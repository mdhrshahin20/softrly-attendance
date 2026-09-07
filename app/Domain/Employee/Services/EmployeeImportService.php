<?php

namespace App\Domain\Employee\Services;

use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Department;
use App\Domain\Employee\Models\Designation;
use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Services\LeaveBalanceService;
use App\Domain\Office\Models\Office;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\AuditLogger;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EmployeeImportService
{
    public function __construct(
        private readonly SubscriptionService $subscriptions,
        private readonly LeaveBalanceService $balances,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * @return array{headers: list<string>, rows: list<array<string, mixed>>, valid: int, invalid: int}
     */
    public function preview(UploadedFile $file): array
    {
        $parsed = $this->parse($file);

        $valid = 0;
        $invalid = 0;

        foreach ($parsed['rows'] as $row) {
            if ($row['valid']) {
                $valid++;
            } else {
                $invalid++;
            }
        }

        return [
            'headers' => $parsed['headers'],
            'rows' => $parsed['rows'],
            'valid' => $valid,
            'invalid' => $invalid,
        ];
    }

    /**
     * @param  list<array{line: int, data: array<string, string>, valid: bool, error: string|null}>  $rows
     * @return array{created: int, skipped: int, errors: list<string>}
     */
    public function importRows(array $rows, User $actor): array
    {
        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $row) {
            if (! $row['valid']) {
                $skipped++;
                $errors[] = 'Row '.$row['line'].': '.($row['error'] ?? 'Invalid');

                continue;
            }

            try {
                $this->subscriptions->assertCanCreateEmployee();
                $this->createEmployee($row['data']);
                $created++;
            } catch (ValidationException $exception) {
                $skipped++;
                $message = collect($exception->errors())->flatten()->first();
                $errors[] = 'Row '.$row['line'].': '.(is_string($message) ? $message : 'Could not import');
            }
        }

        $this->audit->record('employees.imported', $actor, newValues: [
            'created' => $created,
            'skipped' => $skipped,
        ], user: $actor);

        return [
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * @return array{created: int, skipped: int, errors: list<string>}
     */
    public function import(UploadedFile $file, User $actor): array
    {
        return $this->importRows($this->parse($file)['rows'], $actor);
    }

    /**
     * @return list<list<string>>
     */
    public function templateRows(): array
    {
        return [
            ['employee_code', 'first_name', 'last_name', 'email', 'phone', 'department', 'designation', 'office', 'joining_date', 'employment_type'],
            ['EMP101', 'Amina', 'Rahman', 'amina.import@example.com', '01700000000', 'Engineering', 'Engineer', 'Head Office', '2026-01-01', 'permanent'],
        ];
    }

    /**
     * @return array{headers: list<string>, rows: list<array{line: int, data: array<string, string>, valid: bool, error: string|null}>}
     */
    private function parse(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath() ?: $file->getPathname(), 'r');

        if ($handle === false) {
            throw ValidationException::withMessages(['file' => 'The CSV file could not be read.']);
        }

        $headerRow = fgetcsv($handle);
        $headers = $this->normalizeHeaders(is_array($headerRow) ? $headerRow : []);
        $rows = [];
        $line = 1;
        $seenCodes = [];
        $seenEmails = [];

        while (($data = fgetcsv($handle)) !== false) {
            $line++;

            if ($this->rowEmpty($data)) {
                continue;
            }

            $mapped = [];

            foreach ($headers as $index => $header) {
                $mapped[$header] = trim((string) ($data[$index] ?? ''));
            }

            $error = $this->validateRow($mapped, $seenCodes, $seenEmails);
            $code = Str::lower($mapped['employee_code'] ?? '');
            $email = Str::lower($mapped['email'] ?? '');

            if ($error === null) {
                $seenCodes[$code] = true;
                $seenEmails[$email] = true;
            }

            $rows[] = [
                'line' => $line,
                'data' => $mapped,
                'valid' => $error === null,
                'error' => $error,
            ];
        }

        fclose($handle);

        return [
            'headers' => $headers,
            'rows' => $rows,
        ];
    }

    /**
     * @param  list<string|null>  $headers
     * @return list<string>
     */
    private function normalizeHeaders(array $headers): array
    {
        return array_map(function (?string $header): string {
            $value = Str::of((string) $header)->replace("\u{FEFF}", '')->trim()->lower()->replace(' ', '_')->toString();

            return $value;
        }, $headers);
    }

    /**
     * @param  list<string|null>  $row
     */
    private function rowEmpty(array $row): bool
    {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, string>  $row
     * @param  array<string, bool>  $seenCodes
     * @param  array<string, bool>  $seenEmails
     */
    private function validateRow(array $row, array $seenCodes, array $seenEmails): ?string
    {
        $code = $row['employee_code'] ?? '';
        $first = $row['first_name'] ?? '';
        $email = $row['email'] ?? '';

        if ($code === '' || $first === '' || $email === '') {
            return 'employee_code, first_name, and email are required.';
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return 'Invalid email.';
        }

        $codeKey = Str::lower($code);
        $emailKey = Str::lower($email);

        if (isset($seenCodes[$codeKey])) {
            return 'Duplicate employee_code in this file.';
        }

        if (isset($seenEmails[$emailKey])) {
            return 'Duplicate email in this file.';
        }

        if (Employee::query()->where('employee_code', $code)->exists()) {
            return 'Employee code already exists.';
        }

        if (Employee::query()->where('email', $email)->exists() || User::query()->where('email', $email)->exists()) {
            return 'Email already exists.';
        }

        if (($row['office'] ?? '') !== '' && $this->findOffice($row['office']) === null) {
            return 'Unknown office.';
        }

        if (($row['department'] ?? '') !== '' && $this->findDepartment($row['department']) === null) {
            return 'Unknown department.';
        }

        if (($row['designation'] ?? '') !== '' && $this->findDesignation($row['designation']) === null) {
            return 'Unknown designation.';
        }

        if (($row['employment_type'] ?? '') !== '' && EmploymentType::tryFrom(Str::snake($row['employment_type'])) === null) {
            return 'Invalid employment type.';
        }

        return null;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function createEmployee(array $row): Employee
    {
        $tenant = Tenant::current();
        $password = Str::password(12);

        $user = User::query()->create([
            'name' => trim($row['first_name'].' '.($row['last_name'] ?? '')),
            'email' => $row['email'],
            'password' => Hash::make($password),
            'email_verified_at' => now(),
            'current_tenant_id' => $tenant?->id,
        ]);

        $tenant?->users()->syncWithoutDetaching([$user->id]);
        $user->assignRole('employee');

        $office = ($row['office'] ?? '') !== '' ? $this->findOffice($row['office']) : Office::query()->orderBy('id')->first();
        $department = ($row['department'] ?? '') !== '' ? $this->findDepartment($row['department']) : null;
        $designation = ($row['designation'] ?? '') !== '' ? $this->findDesignation($row['designation']) : null;
        $employment = EmploymentType::tryFrom(Str::snake($row['employment_type'] ?? '')) ?? EmploymentType::Permanent;

        $employee = Employee::query()->create([
            'user_id' => $user->id,
            'employee_code' => $row['employee_code'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'] !== '' ? $row['last_name'] : null,
            'email' => $row['email'],
            'phone' => ($row['phone'] ?? '') !== '' ? $row['phone'] : null,
            'department_id' => $department?->id,
            'designation_id' => $designation?->id,
            'office_id' => $office?->id,
            'joining_date' => ($row['joining_date'] ?? '') !== '' ? $row['joining_date'] : now()->toDateString(),
            'employment_type' => $employment,
            'status' => EmployeeStatus::Active,
        ]);

        $this->balances->ensureForEmployee($employee);

        return $employee;
    }

    private function findOffice(string $value): ?Office
    {
        return Office::query()
            ->where(function ($query) use ($value): void {
                $query->where('name', $value)->orWhere('code', $value);
            })
            ->first();
    }

    private function findDepartment(string $value): ?Department
    {
        return Department::query()
            ->where(function ($query) use ($value): void {
                $query->where('name', $value)->orWhere('code', $value);
            })
            ->first();
    }

    private function findDesignation(string $value): ?Designation
    {
        return Designation::query()->where('name', $value)->first();
    }
}
