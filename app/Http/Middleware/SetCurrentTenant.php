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

        return $next($request);
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
