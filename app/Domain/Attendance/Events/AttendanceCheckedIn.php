<?php

namespace App\Domain\Attendance\Events;

use App\Domain\Attendance\Models\Attendance;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceCheckedIn
{
    use Dispatchable, SerializesModels;

    public function __construct(public Attendance $attendance) {}
}
