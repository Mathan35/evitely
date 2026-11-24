<?php

namespace App\Services;

use App\Models\User;
use App\Support\InviteHost;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class PlatformReadinessService
{
    public function __construct(private TwilioMessagingService $twilio) {}

    /**
     * Owner admin console access — PLATFORM_ADMIN_EMAILS only (never billing list).
     */
    public function isAdmin(User $user): bool
    {
        $emails = collect(config('platform.admin_emails', []))
            ->filter()
            ->map(fn ($email) => strtolower(trim((string) $email)))
            ->unique()
            ->values()
            ->all();

        if ($emails === [] || $user->isDisabled()) {
            return false;
        }

        return in_array(strtolower((string) $user->email), $emails, true);
    }

    /**
     * @return list<array{id: string, label: string, done: bool, hint: string, group: string}>
     */
    public function checklist(): array
    {
        $twilio = $this->twilio->status();
        $mailDefault = (string) config('mail.default');
        $queue = (string) config('queue.default');
        $failedJobs = 0;
        try {
            $failedJobs = (int) DB::table('failed_jobs')->count();
        } catch (Throwable) {
            // table may not exist yet
        }

        $pendingJobs = 0;
        try {
            if ($queue === 'database') {
                $pendingJobs = (int) DB::table('jobs')->count();
            }
        } catch (Throwable) {
            // ignore
        }

        return [
            [
                'id' => 'mail',
                'group' => 'Delivery',
                'label' => 'Transactional email ready',
                'done' => $twilio['email'] === true && $mailDefault !== 'array',
                'hint' => 'Set TWILIO_SENDGRID_API_KEY or RESEND_API_KEY (and MAIL_MAILER=twilio_email|resend)',
            ],
            [
                'id' => 'sms',
                'group' => 'Delivery',
                'label' => 'Twilio SMS ready',
                'done' => $twilio['sms'] === true,
                'hint' => 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM',
            ],
            [
                'id' => 'whatsapp',
                'group' => 'Delivery',
                'label' => 'Twilio WhatsApp ready',
                'done' => $twilio['whatsapp'] === true,
                'hint' => 'TWILIO_WHATSAPP_FROM (sandbox or approved WhatsApp Business sender)',
            ],
            [
                'id' => 'queue',
                'group' => 'Workers',
                'label' => 'Queue driver not sync',
                'done' => $queue !== 'sync',
                'hint' => 'QUEUE_CONNECTION=database|redis + php artisan queue:work',
            ],
            [
                'id' => 'queue_depth',
                'group' => 'Workers',
                'label' => 'Job backlog healthy',
                'done' => $pendingJobs < 200 && $failedJobs === 0,
                'hint' => $failedJobs > 0
                    ? "{$failedJobs} failed jobs — run queue:retry / inspect failed_jobs"
                    : ($pendingJobs >= 200 ? "{$pendingJobs} pending jobs — start a worker" : 'Workers clearing jobs'),
            ],
            [
                'id' => 'schedule',
                'group' => 'Workers',
                'label' => 'Scheduler heartbeat (cron running)',
                'done' => $this->schedulerHeartbeatFresh(),
                'hint' => $this->schedulerHint(),
            ],
            [
                'id' => 'subdomains',
                'group' => 'Invites',
                'label' => 'Invite subdomains enabled',
                'done' => InviteHost::enabled(),
                'hint' => 'INVITE_ROOT_DOMAIN + DNS *.domain → app; INVITE_SUBDOMAINS_ENABLED=true',
            ],
            [
                'id' => 'pwa',
                'group' => 'App',
                'label' => 'Installable PWA (icons + offline invites)',
                'done' => $this->pwaReady(),
                'hint' => 'manifest.webmanifest + /icons/icon-192.png + /icons/icon-512.png + sw.js',
            ],
            [
                'id' => 'payments',
                'group' => 'Billing',
                'label' => 'At least one live checkout gateway',
                'done' => $this->paymentsReady(),
                'hint' => 'RAZORPAY_KEY+SECRET (INR) and/or STRIPE_KEY+SECRET (USD) + webhook secrets',
            ],
            [
                'id' => 'legal',
                'group' => 'App',
                'label' => 'Privacy / Terms / Cookies routes live',
                'done' => true,
                'hint' => '/privacy · /terms · /cookies',
            ],
            [
                'id' => 'observability',
                'group' => 'Ops',
                'label' => 'Error monitoring DSN configured',
                'done' => filled(config('services.sentry.dsn')),
                'hint' => 'Set SENTRY_LARAVEL_DSN (optional until you install sentry/sentry-laravel)',
            ],
        ];
    }

    private function paymentsReady(): bool
    {
        $razorpay = filled(config('razorpay.key')) && filled(config('razorpay.secret'));
        $stripe = filled(config('cashier.key')) && filled(config('cashier.secret'));

        return $razorpay || $stripe;
    }

    public function schedulerHeartbeatFresh(int $maxAgeSeconds = 180): bool
    {
        $ts = Cache::get('platform:scheduler_heartbeat');
        if (! is_numeric($ts)) {
            return false;
        }

        return (now()->timestamp - (int) $ts) <= $maxAgeSeconds;
    }

    public function touchSchedulerHeartbeat(): void
    {
        Cache::put('platform:scheduler_heartbeat', now()->timestamp, now()->addDay());
    }

    private function schedulerHint(): string
    {
        $ts = Cache::get('platform:scheduler_heartbeat');
        if (! is_numeric($ts)) {
            return 'No heartbeat yet — run cron: * * * * * php artisan schedule:run';
        }

        $age = max(0, now()->timestamp - (int) $ts);
        if ($age <= 180) {
            return "Heartbeat {$age}s ago — rsvp:remind + host:digest will fire";
        }

        return "Last heartbeat {$age}s ago — cron may have stopped (schedule:run every minute)";
    }

    private function pwaReady(): bool
    {
        return is_file(public_path('manifest.webmanifest'))
            && is_file(public_path('sw.js'))
            && is_file(public_path('icons/icon-192.png'))
            && is_file(public_path('icons/icon-512.png'));
    }

    /**
     * @return array{twilio: array<string, bool>, mailer: string, queue: string, subdomains: array<string, mixed>, checklist: list<array<string, mixed>>}
     */
    public function summary(): array
    {
        $failedJobs = 0;
        $pendingJobs = 0;
        try {
            $failedJobs = (int) DB::table('failed_jobs')->count();
        } catch (\Throwable) {
            // table may be missing before migrate
        }
        if (config('queue.default') === 'database') {
            try {
                $pendingJobs = (int) DB::table('jobs')->count();
            } catch (\Throwable) {
                // ignore
            }
        }

        return [
            'twilio' => $this->twilio->status(),
            'mailer' => (string) config('mail.default'),
            'queue' => (string) config('queue.default'),
            'jobs' => [
                'pending' => $pendingJobs,
                'failed' => $failedJobs,
            ],
            'pending_jobs' => $pendingJobs,
            'failed_jobs' => $failedJobs,
            'subdomains' => [
                'enabled' => InviteHost::enabled(),
                'root' => InviteHost::rootDomain(),
                'example' => InviteHost::enabled()
                    ? 'https://your-event.'.InviteHost::rootDomain()
                    : null,
            ],
            'checklist' => $this->checklist(),
        ];
    }
}
