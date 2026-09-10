<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Platform\Services\LogViewerService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogController extends Controller
{
    public function __construct(
        private readonly LogViewerService $logs,
    ) {}

    public function index(Request $request): Response
    {
        $files = $this->logs->files();
        $selected = $request->string('file')->toString();

        if ($selected === '') {
            $selected = $files[0]['name'] ?? '';
        }

        $lines = min(2000, max(50, $request->integer('lines', 300)));

        return Inertia::render('platform/logs', [
            'files' => $files,
            'selected' => $selected ?: null,
            'lines' => $lines,
            'content' => $selected !== '' && $this->logs->exists($selected)
                ? $this->logs->tail($selected, $lines)
                : '',
        ]);
    }

    public function destroy(string $file): RedirectResponse
    {
        abort_unless($this->logs->delete($file), 404);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Log file deleted.']);

        return redirect()->route('platform.logs');
    }
}
