<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Office\Models\Office;
use App\Domain\Office\Models\OfficeNetwork;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OfficeController extends Controller
{
    public function index(): Response
    {
        abort_unless(request()->user()?->can('office.manage'), 403);

        return Inertia::render('offices/index', [
            'offices' => Office::query()
                ->with('networks')
                ->withCount('employees')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('office.manage'), 403);
        app(SubscriptionService::class)->assertCanCreateOffice();

        Office::query()->create($request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:30', 'unique:offices,code'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:5'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'allowed_radius' => ['nullable', 'integer', 'min:10', 'max:5000'],
            'timezone' => ['required', 'string', 'max:64'],
            'status' => ['required', 'in:active,inactive'],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Office created.']);

        return back();
    }

    public function update(Request $request, Office $office): RedirectResponse
    {
        abort_unless($request->user()?->can('office.manage'), 403);

        $office->update($request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:30', 'unique:offices,code,'.$office->id],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:5'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'allowed_radius' => ['nullable', 'integer', 'min:10', 'max:5000'],
            'timezone' => ['required', 'string', 'max:64'],
            'status' => ['required', 'in:active,inactive'],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Office updated.']);

        return back();
    }

    public function destroy(Office $office): RedirectResponse
    {
        abort_unless(request()->user()?->can('office.manage'), 403);

        $office->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Office deleted.']);

        return back();
    }

    public function storeNetwork(Request $request, Office $office): RedirectResponse
    {
        abort_unless($request->user()?->can('office.network.manage'), 403);

        OfficeNetwork::query()->create([
            ...$request->validate([
                'name' => ['required', 'string', 'max:100'],
                'ip_address' => ['nullable', 'ip'],
                'ip_range' => ['nullable', 'string', 'max:64'],
                'network_type' => ['required', 'in:static_ip,cidr'],
                'status' => ['required', 'in:active,inactive'],
            ]),
            'office_id' => $office->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Office network added.']);

        return back();
    }

    public function destroyNetwork(OfficeNetwork $network): RedirectResponse
    {
        abort_unless(request()->user()?->can('office.network.manage'), 403);

        $network->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Office network removed.']);

        return back();
    }
}
