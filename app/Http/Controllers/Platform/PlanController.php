<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Services\PlanCatalog;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(PlanCatalog $catalog): Response
    {
        $catalog->seed();

        return Inertia::render('platform/plans', [
            'plans' => Plan::query()->with('features')->orderBy('sort_order')->get()->map->toPublicArray()->values(),
        ]);
    }

    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'employee_limit' => ['nullable', 'integer', 'min:1'],
            'office_limit' => ['nullable', 'integer', 'min:1'],
            'monthly_price' => ['required', 'integer', 'min:0'],
            'yearly_price' => ['required', 'integer', 'min:0'],
        ]);

        $plan->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'employee_limit' => $request->filled('employee_limit') ? $request->integer('employee_limit') : null,
            'office_limit' => $request->filled('office_limit') ? $request->integer('office_limit') : null,
            'monthly_price' => $data['monthly_price'],
            'yearly_price' => $data['yearly_price'],
            'is_public' => $this->asBool($request->input('is_public')),
            'is_active' => $this->asBool($request->input('is_active')),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Plan updated.']);

        return back();
    }

    private function asBool(mixed $value): bool
    {
        if (is_array($value)) {
            $value = end($value);
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
