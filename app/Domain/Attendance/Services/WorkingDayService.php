<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Models\WorkingDay;
use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Services\HolidayService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class WorkingDayService
{
    public function __construct(private readonly HolidayService $holidays) {}

    public function isConfiguredWorkingWeekday(CarbonInterface $date): bool
    {
        $dayOfWeek = (int) $date->dayOfWeek;
        $row = WorkingDay::query()->where('day_of_week', $dayOfWeek)->first();

        if ($row) {
            return $row->is_working;
        }

        // Bangladesh default: Friday and Saturday off.
        return ! in_array($dayOfWeek, [5, 6], true);
    }

    public function isWorkable(CarbonInterface $date, ?Employee $employee = null): bool
    {
        if (! $this->isConfiguredWorkingWeekday($date)) {
            return false;
        }

        return $this->holidays->forDate($date, $employee) === null;
    }

    /**
     * @return Collection<int, CarbonImmutable>
     */
    public function datesBetween(CarbonInterface $start, CarbonInterface $end, ?Employee $employee = null): Collection
    {
        $dates = collect();

        for ($date = CarbonImmutable::parse($start->toDateString()); $date->lte($end); $date = $date->addDay()) {
            if ($this->isWorkable($date, $employee)) {
                $dates->push($date);
            }
        }

        return $dates;
    }

    public function countDays(CarbonInterface $start, CarbonInterface $end, ?Employee $employee = null, bool $halfDay = false): float
    {
        $count = (float) $this->datesBetween($start, $end, $employee)->count();

        if ($halfDay && $start->toDateString() === $end->toDateString()) {
            return $count > 0 ? 0.5 : 0.0;
        }

        return $count;
    }

    /**
     * @return list<array{day_of_week: int, label: string, is_working: bool}>
     */
    public function week(): array
    {
        $labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $configured = WorkingDay::query()->orderBy('day_of_week')->get()->keyBy('day_of_week');

        return collect($labels)->map(function (string $label, int $day) use ($configured): array {
            return [
                'day_of_week' => $day,
                'label' => $label,
                'is_working' => (bool) ($configured->get($day)?->is_working ?? ! in_array($day, [5, 6], true)),
            ];
        })->all();
    }
}
