<?php

namespace App\Console\Commands;

use App\Models\Wedding;
use App\Services\Billing\SiteBillingService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class BillingSetSiteCommand extends Command
{
    protected $signature = 'billing:set-site
        {event : Event id}
        {action : trial|expired|clear|site_15|site_30|site_50|site_100|custom}
        {--from= : Custom starts_on Y-m-d}
        {--to= : Custom ends_on Y-m-d}';

    protected $description = 'Ops: set site billing state for an event';

    public function handle(SiteBillingService $siteBilling): int
    {
        $wedding = Wedding::query()->findOrFail((int) $this->argument('event'));
        $action = (string) $this->argument('action');
        $user = $wedding->user;

        if ($user === null) {
            $this->error('Event has no owner.');

            return self::FAILURE;
        }

        match ($action) {
            'clear' => $wedding->forceFill([
                'site_billing_status' => 'draft_ready',
                'site_pack_sku' => null,
                'site_pack_days' => null,
                'site_pack_paid_at' => null,
                'site_pack_starts_at' => null,
                'site_pack_ends_at' => null,
                'site_trial_started_at' => null,
                'site_trial_ends_at' => null,
                'scheduled_publish_at' => null,
                'scheduled_publish_status' => 'none',
            ])->save(),
            'trial' => $wedding->forceFill([
                'site_billing_status' => 'trial',
                'site_trial_started_at' => now(),
                'site_trial_ends_at' => now()->addDays((int) config('billing.trial_days', 30)),
            ])->save(),
            'expired' => $wedding->forceFill(['site_billing_status' => 'expired'])->save(),
            'site_15', 'site_30', 'site_50', 'site_100' => $siteBilling->fulfillFixedPackPayment(
                $wedding,
                $user,
                $action,
                (int) (config("billing.site_packs.{$action}.included_credits") ?? 0),
                ['go_live_mode' => 'now'],
            ),
            'custom' => $siteBilling->fulfillCustomPackPayment(
                $wedding,
                $user,
                (string) ($this->option('from') ?: now()->toDateString()),
                (string) ($this->option('to') ?: now()->addDays(30)->toDateString()),
                100,
                ['go_live_mode' => 'now', 'currency' => 'inr'],
            ),
            default => null,
        };

        if (! in_array($action, ['clear', 'trial', 'expired', 'site_15', 'site_30', 'site_50', 'site_100', 'custom'], true)) {
            $this->error('Unknown action.');

            return self::FAILURE;
        }

        $this->info('status='.$wedding->fresh()->site_billing_status);

        return self::SUCCESS;
    }
}
