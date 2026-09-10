<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Platform\Services\MaintenanceService;
use App\Domain\Platform\Services\PlatformAnalyticsService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(PlatformAnalyticsService $analytics, MaintenanceService $maintenance): Response
    {
        return Inertia::render('platform/dashboard', [
            ...$analytics->dashboard(),
            'system' => $maintenance->summary(),
        ]);
    }
}
