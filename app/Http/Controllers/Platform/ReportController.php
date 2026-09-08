<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Platform\Services\PlatformAnalyticsService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        private readonly PlatformAnalyticsService $analytics,
    ) {}

    public function index(): Response
    {
        return Inertia::render('platform/reports', $this->analytics->reports());
    }

    public function export(): StreamedResponse
    {
        $reports = $this->analytics->reports();
        $filename = 'platform-report-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($reports): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Platform analytics export', now()->toDateTimeString()]);
            fputcsv($handle, []);
            fputcsv($handle, ['Month', 'New tenants', 'Revenue', 'Leads']);

            foreach ($reports['series'] as $row) {
                fputcsv($handle, [$row['label'].' '.$row['key'], $row['tenants'], $row['revenue'], $row['leads']]);
            }

            fputcsv($handle, []);
            fputcsv($handle, ['Gateway', 'Payments', 'Amount']);

            foreach ($reports['byGateway'] as $row) {
                fputcsv($handle, [$row['gateway'], $row['count'], $row['amount']]);
            }

            fputcsv($handle, []);
            fputcsv($handle, ['Source', 'Leads', 'Converted']);

            foreach ($reports['sources'] as $row) {
                fputcsv($handle, [$row['source'], $row['total'], $row['converted']]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
