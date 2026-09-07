<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Employee\Models\Department;
use App\Domain\Employee\Models\Designation;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DesignationController extends Controller
{
    public function index(): Response
    {
        abort_unless(request()->user()?->can('designation.manage'), 403);

        return Inertia::render('designations/index', [
            'designations' => Designation::query()->with('department')->withCount('employees')->orderBy('name')->get(),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('designation.manage'), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        Designation::query()->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Designation created.']);

        return back();
    }

    public function update(Request $request, Designation $designation): RedirectResponse
    {
        abort_unless($request->user()?->can('designation.manage'), 403);

        $designation->update($request->validate([
            'name' => ['required', 'string', 'max:100'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'status' => ['required', 'in:active,inactive'],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Designation updated.']);

        return back();
    }

    public function destroy(Designation $designation): RedirectResponse
    {
        abort_unless(request()->user()?->can('designation.manage'), 403);

        $designation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Designation deleted.']);

        return back();
    }
}
