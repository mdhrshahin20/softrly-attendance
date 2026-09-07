<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Employee\Services\EmployeeImportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeImportController extends Controller
{
    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('employee.create'), 403);

        return Inertia::render('employees/import', [
            'preview' => $request->session()->get('employee_import_preview'),
        ]);
    }

    public function preview(Request $request, EmployeeImportService $importer): RedirectResponse
    {
        abort_unless($request->user()?->can('employee.create'), 403);

        $request->validate([
            'file' => ['required', 'file', 'max:2048'],
        ]);

        $file = $request->file('file');
        abort_unless($file, 422);

        $preview = $importer->preview($file);

        return back()->with('employee_import_preview', $preview);
    }

    public function store(Request $request, EmployeeImportService $importer): RedirectResponse
    {
        abort_unless($request->user()?->can('employee.create'), 403);

        $preview = $request->session()->get('employee_import_preview');

        if (! is_array($preview) || ! isset($preview['rows']) || ! $request->user()) {
            return back()->withErrors(['file' => 'Preview the CSV before importing.']);
        }

        /** @var list<array{line: int, data: array<string, string>, valid: bool, error: string|null}> $rows */
        $rows = $preview['rows'];
        $result = $importer->importRows($rows, $request->user());
        $request->session()->forget('employee_import_preview');

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $result['created'].' employees imported, '.$result['skipped'].' skipped.',
        ]);

        return to_route('employees.index');
    }

    public function template(Request $request, EmployeeImportService $importer): StreamedResponse
    {
        abort_unless($request->user()?->can('employee.create'), 403);

        return response()->streamDownload(function () use ($importer): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            foreach ($importer->templateRows() as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 'employees-template.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
