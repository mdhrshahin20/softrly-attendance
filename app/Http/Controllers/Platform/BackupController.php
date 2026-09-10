<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Platform\Models\Backup;
use App\Domain\Platform\Services\BackupService;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class BackupController extends Controller
{
    public function __construct(
        private readonly BackupService $backups,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        return Inertia::render('platform/backups', [
            'backups' => Backup::query()
                ->with(['tenant', 'creator'])
                ->latest()
                ->paginate(20)
                ->withQueryString()
                ->through(fn (Backup $backup): array => [
                    'id' => $backup->id,
                    'type' => $backup->type,
                    'tenant' => $backup->tenant?->name,
                    'tenant_id' => $backup->tenant_id,
                    'status' => $backup->status,
                    'filename' => $backup->filename,
                    'size_bytes' => $backup->size_bytes,
                    'table_count' => $backup->table_count,
                    'row_count' => $backup->row_count,
                    'file_count' => $backup->file_count,
                    'error' => $backup->error,
                    'created_by' => $backup->creator?->name,
                    'completed_at' => $backup->completed_at?->toDateTimeString(),
                    'created_at' => $backup->created_at?->toDateTimeString(),
                    'exists' => is_file($this->backups->pathFor($backup)),
                ]),
            'tenants' => Tenant::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Tenant $tenant): array => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                ])
                ->values(),
        ]);
    }

    public function storeFull(Request $request): RedirectResponse
    {
        return $this->create($request, fn (): Backup => $this->backups->createFull($request->user()), 'Full site backup created.');
    }

    public function storeTenant(Request $request, Tenant $tenant): RedirectResponse
    {
        return $this->create(
            $request,
            fn (): Backup => $this->backups->createForTenant($tenant, $request->user()),
            'Backup created for '.$tenant->name.'.',
        );
    }

    public function download(Backup $backup): BinaryFileResponse
    {
        $path = $this->backups->pathFor($backup);

        abort_unless(is_file($path), 404, 'This backup file is no longer on disk.');

        return response()->download($path, $backup->filename);
    }

    public function destroy(Request $request, Backup $backup): RedirectResponse
    {
        $this->audit->record('backup.deleted', $backup, newValues: [
            'filename' => $backup->filename,
            'type' => $backup->type,
        ], user: $request->user(), request: $request, tenant: $backup->tenant);

        $this->backups->delete($backup);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Backup deleted.']);

        return back();
    }

    /**
     * @param  callable(): Backup  $callback
     */
    private function create(Request $request, callable $callback, string $message): RedirectResponse
    {
        try {
            $backup = $callback();
        } catch (Throwable $exception) {
            report($exception);

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Backup failed: '.$exception->getMessage(),
            ]);

            return back();
        }

        $this->audit->record('backup.created', $backup, newValues: [
            'filename' => $backup->filename,
            'type' => $backup->type,
            'rows' => $backup->row_count,
        ], user: $request->user(), request: $request, tenant: $backup->tenant);

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
