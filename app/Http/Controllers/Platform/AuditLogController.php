<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Tenant\Models\ActivityLog;
use App\Http\Controllers\Controller;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $action = $request->string('action')->toString();

        $logs = ActivityLog::query()
            ->with(['user', 'tenant'])
            ->when($action !== '', fn (Builder $query) => $query->where('action', $action))
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $inner) use ($search): void {
                    $inner->where('action', 'like', '%'.$search.'%')
                        ->orWhere('entity_type', 'like', '%'.$search.'%')
                        ->orWhereHas('user', function (Builder $user) use ($search): void {
                            $user->where('name', 'like', '%'.$search.'%')
                                ->orWhere('email', 'like', '%'.$search.'%');
                        })
                        ->orWhereHas('tenant', function (Builder $tenant) use ($search): void {
                            $tenant->where('name', 'like', '%'.$search.'%');
                        });
                });
            })
            ->latest()
            ->paginate(30)
            ->withQueryString()
            ->through(fn (ActivityLog $log): array => [
                'id' => $log->id,
                'action' => $log->action,
                'tenant' => $log->tenant?->name,
                'tenant_id' => $log->tenant_id,
                'user' => $log->user?->name,
                'user_email' => $log->user?->email,
                'entity' => $log->entity_type ? class_basename($log->entity_type) : null,
                'entity_id' => $log->entity_id,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('platform/audit', [
            'logs' => $logs,
            'actions' => ActivityLog::query()
                ->select('action')
                ->distinct()
                ->orderBy('action')
                ->pluck('action'),
            'filters' => [
                'search' => $search ?: null,
                'action' => $action ?: null,
            ],
        ]);
    }
}
