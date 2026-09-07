<?php

namespace App\Domain\Api\Services;

use App\Domain\Api\Models\ApiToken;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;

class ApiTokenService
{
    /**
     * @return array{token: ApiToken, plain: string}
     */
    public function create(User $user, Tenant $tenant, string $name): array
    {
        $plain = Str::random(40);

        $token = ApiToken::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'name' => $name,
            'token' => hash('sha256', $plain),
        ]);

        return [
            'token' => $token,
            'plain' => $plain,
        ];
    }

    public function findByPlainText(string $plain): ?ApiToken
    {
        if ($plain === '') {
            return null;
        }

        return ApiToken::query()
            ->with(['user', 'tenant'])
            ->where('token', hash('sha256', $plain))
            ->first();
    }

    public function touch(ApiToken $token): void
    {
        $token->forceFill(['last_used_at' => now()])->save();
    }
}
