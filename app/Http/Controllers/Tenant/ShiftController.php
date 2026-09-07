<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Models\Shift;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(): Response
    {
        abort_unless(request()->user()?->can('shift.manage'), 403);

        return Inertia::render('shifts/index', [
            'shifts' => Shift::query()
                ->withCount('employees')
                ->orderBy('start_time')
                ->get()
                ->map(fn (Shift $shift): array => [
                    'id' => $shift->id,
                    'name' => $shift->name,
                    'start_time' => substr((string) $shift->start_time, 0, 5),
                    'end_time' => substr((string) $shift->end_time, 0, 5),
                    'grace_minutes' => $shift->grace_minutes,
                    'minimum_work_minutes' => $shift->minimum_work_minutes,
                    'status' => $shift->status,
                    'employees_count' => $shift->employees_count,
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('shift.manage'), 403);

        Shift::query()->create($this->validatedShift($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift created.']);

        return back();
    }

    public function update(Request $request, Shift $shift): RedirectResponse
    {
        abort_unless($request->user()?->can('shift.manage'), 403);

        $shift->update($this->validatedShift($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift updated.']);

        return back();
    }

    public function destroy(Shift $shift): RedirectResponse
    {
        abort_unless(request()->user()?->can('shift.manage'), 403);

        if ($shift->employees()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Reassign employees before deleting this shift.',
            ]);

            return back();
        }

        $shift->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift deleted.']);

        return back();
    }

    /**
     * @return array{name: string, start_time: string, end_time: string, grace_minutes: int, minimum_work_minutes: int, status: string}
     */
    private function validatedShift(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'grace_minutes' => ['required', 'integer', 'min:0', 'max:180'],
            'minimum_work_minutes' => ['required', 'integer', 'min:60', 'max:1440'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $data['start_time'] = substr($data['start_time'], 0, 5);
        $data['end_time'] = substr($data['end_time'], 0, 5);

        return $data;
    }
}
