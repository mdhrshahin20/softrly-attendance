<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Domain\Marketing\Services\LeadService;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\TenantProvisioner;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private readonly TenantProvisioner $provisioner) {}

    /**
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        if (empty($input['slug']) && ! empty($input['company_name'])) {
            $input['slug'] = Str::slug((string) $input['company_name']);
        }

        $input['slug'] = $this->uniqueSlug((string) ($input['slug'] ?? ''));

        Validator::make($input, [
            'company_name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:63', 'alpha_dash', Rule::unique('tenants', 'slug')],
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $result = $this->provisioner->provision([
            'company_name' => $input['company_name'],
            'slug' => $input['slug'],
            'owner_name' => $input['name'],
            'owner_email' => $input['email'],
            'password' => $input['password'],
        ]);

        app(LeadService::class)->captureRegistration($result['tenant'], $result['user'], $input);

        return $result['user'];
    }

    private function uniqueSlug(string $slug): string
    {
        $slug = Str::slug($slug);

        if ($slug === '') {
            return $slug;
        }

        $base = $slug;
        $suffix = 1;

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $candidate = $base.'-'.$suffix;
            $slug = Str::limit($candidate, 63, '');
            $suffix++;
        }

        return $slug;
    }
}
