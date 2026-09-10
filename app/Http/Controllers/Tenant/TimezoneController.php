<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantSetting;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TimezoneController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('settings.manage'), 403);

        // SetCurrentTenant already applied the workspace zone to the request, so
        // this is the effective timezone for the current tenant.
        $timezone = (string) config('app.timezone');

        return Inertia::render('settings/timezone', [
            'timezone' => $timezone,
            'now' => Carbon::now($timezone)->format('D, d M Y · h:i A'),
            'offset' => Carbon::now($timezone)->format('P'),
            'timezones' => $this->options(),
        ]);
    }

    public function update(Request $request, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);

        $data = $request->validate([
            'timezone' => ['required', 'string', Rule::in(timezone_identifiers_list())],
        ]);

        $tenant = Tenant::current();
        abort_unless($tenant instanceof Tenant, 404);

        $old = $tenant->timezone;

        if ($old === $data['timezone']) {
            return back();
        }

        $tenant->update(['timezone' => $data['timezone']]);

        // Keep the per-tenant setting row in step with the column, which is the
        // value the request timezone is applied from.
        TenantSetting::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'timezone'],
            ['value' => $data['timezone'], 'type' => 'string'],
        );

        $audit->record('settings.timezone', $tenant, oldValues: ['timezone' => $old], newValues: [
            'timezone' => $data['timezone'],
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Time zone updated. New attendance will use '.$data['timezone'].'.',
        ]);

        return back();
    }

    /**
     * All PHP timezones, grouped by region, with their current UTC offset.
     *
     * @return list<array{region: string, zones: list<array{value: string, label: string, offset: string}>}>
     */
    private function options(): array
    {
        $grouped = [];

        foreach (timezone_identifiers_list() as $identifier) {
            $parts = explode('/', $identifier, 2);
            $region = $parts[0];
            $city = str_replace('_', ' ', $parts[1] ?? $identifier);

            $grouped[$region][] = [
                'value' => $identifier,
                'label' => $city,
                'offset' => Carbon::now($identifier)->format('P'),
            ];
        }

        ksort($grouped);

        $rows = [];

        foreach ($grouped as $region => $zones) {
            usort($zones, fn (array $a, array $b): int => strcmp($a['value'], $b['value']));

            $rows[] = ['region' => $region, 'zones' => $zones];
        }

        return $rows;
    }
}
