<?php

namespace App\Domain\Holiday\Services;

use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Models\Holiday;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class HolidayService
{
    public function forDate(CarbonInterface $date, ?Employee $employee = null): ?Holiday
    {
        return $this->inRange($date, $date, $employee)->first();
    }

    /**
     * @return Collection<int, Holiday>
     */
    public function inRange(CarbonInterface $start, CarbonInterface $end, ?Employee $employee = null): Collection
    {
        $from = $start->toDateString();
        $to = $end->toDateString();

        return Holiday::query()
            ->where('status', 'active')
            ->whereDate('date', '<=', $to)
            ->where(function ($query) use ($from): void {
                $query->whereDate('end_date', '>=', $from)
                    ->orWhere(function ($inner) use ($from): void {
                        $inner->whereNull('end_date')->whereDate('date', '>=', $from);
                    });
            })
            ->orderBy('date')
            ->get()
            ->filter(fn (Holiday $holiday): bool => $this->appliesTo($holiday, $employee))
            ->values();
    }

    public function appliesTo(Holiday $holiday, ?Employee $employee): bool
    {
        if ($holiday->office_id === null && $holiday->department_id === null) {
            return true;
        }

        if ($employee === null) {
            return $holiday->office_id === null && $holiday->department_id === null;
        }

        if ($holiday->office_id && $holiday->office_id !== $employee->office_id) {
            return false;
        }

        if ($holiday->department_id && $holiday->department_id !== $employee->department_id) {
            return false;
        }

        return true;
    }

    /**
     * @return Collection<int, Holiday>
     */
    public function upcoming(?Employee $employee = null, int $limit = 5): Collection
    {
        return $this->inRange(now()->startOfDay(), now()->addMonths(6), $employee)
            ->take($limit)
            ->values();
    }
}
