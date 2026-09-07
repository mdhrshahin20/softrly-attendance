<?php

namespace App\Policies;

use App\Domain\Holiday\Models\Holiday;
use App\Models\User;

class HolidayPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('holiday.view') || $user->can('holiday.manage');
    }

    public function create(User $user): bool
    {
        return $user->can('holiday.manage');
    }

    public function update(User $user, Holiday $holiday): bool
    {
        return $user->can('holiday.manage');
    }

    public function delete(User $user, Holiday $holiday): bool
    {
        return $user->can('holiday.manage');
    }
}
