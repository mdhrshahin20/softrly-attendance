<?php

use App\Http\Middleware\AuthenticateApiToken;
use App\Http\Middleware\CaptureMarketingAttribution;
use App\Http\Middleware\EnsureActiveEmployee;
use App\Http\Middleware\EnsureCurrentTenant;
use App\Http\Middleware\EnsureOfficeNetwork;
use App\Http\Middleware\EnsurePlanFeature;
use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\EnsureSubscriptionActive;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetCurrentTenant;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Spatie\Multitenancy\Exceptions\NoCurrentTenant;
use Spatie\Multitenancy\Http\Middleware\EnsureValidTenantSession;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'device_uuid']);

        $middleware->validateCsrfTokens(except: [
            'billing/gateways/*',
        ]);

        $middleware->web(append: [
            SetCurrentTenant::class,
            CaptureMarketingAttribution::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'tenant' => EnsureCurrentTenant::class,
            'tenant.session' => EnsureValidTenantSession::class,
            'office.network' => EnsureOfficeNetwork::class,
            'active.employee' => EnsureActiveEmployee::class,
            'platform' => EnsurePlatformAdmin::class,
            'subscription.active' => EnsureSubscriptionActive::class,
            'feature' => EnsurePlanFeature::class,
            'api.token' => AuthenticateApiToken::class,
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (NoCurrentTenant $exception, Request $request) {
            if ($request->user()?->is_platform_admin) {
                return redirect()->route('platform.dashboard');
            }

            if ($request->user()) {
                return redirect()->route('dashboard')->withErrors([
                    'tenant' => 'No company workspace is assigned to this account.',
                ]);
            }

            return redirect()->route('login');
        });
    })->create();
