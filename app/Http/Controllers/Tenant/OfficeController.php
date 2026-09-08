<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Services\AttendancePolicyService;
use App\Domain\Attendance\Services\NetworkVerificationService;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Office\Models\Office;
use App\Domain\Office\Models\OfficeNetwork;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OfficeController extends Controller
{
    public function index(AttendancePolicyService $policy): Response
    {
        abort_unless(request()->user()?->can('office.manage'), 403);

        return Inertia::render('offices/index', [
            'offices' => Office::query()
                ->with('networks')
                ->withCount('employees')
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString(),
            'attendancePolicy' => $policy->snapshot(),
        ]);
    }

    public function detectIp(Request $request, NetworkVerificationService $networks): JsonResponse
    {
        abort_unless(
            $request->user()?->can('office.manage') || $request->user()?->can('office.network.manage'),
            403,
        );

        $ip = $networks->getClientIp($request);
        $isPublic = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;

        return response()->json([
            'ip' => $ip,
            'is_public' => $isPublic,
            'message' => $isPublic
                ? 'This is the public IP the server sees for this connection. Save it as the office Wi‑Fi IP.'
                : 'This is a local or private IP. Check-in uses the same IP the server sees, so it works here. On a live office network, detect while connected to that internet.',
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

        if ($office->employees()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Reassign employees before deleting this office.',
            ]);

            return back();
        }

        $office->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Office deleted.']);

        return back();
    }

    public function storeNetwork(Request $request, Office $office): RedirectResponse
    {
        abort_unless($request->user()?->can('office.network.manage'), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'ip_address' => ['nullable', 'ip', 'required_without:ip_range'],
            'ip_range' => ['nullable', 'string', 'max:64', 'required_without:ip_address'],
            'network_type' => ['nullable', 'in:static_ip,cidr'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $data['network_type'] = filled($data['ip_range'] ?? null) && blank($data['ip_address'] ?? null)
            ? 'cidr'
            : 'static_ip';

        OfficeNetwork::query()->create([
            ...$data,
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
