<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Platform\Services\MaintenanceService;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function __construct(
        private readonly MaintenanceService $maintenance,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        return Inertia::render('platform/maintenance', [
            'status' => $this->maintenance->status(),
            'actions' => $this->maintenance->actions(),
            'result' => session('maintenance_result'),
        ]);
    }

    public function run(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', 'string'],
            'confirm' => ['sometimes', 'boolean'],
        ]);

        if (! $this->maintenance->exists($data['action'])) {
            throw ValidationException::withMessages(['action' => 'Unknown maintenance action.']);
        }

        if ($this->maintenance->requiresConfirmation($data['action']) && ! $request->boolean('confirm')) {
            throw ValidationException::withMessages([
                'action' => 'This action requires confirmation. Take a backup before running it.',
            ]);
        }

        $result = $this->maintenance->run($data['action']);

        $this->audit->record('maintenance.'.$result['action'], newValues: [
            'command' => $result['command'],
            'exit_code' => $result['exit_code'],
        ], user: $request->user(), request: $request);

        Inertia::flash('toast', [
            'type' => $result['exit_code'] === 0 ? 'success' : 'error',
            'message' => $result['exit_code'] === 0
                ? 'Ran '.$result['command'].'.'
                : 'Command exited with code '.$result['exit_code'].'.',
        ]);

        return back()->with('maintenance_result', $result);
    }
}
