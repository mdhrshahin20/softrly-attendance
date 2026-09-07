<?php

namespace App\Http\Middleware;

use App\Domain\Employee\Models\Employee;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveEmployee
{
    public function handle(Request $request, Closure $next): Response
    {
        $employee = $request->user()?->employee;

        if (! $employee instanceof Employee || ! $employee->isActive()) {
            abort(Response::HTTP_FORBIDDEN, 'Only active employees can mark attendance.');
        }

        return $next($request);
    }
}
