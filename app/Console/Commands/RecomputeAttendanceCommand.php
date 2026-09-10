<?php

namespace App\Console\Commands;

use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Services\AttendanceService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Console\Command;
use Throwable;

/**
 * Recomputes the minutes derived from a check-in/check-out pair.
 *
 * Records written before the workspace timezone was applied to requests have
 * work_minutes, late_minutes, early_leave_minutes and overtime_minutes computed
 * against the wrong zone, which understates hours and skews payroll. This is
 * safe to re-run: it only rewrites the derived columns.
 */
class RecomputeAttendanceCommand extends Command
{
    protected $signature = 'attendance:recompute
        {--tenant= : Only process a single tenant id}
        {--dry-run : Report what would change without writing}';

    protected $description = 'Recompute work, late, early-leave and overtime minutes for existing attendance.';

    public function handle(AttendanceService $attendance): int
    {
        $tenantId = $this->option('tenant');
        $dryRun = (bool) $this->option('dry-run');

        $tenants = Tenant::query()
            ->when($tenantId !== null, fn ($query) => $query->whereKey($tenantId))
            ->get();

        if ($tenants->isEmpty()) {
            $this->error('No tenants matched.');

            return self::FAILURE;
        }

        $totalChecked = 0;
        $totalChanged = 0;

        foreach ($tenants as $tenant) {
            $tenant->makeCurrent();

            // Run each tenant in its own zone so the stored wall-clock times are
            // interpreted correctly.
            $timezone = $tenant->timezone;
            config(['app.timezone' => $timezone]);
            date_default_timezone_set($timezone);

            $this->info(sprintf('Tenant #%d %s (%s)', $tenant->id, $tenant->name, $timezone));

            $checked = 0;
            $changed = 0;

            Attendance::query()
                ->with('employee.shift')
                ->whereNotNull('check_in_at')
                ->orderBy('id')
                ->chunkById(200, function ($records) use ($attendance, $dryRun, &$checked, &$changed): void {
                    foreach ($records as $record) {
                        $employee = $record->employee;

                        if (! $employee instanceof Employee) {
                            continue;
                        }

                        $checked++;
                        $shift = $employee->shift;

                        try {
                            $workMinutes = $record->check_out_at !== null
                                ? max(0, (int) $record->check_in_at->diffInMinutes($record->check_out_at))
                                : 0;

                            $lateMinutes = $attendance->lateMinutes($record->check_in_at->toImmutable(), $shift);
                            $earlyLeave = $record->check_out_at !== null
                                ? $attendance->earlyLeaveMinutes($record->check_out_at->toImmutable(), $shift)
                                : 0;
                            $overtime = $attendance->overtimeMinutes($workMinutes, $shift);
                        } catch (Throwable $exception) {
                            $this->warn(sprintf('  skipped #%d: %s', $record->id, $exception->getMessage()));

                            continue;
                        }

                        $dirty = (int) $record->work_minutes !== $workMinutes
                            || (int) $record->late_minutes !== $lateMinutes
                            || (int) $record->early_leave_minutes !== $earlyLeave
                            || (int) $record->overtime_minutes !== $overtime;

                        if (! $dirty) {
                            continue;
                        }

                        $changed++;

                        if ($dryRun) {
                            $this->line(sprintf(
                                '  #%d work %d→%d, late %d→%d, early %d→%d, overtime %d→%d',
                                $record->id,
                                $record->work_minutes,
                                $workMinutes,
                                $record->late_minutes,
                                $lateMinutes,
                                $record->early_leave_minutes,
                                $earlyLeave,
                                $record->overtime_minutes,
                                $overtime,
                            ));

                            continue;
                        }

                        // Bypass fillable guards deliberately: these are derived columns.
                        $record->forceFill([
                            'work_minutes' => $workMinutes,
                            'late_minutes' => $lateMinutes,
                            'early_leave_minutes' => $earlyLeave,
                            'overtime_minutes' => $overtime,
                        ])->save();
                    }
                });

            $this->line(sprintf('  checked %d, %s %d', $checked, $dryRun ? 'would change' : 'changed', $changed));

            $totalChecked += $checked;
            $totalChanged += $changed;
        }

        Tenant::forgetCurrent();

        $this->info(sprintf(
            '%s %d of %d record(s).',
            $dryRun ? 'Would update' : 'Updated',
            $totalChanged,
            $totalChecked,
        ));

        return self::SUCCESS;
    }
}
