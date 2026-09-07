<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Billing\Enums\PaymentStatus;
use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Models\Payment;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Shared\Enums\TenantStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $activeSubscriptions = Subscription::query()
            ->with('plan')
            ->where('status', SubscriptionStatus::Active)
            ->get();

        $mrr = $activeSubscriptions->sum(function (Subscription $subscription): int {
            $plan = $subscription->plan;

            if ($plan === null) {
                return 0;
            }

            return $subscription->billing_cycle->value === 'yearly'
                ? (int) round($plan->yearly_price / 12)
                : $plan->monthly_price;
        });

        $planDistribution = Plan::query()
            ->withCount(['subscriptions as active_subscriptions_count' => function ($query): void {
                $query->where('status', SubscriptionStatus::Active->value);
            }])
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Plan $plan): array => [
                'name' => $plan->name,
                'count' => $plan->active_subscriptions_count,
            ]);

        $paidTenants = Tenant::query()->where('status', TenantStatus::Active)->count();
        $trialTenants = Tenant::query()->where('status', TenantStatus::Trial)->count();

        return Inertia::render('platform/dashboard', [
            'stats' => [
                'tenants' => Tenant::query()->count(),
                'active' => $paidTenants,
                'trial' => $trialTenants,
                'suspended' => Tenant::query()->where('status', TenantStatus::Suspended)->count(),
                'users' => User::query()->where('is_platform_admin', false)->count(),
                'mrr' => $mrr,
                'arr' => $mrr * 12,
                'new_subscriptions' => Subscription::query()->where('created_at', '>=', now()->startOfMonth())->count(),
                'trial_conversion' => $trialTenants + $paidTenants > 0
                    ? round(($paidTenants / max(1, $trialTenants + $paidTenants)) * 100)
                    : 0,
                'churn' => Tenant::query()->whereIn('status', [TenantStatus::Cancelled, TenantStatus::Expired])->count(),
            ],
            'planDistribution' => $planDistribution,
            'recentPayments' => Payment::query()
                ->with(['subscription.plan'])
                ->where('status', PaymentStatus::Paid)
                ->latest('paid_at')
                ->limit(8)
                ->get()
                ->map(fn (Payment $payment): array => [
                    'id' => $payment->id,
                    'tenant' => $payment->tenant?->name,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'plan' => $payment->subscription?->plan?->name,
                    'paid_at' => $payment->paid_at?->toDateTimeString(),
                ]),
        ]);
    }
}
