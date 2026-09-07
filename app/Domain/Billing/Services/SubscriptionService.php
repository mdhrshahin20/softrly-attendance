<?php

namespace App\Domain\Billing\Services;

use App\Domain\Billing\Contracts\PaymentGateway;
use App\Domain\Billing\Enums\BillingCycle;
use App\Domain\Billing\Enums\PaymentStatus;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Events\PaymentCompleted;
use App\Domain\Billing\Events\SubscriptionExpired;
use App\Domain\Billing\Events\SubscriptionStarted;
use App\Domain\Billing\Models\Payment;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Employee\Models\Employee;
use App\Domain\Office\Models\Office;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\TenantStatus;
use App\Domain\Tenant\Models\ActivityLog;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class SubscriptionService
{
    public function __construct(
        private readonly PlanCatalog $plans,
        private readonly PaymentGateway $gateway,
    ) {}

    public function current(?Tenant $tenant = null): ?Subscription
    {
        $tenant ??= Tenant::current();

        if ($tenant === null) {
            return null;
        }

        return Subscription::query()
            ->with('plan.features')
            ->where('tenant_id', $tenant->id)
            ->latest('id')
            ->first();
    }

    public function allowsAccess(?Tenant $tenant = null): bool
    {
        $tenant ??= Tenant::current();

        if ($tenant === null) {
            return false;
        }

        if (in_array($tenant->status, [TenantStatus::Suspended, TenantStatus::Cancelled], true)) {
            return false;
        }

        $subscription = $this->current($tenant);

        if ($subscription) {
            return $subscription->allowsAccess();
        }

        return $tenant->status === TenantStatus::Trial
            && ($tenant->trial_ends_at === null || $tenant->trial_ends_at->isFuture());
    }

    public function startTrial(Tenant $tenant, ?Plan $plan = null): Subscription
    {
        $plan ??= $this->plans->starter();
        $ends = now()->addDays($plan->trial_days);

        $subscription = Subscription::query()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Trial,
            'billing_cycle' => BillingCycle::Monthly,
            'started_at' => now(),
            'trial_ends_at' => $ends,
            'current_period_start' => now(),
            'current_period_end' => $ends,
        ]);

        $tenant->update([
            'status' => TenantStatus::Trial,
            'trial_ends_at' => $ends,
        ]);

        event(new SubscriptionStarted($subscription->load('plan')));

        return $subscription;
    }

    public function subscribe(Tenant $tenant, Plan $plan, BillingCycle $cycle, ?User $actor = null, bool $chargeNow = true): Subscription
    {
        if (! $plan->is_active) {
            throw ValidationException::withMessages(['plan_id' => 'This plan is not available.']);
        }

        $this->assertUpgradeFitsUsage($tenant, $plan);

        $subscription = $this->current($tenant);

        if ($subscription === null) {
            $subscription = $this->startTrial($tenant, $plan);
        }

        $amount = $plan->priceFor($cycle->value);

        $subscription->update([
            'plan_id' => $plan->id,
            'billing_cycle' => $cycle,
        ]);

        if ($amount === 0) {
            $this->activate($subscription->fresh(), $cycle);
            $this->log($tenant, $actor, 'subscription.changed', $subscription, ['plan' => $plan->slug, 'cycle' => $cycle->value]);

            return $subscription->fresh(['plan.features']) ?? $subscription;
        }

        $payment = Payment::query()->create([
            'tenant_id' => $tenant->id,
            'subscription_id' => $subscription->id,
            'amount' => $amount,
            'currency' => $plan->currency,
            'gateway' => $this->gateway->name(),
            'status' => PaymentStatus::Pending,
            'notes' => $plan->name.' · '.$cycle->label(),
        ]);

        if ($chargeNow) {
            $this->completePayment($payment, $actor);
        }

        return $subscription->fresh(['plan.features']) ?? $subscription;
    }

    public function completePayment(Payment $payment, ?User $actor = null): Payment
    {
        if ($payment->status === PaymentStatus::Paid) {
            return $payment;
        }

        $charged = $this->gateway->charge($payment);
        $subscription = $charged->subscription;

        if ($subscription) {
            $this->activate($subscription, $subscription->billing_cycle);
        }

        event(new PaymentCompleted($charged->load('subscription.plan')));
        $this->log($charged->tenant, $actor, 'payment.completed', $charged, [
            'amount' => $charged->amount,
            'plan' => $subscription?->plan?->slug,
        ]);

        return $charged;
    }

    public function cancel(Tenant $tenant, ?User $actor = null): Subscription
    {
        $subscription = $this->current($tenant);

        if ($subscription === null) {
            throw ValidationException::withMessages(['subscription' => 'No subscription to cancel.']);
        }

        $subscription->update([
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        $tenant->update(['status' => TenantStatus::Cancelled]);
        $this->log($tenant, $actor, 'subscription.cancelled', $subscription);

        return $subscription->fresh(['plan']) ?? $subscription;
    }

    public function assignPlan(Tenant $tenant, Plan $plan, BillingCycle $cycle, ?User $actor = null): Subscription
    {
        $this->assertUpgradeFitsUsage($tenant, $plan);

        $subscription = $this->current($tenant);

        if ($subscription === null) {
            $subscription = $this->startTrial($tenant, $plan);
        }

        $subscription->update([
            'plan_id' => $plan->id,
            'billing_cycle' => $cycle,
        ]);

        if (! $subscription->allowsAccess() || $subscription->status === SubscriptionStatus::Trial) {
            $this->activate($subscription->fresh() ?? $subscription, $cycle);
        }

        $this->log($tenant, $actor, 'subscription.changed', $subscription, ['plan' => $plan->slug]);

        return $subscription->fresh(['plan.features']) ?? $subscription;
    }

    public function extendTrial(Tenant $tenant, int $days, ?User $actor = null): Subscription
    {
        $subscription = $this->current($tenant) ?? $this->startTrial($tenant);
        $ends = now()->addDays(max(1, $days));

        $subscription->update([
            'status' => SubscriptionStatus::Trial,
            'trial_ends_at' => $ends,
            'current_period_end' => $ends,
            'cancelled_at' => null,
        ]);

        $tenant->update([
            'status' => TenantStatus::Trial,
            'trial_ends_at' => $ends,
        ]);

        $this->log($tenant, $actor, 'trial.extended', $subscription, ['days' => $days]);

        return $subscription->fresh(['plan']) ?? $subscription;
    }

    public function expireOverdue(): int
    {
        $expired = 0;

        Subscription::query()
            ->with('tenant')
            ->whereIn('status', [SubscriptionStatus::Trial, SubscriptionStatus::Active])
            ->where(function ($query): void {
                $query->where(function ($trial): void {
                    $trial->where('status', SubscriptionStatus::Trial)
                        ->whereNotNull('trial_ends_at')
                        ->where('trial_ends_at', '<', now());
                })->orWhere(function ($active): void {
                    $active->where('status', SubscriptionStatus::Active)
                        ->whereNotNull('current_period_end')
                        ->where('current_period_end', '<', now());
                });
            })
            ->each(function (Subscription $subscription) use (&$expired): void {
                $subscription->update(['status' => SubscriptionStatus::Expired]);
                $subscription->tenant?->update(['status' => TenantStatus::Expired]);
                event(new SubscriptionExpired($subscription));
                $expired++;
            });

        return $expired;
    }

    public function hasFeature(PlanFeature|string $feature, ?Tenant $tenant = null): bool
    {
        $subscription = $this->current($tenant);

        if ($subscription?->plan === null) {
            return false;
        }

        return $subscription->plan->hasFeature($feature);
    }

    public function assertFeature(PlanFeature|string $feature, ?Tenant $tenant = null): void
    {
        if ($this->hasFeature($feature, $tenant)) {
            return;
        }

        $label = $feature instanceof PlanFeature ? $feature->label() : $feature;

        throw ValidationException::withMessages([
            'plan' => 'Upgrade required to use '.$label.'.',
        ]);
    }

    public function assertCanCreateEmployee(?Tenant $tenant = null): void
    {
        $usage = $this->usage($tenant);
        $limit = $usage['employee_limit'];

        if ($limit !== null && $usage['employees'] >= $limit) {
            throw ValidationException::withMessages([
                'employee' => 'Upgrade required. Your plan allows '.$limit.' employees.',
            ]);
        }
    }

    public function assertCanCreateOffice(?Tenant $tenant = null): void
    {
        $usage = $this->usage($tenant);
        $limit = $usage['office_limit'];

        if ($limit !== null && $usage['offices'] >= $limit) {
            throw ValidationException::withMessages([
                'office' => 'Upgrade required. Your plan allows '.$limit.' office(s).',
            ]);
        }
    }

    /**
     * @return array{
     *     employees: int,
     *     offices: int,
     *     employee_limit: int|null,
     *     office_limit: int|null,
     *     plan: Plan|null,
     *     subscription: Subscription|null
     * }
     */
    public function usage(?Tenant $tenant = null): array
    {
        $tenant ??= Tenant::current();
        $subscription = $this->current($tenant);
        $plan = $subscription?->plan;

        return [
            'employees' => Employee::query()
                ->when($tenant, fn ($query) => $query->where('tenant_id', $tenant->id))
                ->where('status', EmployeeStatus::Active)
                ->count(),
            'offices' => Office::query()
                ->when($tenant, fn ($query) => $query->where('tenant_id', $tenant->id))
                ->count(),
            'employee_limit' => $plan?->employee_limit,
            'office_limit' => $plan?->office_limit,
            'plan' => $plan,
            'subscription' => $subscription,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function snapshot(?Tenant $tenant = null): array
    {
        $tenant ??= Tenant::current();
        $usage = $this->usage($tenant);
        $subscription = $usage['subscription'];

        return [
            'status' => $subscription?->status->value ?? $tenant?->status->value,
            'status_label' => $subscription?->status->label() ?? $tenant?->status->value,
            'plan_name' => $usage['plan']?->name,
            'plan_slug' => $usage['plan']?->slug,
            'billing_cycle' => $subscription?->billing_cycle->value,
            'trial_ends_at' => $subscription?->trial_ends_at?->toIso8601String() ?? $tenant?->trial_ends_at?->toIso8601String(),
            'current_period_end' => $subscription?->current_period_end?->toIso8601String(),
            'is_access_active' => $this->allowsAccess($tenant),
            'is_on_trial' => $subscription?->isOnTrial() ?? false,
            'employees_used' => $usage['employees'],
            'employee_limit' => $usage['employee_limit'],
            'offices_used' => $usage['offices'],
            'office_limit' => $usage['office_limit'],
            'features' => $usage['plan']?->featureKeys() ?? [],
        ];
    }

    /**
     * @return Collection<int, Payment>
     */
    public function payments(?Tenant $tenant = null): Collection
    {
        $tenant ??= Tenant::current();

        return Payment::query()
            ->when($tenant, fn ($query) => $query->where('tenant_id', $tenant->id))
            ->latest()
            ->limit(25)
            ->get();
    }

    private function activate(Subscription $subscription, BillingCycle $cycle): void
    {
        $end = now()->addMonths($cycle->months());

        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'billing_cycle' => $cycle,
            'started_at' => $subscription->started_at ?? now(),
            'current_period_start' => now(),
            'current_period_end' => $end,
            'cancelled_at' => null,
        ]);

        $subscription->tenant?->update([
            'status' => TenantStatus::Active,
        ]);
    }

    private function assertUpgradeFitsUsage(Tenant $tenant, Plan $plan): void
    {
        $usage = $this->usage($tenant);

        if ($plan->employee_limit !== null && $usage['employees'] > $plan->employee_limit) {
            throw ValidationException::withMessages([
                'plan_id' => 'This tenant already has '.$usage['employees'].' employees, above the '.$plan->name.' limit.',
            ]);
        }

        if ($plan->office_limit !== null && $usage['offices'] > $plan->office_limit) {
            throw ValidationException::withMessages([
                'plan_id' => 'This tenant already has '.$usage['offices'].' offices, above the '.$plan->name.' limit.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $new
     */
    private function log(?Tenant $tenant, ?User $actor, string $action, mixed $entity, array $new = []): void
    {
        if ($tenant === null) {
            return;
        }

        ActivityLog::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $actor?->id,
            'action' => $action,
            'entity_type' => is_object($entity) ? $entity::class : null,
            'entity_id' => is_object($entity) && isset($entity->id) ? $entity->id : null,
            'new_values' => $new,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
