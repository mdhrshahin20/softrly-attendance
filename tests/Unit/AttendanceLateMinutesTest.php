<?php

use App\Domain\Attendance\Models\Shift;
use App\Domain\Attendance\Services\AttendanceService;
use Carbon\CarbonImmutable;

test('grace period keeps a check-in on time and later minutes are late', function () {
    $service = app(AttendanceService::class);
    $shift = new Shift([
        'start_time' => '09:00:00',
        'end_time' => '18:00:00',
        'grace_minutes' => 10,
        'minimum_work_minutes' => 480,
    ]);

    $onTime = CarbonImmutable::parse('2026-09-07 09:07:00', 'Asia/Dhaka');
    $late = CarbonImmutable::parse('2026-09-07 09:18:00', 'Asia/Dhaka');

    expect($service->lateMinutes($onTime, $shift))->toBe(0)
        ->and($service->lateMinutes($late, $shift))->toBe(8);
});
