<?php

namespace App\Http\Middleware;

use App\Domain\Billing\Services\SubscriptionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlanFeature
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function handle(Request $request, Closure $next, string $feature): Response
    {
        if ($this->subscriptions->hasFeature($feature)) {
            return $next($request);
        }

        abort(Response::HTTP_FORBIDDEN, 'Upgrade required to use this feature.');
    }
}
