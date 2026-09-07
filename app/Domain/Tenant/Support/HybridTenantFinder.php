<?php

namespace App\Domain\Tenant\Support;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use Illuminate\Http\Request;
use Spatie\Multitenancy\Contracts\IsTenant;
use Spatie\Multitenancy\TenantFinder\TenantFinder;

class HybridTenantFinder extends TenantFinder
{
    /**
     * @var list<string>
     */
    private array $reservedHosts = ['www', 'app', 'admin', 'api', 'mail', 'localhost'];

    public function findForRequest(Request $request): ?IsTenant
    {
        $host = strtolower($request->getHost());

        $domainTenant = TenantDomain::query()
            ->where('hostname', $host)
            ->where('status', 'active')
            ->first()?->tenant;

        if ($domainTenant instanceof Tenant) {
            return $domainTenant;
        }

        $subdomain = explode('.', $host)[0];

        if (! in_array($subdomain, $this->reservedHosts, true) && $host !== '127.0.0.1') {
            $tenant = Tenant::query()->where('slug', $subdomain)->first();

            if ($tenant instanceof Tenant) {
                return $tenant;
            }
        }

        return null;
    }
}
