<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Models\WorkingDay;
use App\Domain\Attendance\Services\WorkingDayService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkingDayController extends Controller
{
    public function index(WorkingDayService $workingDays): Response
    {
        abort_unless(request()->user()?->can('settings.manage'), 403);

        return Inertia::render('settings/working-days', [
            'days' => $workingDays->week(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);

        $data = $request->validate([
            'days' => ['required', 'array', 'size:7'],
            'days.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'days.*.is_working' => ['required'],
        ]);

        foreach ($data['days'] as $day) {
            $working = $day['is_working'];

            if (is_array($working)) {
                $working = end($working);
            }

            WorkingDay::query()->updateOrCreate(
                ['day_of_week' => $day['day_of_week']],
                ['is_working' => filter_var($working, FILTER_VALIDATE_BOOLEAN)],
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Working week updated.']);

        return back();
    }
}
