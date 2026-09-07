<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Employee\Models\Department;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(): Response
    {
        $this->authorizeManage();

        return Inertia::render('departments/index', [
            'departments' => Department::query()->withCount('employees')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeManage();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:30', 'unique:departments,code'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        Department::query()->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Department created.']);

        return back();
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $this->authorizeManage();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:30', 'unique:departments,code,'.$department->id],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $department->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Department updated.']);

        return back();
    }

    public function destroy(Department $department): RedirectResponse
    {
        $this->authorizeManage();

        $department->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Department deleted.']);

        return back();
    }

    private function authorizeManage(): void
    {
        abort_unless($this->userCan('department.manage'), 403);
    }

    private function userCan(string $permission): bool
    {
        return request()->user()?->can($permission) ?? false;
    }
}
