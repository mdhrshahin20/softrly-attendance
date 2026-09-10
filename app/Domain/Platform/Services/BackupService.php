<?php

namespace App\Domain\Platform\Services;

use App\Domain\Platform\Models\Backup;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;
use ZipArchive;

/**
 * Writes portable SQL dumps (schema + data) using PDO only, so it works
 * without the mysqldump binary. A full backup additionally archives
 * storage/app/public alongside the database dump.
 */
class BackupService
{
    /**
     * Tables that hold no durable business data and are skipped in every dump.
     *
     * @var list<string>
     */
    private const EPHEMERAL_TABLES = [
        'cache',
        'cache_locks',
        'sessions',
        'jobs',
        'job_batches',
        'failed_jobs',
        'backups',
    ];

    /**
     * Small platform-wide tables copied in full into a tenant dump so the
     * tenant's roles and plan can be resolved after a restore.
     *
     * @var list<string>
     */
    private const REFERENCE_TABLES = [
        'permissions',
        'role_has_permissions',
        'plans',
        'plan_features',
    ];

    private const ROWS_PER_INSERT = 200;

    private const ID_BATCH = 1000;

    public function __construct(private readonly ?string $root = null) {}

    public function root(): string
    {
        return $this->root ?? storage_path('app/backups');
    }

    public function pathFor(Backup $backup): string
    {
        return rtrim($this->root(), '/').DIRECTORY_SEPARATOR.$backup->filename;
    }

    public function createFull(?User $actor = null): Backup
    {
        $backup = $this->start(Backup::TYPE_FULL, null, $actor, 'attendrly-full');

        return $this->run($backup, function (Backup $backup, string $sqlPath): array {
            $result = $this->writeSqlDump(
                $sqlPath,
                $this->fullPlan(),
                withDrop: true,
            );

            $storage = $this->storageManifest();

            $this->zip($backup, $sqlPath, $storage);

            return $result + ['file_count' => count($storage)];
        });
    }

    public function createForTenant(Tenant $tenant, ?User $actor = null): Backup
    {
        $backup = $this->start(Backup::TYPE_TENANT, $tenant, $actor, 'attendrly-tenant-'.$tenant->slug);

        return $this->run($backup, function (Backup $backup, string $sqlPath) use ($tenant): array {
            $result = $this->writeSqlDump(
                $sqlPath,
                $this->tenantPlan($tenant),
                withDrop: false,
            );

            $this->zip($backup, $sqlPath, []);

            return $result + ['file_count' => 0];
        });
    }

    public function delete(Backup $backup): bool
    {
        $path = $this->pathFor($backup);

        if (is_file($path)) {
            unlink($path);
        }

        return (bool) $backup->delete();
    }

    /**
     * @return list<string>
     */
    public function tableNames(): array
    {
        $driver = $this->driver();

        // On MySQL, passing no schema lists tables from EVERY database the user
        // can see, so always scope to the current database.
        $schema = $driver === 'sqlite'
            ? null
            : $this->connection()->getDatabaseName();

        $tables = Schema::connection($this->connectionName())
            ->getTableListing($schema, false);

        return array_values(array_diff($tables, self::EPHEMERAL_TABLES));
    }

    /**
     * @return list<string>
     */
    public function tenantScopedTables(): array
    {
        $scoped = [];

        foreach ($this->tableNames() as $table) {
            if (in_array('tenant_id', $this->columns($table), true)) {
                $scoped[] = $table;
            }
        }

        return $scoped;
    }

