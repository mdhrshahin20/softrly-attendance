<?php

namespace App\Domain\Attendance\Enums;

enum AttendanceStatus: string
{
    case Present = 'present';
    case Late = 'late';
    case Absent = 'absent';
    case HalfDay = 'half_day';
    case Leave = 'leave';
    case Holiday = 'holiday';
    case Weekend = 'weekend';
    case WorkFromHome = 'work_from_home';
    case Manual = 'manual';
    case NotJoined = 'before_joining';

    /**
     * Statuses that may be written to an attendance record.
     *
     * Holiday, weekend and before-joining are derived when a month is rendered
     * and must never be persisted.
     *
     * @return list<self>
     */
    public static function recordable(): array
    {
        return [
            self::Present,
            self::Late,
            self::Absent,
            self::HalfDay,
            self::Leave,
            self::WorkFromHome,
            self::Manual,
        ];
    }

    public function label(): string
    {
        return match ($this) {
            self::Present => 'Present',
            self::Late => 'Late',
            self::Absent => 'Absent',
            self::HalfDay => 'Half Day',
            self::Leave => 'Leave',
            self::Holiday => 'Holiday',
            self::Weekend => 'Weekly Off',
            self::WorkFromHome => 'Work From Home',
            self::Manual => 'Manual',
            self::NotJoined => 'Before joining',
        };
    }

    public function shortCode(): string
    {
        return match ($this) {
            self::Present => 'P',
            self::Late => 'L',
            self::Absent => 'A',
            self::HalfDay => 'HD',
            self::Leave => 'LV',
            self::Holiday => 'H',
            self::Weekend => 'WO',
            self::WorkFromHome => 'WFH',
            self::Manual => 'M',
            self::NotJoined => '—',
        };
    }
}
