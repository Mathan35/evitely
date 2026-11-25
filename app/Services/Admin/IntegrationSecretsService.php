<?php

namespace App\Services\Admin;

use App\Models\PlatformIntegrationSetting;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class IntegrationSecretsService
{
    /**
     * Config path map for each editable secret.
     *
     * @return array<string, array{config: string, label: string, group: string, secret?: bool, placeholder?: string, multiline?: bool}>
     */
    public function definitions(): array
    {
        return [
            'razorpay.key' => [
                'config' => 'razorpay.key',
                'label' => 'Razorpay key ID',
                'group' => 'razorpay',
                'secret' => false,
                'placeholder' => 'rzp_test_… or rzp_live_…',
            ],
            'razorpay.secret' => [
                'config' => 'razorpay.secret',
                'label' => 'Razorpay key secret',
                'group' => 'razorpay',
                'secret' => true,
                'placeholder' => 'Leave blank to keep current',
            ],
            'razorpay.webhook_secret' => [
                'config' => 'razorpay.webhook_secret',
                'label' => 'Razorpay webhook secret',
                'group' => 'razorpay',
                'secret' => true,
            ],
            'stripe.key' => [
                'config' => 'cashier.key',
                'label' => 'Stripe publishable key',
                'group' => 'stripe',
                'secret' => false,
                'placeholder' => 'pk_test_… or pk_live_…',
            ],
            'stripe.secret' => [
                'config' => 'cashier.secret',
                'label' => 'Stripe secret key',
                'group' => 'stripe',
                'secret' => true,
            ],
            'stripe.webhook_secret' => [
                'config' => 'cashier.webhook.secret',
                'label' => 'Stripe webhook secret',
                'group' => 'stripe',
                'secret' => true,
            ],
            'twilio.account_sid' => [
                'config' => 'services.twilio.account_sid',
                'label' => 'Twilio account SID',
                'group' => 'twilio',
                'secret' => false,
            ],
            'twilio.auth_token' => [
                'config' => 'services.twilio.auth_token',
                'label' => 'Twilio auth token',
                'group' => 'twilio',
                'secret' => true,
            ],
            'twilio.sms_from' => [
                'config' => 'services.twilio.sms_from',
                'label' => 'SMS from (E.164)',
                'group' => 'twilio',
                'secret' => false,
                'placeholder' => '+14155552671',
            ],
            'twilio.whatsapp_from' => [
                'config' => 'services.twilio.whatsapp_from',
                'label' => 'WhatsApp from',
                'group' => 'twilio',
                'secret' => false,
                'placeholder' => 'whatsapp:+14155238886',
            ],
            'twilio.sendgrid_api_key' => [
                'config' => 'services.twilio.sendgrid_api_key',
                'label' => 'SendGrid API key',
                'group' => 'twilio',
                'secret' => true,
            ],
            'resend.key' => [
                'config' => 'services.resend.key',
                'label' => 'Resend API key',
                'group' => 'mail',
                'secret' => true,
            ],
            'mail.from_address' => [
                'config' => 'mail.from.address',
                'label' => 'Mail from address',
                'group' => 'mail',
                'secret' => false,
                'placeholder' => 'hello@example.com',
            ],
            'mail.from_name' => [
                'config' => 'mail.from.name',
                'label' => 'Mail from name',
                'group' => 'mail',
                'secret' => false,
            ],
            'translation.deepl_key' => [
                'config' => 'services.translation.deepl_key',
                'label' => 'DeepL API key',
                'group' => 'extras',
                'secret' => true,
            ],
            'sentry.dsn' => [
                'config' => 'services.sentry.dsn',
                'label' => 'Sentry DSN',
                'group' => 'extras',
                'secret' => true,
            ],
            'google.client_id' => [
                'config' => 'services.google.client_id',
                'label' => 'Google OAuth client ID',
                'group' => 'social',
                'secret' => false,
            ],
            'google.client_secret' => [
                'config' => 'services.google.client_secret',
                'label' => 'Google OAuth client secret',
                'group' => 'social',
                'secret' => true,
            ],
            'facebook.client_id' => [
                'config' => 'services.facebook.client_id',
                'label' => 'Facebook App ID',
                'group' => 'social',
                'secret' => false,
            ],
            'facebook.client_secret' => [
                'config' => 'services.facebook.client_secret',
                'label' => 'Facebook App secret',
                'group' => 'social',
                'secret' => true,
            ],
            'apple.client_id' => [
                'config' => 'services.apple.client_id',
                'label' => 'Apple Services ID',
                'group' => 'social',
                'secret' => false,
            ],
            'apple.client_secret' => [
                'config' => 'services.apple.client_secret',
                'label' => 'Apple client secret JWT (optional if key path set)',
                'group' => 'social',
                'secret' => true,
            ],
            'apple.team_id' => [
                'config' => 'services.apple.team_id',
                'label' => 'Apple Team ID',
                'group' => 'social',
                'secret' => false,
            ],
            'apple.key_id' => [
                'config' => 'services.apple.key_id',
                'label' => 'Apple Key ID',
                'group' => 'social',
                'secret' => false,
            ],
            'apple.private_key' => [
                'config' => 'services.apple.private_key',
                'label' => 'Apple .p8 key (path or paste PEM)',
                'group' => 'social',
                'secret' => true,
                'multiline' => true,
                'placeholder' => '/home/…/AuthKey_XXXXX.p8  — or paste -----BEGIN PRIVATE KEY----- …',
            ],
            'apple.passphrase' => [
                'config' => 'services.apple.passphrase',
                'label' => 'Apple key passphrase (optional)',
                'group' => 'social',
                'secret' => true,
            ],
        ];
    }

    public function tableReady(): bool
    {
        try {
            return Schema::hasTable('platform_integration_settings');
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Merge DB overrides into runtime config (DB wins over .env).
     */
    public function applyToConfig(): void
    {
        if (! $this->tableReady()) {
            return;
        }

        foreach ($this->definitions() as $key => $def) {
            $row = PlatformIntegrationSetting::query()->find($key);
            if ($row === null || $row->value === null || $row->value === '') {
                continue;
            }
            config([$def['config'] => $row->value]);
        }

        // Keep SendGrid alias in sync when Twilio SendGrid key is overridden.
        $sendgrid = config('services.twilio.sendgrid_api_key');
        if (filled($sendgrid)) {
            config(['services.sendgrid.key' => $sendgrid]);
        }
    }

    /**
     * Masked field state for the admin UI (never expose full secrets).
     *
     * @return list<array{key: string, label: string, group: string, secret: bool, multiline: bool, placeholder: string|null, set: bool, preview: string|null, source: string}>
     */
    public function fieldsForAdmin(): array
    {
        $overrides = $this->tableReady()
            ? PlatformIntegrationSetting::query()->get()->keyBy('key')
            : collect();

        $fields = [];

        foreach ($this->definitions() as $key => $def) {
            $override = $overrides->get($key);
            $hasOverride = $override !== null && filled($override->value);
            $envValue = (string) (config($def['config']) ?? '');
            $effective = $hasOverride ? (string) $override->value : $envValue;
            $set = filled($effective);
            $secret = (bool) ($def['secret'] ?? true);

            $fields[] = [
                'key' => $key,
                'label' => $def['label'],
                'group' => $def['group'],
                'secret' => $secret,
                'multiline' => (bool) ($def['multiline'] ?? false),
                'placeholder' => $def['placeholder'] ?? null,
                'set' => $set,
                'preview' => $set ? $this->mask($effective, $secret) : null,
                'source' => $hasOverride ? 'database' : ($set ? 'environment' : 'unset'),
            ];
        }

        return $fields;
    }

    /**
     * @param  array<string, string|null>  $values  keyed by definition key; empty string = keep; "__clear__" = remove override
     * @return list<string> keys that changed
     */
    public function updateMany(array $values, User $actor): array
    {
        if (! $this->tableReady()) {
            return [];
        }

        $changed = [];
        $defs = $this->definitions();

        foreach ($values as $key => $raw) {
            if (! isset($defs[$key])) {
                continue;
            }

            $value = is_string($raw) ? trim($raw) : '';

            if ($value === '') {
                continue;
            }

            if ($value === '__clear__') {
                PlatformIntegrationSetting::query()->where('key', $key)->delete();
                $changed[] = $key;
                continue;
            }

            PlatformIntegrationSetting::query()->updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'updated_by' => $actor->id,
                ],
            );
            $changed[] = $key;
        }

        if ($changed !== []) {
            $this->applyToConfig();
        }

        return $changed;
    }

    private function mask(string $value, bool $secret): string
    {
        $len = strlen($value);
        if ($len === 0) {
            return '';
        }

        if (! $secret) {
            if ($len <= 12) {
                return $value;
            }

            return substr($value, 0, 10).'…'.substr($value, -4);
        }

        if ($len <= 8) {
            return str_repeat('•', min(8, $len));
        }

        return substr($value, 0, 4).str_repeat('•', 8).substr($value, -4);
    }
}
