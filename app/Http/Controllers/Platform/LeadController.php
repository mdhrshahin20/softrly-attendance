<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Marketing\Models\Lead;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $leads = Lead::query()
            ->with('tenant')
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('email', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('platform/leads', [
            'leads' => $leads->through(fn (Lead $lead): array => [
                'id' => $lead->id,
                'company_name' => $lead->company_name,
                'name' => $lead->name,
                'email' => $lead->email,
                'source' => $lead->source,
                'utm_source' => $lead->utm_source,
                'utm_medium' => $lead->utm_medium,
                'utm_campaign' => $lead->utm_campaign,
                'status' => $lead->status,
                'tenant' => $lead->tenant?->name,
                'created_at' => $lead->created_at?->toDateTimeString(),
            ]),
            'filters' => [
                'search' => $request->string('search')->toString() ?: null,
            ],
            'stats' => [
                'total' => Lead::query()->count(),
                'converted' => Lead::query()->where('status', 'converted')->count(),
            ],
        ]);
    }
}
