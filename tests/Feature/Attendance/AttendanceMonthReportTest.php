<?php

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Services\AdvancedReportService;
use App\Domain\Attendance\Services\EmployeeMonthReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function monthReportFor(string $joiningDate): array
{
    $workspace = createWorkspace([
        'slug' => 'join-'.str_replace('-', '', $joiningDate),
        'owner_email' => 'join-'.$joiningDate.'@example.com',
    ]);

    $employee = $workspace['employee'];
    $employee->forceFill(['joining_date' => $joiningDate])->save();

    return app(EmployeeMonthReportService::class)->build($employee->fresh(), 2026, 6);
}

test('days before the joining date are marked before joining, not absent', function () {
    // Stand in July so the whole of June is in the past.
    $this->travelTo(now()->setDate(2026, 7, 15)->setTime(10, 0));

    $report = monthReportFor('2026-06-20');

    $beforeJoining = collect($report['days'])->filter(
        fn (array $day): bool => $day['date'] < '2026-06-20',
    );

    expect($beforeJoining)->not->toBeEmpty()
        ->and($beforeJoining->every(
            fn (array $day): bool => $day['status'] === AttendanceStatus::NotJoined->value,
        ))->toBeTrue();

    $absentDates = collect($report['days'])
        ->where('status', AttendanceStatus::Absent->value)
        ->pluck('date');

    expect($absentDates->every(fn (string $date): bool => $date >= '2026-06-20'))->toBeTrue();
});

test('absence is only counted from the joining date onwards', function () {
    $this->travelTo(now()->setDate(2026, 7, 15)->setTime(10, 0));

    $report = monthReportFor('2026-06-20');

    $workingDaysBeforeJoining = collect($report['days'])
        ->filter(fn (array $day): bool => $day['date'] < '2026-06-20')
        ->whereNotIn('status', [AttendanceStatus::Weekend->value, AttendanceStatus::Holiday->value])
        ->count();

    // The old behaviour counted every one of these as absent.
    expect($workingDaysBeforeJoining)->toBeGreaterThan(0)
        ->and($report['summary']['absent'])->toBeLessThan($workingDaysBeforeJoining);
});

test('a joining date before the month start leaves absence counting unchanged', function () {
    $this->travelTo(now()->setDate(2026, 7, 15)->setTime(10, 0));

    $report = monthReportFor('2026-01-01');

    expect(collect($report['days'])->pluck('status'))
        ->not->toContain(AttendanceStatus::NotJoined->value)
        ->toContain(AttendanceStatus::Absent->value);
});

test('an employee without a joining date keeps the previous behaviour', function () {
    $this->travelTo(now()->setDate(2026, 7, 15)->setTime(10, 0));

    $workspace = createWorkspace(['owner_email' => 'no-joining@example.com']);
    $employee = $workspace['employee'];
    $employee->forceFill(['joining_date' => null])->save();

    $report = app(EmployeeMonthReportService::class)->build($employee->fresh(), 2026, 6);

    expect(collect($report['days'])->pluck('status'))
        ->not->toContain(AttendanceStatus::NotJoined->value)
        ->toContain(AttendanceStatus::Absent->value);
});

test('the advanced report does not count pre-joining days as absent', function () {
    $workspace = createWorkspace(['owner_email' => 'advanced-joining@example.com']);

    $employee = $workspace['employee'];
    $employee->forceFill(['joining_date' => '2026-06-20', 'status' => 'active'])->save();

    $report = app(AdvancedReportService::class)->build('2026-06-01', '2026-06-30');

    $row = collect($report['employees'])->firstWhere('employee_id', $employee->id);

    expect($row)->not->toBeNull();

    $workingDaysBeforeJoining = 0;

    for ($date = now()->parse('2026-06-01'); $date->lte(now()->parse('2026-06-19')); $date = $date->addDay()) {
        if (! in_array($date->dayOfWeek, [5, 6], true)) {
            $workingDaysBeforeJoining++;
        }
    }

    expect($workingDaysBeforeJoining)->toBeGreaterThan(0)
        ->and($row['absent'])->toBeLessThan($workingDaysBeforeJoining);
});

test('the calendar page exposes the before joining status', function () {
    $this->travelTo(now()->setDate(2026, 7, 15)->setTime(10, 0));

    $workspace = createWorkspace(['owner_email' => 'calendar-joining@example.com']);
    $workspace['employee']->forceFill(['joining_date' => '2026-06-20'])->save();

    actingAsOwner($workspace)
        ->get('/attendance/calendar?month=6&year=2026')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('attendance/calendar')
            ->where('days', function ($days): bool {
                $days = collect($days);

                $allBeforeJoining = $days
                    ->filter(fn (array $day): bool => $day['date'] < '2026-06-20')
                    ->every(fn (array $day): bool => $day['status'] === AttendanceStatus::NotJoined->value);

                $joiningDay = $days->firstWhere('date', '2026-06-20');

                return $allBeforeJoining
                    && $joiningDay !== null
                    && $joiningDay['status'] !== AttendanceStatus::NotJoined->value;
            }));
});

test('derived statuses cannot be persisted through a manual adjustment', function () {
    $workspace = createWorkspace(['owner_email' => 'manual-derived@example.com']);

    actingAsOwner($workspace)
        ->post('/attendance/manual', [
            'employee_id' => $workspace['employee']->id,
            'attendance_date' => '2026-06-20',
            'check_in_at' => '09:10',
            'check_out_at' => '18:00',
            'status' => AttendanceStatus::NotJoined->value,
            'reason' => 'Attempt to store a derived status',
        ])
        ->assertRedirect();

    expect(Attendance::query()->first()?->status)
        ->not->toBe(AttendanceStatus::NotJoined);
});
