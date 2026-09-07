<?php

use App\Domain\Attendance\Models\Shift;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('tenant admins can update a work shift', function () {
    $workspace = createWorkspace(['owner_email' => 'shifts@example.com']);
    $shift = $workspace['employee']->shift;

    actingAsOwner($workspace)
        ->put("/shifts/{$shift->id}", [
            'name' => 'Morning Shift',
            'start_time' => '08:30',
            'end_time' => '17:30',
            'grace_minutes' => 15,
            'minimum_work_minutes' => 480,
            'status' => 'active',
        ])
        ->assertRedirect();

    expect($shift->fresh()?->name)->toBe('Morning Shift')
        ->and(substr((string) $shift->fresh()?->start_time, 0, 5))->toBe('08:30')
        ->and($shift->fresh()?->grace_minutes)->toBe(15);
});

test('tenant admins cannot delete a shift that still has employees', function () {
    $workspace = createWorkspace(['owner_email' => 'shifts-busy@example.com']);
    $shift = $workspace['employee']->shift;

    actingAsOwner($workspace)
        ->delete("/shifts/{$shift->id}")
        ->assertRedirect();

    expect(Shift::query()->find($shift->id))->not->toBeNull();
});

test('tenant admins can delete an unused work shift', function () {
    $workspace = createWorkspace(['owner_email' => 'shifts-free@example.com']);
    $workspace['tenant']->makeCurrent();

    $shift = Shift::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'name' => 'Night Shift',
        'start_time' => '22:00',
        'end_time' => '06:00',
        'grace_minutes' => 10,
        'minimum_work_minutes' => 480,
        'status' => 'active',
    ]);

    actingAsOwner($workspace)
        ->delete("/shifts/{$shift->id}")
        ->assertRedirect();

    expect(Shift::query()->find($shift->id))->toBeNull();
});
