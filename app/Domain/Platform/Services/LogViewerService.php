<?php

namespace App\Domain\Platform\Services;

use InvalidArgumentException;

class LogViewerService
{
    private const MAX_LINES = 2000;

    public function __construct(private readonly ?string $directory = null) {}

    public function directory(): string
    {
        return $this->directory ?? storage_path('logs');
    }

    /**
     * @return list<array{name: string, size: int, modified_at: string|null}>
     */
    public function files(): array
    {
        $paths = glob($this->directory().'/*.log') ?: [];

        $files = array_map(fn (string $path): array => [
            'name' => basename($path),
            'size' => (int) filesize($path),
            'modified_at' => date('Y-m-d H:i:s', (int) filemtime($path)),
        ], $paths);

        usort($files, fn (array $left, array $right): int => strcmp($right['modified_at'], $left['modified_at']));

        return $files;
    }

    public function exists(string $file): bool
    {
        return in_array($file, array_column($this->files(), 'name'), true);
    }

    public function tail(string $file, int $lines = 300): string
    {
        $path = $this->path($file);
        $lines = max(1, min(self::MAX_LINES, $lines));

        if ($path === null) {
            throw new InvalidArgumentException('Log file not found.');
        }

        return $this->readTail($path, $lines);
    }

    public function delete(string $file): bool
    {
        $path = $this->path($file);

        if ($path === null) {
            return false;
        }

        return unlink($path);
    }

    private function path(string $file): ?string
    {
        if ($file === '' || basename($file) !== $file || ! preg_match('/^[\w.\-]+\.log$/', $file)) {
            return null;
        }

        $path = $this->directory().DIRECTORY_SEPARATOR.$file;

        return is_file($path) ? $path : null;
    }

    private function readTail(string $path, int $lines): string
    {
        $handle = fopen($path, 'rb');

        if ($handle === false) {
            return '';
        }

        $buffer = '';
        $chunkSize = 8192;
        $position = (int) filesize($path);

        fseek($handle, 0, SEEK_END);

        while ($position > 0 && substr_count($buffer, "\n") <= $lines) {
            $read = (int) min($chunkSize, $position);
            $position -= $read;

            fseek($handle, $position);

            $buffer = (string) fread($handle, $read).$buffer;
        }

        fclose($handle);

        $rows = explode("\n", $buffer);

        if (count($rows) > $lines) {
            $rows = array_slice($rows, -$lines);
        }

        return implode("\n", $rows);
    }
}
