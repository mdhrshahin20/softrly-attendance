<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Api\Models\ApiToken;
use App\Domain\Api\Services\ApiTokenService;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiTokenController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('settings.manage'), 403);
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::ApiAccess), 403);

        return Inertia::render('settings/api-tokens', [
            'tokens' => ApiToken::query()
                ->where('tenant_id', Tenant::current()?->id)
                ->latest()
                ->paginate(15)
                ->withQueryString()
                ->through(fn (ApiToken $token): array => [
                    'id' => $token->id,
                    'name' => $token->name,
                    'last_used_at' => $token->last_used_at?->toDateTimeString(),
                    'created_at' => $token->created_at?->toDateTimeString(),
                ]),
            'plainToken' => $request->session()->get('plain_api_token'),
        ]);
    }

    public function store(Request $request, ApiTokenService $tokens, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);
        app(SubscriptionService::class)->assertFeature(PlanFeature::ApiAccess);

        $tenant = Tenant::current();
        $user = $request->user();
        abort_unless($tenant instanceof Tenant && $user instanceof User, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
        ]);

        $created = $tokens->create($user, $tenant, $data['name']);
        $audit->record('api_token.created', $created['token'], newValues: ['name' => $data['name']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'API token created. Copy it now — it will not be shown again.']);

        return back()->with('plain_api_token', $created['plain']);
    }

    public function destroy(Request $request, ApiToken $token, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);
        abort_unless($token->tenant_id === Tenant::current()?->id, 404);

        $audit->record('api_token.revoked', $token, oldValues: ['name' => $token->name]);
        $token->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'API token revoked.']);

        return back();
    }
}
