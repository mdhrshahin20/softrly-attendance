<?php

namespace App\Http\Middleware;

use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Tenant\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscriptionActive
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->is_platform_admin) {
            return $next($request);
        }

        if ($this->subscriptions->allowsAccess(Tenant::current())) {
            return $next($request);
        }

        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            return $next($request);
        }

        abort(Response::HTTP_FORBIDDEN, 'Your trial or subscription is not active. Open Billing to upgrade.');
    }
}
