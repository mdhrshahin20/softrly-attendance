<?php

namespace App\Domain\Platform\Services;

use App\Domain\Platform\Models\PlatformSetting;

class PlatformSettingsService
{
    /**
     * @var array<string, mixed>|null
     */
    private ?array $cache = null;

    /**
     * @return array<string, mixed>
     */
    public function defaults(): array
    {
        return [
            'payments.default_gateway' => 'manual',
            'payments.mode' => 'sandbox',
            'payments.sslcommerz.enabled' => false,
            'payments.sslcommerz.store_id' => '',
            'payments.sslcommerz.store_password' => '',
            'payments.bkash.enabled' => false,
            'payments.bkash.app_key' => '',
            'payments.bkash.app_secret' => '',
            'payments.bkash.username' => '',
            'payments.bkash.password' => '',
            'mail.driver' => 'log',
            'mail.from_address' => (string) config('mail.from.address'),
            'mail.from_name' => (string) config('mail.from.name'),
            'mail.smtp_host' => '',
            'mail.smtp_port' => 587,
            'mail.smtp_username' => '',
            'mail.smtp_password' => '',
            'mail.smtp_encryption' => 'tls',
            'mail.ses_host' => '',
            'mail.ses_username' => '',
            'mail.ses_password' => '',
            'mail.ses_region' => 'ap-southeast-1',
            'mail.brevo_login' => '',
            'mail.brevo_key' => '',
            'sms.driver' => 'log',
            'sms.sender_id' => 'SOFTRLY',
            'sms.api_url' => '',
            'sms.api_key' => '',
            'sms.api_secret' => '',
            'marketing.ga_measurement_id' => '',
            'marketing.fb_pixel_id' => '',
            'marketing.gtm_container_id' => '',
        ];
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $all = $this->all();

        if (array_key_exists($key, $all)) {
            return $all[$key];
        }

        return $default ?? $this->defaults()[$key] ?? null;
    }

    public function bool(string $key): bool
    {
        return filter_var($this->get($key, false), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * @return array<string, mixed>
     */
    public function group(string $prefix): array
    {
        $needle = $prefix.'.';

        return collect($this->all())
            ->filter(fn (mixed $value, string $key): bool => str_starts_with($key, $needle))
            ->mapWithKeys(fn (mixed $value, string $key): array => [substr($key, strlen($needle)) => $value])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function all(): array
    {
        if ($this->cache !== null) {
            return $this->cache;
        }

        $stored = PlatformSetting::query()
            ->get()
            ->mapWithKeys(fn (PlatformSetting $setting): array => [$setting->key => $setting->value])
            ->all();

        $this->cache = array_merge($this->defaults(), $stored);

        return $this->cache;
    }

    public function set(string $key, mixed $value): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value],
        );

        $this->cache = null;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public function putMany(array $values): void
    {
        foreach ($values as $key => $value) {
            $this->set($key, $value);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function marketingPublic(): array
    {
        return [
            'ga_measurement_id' => (string) $this->get('marketing.ga_measurement_id', ''),
            'fb_pixel_id' => (string) $this->get('marketing.fb_pixel_id', ''),
            'gtm_container_id' => (string) $this->get('marketing.gtm_container_id', ''),
        ];
    }
}
