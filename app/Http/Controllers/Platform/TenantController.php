<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Billing\Enums\BillingCycle;
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

    public function index(): Response
    {
        $tenants = Tenant::query()
            ->with(['currentSubscription.plan'])
            ->withCount('users')
            ->latest()
            ->paginate(20);

        return Inertia::render('platform/tenants', [
            'tenants' => $tenants->through(fn (Tenant $tenant): array => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'email' => $tenant->email,
                'status' => $tenant->status->value,
                'trial_ends_at' => $tenant->trial_ends_at?->toDateString(),
                'users_count' => $tenant->users_count,
                'plan' => $tenant->currentSubscription?->plan?->name,
                'plan_id' => $tenant->currentSubscription?->plan_id,
            ]),
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Trial extended.']);

        return back();
    }
}
