<?php

namespace App\Domain\Marketing\Services;

use App\Domain\Marketing\Models\Lead;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LeadService
{
    /**
     * @param  array<string, mixed>  $input
     */
    public function captureRegistration(Tenant $tenant, User $user, array $input, ?Request $request = null): Lead
    {
        $request ??= request();
        $session = $request->hasSession() ? $request->session()->get('marketing', []) : [];
        $session = is_array($session) ? $session : [];

        $lead = Lead::query()->updateOrCreate(
            ['email' => $user->email],
            [
                'company_name' => $input['company_name'] ?? $tenant->name,
                'name' => $user->name,
                'source' => $this->value($input, $session, 'source') ?? 'register',
                'utm_source' => $this->value($input, $session, 'utm_source'),
                'utm_medium' => $this->value($input, $session, 'utm_medium'),
                'utm_campaign' => $this->value($input, $session, 'utm_campaign'),
                'utm_term' => $this->value($input, $session, 'utm_term'),
                'utm_content' => $this->value($input, $session, 'utm_content'),
                'referrer' => $this->value($input, $session, 'referrer') ?? $request->headers->get('referer'),
                'landing_page' => is_string($session['landing_page'] ?? null) ? $session['landing_page'] : $request->fullUrl(),
                'ip_address' => $request->ip(),
                'tenant_id' => $tenant->id,
                'status' => 'converted',
            ],
        );

        if ($request->hasSession()) {
            $request->session()->forget('marketing');
        }

        return $lead;
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  array<string, mixed>  $session
     */
    private function value(array $input, array $session, string $key): ?string
    {
        $value = $input[$key] ?? $session[$key] ?? null;

        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return Str::limit(trim($value), 255, '');
    }
}
