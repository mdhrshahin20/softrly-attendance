<?php

use App\Domain\Employee\Models\Department;
use App\Domain\Employee\Models\Designation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('tenant admins can update and delete unused departments', function () {
    $workspace = createWorkspace(['owner_email' => 'dept-edit@example.com']);
    $workspace['tenant']->makeCurrent();

    $department = Department::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'name' => 'Engineering',
        'code' => 'ENG',
        'status' => 'active',
    ]);

    actingAsOwner($workspace)
        ->put("/departments/{$department->id}", [
            'name' => 'Product Engineering',
            'code' => 'ENG',
            'status' => 'inactive',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($department->fresh())
        ->name->toBe('Product Engineering')
        ->status->toBe('inactive');

    actingAsOwner($workspace)
        ->delete("/departments/{$department->id}")
        ->assertRedirect();

    expect(Department::query()->find($department->id))->toBeNull();
});

test('tenant admins cannot delete a department that still has employees', function () {
    $workspace = createWorkspace(['owner_email' => 'dept-busy@example.com']);
    $department = $workspace['employee']->department;

    actingAsOwner($workspace)
        ->delete("/departments/{$department->id}")
        ->assertRedirect();

    expect(Department::query()->find($department->id))->not->toBeNull();
});

test('tenant admins can update and delete unused designations', function () {
    $workspace = createWorkspace(['owner_email' => 'desig-edit@example.com']);
    $workspace['tenant']->makeCurrent();

    $designation = Designation::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'name' => 'QA Engineer',
        'department_id' => $workspace['employee']->department_id,
        'status' => 'active',
    ]);

    actingAsOwner($workspace)
        ->put("/designations/{$designation->id}", [
            'name' => 'Senior QA Engineer',
            'department_id' => $workspace['employee']->department_id,
            'status' => 'active',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($designation->fresh()->name)->toBe('Senior QA Engineer');

    actingAsOwner($workspace)
        ->delete("/designations/{$designation->id}")
        ->assertRedirect();

    expect(Designation::query()->find($designation->id))->toBeNull();
});

test('tenant admins cannot delete a designation that still has employees', function () {
    $workspace = createWorkspace(['owner_email' => 'desig-busy@example.com']);
    $designation = $workspace['employee']->designation;

    actingAsOwner($workspace)
        ->delete("/designations/{$designation->id}")
        ->assertRedirect();

    expect(Designation::query()->find($designation->id))->not->toBeNull();
});
