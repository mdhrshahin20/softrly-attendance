<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Leave\Models\LeaveType;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeaveTypeController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('leave.manage'), 403);

        return Inertia::render('leave/types', [
            'types' => LeaveType::query()->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('leave.manage'), 403);

        LeaveType::query()->create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Leave type created.']);

        return back();
    }

    public function update(Request $request, LeaveType $leaveType): RedirectResponse
    {
        abort_unless($request->user()?->can('leave.manage'), 403);

        $leaveType->update($this->validated($request, $leaveType));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Leave type updated.']);

        return back();
    }

    public function destroy(LeaveType $leaveType): RedirectResponse
    {
        abort_unless(request()->user()?->can('leave.manage'), 403);

        $leaveType->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Leave type deleted.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?LeaveType $leaveType = null): array
    {
        $unique = Rule::unique('leave_types', 'code')
            ->where(fn ($query) => $query->where('tenant_id', Tenant::current()?->id));

        if ($leaveType) {
            $unique->ignore($leaveType->id);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:30', $unique],
            'days_per_year' => ['required', 'integer', 'min:0', 'max:365'],
            'is_paid' => ['sometimes', 'boolean'],
            'carry_forward' => ['sometimes', 'boolean'],
            'maximum_carry_forward' => ['nullable', 'integer', 'min:0', 'max:365'],
            'requires_attachment' => ['sometimes', 'boolean'],
            'minimum_notice_days' => ['required', 'integer', 'min:0', 'max:60'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $data['is_paid'] = $request->boolean('is_paid', true);
        $data['carry_forward'] = $request->boolean('carry_forward');
        $data['requires_attachment'] = $request->boolean('requires_attachment');
        $data['maximum_carry_forward'] = (int) ($data['maximum_carry_forward'] ?? 0);

        return $data;
    }
}
