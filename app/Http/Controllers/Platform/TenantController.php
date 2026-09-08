<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Billing\Enums\BillingCycle;
use App\Domain\Billing\Models\Invoice;
use App\Domain\Billing\Models\Payment;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Services\PlanCatalog;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Shared\Enums\TenantStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscriptions,
        private readonly PlanCatalog $plans,
    ) {}

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        $tenants = Tenant::query()
            ->with(['currentSubscription.plan'])
            ->withCount(['users', 'employees', 'offices'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%')
                        ->orWhere('slug', 'like', '%'.$search.'%');
                });
            })
            ->when($status !== '' && $status !== 'all', function ($query) use ($status): void {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('platform/tenants', [
            'tenants' => $tenants->through(fn (Tenant $tenant): array => $this->listPayload($tenant)),
            'plans' => $this->plans->publicPlans()->map(fn (Plan $plan): array => [
                'id' => $plan->id,
                'name' => $plan->name,
            ]),
            'stats' => [
                'total' => Tenant::query()->count(),
                'active' => Tenant::query()->where('status', TenantStatus::Active)->count(),
                'trial' => Tenant::query()->where('status', TenantStatus::Trial)->count(),
                'suspended' => Tenant::query()->where('status', TenantStatus::Suspended)->count(),
            ],
            'filters' => [
                'search' => $search ?: null,
                'status' => $status ?: 'all',
            ],
        ]);
    }

    public function show(Tenant $tenant): Response
    {
        $tenant->load([
            'currentSubscription.plan',
            'domains',
            'settings',
            'users',
        ]);

        $subscription = $tenant->currentSubscription;
        $owner = $tenant->owner();

        $invoices = Invoice::query()
            ->where('tenant_id', $tenant->id)
            ->with(['subscription.plan', 'payment'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (Invoice $invoice): array => $invoice->toAdminArray())
            ->values();

        $payments = Payment::query()
            ->where('tenant_id', $tenant->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (Payment $payment): array => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'gateway' => $payment->gateway,
                'transaction_id' => $payment->transaction_id,
                'status' => $payment->status->value,
                'paid_at' => $payment->paid_at?->toDateTimeString(),
                'created_at' => $payment->created_at?->toDateTimeString(),
            ])
            ->values();

        $subscriptions = $tenant->subscriptions()
            ->with('plan')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($item): array => [
                'id' => $item->id,
                'plan' => $item->plan?->name,
                'status' => $item->status->value,
                'billing_cycle' => $item->billing_cycle->value,
                'started_at' => $item->started_at?->toDateString(),
                'trial_ends_at' => $item->trial_ends_at?->toDateString(),
                'current_period_end' => $item->current_period_end?->toDateString(),
                'cancelled_at' => $item->cancelled_at?->toDateString(),
            ])
            ->values();

        return Inertia::render('platform/tenant-show', [
            'tenant' => [
                'id' => $tenant->id,
                'uuid' => $tenant->uuid,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'country' => $tenant->country,
                'timezone' => $tenant->timezone,
                'currency' => $tenant->currency,
                'status' => $tenant->status->value,
                'trial_ends_at' => $tenant->trial_ends_at?->toDateString(),
                'created_at' => $tenant->created_at?->toDateTimeString(),
                'updated_at' => $tenant->updated_at?->toDateTimeString(),
                'employees_count' => $tenant->employees()->count(),
                'offices_count' => $tenant->offices()->count(),
                'users_count' => $tenant->users->count(),
                'owner' => $owner ? [
                    'id' => $owner->id,
                    'name' => $owner->name,
                    'email' => $owner->email,
                ] : null,
                'subscription' => $subscription ? [
                    'id' => $subscription->id,
                    'plan' => $subscription->plan?->name,
                    'plan_id' => $subscription->plan_id,
                    'status' => $subscription->status->value,
                    'billing_cycle' => $subscription->billing_cycle->value,
                    'started_at' => $subscription->started_at?->toDateString(),
                    'trial_ends_at' => $subscription->trial_ends_at?->toDateString(),
                    'current_period_start' => $subscription->current_period_start?->toDateString(),
                    'current_period_end' => $subscription->current_period_end?->toDateString(),
                    'cancelled_at' => $subscription->cancelled_at?->toDateString(),
                    'allows_access' => $subscription->allowsAccess(),
                ] : null,
                'domains' => $tenant->domains->map(fn ($domain): array => [
                    'id' => $domain->id,
                    'hostname' => $domain->hostname,
                    'type' => $domain->type,
                    'status' => $domain->status,
                    'is_primary' => (bool) $domain->is_primary,
                ])->values(),
                'settings' => $tenant->settingsMap(),
                'users' => $tenant->users->map(fn ($user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_owner' => (bool) $user->pivot->is_owner,
                ])->values(),
                'subscriptions' => $subscriptions,
                'invoices' => $invoices,
                'payments' => $payments,
            ],
            'plans' => Plan::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name'])
                ->map(fn (Plan $plan): array => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                ])
                ->values(),
        ]);
    }

    public function updateStatus(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:trial,active,suspended,cancelled,expired'],
        ]);

        $tenant->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Tenant status updated.']);

        return back();
    }

    public function updatePlan(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'billing_cycle' => ['required', 'in:monthly,yearly'],
        ]);

        $tenant->makeCurrent();

        $this->subscriptions->assignPlan(
            $tenant,
            Plan::query()->findOrFail($data['plan_id']),
            BillingCycle::from($data['billing_cycle']),
            $request->user(),
        );

        Tenant::forgetCurrent();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Plan assigned.']);

        return back();
    }

    public function extendTrial(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'days' => ['required', 'integer', 'min:1', 'max:90'],
        ]);

        $tenant->makeCurrent();
        $this->subscriptions->extendTrial($tenant, (int) $data['days'], $request->user());
        Tenant::forgetCurrent();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Trial extended.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function listPayload(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'email' => $tenant->email,
            'status' => $tenant->status->value,
            'trial_ends_at' => $tenant->trial_ends_at?->toDateString(),
            'created_at' => $tenant->created_at?->toDateString(),
            'users_count' => $tenant->users_count,
            'employees_count' => $tenant->employees_count ?? 0,
            'offices_count' => $tenant->offices_count ?? 0,
            'plan' => $tenant->currentSubscription?->plan?->name,
            'plan_id' => $tenant->currentSubscription?->plan_id,
            'subscription_status' => $tenant->currentSubscription?->status?->value,
        ];
    }
}
