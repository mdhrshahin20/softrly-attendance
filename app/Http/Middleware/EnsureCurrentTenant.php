<?php

namespace App\Http\Middleware;

use App\Domain\Tenant\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCurrentTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Tenant::checkCurrent()) {
            return $next($request);
        }

        if ($request->user()?->is_platform_admin) {
            return redirect()->route('platform.dashboard');
        }

        if ($request->user()) {
            return redirect()->route('dashboard')->withErrors([
                'tenant' => 'No company workspace is assigned to this account.',
            ]);
        }

        return redirect()->route('login');
    }
}
