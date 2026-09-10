<?php

use App\Domain\Tenant\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function opsAdmin(): User
{
    return User::factory()->create([
        'email' => 'ops-console@platform.test',
        'is_platform_admin' => true,
        'email_verified_at' => now(),
    ]);
}

test('platform actions are recorded and visible in the audit log', function () {
    $admin = opsAdmin();
    $workspace = createWorkspace(['owner_email' => 'audit-target@example.com']);

    $this->actingAs($admin)
        ->patch("/platform/tenants/{$workspace['tenant']->id}/status", ['status' => 'suspended'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $entry = ActivityLog::query()->where('action', 'tenant.status_updated')->first();

    expect($entry)->not->toBeNull()
        ->and($entry?->user_id)->toBe($admin->id)
        ->and($entry?->tenant_id)->toBe($workspace['tenant']->id);

    $this->actingAs($admin)
        ->get('/platform/audit')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/audit')
            ->has('logs')
            ->where('logs.data.0.action', 'tenant.status_updated'));
});

test('platform admins can list and tail a log file', function () {
    $admin = opsAdmin();
    $name = 'testing-'.uniqid().'.log';
    $path = storage_path('logs').DIRECTORY_SEPARATOR.$name;

    file_put_contents($path, "first line\nTAIL-MARKER-LINE\n");

    try {
        $this->actingAs($admin)
            ->get('/platform/logs')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('platform/logs')
                ->where('files', fn ($files): bool => collect($files)->contains('name', $name)));

        $this->actingAs($admin)
            ->get('/platform/logs?file='.$name.'&lines=50')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('platform/logs')
                ->where('selected', $name)
                ->where('content', fn (string $content): bool => str_contains($content, 'TAIL-MARKER-LINE')));

        $this->actingAs($admin)
            ->delete('/platform/logs/'.$name)
            ->assertRedirect();

        expect(file_exists($path))->toBeFalse();
    } finally {
        if (file_exists($path)) {
            unlink($path);
        }
    }
});

test('platform admins can run safe maintenance actions', function () {
    $admin = opsAdmin();

    $this->actingAs($admin)
        ->get('/platform/maintenance')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/maintenance')
            ->has('status')
            ->has('actions'));

    $this->actingAs($admin)
        ->post('/platform/maintenance/run', ['action' => 'cache:clear'])
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('maintenance_result', fn (array $result): bool => $result['exit_code'] === 0);

    expect(ActivityLog::query()->where('action', 'maintenance.cache:clear')->exists())->toBeTrue();
});

test('unknown maintenance actions are rejected', function () {
    $admin = opsAdmin();

    $this->actingAs($admin)
        ->post('/platform/maintenance/run', ['action' => 'db:wipe'])
        ->assertSessionHasErrors('action');
});

test('non platform admins cannot reach the ops console', function () {
    $intruder = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($intruder)->get('/platform/audit')->assertForbidden();
    $this->actingAs($intruder)->get('/platform/logs')->assertForbidden();
    $this->actingAs($intruder)->get('/platform/maintenance')->assertForbidden();
});

test('platform admins can see and manually verify a tenant owner email', function () {
    $admin = opsAdmin();
    $workspace = createWorkspace(['owner_email' => 'unverified-owner@example.com']);
    $owner = $workspace['user'];

    // createWorkspace verifies the owner, so reset it to model a real signup.
    $owner->forceFill(['email_verified_at' => null])->save();

    $this->actingAs($admin)
        ->get("/platform/tenants/{$workspace['tenant']->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/tenant-show')
            ->where('tenant.owner.email_verified', false)
            ->where('tenant.owner.email_verified_at', null));

    $this->actingAs($admin)
        ->patch("/platform/tenants/{$workspace['tenant']->id}/verify-owner")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($owner->refresh()->email_verified_at)->not->toBeNull();

    expect(ActivityLog::query()->where('action', 'tenant.owner_email_verified')->exists())->toBeTrue();

    $this->actingAs($admin)
        ->get("/platform/tenants/{$workspace['tenant']->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('tenant.owner.email_verified', true));
});

test('the tenant list exposes owner verification state', function () {
    $admin = opsAdmin();
    $workspace = createWorkspace(['owner_email' => 'listed-owner@example.com']);
    $workspace['user']->forceFill(['email_verified_at' => null])->save();

    $this->actingAs($admin)
        ->get('/platform/tenants')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/tenants')
            ->where('tenants.data.0.owner_email', 'listed-owner@example.com')
            ->where('tenants.data.0.owner_verified', false));
});

test('the migrate action is listed and requires explicit confirmation', function () {
    $admin = opsAdmin();

    $this->actingAs($admin)
        ->get('/platform/maintenance')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where(
            'actions',
            fn ($actions): bool => collect($actions)->contains(
                fn ($action): bool => $action['name'] === 'migrate' && $action['dangerous'] === true,
            ),
        ));

    $this->actingAs($admin)
        ->post('/platform/maintenance/run', ['action' => 'migrate'])
        ->assertSessionHasErrors('action');

    $this->actingAs($admin)
        ->post('/platform/maintenance/run', ['action' => 'migrate', 'confirm' => '1'])
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('maintenance_result', fn (array $result): bool => $result['exit_code'] === 0);

    expect(ActivityLog::query()->where('action', 'maintenance.migrate')->exists())->toBeTrue();
});
