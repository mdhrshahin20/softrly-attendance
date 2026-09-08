<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Employee\Models\Department;
use App\Domain\Employee\Models\Designation;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DesignationController extends Controller
{
    public function index(): Response
    {
        $this->authorizeManage();

        return Inertia::render('designations/index', [
            'designations' => Designation::query()->with('department')->withCount('employees')->orderBy('name')->paginate(15)->withQueryString(),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeManage();

        Designation::query()->create($this->validatedDesignation($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Designation created.']);

        return back();
    }

    public function update(Request $request, Designation $designation): RedirectResponse
    {
        $this->authorizeManage();

        $designation->update($this->validatedDesignation($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Designation updated.']);

        return back();
    }

    public function destroy(Designation $designation): RedirectResponse
    {
        $this->authorizeManage();

        if ($designation->employees()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Reassign employees before deleting this designation.',
            ]);

            return back();
        }

        $designation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Designation deleted.']);

        return back();
    }

    /**
     * @return array{name: string, department_id: int|null, status: string}
     */
    private function validatedDesignation(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'department_id' => [
                'nullable',
                Rule::exists('departments', 'id')->where('tenant_id', Tenant::current()?->id),
            ],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $data['department_id'] = $data['department_id'] ?: null;

        return $data;
    }

    private function authorizeManage(): void
    {
        abort_unless(request()->user()?->can('designation.manage'), 403);
    }
}
