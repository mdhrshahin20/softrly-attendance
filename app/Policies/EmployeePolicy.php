<?php

namespace App\Policies;

use App\Domain\Employee\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('employee.view');
    }

    public function view(User $user, Employee $employee): bool
    {
        return $user->can('employee.view') || $user->employee?->is($employee);
    }

    public function create(User $user): bool
    {
        return $user->can('employee.create');
    }

    public function update(User $user, Employee $employee): bool
    {
        return $user->can('employee.update');
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $user->can('employee.delete');
    }
}
