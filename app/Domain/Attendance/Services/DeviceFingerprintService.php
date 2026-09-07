<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Models\UserDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeviceFingerprintService
{
    /**
     * @return array{device_id: string, browser: string, os: string, user_agent: string, trusted: bool, model: UserDevice}
     */
    public function capture(Request $request, int $userId): array
    {
        $userAgent = (string) $request->userAgent();
        $deviceId = $request->input('device_id') ?: $request->cookie('device_uuid') ?: (string) Str::uuid();

        $device = UserDevice::query()->updateOrCreate(
            [
                'user_id' => $userId,
                'device_uuid' => $deviceId,
            ],
            [
                'device_name' => $request->input('device_name') ?: $this->browser($userAgent).' on '.$this->operatingSystem($userAgent),
                'browser' => $this->browser($userAgent),
                'os' => $this->operatingSystem($userAgent),
                'last_ip' => $request->ip(),
                'last_seen_at' => now(),
            ],
        );

        if (! $device->trusted && UserDevice::query()->where('user_id', $userId)->where('trusted', true)->doesntExist()) {
            $device->forceFill(['trusted' => true])->save();
        }

        return [
            'device_id' => $device->device_uuid,
            'browser' => (string) $device->browser,
            'os' => (string) $device->os,
            'user_agent' => $userAgent,
            'trusted' => (bool) $device->trusted,
            'model' => $device,
        ];
    }

    private function browser(string $userAgent): string
    {
        return match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'Safari/') => 'Safari',
            str_contains($userAgent, 'Firefox/') => 'Firefox',
            default => 'Unknown',
        };
    }

    private function operatingSystem(string $userAgent): string
    {
        return match (true) {
            str_contains($userAgent, 'Windows') => 'Windows',
            str_contains($userAgent, 'Mac OS') || str_contains($userAgent, 'Macintosh') => 'macOS',
            str_contains($userAgent, 'Android') => 'Android',
            str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad') => 'iOS',
            str_contains($userAgent, 'Linux') => 'Linux',
            default => 'Unknown',
        };
    }
}
