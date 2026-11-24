<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Notifications\AdminIntegrationTestMail;
use App\Services\Admin\AdminAuditLogger;
use App\Services\Admin\IntegrationSecretsService;
use App\Services\Billing\BillingService;
use App\Services\ContentTranslator;
use App\Services\PlatformReadinessService;
use App\Services\TwilioMessagingService;
use App\Support\InviteHost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationController extends Controller
{
    public function index(
        PlatformReadinessService $platform,
        BillingService $billing,
        TwilioMessagingService $twilio,
        IntegrationSecretsService $secrets,
    ): Response {
        $summary = $platform->summary();
        $razorpayKey = (string) config('razorpay.key');
        $stripeKey = (string) config('cashier.key');

        $fields = $secrets->fieldsForAdmin();
        $byGroup = collect($fields)->groupBy('group')->map->values()->all();

        return Inertia::render('admin/integrations/index', [
            'platform' => $summary,
            'integrations' => [
                'mail' => [
                    'mailer' => (string) config('mail.default'),
                    'from' => (string) config('mail.from.address'),
                    'ready' => collect($summary['checklist'] ?? [])->firstWhere('id', 'mail')['done'] ?? false,
                ],
                'twilio' => $twilio->status(),
                'razorpay' => [
                    'ready' => $billing->razorpayReady(),
                    'mode' => str_starts_with($razorpayKey, 'rzp_live_') ? 'live' : (str_starts_with($razorpayKey, 'rzp_test_') ? 'test' : 'unset'),
                    'key_prefix' => $razorpayKey !== '' ? substr($razorpayKey, 0, 12).'…' : null,
                    'webhook_url' => url('/razorpay/webhook'),
                ],
                'stripe' => [
                    'ready' => $billing->stripeReady(),
                    'mode' => str_starts_with($stripeKey, 'pk_live_') ? 'live' : (str_starts_with($stripeKey, 'pk_test_') ? 'test' : 'unset'),
                    'key_prefix' => $stripeKey !== '' ? substr($stripeKey, 0, 12).'…' : null,
                    'webhook_url' => url('/stripe/webhook'),
                ],
                'storage' => [
                    'disk' => (string) config('filesystems.default'),
                    'bucket_set' => filled(config('filesystems.disks.s3.bucket')),
                    'region' => config('filesystems.disks.s3.region'),
                ],
                'translation' => [
                    'driver' => (string) config('services.translation.driver'),
                    'deepl_key_set' => filled(config('services.translation.deepl_key')),
                ],
                'sentry' => [
                    'dsn_set' => filled(config('services.sentry.dsn')),
                    'package' => class_exists(\Sentry\Laravel\Integration::class),
                ],
                'subdomains' => [
                    'enabled' => InviteHost::enabled(),
                    'root' => InviteHost::rootDomain(),
                ],
            ],
            'secret_groups' => [
                [
                    'id' => 'razorpay',
                    'title' => 'Razorpay',
                    'hint' => 'INR checkout. Paste key ID + secret; webhook URL below.',
                    'webhook_url' => url('/razorpay/webhook'),
                    'fields' => $byGroup['razorpay'] ?? [],
                ],
                [
                    'id' => 'stripe',
                    'title' => 'Stripe',
                    'hint' => 'USD / international checkout.',
                    'webhook_url' => url('/stripe/webhook'),
                    'fields' => $byGroup['stripe'] ?? [],
                ],
                [
                    'id' => 'twilio',
                    'title' => 'Twilio · SMS / WhatsApp / SendGrid',
                    'hint' => 'Automated invite delivery channels.',
                    'fields' => $byGroup['twilio'] ?? [],
                ],
                [
                    'id' => 'mail',
                    'title' => 'Mail · Resend',
                    'hint' => 'Transactional from-address and Resend API key.',
                    'fields' => $byGroup['mail'] ?? [],
                ],
                [
                    'id' => 'extras',
                    'title' => 'Translation & errors',
                    'hint' => 'Optional DeepL and Sentry.',
                    'fields' => $byGroup['extras'] ?? [],
                ],
            ],
            'note' => 'Edit keys here — values are encrypted in the database and override .env. Leave a field blank to keep the current value. Use Clear to remove a database override (falls back to .env).',
        ]);
    }

    public function update(Request $request, IntegrationSecretsService $secrets, AdminAuditLogger $audit): RedirectResponse
    {
        $allowed = array_keys($secrets->definitions());
        $data = $request->validate([
            'values' => ['required', 'array'],
            'values.*' => ['nullable', 'string', 'max:2000'],
            'clear' => ['sometimes', 'array'],
            'clear.*' => ['string', Rule::in($allowed)],
        ]);

        $values = [];
        foreach (($data['values'] ?? []) as $key => $value) {
            if (! in_array($key, $allowed, true)) {
                continue;
            }
            $values[$key] = is_string($value) ? $value : '';
        }

        foreach (($data['clear'] ?? []) as $key) {
            $values[$key] = '__clear__';
        }

        $changed = $secrets->updateMany($values, $request->user());

        $audit->log($request->user(), 'integrations.update', null, [
            'keys' => $changed,
            'cleared' => array_values(array_filter($changed, fn (string $k): bool => ($values[$k] ?? '') === '__clear__')),
        ], $request);

        if ($changed === []) {
            return back()->with('toast', ['type' => 'info', 'message' => 'No changes saved — leave blank fields empty to keep current secrets.']);
        }

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Saved '.count($changed).' integration setting(s).',
        ]);
    }

    public function testMail(Request $request, AdminAuditLogger $audit): RedirectResponse
    {
        $user = $request->user();
        Notification::route('mail', $user->email)->notify(new AdminIntegrationTestMail);
        $audit->log($user, 'integrations.test_mail', null, ['to' => $user->email], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Test email queued to '.$user->email]);
    }

    public function testTranslate(Request $request, ContentTranslator $translator, AdminAuditLogger $audit): RedirectResponse
    {
        $sample = 'Welcome to our celebration';
        $out = $translator->translate($sample, 'en', 'hi');
        $audit->log($request->user(), 'integrations.test_translate', null, ['sample' => $sample, 'out' => $out], $request);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Translate sample → '.Str::limit((string) $out, 80),
        ]);
    }

    public function testStorage(Request $request, AdminAuditLogger $audit): RedirectResponse
    {
        $disk = Storage::disk((string) config('filesystems.default'));
        $path = 'admin-probes/'.Str::uuid().'.txt';
        $disk->put($path, 'ok '.now()->toIso8601String());
        $ok = $disk->exists($path);
        $disk->delete($path);
        $audit->log($request->user(), 'integrations.test_storage', null, ['ok' => $ok, 'disk' => config('filesystems.default')], $request);

        return back()->with('toast', [
            'type' => $ok ? 'success' : 'error',
            'message' => $ok ? 'Storage write/delete probe succeeded.' : 'Storage probe failed.',
        ]);
    }
}
