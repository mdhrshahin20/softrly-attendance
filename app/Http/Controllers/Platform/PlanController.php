<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Models\PlanFeatureModel;
use App\Domain\Billing\Services\PlanCatalog;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(PlanCatalog $catalog): Response
    {
        $catalog->seed();

        return Inertia::render('platform/plans', [
            'plans' => Plan::query()
                ->with('features')
                ->withCount('subscriptions')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->paginate(20)
                ->withQueryString()
                ->through(fn (Plan $plan): array => $plan->toPublicArray()),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('platform/plan-create', [
            'featureOptions' => collect(PlanFeature::cases())->map(fn (PlanFeature $feature): array => [
                'value' => $feature->value,
                'label' => $feature->label(),
            ])->values(),
        ]);
    }

    public function show(Plan $plan): Response
    {
        $plan->load('features');
        $plan->loadCount('subscriptions');

        $subscribers = $plan->subscriptions()
            ->with('tenant')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($subscription): array => [
                'id' => $subscription->id,
                'tenant_id' => $subscription->tenant_id,
                'tenant' => $subscription->tenant?->name,
                'tenant_email' => $subscription->tenant?->email,
                'status' => $subscription->status->value,
                'billing_cycle' => $subscription->billing_cycle->value,
                'started_at' => $subscription->started_at?->toDateString(),
                'current_period_end' => $subscription->current_period_end?->toDateString(),
            ])
            ->values();

        return Inertia::render('platform/plan-show', [
            'plan' => array_merge($plan->toPublicArray(), [
                'created_at' => $plan->created_at?->toDateTimeString(),
                'updated_at' => $plan->updated_at?->toDateTimeString(),
            ]),
            'subscribers' => $subscribers,
            'featureOptions' => collect(PlanFeature::cases())->map(fn (PlanFeature $feature): array => [
                'value' => $feature->value,
                'label' => $feature->label(),
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $slug = $this->uniqueSlug($data['slug'] ?? $data['name']);

        $plan = Plan::query()->create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'employee_limit' => $request->filled('employee_limit') ? $request->integer('employee_limit') : null,
            'office_limit' => $request->filled('office_limit') ? $request->integer('office_limit') : null,
            'monthly_price' => $data['monthly_price'],
            'yearly_price' => $data['yearly_price'],
            'currency' => $data['currency'] ?? 'BDT',
            'trial_days' => $data['trial_days'] ?? 14,
            'sort_order' => $data['sort_order'] ?? ((int) Plan::query()->max('sort_order') + 1),
            'is_public' => $this->asBool($request->input('is_public')),
            'is_active' => $this->asBool($request->input('is_active', true)),
        ]);

        $this->syncFeatures($plan, $request->input('features', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Plan created.']);

        return redirect()->route('platform.plans.show', $plan);
    }

    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $data = $this->validated($request, $plan);

        $plan->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'employee_limit' => $request->filled('employee_limit') ? $request->integer('employee_limit') : null,
            'office_limit' => $request->filled('office_limit') ? $request->integer('office_limit') : null,
            'monthly_price' => $data['monthly_price'],
            'yearly_price' => $data['yearly_price'],
            'currency' => $data['currency'] ?? $plan->currency,
            'trial_days' => $data['trial_days'] ?? $plan->trial_days,
            'sort_order' => $data['sort_order'] ?? $plan->sort_order,
            'is_public' => $this->asBool($request->input('is_public')),
            'is_active' => $this->asBool($request->input('is_active')),
        ]);

        if ($request->has('features')) {
            $this->syncFeatures($plan, $request->input('features', []));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Plan updated.']);

        return redirect()->route('platform.plans.show', $plan);
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        if ($plan->subscriptions()->exists()) {
            throw ValidationException::withMessages([
                'plan' => 'This plan has subscriptions and cannot be deleted. Deactivate it instead.',
            ]);
        }

        $plan->features()->delete();
        $plan->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Plan deleted.']);

        return redirect()->route('platform.plans');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Plan $plan = null): array
    {
        $featureValues = collect(PlanFeature::cases())->map->value->all();

        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:100', Rule::unique('plans', 'slug')->ignore($plan?->id)],
            'description' => ['nullable', 'string', 'max:500'],
            'employee_limit' => ['nullable', 'integer', 'min:1'],
            'office_limit' => ['nullable', 'integer', 'min:1'],
            'monthly_price' => ['required', 'integer', 'min:0'],
            'yearly_price' => ['required', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', Rule::in($featureValues)],
        ]);
    }

    /**
     * @param  list<string>|string|null  $features
     */
    private function syncFeatures(Plan $plan, array|string|null $features): void
    {
        $keys = collect(is_array($features) ? $features : [])
            ->filter()
            ->unique()
            ->values()
            ->all();

        $plan->features()->whereNotIn('key', $keys)->delete();

        foreach ($keys as $key) {
            PlanFeatureModel::query()->firstOrCreate([
                'plan_id' => $plan->id,
                'key' => $key,
            ]);
        }
    }

    private function uniqueSlug(string $value): string
    {
        $slug = Str::slug($value) ?: 'plan';
        $base = $slug;
        $i = 2;

        while (Plan::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }

    private function asBool(mixed $value): bool
    {
        if (is_array($value)) {
            $value = end($value);
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
