<?php

namespace App\Http\Middleware;

use App\Domain\Attendance\Services\AttendancePolicyService;
use App\Domain\Attendance\Services\NetworkVerificationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOfficeNetwork
{
    public function __construct(
        private readonly NetworkVerificationService $networks,
        private readonly AttendancePolicyService $policy,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->policy->mode()->requiresNetwork()) {
            return $next($request);
        }

        $employee = $request->user()?->employee;
        $result = $this->networks->inspect($request, $employee);

        if ($result['allowed']) {
            $request->attributes->set('office', $result['office']);
            $request->attributes->set('office_network', $result['network']);

            return $next($request);
        }

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            abort(Response::HTTP_FORBIDDEN, (string) $result['message']);
        }

        return back()->withErrors([
            'attendance' => $result['message'],
        ]);
    }
}
