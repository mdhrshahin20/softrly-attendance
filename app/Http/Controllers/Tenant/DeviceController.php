<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Models\UserDevice;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user, 403);

        $canManage = $user->can('settings.manage') || $user->can('employee.update');

        $query = UserDevice::query()->with('user')->latest('last_seen_at');

        if (! $canManage) {
            $query->where('user_id', $user->id);
        }

        return Inertia::render('devices/index', [
            'devices' => $query->get()->map(fn (UserDevice $device): array => [
                'id' => $device->id,
                'device_name' => $device->device_name,
                'browser' => $device->browser,
                'os' => $device->os,
                'last_ip' => $device->last_ip,
                'last_seen_at' => $device->last_seen_at?->toDateTimeString(),
                'trusted' => $device->trusted,
                'user' => $device->user?->only(['id', 'name', 'email']),
                'is_mine' => $device->user_id === $user->id,
            ]),
            'canManage' => $canManage,
        ]);
    }

    public function trust(Request $request, UserDevice $device, AuditLogger $audit): RedirectResponse
    {
        $this->authorizeManage($request, $device);

        $device->update(['trusted' => true]);
        $audit->record('device.trusted', $device, newValues: ['device_uuid' => $device->device_uuid]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Device trusted.']);

        return back();
    }

    public function untrust(Request $request, UserDevice $device, AuditLogger $audit): RedirectResponse
    {
        $this->authorizeManage($request, $device);

        $device->update(['trusted' => false]);
        $audit->record('device.untrusted', $device, newValues: ['device_uuid' => $device->device_uuid]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Device untrusted.']);

        return back();
    }

    public function destroy(Request $request, UserDevice $device, AuditLogger $audit): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 403);
        abort_unless($device->user_id === $user->id || $user->can('settings.manage'), 403);

        $audit->record('device.removed', $device, oldValues: ['device_uuid' => $device->device_uuid]);
        $device->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Device removed.']);

        return back();
    }

    private function authorizeManage(Request $request, UserDevice $device): void
    {
        $user = $request->user();
        abort_unless($user, 403);
        abort_unless($user->can('settings.manage') || $user->can('employee.update') || $device->user_id === $user->id, 403);
    }
}
