<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DomainController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('settings.manage'), 403);
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::CustomDomain), 403);

        $tenant = Tenant::current();

        return Inertia::render('settings/domains', [
            'domains' => $tenant?->domains()->orderByDesc('is_primary')->get()->map(fn (TenantDomain $domain): array => [
                'id' => $domain->id,
                'hostname' => $domain->hostname,
                'type' => $domain->type,
                'is_primary' => $domain->is_primary,
                'status' => $domain->status,
            ]),
        ]);
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);
        app(SubscriptionService::class)->assertFeature(PlanFeature::CustomDomain);

        $tenant = Tenant::current();
        abort_unless($tenant, 404);

        $data = $request->validate([
            'hostname' => ['required', 'string', 'max:255', 'lowercase', Rule::unique('tenant_domains', 'hostname')],
        ]);

        $hostname = strtolower(trim($data['hostname']));

        $domain = TenantDomain::query()->create([
            'tenant_id' => $tenant->id,
            'hostname' => $hostname,
            'type' => 'custom',
            'is_primary' => false,
            'status' => 'active',
        ]);

        $audit->record('domain.added', $domain, newValues: ['hostname' => $hostname]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Custom domain added. Point DNS to this application.']);

        return back();
    }

    public function destroy(Request $request, TenantDomain $domain, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);
        abort_unless($domain->tenant_id === Tenant::current()?->id, 404);
        abort_if($domain->type === 'subdomain' && $domain->is_primary, 422, 'The primary subdomain cannot be removed.');

        $audit->record('domain.removed', $domain, oldValues: ['hostname' => $domain->hostname]);
        $domain->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Domain removed.']);

        return back();
    }
}
