<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Employee\Models\Department;
use App\Domain\Holiday\Enums\HolidayType;
use App\Domain\Holiday\Models\Holiday;
use App\Domain\Office\Models\Office;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('holiday.view') || $request->user()?->can('holiday.manage'), 403);

        return Inertia::render('holidays/index', [
            'holidays' => Holiday::query()
                ->with(['office', 'department'])
                ->orderBy('date')
                ->paginate(20)
                ->withQueryString()
                ->through(fn (Holiday $holiday): array => [
                    'id' => $holiday->id,
                    'name' => $holiday->name,
                    'date' => $holiday->date->toDateString(),
                    'end_date' => $holiday->end_date?->toDateString(),
                    'holiday_type' => $holiday->holiday_type->value,
                    'holiday_type_label' => $holiday->holiday_type->label(),
                    'office' => $holiday->office?->name,
                    'department' => $holiday->department?->name,
                    'status' => $holiday->status,
                ]),
            'offices' => Office::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'types' => collect(HolidayType::cases())->map(fn (HolidayType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
            'canManage' => $request->user()?->can('holiday.manage') ?? false,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('holiday.manage'), 403);

        Holiday::query()->create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Holiday created.']);

        return back();
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        abort_unless(request()->user()?->can('holiday.manage'), 403);

        $holiday->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Holiday deleted.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:date'],
            'holiday_type' => ['required', 'in:public,company,optional'],
            'office_id' => ['nullable', 'integer', 'exists:offices,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $data['office_id'] = $data['office_id'] ?: null;
        $data['department_id'] = $data['department_id'] ?: null;
        $data['end_date'] = $data['end_date'] ?: null;

        return $data;
    }
}
