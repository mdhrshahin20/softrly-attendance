<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Enums\AttendanceMode;
use App\Domain\Attendance\Models\UserDevice;
use App\Domain\Employee\Models\Employee;
use App\Domain\Office\Models\Office;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AttendancePolicyService
{
    public function __construct(
        private readonly NetworkVerificationService $networks,
        private readonly LocationVerificationService $locations,
        private readonly DeviceFingerprintService $devices,
        private readonly FaceVerificationService $faces,
    ) {}

    public function mode(?Tenant $tenant = null): AttendanceMode
    {
        $tenant ??= Tenant::current();
        $value = (string) ($tenant?->setting('attendance_method', AttendanceMode::Network->value) ?? AttendanceMode::Network->value);

        return AttendanceMode::tryFrom($value) ?? AttendanceMode::Network;
    }

    /**
     * @return array{
     *     mode: AttendanceMode,
     *     office: Office,
     *     device: array{device_id: string, browser: string, os: string, user_agent: string, trusted: bool, model: UserDevice},
     *     method: string,
     *     face: array{required: bool, score: float|null, selfie_path: string|null}
     * }
     */
    public function authorize(Request $request, Employee $employee): array
    {
        $mode = $this->mode();
        $office = $this->resolveOffice($request, $employee, $mode);
        $device = $this->devices->capture($request, (int) $employee->user_id);

        if ($mode->requiresLocation()) {
            $this->locations->assertWithinOffice($request, $office);
        }

        if ($mode->requiresTrustedDevice() && ! $device['trusted']) {
            throw ValidationException::withMessages([
                'attendance' => 'This device is not trusted. Ask HR to trust it before marking attendance.',
            ]);
        }

        // Face verification is an independent requirement layered on top of the
        // configured attendance mode, so it composes with network/location/device.
        $face = $this->faces->assertVerified($request, $employee);

        return [
            'mode' => $mode,
            'office' => $office,
            'device' => $device,
            'method' => $mode->value,
            'face' => $face,
        ];
    }

    /**
     * @return array{
     *     mode: string,
     *     label: string,
     *     description: string,
     *     requires_network: bool,
     *     requires_location: bool,
     *     requires_device: bool
     * }
     */
    public function snapshot(?Tenant $tenant = null): array
    {
        $mode = $this->mode($tenant);

        return [
            'mode' => $mode->value,
            'label' => $mode->label(),
            'description' => $mode->description(),
            'requires_network' => $mode->requiresNetwork(),
            'requires_location' => $mode->requiresLocation(),
            'requires_device' => $mode->requiresTrustedDevice(),
        ];
    }

    private function resolveOffice(Request $request, Employee $employee, AttendanceMode $mode): Office
    {
        if ($mode->requiresNetwork()) {
            return $this->networks->verify($request, $employee);
        }

        $office = $employee->office;

        if (! $office instanceof Office) {
            throw ValidationException::withMessages([
                'attendance' => 'You must be assigned to an office to mark attendance.',
            ]);
        }

        return $office;
    }
}
