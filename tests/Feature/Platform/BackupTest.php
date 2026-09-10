<?php

use App\Domain\Platform\Models\Backup;
use App\Domain\Platform\Services\BackupService;
use App\Domain\Tenant\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function backupAdmin(): User
{
    return User::factory()->create([
        'email' => 'backup-ops@platform.test',
        'is_platform_admin' => true,
        'email_verified_at' => now(),
    ]);
}

beforeEach(function () {
    $this->backupRoot = storage_path('app/testing-backups-'.uniqid());
    File::ensureDirectoryExists($this->backupRoot);

    $root = $this->backupRoot;

    app()->bind(BackupService::class, fn (): BackupService => new BackupService($root));
});

afterEach(function () {
    File::deleteDirectory($this->backupRoot);
});

test('a full backup archives the database and storage files', function () {
    $admin = backupAdmin();
    $workspace = createWorkspace(['owner_email' => 'full-backup@example.com']);

    Storage::disk('public')->put('avatars/sample.txt', 'hello');

    $this->actingAs($admin)
        ->post('/platform/backups/full')
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $backup = Backup::query()->latest('id')->first();

    expect($backup)->not->toBeNull()
        ->and($backup->status)->toBe(Backup::STATUS_COMPLETED)
        ->and($backup->type)->toBe(Backup::TYPE_FULL)
        ->and($backup->table_count)->toBeGreaterThan(0)
        ->and($backup->row_count)->toBeGreaterThan(0)
        ->and($backup->file_count)->toBeGreaterThan(0)
        ->and($backup->size_bytes)->toBeGreaterThan(0);

    $path = app(BackupService::class)->pathFor($backup);

    expect(is_file($path))->toBeTrue();

    $zip = new ZipArchive;
    expect($zip->open($path))->toBeTrue();

    $sql = $zip->getFromName('database.sql');
    $manifest = json_decode((string) $zip->getFromName('manifest.json'), true);
    $storageEntries = [];

    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = (string) $zip->getNameIndex($i);
        if (str_starts_with($name, 'storage/public/')) {
            $storageEntries[] = $name;
        }
    }

    $zip->close();

    expect($sql)->toBeString()
        ->and($sql)->toContain('-- Attendrly backup')
        ->and($sql)->toContain('DROP TABLE IF EXISTS')
        ->and($sql)->toContain('CREATE TABLE')
        ->and($sql)->toContain('INSERT INTO')
        // A full dump is a true restore: it drops before creating.
        ->and($sql)->not->toContain('CREATE TABLE IF NOT EXISTS')
        ->and($manifest['type'])->toBe('full')
        ->and($storageEntries)->toContain('storage/public/avatars/sample.txt');

    expect($workspace['tenant']->name)->not->toBeNull();
});

test('a tenant backup contains only that workspace rows', function () {
    $admin = backupAdmin();

    $alpha = createWorkspace([
        'owner_email' => 'alpha-owner@example.com',
        'company_name' => 'Alpha Workspace',
    ]);
    $beta = createWorkspace([
        'owner_email' => 'beta-owner@example.com',
        'company_name' => 'Beta Workspace',
    ]);

    $this->actingAs($admin)
        ->post("/platform/backups/tenant/{$alpha['tenant']->id}")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $backup = Backup::query()->latest('id')->first();

    expect($backup->type)->toBe(Backup::TYPE_TENANT)
        ->and($backup->tenant_id)->toBe($alpha['tenant']->id)
        ->and($backup->status)->toBe(Backup::STATUS_COMPLETED);

    $zip = new ZipArchive;
    $zip->open(app(BackupService::class)->pathFor($backup));
    $sql = (string) $zip->getFromName('database.sql');
    $zip->close();

    expect($sql)->toContain('CREATE TABLE IF NOT EXISTS')
        ->and($sql)->not->toContain('DROP TABLE')
        ->and($sql)->toContain('alpha-owner@example.com')
        ->and($sql)->toContain('Alpha Workspace')
        ->and($sql)->not->toContain('beta-owner@example.com')
        ->and($sql)->not->toContain('Beta Workspace');
});

test('a full backup never contains tables from another database', function () {
    $admin = backupAdmin();
    createWorkspace(['owner_email' => 'scope-check@example.com']);

    $service = app(BackupService::class);

    foreach ($service->tableNames() as $table) {
        expect($table)->not->toContain('.');
    }

    $this->actingAs($admin)->post('/platform/backups/full')->assertRedirect();

    $backup = Backup::query()->latest('id')->first();

    $zip = new ZipArchive;
    $zip->open($service->pathFor($backup));
    $sql = (string) $zip->getFromName('database.sql');
    $zip->close();

    expect($sql)->not->toContain('t_and_s_apromise');
});

test('a backup can be downloaded and deleted', function () {
    $admin = backupAdmin();
    createWorkspace(['owner_email' => 'download@example.com']);

    $this->actingAs($admin)->post('/platform/backups/full')->assertRedirect();

    $backup = Backup::query()->latest('id')->first();
    $path = app(BackupService::class)->pathFor($backup);

    $this->actingAs($admin)
        ->get("/platform/backups/{$backup->id}/download")
        ->assertOk()
        ->assertDownload($backup->filename);

    $this->actingAs($admin)
        ->delete("/platform/backups/{$backup->id}")
        ->assertRedirect();

    expect(Backup::query()->whereKey($backup->id)->exists())->toBeFalse()
        ->and(is_file($path))->toBeFalse();
});

test('the backups page lists archives with workspace options', function () {
    $admin = backupAdmin();
    createWorkspace(['owner_email' => 'listing@example.com']);

    $this->actingAs($admin)->post('/platform/backups/full')->assertRedirect();

    $this->actingAs($admin)
        ->get('/platform/backups')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/backups')
            ->has('backups.data', 1)
            ->has('tenants')
            ->where('backups.data.0.type', 'full')
            ->where('backups.data.0.exists', true));
});

test('non platform admins cannot create or download backups', function () {
    $intruder = User::factory()->create(['email_verified_at' => now()]);
    $workspace = createWorkspace(['owner_email' => 'deny-backup@example.com']);

    $this->actingAs($intruder)->get('/platform/backups')->assertForbidden();
    $this->actingAs($intruder)->post('/platform/backups/full')->assertForbidden();
    $this->actingAs($intruder)
        ->post("/platform/backups/tenant/{$workspace['tenant']->id}")
        ->assertForbidden();
});

test('creating a backup is recorded in the audit log', function () {
    $admin = backupAdmin();
    createWorkspace(['owner_email' => 'audit-backup@example.com']);

    $this->actingAs($admin)->post('/platform/backups/full')->assertRedirect();

    expect(ActivityLog::query()->where('action', 'backup.created')->exists())->toBeTrue();
});
