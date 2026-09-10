<?php

namespace App\Http\Middleware;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Support\HybridTenantFinder;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->resolveTenant($request);

        if ($tenant instanceof Tenant) {
            $tenant->makeCurrent();
            app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
            $request->session()->put('current_tenant_id', $tenant->id);
            $request->session()->put('ensure_valid_tenant_session_tenant_id', $tenant->id);

            $user = $request->user();

            if (
                $user instanceof User
                && ! $user->is_platform_admin
                && $user->current_tenant_id !== $tenant->id
                && $user->tenants()->where('tenants.id', $tenant->id)->exists()
            ) {
                $user->forceFill(['current_tenant_id' => $tenant->id])->save();
            }
        } else {
            Tenant::forgetCurrent();
        }

        // Attendance times are stored as the workspace's wall-clock time, so the
        // whole request has to run in that zone. Without this, a stored 02:41 is
        // read as 02:41 UTC, which both shifts every displayed time and makes
        // duration maths (work minutes, overtime, late) wrong.
        $this->applyTimezone($tenant?->timezone);

        return $next($request);
    }

    /**
     * Run the request in the workspace's timezone, falling back to the app default.
     */
    private function applyTimezone(?string $timezone): void
    {
        $fallback = (string) config('app.timezone', 'UTC');

        if ($timezone === null || ! in_array($timezone, timezone_identifiers_list(), true)) {
            $timezone = $fallback;
        }

        if (date_default_timezone_get() === $timezone && config('app.timezone') === $timezone) {
            return;
        }

        config(['app.timezone' => $timezone]);
        date_default_timezone_set($timezone);
    }

    private function resolveTenant(Request $request): ?Tenant
    {
        $fromHost = app(HybridTenantFinder::class)->findForRequest($request);
        $user = $request->user();

        if ($fromHost instanceof Tenant) {
            if ($user instanceof User && ! $user->is_platform_admin) {
                $belongs = $user->tenants()->where('tenants.id', $fromHost->id)->exists();

                return $belongs ? $fromHost : $this->resolveFromUser($user);
            }

            return $fromHost;
        }

        return $this->resolveFromUser($user);
    }

    private function resolveFromUser(?User $user): ?Tenant
    {
        if ($user === null || $user->is_platform_admin) {
            return null;
        }

        if ($user->current_tenant_id) {
            $current = Tenant::query()->find($user->current_tenant_id);

            if ($current instanceof Tenant && $user->tenants()->where('tenants.id', $current->id)->exists()) {
                return $current;
            }
        }

        return $user->tenants()->first();
    }
}
