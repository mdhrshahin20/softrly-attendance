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
            'shifts' => Shift::query()->orderBy('start_time')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('shift.manage'), 403);

        Shift::query()->create($request->validate([
            'name' => ['required', 'string', 'max:100'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'grace_minutes' => ['required', 'integer', 'min:0', 'max:180'],
            'minimum_work_minutes' => ['required', 'integer', 'min:60', 'max:1440'],
            'status' => ['required', 'in:active,inactive'],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift created.']);

        return back();
    }

    public function update(Request $request, Shift $shift): RedirectResponse
    {
        abort_unless($request->user()?->can('shift.manage'), 403);

        $shift->update($request->validate([
            'name' => ['required', 'string', 'max:100'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'grace_minutes' => ['required', 'integer', 'min:0', 'max:180'],
            'minimum_work_minutes' => ['required', 'integer', 'min:60', 'max:1440'],
            'status' => ['required', 'in:active,inactive'],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift updated.']);

        return back();
    }

    public function destroy(Shift $shift): RedirectResponse
    {
        abort_unless(request()->user()?->can('shift.manage'), 403);

        $shift->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift deleted.']);

        return back();
    }
}
