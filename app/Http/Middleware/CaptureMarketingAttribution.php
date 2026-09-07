<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CaptureMarketingAttribution
{
    /**
     * @var list<string>
     */
    private array $keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'];

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->hasSession()) {
            return $next($request);
        }

        $captured = [];

        foreach ($this->keys as $key) {
            if ($request->filled($key)) {
                $captured[$key] = $request->string($key)->limit(255)->toString();
            }
        }

        if ($captured !== []) {
            if (! isset($captured['landing_page'])) {
                $captured['landing_page'] = $request->fullUrl();
            }

            $request->session()->put(
                'marketing',
                array_merge($request->session()->get('marketing', []), $captured),
            );
        }

        return $next($request);
    }
}
