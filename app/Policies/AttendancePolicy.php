<?php

namespace App\Policies;

use App\Domain\Attendance\Models\Attendance;
use App\Models\User;

class AttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('attendance.view');
    }

    public function view(User $user, Attendance $attendance): bool
    {
        return $user->can('attendance.view')
            || $user->employee?->id === $attendance->employee_id;
    }

    public function create(User $user): bool
    {
        return $user->can('attendance.create');
    }

    public function update(User $user, Attendance $attendance): bool
    {
        return $user->can('attendance.edit');
    }

    public function export(User $user): bool
    {
        return $user->can('attendance.export');
    }
}
