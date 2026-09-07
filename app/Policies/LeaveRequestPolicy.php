<?php

namespace App\Policies;

use App\Domain\Leave\Models\LeaveRequest;
use App\Models\User;

class LeaveRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('leave.view');
    }

    public function view(User $user, LeaveRequest $leaveRequest): bool
    {
        return $user->can('leave.view')
            || $user->employee?->id === $leaveRequest->employee_id
            || $this->manages($user, $leaveRequest);
    }

    public function create(User $user): bool
    {
        return $user->can('leave.apply');
    }

    public function approve(User $user, LeaveRequest $leaveRequest): bool
    {
        if ($user->employee?->id === $leaveRequest->employee_id) {
            return false;
        }

        if ($user->can('leave.manage') || $user->can('employee.view')) {
            return $user->can('leave.approve');
        }

        return $this->manages($user, $leaveRequest);
    }

    public function reject(User $user, LeaveRequest $leaveRequest): bool
    {
        return $this->approve($user, $leaveRequest);
    }

    public function cancel(User $user, LeaveRequest $leaveRequest): bool
    {
        return $user->employee?->id === $leaveRequest->employee_id
            || $user->can('leave.approve');
    }

    private function manages(User $user, LeaveRequest $leaveRequest): bool
    {
        $managerId = $user->employee?->id;

        return $managerId !== null && $leaveRequest->employee?->manager_id === $managerId;
    }
}
