<?php

namespace App\Http\Middleware;

use App\Domain\Api\Services\ApiTokenService;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function __construct(
        private readonly ApiTokenService $tokens,
        private readonly SubscriptionService $subscriptions,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $plain = $this->bearerToken($request);

        if ($plain === null) {
            abort(Response::HTTP_UNAUTHORIZED, 'Missing API token.');
        }

        $token = $this->tokens->findByPlainText($plain);

        if ($token === null || $token->user === null || $token->tenant === null) {
            abort(Response::HTTP_UNAUTHORIZED, 'Invalid API token.');
        }

        $tenant = $token->tenant;
        $tenant->makeCurrent();
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);

        if (! $this->subscriptions->hasFeature(PlanFeature::ApiAccess, $tenant)) {
            abort(Response::HTTP_FORBIDDEN, 'API access is not included in this plan.');
        }

        Auth::setUser($token->user);
        $request->setUserResolver(fn () => $token->user);
        $this->tokens->touch($token);

        return $next($request);
    }

    private function bearerToken(Request $request): ?string
    {
        $header = $request->header('Authorization', '');

        if (is_string($header) && str_starts_with($header, 'Bearer ')) {
            $token = trim(substr($header, 7));

            return $token !== '' ? $token : null;
        }

        $query = $request->string('api_token')->toString();

        return $query !== '' ? $query : null;
    }
}
