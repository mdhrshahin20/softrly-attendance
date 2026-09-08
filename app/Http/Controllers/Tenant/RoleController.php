<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\AuditLogger;
use App\Domain\Tenant\Services\TenantProvisioner;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * @var list<string>
     */
    private array $systemRoles = ['tenant-owner', 'hr-admin', 'manager', 'employee'];

    public function index(Request $request, TenantProvisioner $provisioner): Response
    {
        abort_unless($request->user()?->can('role.manage'), 403);
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::CustomRoles), 403);

        $tenant = Tenant::current();

        return Inertia::render('roles/index', [
            'roles' => Role::query()
                ->with('permissions')
                ->where('tenant_id', $tenant?->id)
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (Role $role): array => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'is_system' => in_array($role->name, $this->systemRoles, true),
                    'permissions' => $role->permissions->pluck('name')->values()->all(),
                    'users_count' => $role->users()->count(),
                ]),
            'permissions' => collect($provisioner->permissions())->map(fn (string $permission): array => [
                'value' => $permission,
                'label' => str_replace('.', ' · ', $permission),
            ]),
        ]);
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('role.manage'), 403);
        app(SubscriptionService::class)->assertFeature(PlanFeature::CustomRoles);

        $tenant = Tenant::current();
        abort_unless($tenant, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ]);

        $name = Str::slug($data['name']);

        abort_if(in_array($name, $this->systemRoles, true), 422, 'That role name is reserved.');

        $role = Role::query()->create([
            'name' => $name,
            'guard_name' => 'web',
            'tenant_id' => $tenant->id,
        ]);

        $role->syncPermissions($data['permissions'] ?? []);
        $audit->record('role.created', $role, newValues: ['name' => $role->name]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role created.']);

        return back();
    }

    public function update(Request $request, Role $role, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('role.manage'), 403);
        abort_unless((int) $role->getAttribute('tenant_id') === (int) Tenant::current()?->id, 404);
        app(SubscriptionService::class)->assertFeature(PlanFeature::CustomRoles);

        $data = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ]);

        if ($role->name === 'tenant-owner') {
            abort(422, 'The tenant owner role always keeps full access.');
        }

        $role->syncPermissions($data['permissions'] ?? []);
        $audit->record('role.updated', $role, newValues: ['permissions' => $data['permissions'] ?? []]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role updated.']);

        return back();
    }

    public function destroy(Request $request, Role $role, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('role.manage'), 403);
        abort_unless((int) $role->getAttribute('tenant_id') === (int) Tenant::current()?->id, 404);
        abort_if(in_array($role->name, $this->systemRoles, true), 422, 'Default roles cannot be deleted.');

        $audit->record('role.deleted', $role, oldValues: ['name' => $role->name]);
        $role->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role deleted.']);

        return back();
    }
}
