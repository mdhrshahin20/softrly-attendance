<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Tenant\Models\ActivityLog;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('audit.view'), 403);
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::AuditLog), 403);

        $logs = ActivityLog::query()
            ->where('tenant_id', Tenant::current()?->id)
            ->when($request->string('action')->toString(), fn ($query, string $action) => $query->where('action', 'like', '%'.$action.'%'))
            ->latest()
            ->paginate(40)
            ->withQueryString();

        return Inertia::render('audit-logs/index', [
            'logs' => $logs->through(fn (ActivityLog $log): array => [
                'id' => $log->id,
                'action' => $log->action,
                'entity_type' => class_basename((string) $log->entity_type),
                'entity_id' => $log->entity_id,
                'user_id' => $log->user_id,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toDateTimeString(),
            ]),
            'filters' => [
                'action' => $request->string('action')->toString() ?: null,
            ],
        ]);
    }
}