    /**
     * @return list<string>
     */
    public function referenceTables(): array
    {
        $available = $this->tableNames();

        return array_values(array_intersect(self::REFERENCE_TABLES, $available));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fullPlan(): array
    {
        return array_map(fn (string $table): array => ['table' => $table], $this->tableNames());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function tenantPlan(Tenant $tenant): array
    {
        $tenantId = $tenant->id;

        $plan = [];

        foreach ($this->tenantScopedTables() as $table) {
            $plan[] = ['table' => $table, 'where' => ['tenant_id' => $tenantId]];
        }

        $userIds = $this->connection()->table('tenant_users')
            ->where('tenant_id', $tenantId)
            ->pluck('user_id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        $invoiceIds = $this->connection()->table('invoices')
            ->where('tenant_id', $tenantId)
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        $plan[] = ['table' => 'tenants', 'where' => ['id' => $tenantId]];
        $plan[] = ['table' => 'users', 'where_in' => ['id' => $userIds]];
        $plan[] = [
            'table' => 'notifications',
            'where' => ['notifiable_type' => User::class],
            'where_in' => ['notifiable_id' => $userIds],
        ];
        $plan[] = ['table' => 'passkeys', 'where_in' => ['user_id' => $userIds]];
        $plan[] = ['table' => 'invoice_items', 'where_in' => ['invoice_id' => $invoiceIds]];

        foreach ($this->referenceTables() as $table) {
            $plan[] = ['table' => $table];
        }

        return $plan;
    }

    private function start(string $type, ?Tenant $tenant, ?User $actor, string $prefix): Backup
    {
        $filename = $prefix.'-'.now()->format('Ymd-His').'.zip';

        return Backup::query()->create([
            'uuid' => (string) Str::uuid(),
            'type' => $type,
            'tenant_id' => $tenant?->id,
            'status' => Backup::STATUS_RUNNING,
            'filename' => $filename,
            'path' => 'backups/'.$filename,
            'created_by' => $actor?->id,
        ]);
    }

    /**
     * @param  callable(Backup, string): array{table_count: int, row_count: int, file_count: int}  $writer
     */
    private function run(Backup $backup, callable $writer): Backup
    {
        $directory = $this->root();

        if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
            throw new RuntimeException('Unable to create the backups directory: '.$directory);
        }

        $sqlPath = $directory.DIRECTORY_SEPARATOR.$backup->uuid.'.sql';

        try {
            $result = $writer($backup, $sqlPath);

            if (is_file($sqlPath)) {
                unlink($sqlPath);
            }

            $backup->forceFill([
                'status' => Backup::STATUS_COMPLETED,
                'size_bytes' => is_file($this->pathFor($backup)) ? (int) filesize($this->pathFor($backup)) : 0,
                'table_count' => $result['table_count'],
                'row_count' => $result['row_count'],
                'file_count' => $result['file_count'],
                'completed_at' => now(),
            ])->save();

            return $backup;
        } catch (Throwable $exception) {
            if (is_file($sqlPath)) {
                unlink($sqlPath);
            }

            $backup->forceFill([
                'status' => Backup::STATUS_FAILED,
                'error' => $exception->getMessage(),
                'completed_at' => now(),
            ])->save();

            throw $exception;
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     * @return array{table_count: int, row_count: int}
     */
    private function writeSqlDump(string $sqlPath, array $plan, bool $withDrop): array
    {
        $handle = fopen($sqlPath, 'wb');

        if ($handle === false) {
            throw new RuntimeException('Unable to open '.$sqlPath.' for writing.');
        }

        $driver = $this->driver();
        $tables = 0;
        $rows = 0;

        try {
            $this->write($handle, $this->header($driver));

            if ($driver === 'mysql' || $driver === 'mariadb') {
                $this->write($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");
            }

            foreach ($plan as $entry) {
                $table = $entry['table'];

                $this->write($handle, "--\n-- Table structure for `{$table}`\n--\n");

                if ($withDrop) {
                    $this->write($handle, 'DROP TABLE IF EXISTS '.$this->quoteIdentifier($table).";\n");
                }

                $create = $this->createTableStatement($table);

                if ($create !== null) {
                    if (! $withDrop) {
                        $create = preg_replace('/^CREATE TABLE/i', 'CREATE TABLE IF NOT EXISTS', $create, 1) ?? $create;
                    }

                    $this->write($handle, $create.";\n\n");
                }

                $written = $this->writeTableRows($handle, $table, $entry);
                $rows += $written;
                $tables++;
            }

            if ($driver === 'mysql' || $driver === 'mariadb') {
                $this->write($handle, "\nSET FOREIGN_KEY_CHECKS=1;\n");
            }

            $this->write($handle, "\n-- Dump completed on ".now()->toDateTimeString()."\n");
        } finally {
            fclose($handle);
        }

        return ['table_count' => $tables, 'row_count' => $rows];
    }

    /**
     * @param  resource  $handle
     * @param  array<string, mixed>  $entry
     */
    private function writeTableRows($handle, string $table, array $entry): int
    {
        $columns = $this->columns($table);

        if ($columns === []) {
            return 0;
        }

        $written = 0;
        $hasId = in_array('id', $columns, true) && count($columns) > 1;
        $lastId = null;

        while (true) {
            $query = $this->connection()->table($table);

            foreach ($entry['where'] ?? [] as $column => $value) {
                $query->where($column, $value);
            }

            foreach ($entry['where_in'] ?? [] as $column => $values) {
                $query->whereIn($column, $values);
            }

            if ($hasId) {
                if ($lastId !== null) {
                    $query->where('id', '>', $lastId);
                }

                $query->orderBy('id')->limit(self::ID_BATCH);
            }

            $rows = $query->get()->all();

            if ($rows === []) {
                break;
            }

            foreach (array_chunk($rows, self::ROWS_PER_INSERT) as $chunk) {
                $this->writeInsert($handle, $table, $chunk);
                $written += count($chunk);
            }

            if (! $hasId) {
                break;
            }

            $lastId = data_get(end($rows), 'id');

            if (count($rows) < self::ID_BATCH) {
                break;
            }
        }

        if ($written > 0) {
            $this->write($handle, "\n");
        }

        return $written;
    }

    /**
     * @param  resource  $handle
     * @param  list<object|array<string, mixed>>  $rows
     */
    private function writeInsert($handle, string $table, array $rows): void
    {
        $first = (array) $rows[0];
        $columns = array_keys($first);

        $quoted = implode(',', array_map(fn (string $column): string => $this->quoteIdentifier($column), $columns));

        $values = [];

        foreach ($rows as $row) {
            $record = (array) $row;
            $values[] = '('.implode(',', array_map(
                fn (string $column): string => $this->quoteValue($record[$column] ?? null),
                $columns,
            )).')';
        }

        $this->write(
            $handle,
            'INSERT INTO '.$this->quoteIdentifier($table).' ('.$quoted.') VALUES '.implode(',', $values).";\n",
        );
    }

    private function createTableStatement(string $table): ?string
    {
        $driver = $this->driver();

        if ($driver === 'sqlite') {
            $row = $this->connection()->selectOne(
                "select sql from sqlite_master where type = 'table' and name = ?",
                [$table],
            );

            return isset($row->sql) ? (string) $row->sql : null;
        }

        if ($driver === 'mysql' || $driver === 'mariadb') {
            $row = $this->connection()->selectOne('SHOW CREATE TABLE '.$this->quoteIdentifier($table));

            if ($row === null) {
                return null;
            }

            $values = array_values((array) $row);

            return isset($values[1]) ? (string) $values[1] : null;
        }

        return null;
    }

    /**
     * @return list<string>
     */
    private function columns(string $table): array
    {
        return array_map(
            fn (array $column): string => (string) $column['name'],
            Schema::connection($this->connectionName())->getColumns($table),
        );
    }

    private function quoteValue(mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        $quoted = $this->connection()->getPdo()->quote((string) $value);

        return $quoted === false ? "''" : $quoted;
    }

    private function quoteIdentifier(string $name): string
    {
        return $this->driver() === 'sqlite'
            ? '"'.str_replace('"', '""', $name).'"'
            : '`'.str_replace('`', '``', $name).'`';
    }

    private function header(string $driver): string
    {
        $app = (string) config('app.name');

        return "-- {$app} backup\n"
            ."-- Driver: {$driver}\n"
            .'-- Database: '.$this->connection()->getDatabaseName()."\n"
            .'-- Generated: '.now()->toDateTimeString()."\n"
            ."--\n\n";
    }

    /**
     * @param  resource  $handle
     */
    private function write($handle, string $content): void
    {
        fwrite($handle, $content);
    }

    /**
     * @return list<string> Absolute paths of files to archive.
     */
    private function storageManifest(): array
    {
        $base = storage_path('app/public');

        if (! is_dir($base)) {
            return [];
        }

        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($base, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY,
        );

        foreach ($iterator as $file) {
            if ($file instanceof \SplFileInfo && $file->isFile()) {
                $files[] = $file->getPathname();
            }
        }

        sort($files);

        return $files;
    }

    /**
     * @param  list<string>  $files
     */
    private function zip(Backup $backup, string $sqlPath, array $files): void
    {
        $path = $this->pathFor($backup);
        $zip = new ZipArchive;
        $opened = $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        if ($opened !== true) {
            throw new RuntimeException('Unable to create the backup archive at '.$path);
        }

        try {
            $zip->addFile($sqlPath, 'database.sql');

            $manifest = [
                'app' => (string) config('app.name'),
                'type' => $backup->type,
                'tenant' => $backup->tenant_id,
                'generated_at' => now()->toIso8601String(),
                'database' => $this->connection()->getDatabaseName(),
                'driver' => $this->driver(),
                'tables' => $this->tableNames(),
                'ephemeral_tables_excluded' => self::EPHEMERAL_TABLES,
                'files_included' => count($files),
                'notes' => 'Migrations and session/cache/queue tables are excluded. Tenant dumps contain row-level data only; storage files are not tenant-mapped.',
            ];

            $zip->addFromString(
                'manifest.json',
                (string) json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            );

            $base = storage_path('app/public');

            foreach ($files as $file) {
                $zip->addFile($file, 'storage/public/'.ltrim(str_replace($base, '', $file), '/'));
            }
        } finally {
            $zip->close();
        }
    }

    private function connectionName(): ?string
    {
        return config('database.default');
    }

    private function connection(): Connection
    {
        return DB::connection($this->connectionName());
    }

    private function driver(): string
    {
        return $this->connection()->getDriverName();
    }
}
