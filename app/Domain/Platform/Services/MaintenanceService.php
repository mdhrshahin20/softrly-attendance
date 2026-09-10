<?php

namespace App\Domain\Platform\Services;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Validation\ValidationException;
use Throwable;

class MaintenanceService
{
    /**
     * @var array<string, array{command: string, label: string, description: string, dangerous: bool}>
     */
    private const ACTIONS = [
        'optimize' => [
            'command' => 'optimize',
            'label' => 'Cache config, routes & views',
            'description' => 'Compile configuration, routes, and views for faster responses.',
            'dangerous' => false,
        ],
        'optimize:clear' => [
            'command' => 'optimize:clear',
            'label' => 'Clear all compiled caches',
            'description' => 'Remove config, route, view, event, and application caches.',
            'dangerous' => false,
        ],
        'cache:clear' => [
            'command' => 'cache:clear',
            'label' => 'Flush application cache',
            'description' => 'Clear the default cache store used by the application.',
            'dangerous' => false,
        ],
        'config:clear' => [
            'command' => 'config:clear',
            'label' => 'Clear config cache',
            'description' => 'Remove the cached configuration file.',
            'dangerous' => false,
        ],
        'route:clear' => [
            'command' => 'route:clear',
            'label' => 'Clear route cache',
            'description' => 'Remove the cached route file.',
            'dangerous' => false,
        ],
        'view:clear' => [
            'command' => 'view:clear',
            'label' => 'Clear compiled views',
            'description' => 'Delete compiled Blade templates.',
            'dangerous' => false,
        ],
        'event:clear' => [
            'command' => 'event:clear',
            'label' => 'Clear cached events',
            'description' => 'Remove the cached events file.',
            'dangerous' => false,
        ],
        'queue:restart' => [
            'command' => 'queue:restart',
            'label' => 'Restart queue workers',
            'description' => 'Signal workers to finish their current job and exit so they reload code.',
            'dangerous' => false,
        ],
        'queue:retry-all' => [
            'command' => 'queue:retry all',
            'label' => 'Retry all failed jobs',
            'description' => 'Push every failed job back onto the queue.',
            'dangerous' => false,
        ],
        'queue:flush' => [
            'command' => 'queue:flush',
            'label' => 'Delete all failed jobs',
            'description' => 'Permanently remove every failed job from the failed jobs table.',
            'dangerous' => true,
        ],
        'storage:link' => [
            'command' => 'storage:link',
            'label' => 'Create storage symlink',
            'description' => 'Link public/storage to storage/app/public (safe to run repeatedly).',
            'dangerous' => false,
        ],
        'migrate' => [
            'command' => 'migrate --force',
            'label' => 'Run database migrations',
            'description' => 'Apply pending migrations. Schema changes are NOT reversible from this screen — take a full backup first.',
            'dangerous' => true,
        ],
    ];

    /**
     * @return list<array{name: string, label: string, description: string, dangerous: bool}>
     */
    public function actions(): array
    {
        $rows = [];

        foreach (self::ACTIONS as $name => $action) {
            $rows[] = [
                'name' => $name,
                'label' => $action['label'],
                'description' => $action['description'],
                'dangerous' => $action['dangerous'],
            ];
        }

        return $rows;
    }

    /**
     * @return array{action: string, command: string, exit_code: int, output: string}
     */
    public function run(string $action): array
    {
        if (! array_key_exists($action, self::ACTIONS)) {
            throw ValidationException::withMessages(['action' => 'Unknown maintenance action.']);
        }

        $command = self::ACTIONS[$action]['command'];
        $exitCode = Artisan::call($command);

        return [
            'action' => $action,
            'command' => $command,
            'exit_code' => $exitCode,
            'output' => trim(Artisan::output()),
        ];
    }

    public function exists(string $action): bool
    {
        return array_key_exists($action, self::ACTIONS);
    }

    public function requiresConfirmation(string $action): bool
    {
        return self::ACTIONS[$action]['dangerous'] ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        return [
            'environment' => app()->environment(),
            'maintenance' => app()->isDownForMaintenance(),
            'debug' => (bool) config('app.debug'),
            'cache_store' => (string) config('cache.default'),
            'queue_connection' => (string) config('queue.default'),
            'queue_pending' => $this->tableCount('jobs'),
            'queue_failed' => $this->tableCount('failed_jobs'),
            'disk_free_bytes' => $this->diskFreeBytes(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function status(): array
    {
        return [
            'app' => [
                'name' => (string) config('app.name'),
                'environment' => app()->environment(),
                'debug' => (bool) config('app.debug'),
                'maintenance' => app()->isDownForMaintenance(),
                'laravel' => app()->version(),
                'php' => PHP_VERSION,
            ],
            'database' => [
                'connection' => (string) config('database.default'),
                'reachable' => $this->databaseReachable(),
                'pending_migrations' => $this->pendingMigrations(),
            ],
            'cache' => [
                'store' => (string) config('cache.default'),
                'writable' => $this->cacheWritable(),
            ],
            'queue' => [
                'connection' => (string) config('queue.default'),
                'pending' => $this->tableCount('jobs'),
                'failed' => $this->tableCount('failed_jobs'),
            ],
            'storage' => [
                'disk' => (string) config('filesystems.default'),
                'logs_bytes' => $this->logsBytes(),
                'free_bytes' => $this->diskFreeBytes(),
                'total_bytes' => $this->diskTotalBytes(),
            ],
            'schedule' => $this->schedule(),
        ];
    }

    private function databaseReachable(): bool
    {
        try {
            DB::connection()->getPdo();

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    private function cacheWritable(): bool
    {
        try {
            $key = 'maintenance-probe-'.uniqid();
            Cache::put($key, 'ok', 5);
            $value = Cache::pull($key);

            return $value === 'ok';
        } catch (Throwable) {
            return false;
        }
    }

    private function pendingMigrations(): int
    {
        try {
            Artisan::call('migrate:status');

            return substr_count(Artisan::output(), 'Pending');
        } catch (Throwable) {
            return 0;
        }
    }

    /**
     * @return array<int, array{command: string, expression: string, next_run: string|null}>
     */
    private function schedule(): array
    {
        try {
            return collect(Schedule::events())
                ->map(function ($event): array {
                    $command = (string) ($event->command ?? $event->description ?? '');

                    try {
                        $nextRun = $event->nextRunDate()->toDateTimeString();
                    } catch (Throwable) {
                        $nextRun = null;
                    }

                    return [
                        'command' => $command,
                        'expression' => (string) $event->expression,
                        'next_run' => $nextRun,
                    ];
                })
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function tableCount(string $table): int
    {
        try {
            return DB::table($table)->count();
        } catch (Throwable) {
            return 0;
        }
    }

    private function logsBytes(): int
    {
        $bytes = 0;

        foreach (glob(storage_path('logs').'/*.log') ?: [] as $path) {
            $bytes += (int) filesize($path);
        }

        return $bytes;
    }

    private function diskFreeBytes(): int
    {
        $free = @disk_free_space(base_path());

        return $free === false ? 0 : (int) $free;
    }

    private function diskTotalBytes(): int
    {
        $total = @disk_total_space(base_path());

        return $total === false ? 0 : (int) $total;
    }
}
