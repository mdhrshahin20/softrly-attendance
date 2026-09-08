<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Marketing\Models\Lead;
use App\Domain\Platform\Services\PlatformAnalyticsService;
use App\Domain\Platform\Services\PlatformSettingsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MarketingController extends Controller
{
    public function __construct(
        private readonly PlatformSettingsService $settings,
        private readonly PlatformAnalyticsService $analytics,
    ) {}

    public function index(): Response
    {
        $reports = $this->analytics->reports();

        return Inertia::render('platform/marketing', [
            'settings' => $this->settings->group('marketing'),
            'sources' => $reports['sources'],
            'series' => $reports['series'],
            'leads' => Lead::query()
                ->latest()
                ->paginate(15)
                ->withQueryString()
                ->through(fn (Lead $lead): array => [
                    'id' => $lead->id,
                    'email' => $lead->email,
                    'company_name' => $lead->company_name,
                    'source' => $lead->utm_source ?: $lead->source ?: 'direct',
                    'utm_medium' => $lead->utm_medium,
                    'utm_campaign' => $lead->utm_campaign,
                    'utm_term' => $lead->utm_term,
                    'utm_content' => $lead->utm_content,
                    'referrer' => $lead->referrer,
                    'landing_page' => $lead->landing_page,
                    'status' => $lead->status,
                    'created_at' => $lead->created_at?->toDateTimeString(),
                ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ga_measurement_id' => ['nullable', 'string', 'max:40'],
            'fb_pixel_id' => ['nullable', 'string', 'max:40'],
            'gtm_container_id' => ['nullable', 'string', 'max:40'],
        ]);

        $this->settings->putMany([
            'marketing.ga_measurement_id' => trim((string) ($data['ga_measurement_id'] ?? '')),
            'marketing.fb_pixel_id' => trim((string) ($data['fb_pixel_id'] ?? '')),
            'marketing.gtm_container_id' => trim((string) ($data['gtm_container_id'] ?? '')),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Marketing pixels saved.']);

        return back();
    }
}
