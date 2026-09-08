<?php

namespace App\Domain\Platform\Services;

use App\Domain\Billing\Enums\InvoiceStatus;
use App\Domain\Billing\Enums\PaymentStatus;
use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Models\Invoice;
use App\Domain\Billing\Models\Payment;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Marketing\Models\Lead;
use App\Domain\Shared\Enums\TenantStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Carbon;

class PlatformAnalyticsService
{
    /**
     * @return array<string, mixed>
     */
    public function dashboard(): array
    {
        $activeSubscriptions = Subscription::query()
            ->with('plan')
            ->where('status', SubscriptionStatus::Active)
            ->get();

        $mrr = $activeSubscriptions->sum(function (Subscription $subscription): int {
            $plan = $subscription->plan;

            return $subscription->billing_cycle->value === 'yearly'
                ? (int) round($plan->yearly_price / 12)
                : $plan->monthly_price;
        });

        $paidTenants = Tenant::query()->where('status', TenantStatus::Active)->count();
        $trialTenants = Tenant::query()->where('status', TenantStatus::Trial)->count();

        return [
            'stats' => [
                'tenants' => Tenant::query()->count(),
                'active' => $paidTenants,
                'trial' => $trialTenants,
                'suspended' => Tenant::query()->where('status', TenantStatus::Suspended)->count(),
                'users' => User::query()->where('is_platform_admin', false)->count(),
                'mrr' => $mrr,
                'arr' => $mrr * 12,
                'revenue_mtd' => (int) Payment::query()
                    ->where('status', PaymentStatus::Paid)
                    ->where('paid_at', '>=', now()->startOfMonth())
                    ->sum('amount'),
                'outstanding_invoices' => Invoice::query()
                    ->whereIn('status', [InvoiceStatus::Draft, InvoiceStatus::Sent])
                    ->count(),
                'new_subscriptions' => Subscription::query()->where('created_at', '>=', now()->startOfMonth())->count(),
                'trial_conversion' => $trialTenants + $paidTenants > 0
                    ? round(($paidTenants / max(1, $trialTenants + $paidTenants)) * 100)
                    : 0,
                'churn' => Tenant::query()->whereIn('status', [TenantStatus::Cancelled, TenantStatus::Expired])->count(),
                'leads' => Lead::query()->count(),
                'invoices_sent' => Invoice::query()->whereNotNull('sent_at')->count(),
            ],
            'series' => $this->monthlySeries(),
            'planDistribution' => $this->planMix(),
            'sources' => array_slice($this->leadSources(), 0, 6),
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
                    'gateway' => $payment->gateway,
                    'paid_at' => $payment->paid_at?->toDateTimeString(),
                ])
                ->all(),
            'recentInvoices' => Invoice::query()
                ->with(['tenant', 'subscription.plan'])
                ->latest()
                ->limit(6)
                ->get()
                ->map->toAdminArray()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function reports(): array
    {
        $payments = Payment::query()->where('status', PaymentStatus::Paid)->get();

        return [
            'series' => $this->monthlySeries(),
            'byGateway' => $this->paymentsByGateway($payments),
            'planDistribution' => $this->planMix(true),
            'sources' => $this->leadSources(),
            'tenantsByStatus' => collect(TenantStatus::cases())
                ->map(fn (TenantStatus $status): array => [
                    'status' => $status->value,
                    'label' => $status->label(),
                    'count' => Tenant::query()->where('status', $status)->count(),
                ])
                ->all(),
            'invoiceSummary' => [
                'count' => Invoice::query()->count(),
                'paid' => Invoice::query()->where('status', InvoiceStatus::Paid)->count(),
                'sent' => Invoice::query()->whereNotNull('sent_at')->count(),
                'amount' => (int) Invoice::query()->sum('amount'),
            ],
        ];
    }

    /**
     * @param  iterable<Payment>  $payments
     * @return list<array{gateway: string, count: int, amount: int}>
     */
    private function paymentsByGateway(iterable $payments): array
    {
        $grouped = [];

        foreach ($payments as $payment) {
            $gateway = $payment->gateway;
            $grouped[$gateway] ??= ['gateway' => $gateway, 'count' => 0, 'amount' => 0];
            $grouped[$gateway]['count']++;
            $grouped[$gateway]['amount'] += $payment->amount;
        }

        return array_values($grouped);
    }

    /**
     * @return list<array{label: string, key: string, tenants: int, revenue: int, leads: int}>
     */
    private function monthlySeries(): array
    {
        $months = [];

        for ($i = 11; $i >= 0; $i--) {
            $start = Carbon::now()->subMonths($i)->startOfMonth();
            $end = $start->copy()->endOfMonth();
            $key = $start->format('Y-m');

            $months[] = [
                'label' => $start->format('M'),
                'key' => $key,
                'tenants' => Tenant::query()->whereBetween('created_at', [$start, $end])->count(),
                'revenue' => (int) Payment::query()
                    ->where('status', PaymentStatus::Paid)
                    ->whereBetween('paid_at', [$start, $end])
                    ->sum('amount'),
                'leads' => Lead::query()->whereBetween('created_at', [$start, $end])->count(),
            ];
        }

        return $months;
    }

    /**
     * @return list<array{name: string, slug?: string, count: int, mrr?: int}>
     */
    private function planMix(bool $withMrr = false): array
    {
        $plans = Plan::query()
            ->withCount(['subscriptions as active_subscriptions_count' => function ($query): void {
                $query->where('status', SubscriptionStatus::Active->value);
            }])
            ->orderBy('sort_order')
            ->get();

        $rows = [];

        foreach ($plans as $plan) {
            $row = [
                'name' => $plan->name,
                'count' => (int) $plan->active_subscriptions_count,
            ];

            if ($withMrr) {
                $row['slug'] = $plan->slug;
                $row['mrr'] = $plan->monthly_price * (int) $plan->active_subscriptions_count;
            }

            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * @return list<array{source: string, total: int, converted: int}>
     */
    private function leadSources(): array
    {
        $grouped = Lead::query()
            ->get(['source', 'utm_source', 'status'])
            ->groupBy(fn (Lead $lead): string => $lead->utm_source ?: $lead->source ?: 'direct');

        $rows = [];

        foreach ($grouped as $source => $leads) {
            $rows[] = [
                'source' => (string) $source,
                'total' => $leads->count(),
                'converted' => $leads->where('status', 'converted')->count(),
            ];
        }

        usort($rows, fn (array $left, array $right): int => $right['total'] <=> $left['total']);

        return $rows;
    }
}
