<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Enums\BillingCycle;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Services\PlanCatalog;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscriptions,
        private readonly PlanCatalog $plans,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('settings.manage'), 403);

        return Inertia::render('billing/index', [
            'subscription' => $this->subscriptions->snapshot(),
            'plans' => $this->plans->publicPlans()->map->toPublicArray()->values(),
            'payments' => $this->subscriptions->payments()->map(fn ($payment): array => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'gateway' => $payment->gateway,
                'status' => $payment->status->value,
                'status_label' => $payment->status->label(),
                'notes' => $payment->notes,
                'paid_at' => $payment->paid_at?->toDateTimeString(),
                'created_at' => $payment->created_at?->toDateTimeString(),
            ]),
            'cycles' => collect(BillingCycle::cases())->map(fn (BillingCycle $cycle): array => [
                'value' => $cycle->value,
                'label' => $cycle->label(),
            ]),
        ]);
    }

    public function subscribe(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);

        $data = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'billing_cycle' => ['required', 'in:monthly,yearly'],
        ]);

        $plan = Plan::query()->with('features')->findOrFail($data['plan_id']);
        $tenant = Tenant::current();
        abort_unless($tenant, 403);

        $this->subscriptions->subscribe(
            $tenant,
            $plan,
            BillingCycle::from($data['billing_cycle']),
            $request->user(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Plan updated.']);

        return back();
    }

    public function cancel(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);
        $tenant = Tenant::current();
        abort_unless($tenant, 403);

        $this->subscriptions->cancel($tenant, $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Subscription cancelled. You can resubscribe anytime.']);

        return back();
    }
}
