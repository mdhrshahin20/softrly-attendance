<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Employee\Models\Employee;
use App\Domain\Office\Models\Office;
use App\Domain\Office\Models\OfficeNetwork;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Http\Request;

class NetworkVerificationService
{
    /**
     * @return array{
     *     allowed: bool,
     *     ip: string,
     *     office: ?Office,
     *     network: ?OfficeNetwork,
     *     message: ?string
     * }
     */
    public function inspect(Request $request, ?Employee $employee = null): array
    {
        $ip = $this->getClientIp($request);
        $match = $this->findMatchingNetwork($ip, $employee);

        if ($match === null) {
            return [
                'allowed' => false,
                'ip' => $ip,
                'office' => null,
                'network' => null,
                'message' => 'You must be connected to an authorized office network to mark attendance.',
            ];
        }

        return [
            'allowed' => true,
            'ip' => $ip,
            'office' => $match['office'],
            'network' => $match['network'],
            'message' => null,
        ];
    }

    public function verify(Request $request, Employee $employee): Office
    {
        $result = $this->inspect($request, $employee);

        if (! $result['allowed'] || $result['office'] === null) {
            abort(403, $result['message'] ?? 'You must be connected to an authorized office network to mark attendance.');
        }

        return $result['office'];
    }

    public function getClientIp(Request $request): string
    {
        $candidates = [
            $request->header('CF-Connecting-IP'),
            $request->header('True-Client-IP'),
        ];

        $forwarded = $request->header('X-Forwarded-For');

        if (is_string($forwarded) && $forwarded !== '') {
            $candidates[] = trim(explode(',', $forwarded)[0]);
        }

        $candidates[] = $request->ip();

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && filter_var($candidate, FILTER_VALIDATE_IP)) {
                return $candidate;
            }
        }

        return '0.0.0.0';
    }

    /**
     * @return array{office: Office, network: OfficeNetwork}|null
     */
    public function findMatchingNetwork(string $ip, ?Employee $employee = null): ?array
    {
        $tenant = Tenant::current();

        if ($tenant === null) {
            return null;
        }

        $networks = OfficeNetwork::query()
            ->with('office')
            ->where('status', 'active')
            ->whereHas('office', fn ($query) => $query->where('status', 'active'))
            ->get();

        $preferred = $employee?->office_id;

        $sorted = $networks->sortBy(function (OfficeNetwork $network) use ($preferred): int {
            return $preferred !== null && $network->office_id === $preferred ? 0 : 1;
        });

        foreach ($sorted as $network) {
            if ($this->matchesNetwork($ip, $network) && $network->office instanceof Office) {
                return [
                    'office' => $network->office,
                    'network' => $network,
                ];
            }
        }

        return null;
    }

    public function matchesNetwork(string $ip, OfficeNetwork $network): bool
    {
        if (is_string($network->ip_address) && $network->ip_address !== '' && $this->ipsEqual($ip, $network->ip_address)) {
            return true;
        }

        if (is_string($network->ip_range) && $network->ip_range !== '') {
            return $this->matchesCidr($ip, $network->ip_range);
        }

        return false;
    }

    public function matchesCidr(string $ip, string $cidr): bool
    {
        if (! str_contains($cidr, '/')) {
            return $this->ipsEqual($ip, $cidr);
        }

        [$subnet, $maskBits] = explode('/', $cidr, 2);
        $bits = (int) $maskBits;

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $ipLong = ip2long($ip);
            $subnetLong = ip2long($subnet);

            if ($ipLong === false || $subnetLong === false) {
                return false;
            }

            $mask = $bits === 0 ? 0 : (-1 << (32 - $bits));

            return ($ipLong & $mask) === ($subnetLong & $mask);
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $ipBin = inet_pton($ip);
            $subnetBin = inet_pton($subnet);

            if ($ipBin === false || $subnetBin === false) {
                return false;
            }

            $bytes = intdiv($bits, 8);
            $remaining = $bits % 8;

            if ($bytes > 0 && substr($ipBin, 0, $bytes) !== substr($subnetBin, 0, $bytes)) {
                return false;
            }

            if ($remaining === 0) {
                return true;
            }

            $mask = 0xFF << (8 - $remaining);

            return (ord($ipBin[$bytes]) & $mask) === (ord($subnetBin[$bytes]) & $mask);
        }

        return false;
    }

    private function ipsEqual(string $left, string $right): bool
    {
        $normalizedLeft = $this->normalizeIp($left);
        $normalizedRight = $this->normalizeIp($right);

        return $normalizedLeft !== null && $normalizedLeft === $normalizedRight;
    }

    private function normalizeIp(string $ip): ?string
    {
        $packed = inet_pton($ip);

        if ($packed === false) {
            return null;
        }

        $normalized = inet_ntop($packed);

        return $normalized === false ? null : $normalized;
    }
}
