<?php

namespace App\Domain\Attendance\Enums;

enum AttendanceMode: string
{
    case Network = 'network';
    case NetworkLocation = 'network_location';
    case Location = 'location';
    case NetworkDevice = 'network_device';
    case NetworkLocationDevice = 'network_location_device';
    case Manual = 'manual';

    public function label(): string
    {
        return match ($this) {
            self::Network => 'Office network only',
            self::NetworkLocation => 'Network + location',
            self::Location => 'Location only',
            self::NetworkDevice => 'Network + trusted device',
            self::NetworkLocationDevice => 'Network + location + trusted device',
            self::Manual => 'Manual (no automatic checks)',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Network => 'Employees must be on an approved office IP.',
            self::NetworkLocation => 'Approved office IP and GPS within the office radius.',
            self::Location => 'GPS within the office radius. Network is not required.',
            self::NetworkDevice => 'Approved office IP and a trusted device.',
            self::NetworkLocationDevice => 'Office IP, GPS radius, and a trusted device.',
            self::Manual => 'Employees can check in without network, GPS, or device checks. HR can still adjust records.',
        };
    }

    public function requiresNetwork(): bool
    {
        return in_array($this, [
            self::Network,
            self::NetworkLocation,
            self::NetworkDevice,
            self::NetworkLocationDevice,
        ], true);
    }

    public function requiresLocation(): bool
    {
        return in_array($this, [
            self::NetworkLocation,
            self::Location,
            self::NetworkLocationDevice,
        ], true);
    }

    public function requiresTrustedDevice(): bool
    {
        return in_array($this, [
            self::NetworkDevice,
            self::NetworkLocationDevice,
        ], true);
    }

    public function requiresLocationFeature(): bool
    {
        return $this->requiresLocation();
    }
}
