<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Employee\Models\Department;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(): Response
    {
        $this->authorizeManage();

        return Inertia::render('departments/index', [
            'departments' => Department::query()->withCount('employees')->orderBy('name')->paginate(15)->withQueryString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeManage();

        Department::query()->create($this->validatedDepartment($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Department created.']);

        return back();
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $this->authorizeManage();

        $department->update($this->validatedDepartment($request, $department->id));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Department updated.']);

        return back();
    }

    public function destroy(Department $department): RedirectResponse
    {
        $this->authorizeManage();

        if ($department->employees()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Reassign employees before deleting this department.',
            ]);

            return back();
        }

        $department->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Department deleted.']);

        return back();
    }

    /**
     * @return array{name: string, code: string, status: string}
     */
    private function validatedDepartment(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => [
                'required',
                'string',
                'max:30',
                Rule::unique('departments', 'code')
                    ->where('tenant_id', Tenant::current()?->id)
                    ->ignore($ignoreId),
            ],
            'status' => ['required', 'in:active,inactive'],
        ]);
    }

    private function authorizeManage(): void
    {
        abort_unless(request()->user()?->can('department.manage'), 403);
    }
}
