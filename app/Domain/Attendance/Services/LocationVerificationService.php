<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Office\Models\Office;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LocationVerificationService
{
    public function assertWithinOffice(Request $request, Office $office): void
    {
        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');

        if (! is_numeric($latitude) || ! is_numeric($longitude)) {
            throw ValidationException::withMessages([
                'attendance' => 'Location is required to mark attendance.',
            ]);
        }

        if ($office->latitude === null || $office->longitude === null) {
            throw ValidationException::withMessages([
                'attendance' => 'Office coordinates are not configured. Ask HR to set the office location.',
            ]);
        }

        $distance = $this->distanceMeters(
            (float) $latitude,
            (float) $longitude,
            (float) $office->latitude,
            (float) $office->longitude,
        );

        $radius = $office->allowed_radius > 0 ? $office->allowed_radius : 200;

        if ($distance > $radius) {
            throw ValidationException::withMessages([
                'attendance' => 'You are outside the allowed office radius ('.(int) round($distance).'m away).',
            ]);
        }
    }

    public function distanceMeters(float $fromLat, float $fromLng, float $toLat, float $toLng): float
    {
        $earth = 6371000;
        $dLat = deg2rad($toLat - $fromLat);
        $dLng = deg2rad($toLng - $fromLng);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($fromLat)) * cos(deg2rad($toLat)) * sin($dLng / 2) ** 2;

        return 2 * $earth * asin(min(1, sqrt($a)));
    }
}
