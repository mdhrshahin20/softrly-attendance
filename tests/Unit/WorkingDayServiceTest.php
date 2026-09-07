<?php

use App\Domain\Attendance\Services\WorkingDayService;
use App\Domain\Holiday\Enums\HolidayType;
use App\Domain\Holiday\Models\Holiday;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('working day service skips weekends and holidays', function () {
    $workspace = createWorkspace();
    $workspace['tenant']->makeCurrent();

    Holiday::query()->create([
        'name' => 'Company Day',
        'date' => '2026-09-09',
        'holiday_type' => HolidayType::Company,
        'status' => 'active',
    ]);

    $service = app(WorkingDayService::class);
    $start = CarbonImmutable::parse('2026-09-07');
    $end = CarbonImmutable::parse('2026-09-13');

    $dates = $service->datesBetween($start, $end, $workspace['employee']);

    expect($dates->map->toDateString()->all())->toBe([
        '2026-09-07',
        '2026-09-08',
        '2026-09-10',
        '2026-09-13',
    ])->and($service->countDays($start, $end, $workspace['employee']))->toBe(4.0);
});
