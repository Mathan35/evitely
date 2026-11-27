<?php

namespace App\Console\Commands;

use App\Models\BillingExpiryNotification;
use App\Models\Wedding;
use App\Notifications\SiteBillingAlert;
use App\Services\Billing\MessageCreditActivationService;
use App\Services\Billing\SiteBillingService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class BillingSiteLifecycleCommand extends Command
{
    protected $signature = 'billing:site-lifecycle';

    protected $description = 'Auto-publish scheduled sites, activate due message packs, expire packs/trials, and send billing reminders';

    public function handle(SiteBillingService $siteBilling, MessageCreditActivationService $messageCredits): int
    {
        $activated = $siteBilling->activateDueSchedules();
        $creditsActivated = $messageCredits->activateDue();
        $expired = $siteBilling->markExpiredIfNeeded();
        $reminders = $this->sendReminders();

        $this->info("activated={$activated} message_credits={$creditsActivated} expired={$expired} reminders={$reminders}");

        return self::SUCCESS;
    }

    private function sendReminders(): int
    {
        $sent = 0;

        Wedding::query()
            ->with('user')
            ->whereIn('site_billing_status', ['trial', 'paid', 'awaiting_go_live'])
            ->orderBy('id')
            ->chunkById(100, function ($rows) use (&$sent): void {
                foreach ($rows as $wedding) {
                    /** @var Wedding $wedding */
                    $sent += $this->remindWedding($wedding);
                }
            });

        return $sent;
    }

    private function remindWedding(Wedding $wedding): int
    {
        $n = 0;
        $user = $wedding->user;
        if ($user === null) {
            return 0;
        }

        if ($wedding->site_billing_status === 'trial' && $wedding->site_trial_ends_at) {
            $n += $this->maybeNotify($wedding, $user, $wedding->site_trial_ends_at, [
                3 => 'trial_3d',
                1 => 'trial_1d',
                0 => 'trial_expired',
            ], 'Your free site trial');
        }

        if ($wedding->site_billing_status === 'paid' && $wedding->site_pack_ends_at) {
            $n += $this->maybeNotify($wedding, $user, $wedding->site_pack_ends_at, [
                7 => 'pack_7d',
                3 => 'pack_3d',
                1 => 'pack_1d',
                0 => 'pack_expired',
            ], 'Your site plan');
        }

        if (
            $wedding->site_billing_status === 'awaiting_go_live'
            && $wedding->scheduled_publish_status === 'pending'
            && $wedding->scheduled_publish_at
        ) {
            $n += $this->maybeNotify($wedding, $user, $wedding->scheduled_publish_at, [
                3 => 'schedule_3d',
                1 => 'schedule_1d',
            ], 'Scheduled publish');
        }

        if ($wedding->scheduled_publish_status === 'failed') {
            $n += $this->notifyOnce($wedding, $user, 'schedule_publish_failed', 'Scheduled publish failed — open studio to publish manually or retry.');
        }

        return $n;
    }

    /**
     * @param  array<int, string>  $map daysLeft => kind
     */
    private function maybeNotify(Wedding $wedding, $user, Carbon $at, array $map, string $label): int
    {
        $daysLeft = (int) now()->startOfDay()->diffInDays($at->copy()->startOfDay(), false);
        if ($daysLeft < 0) {
            $daysLeft = 0;
        }

        if (! isset($map[$daysLeft])) {
            return 0;
        }

        $kind = $map[$daysLeft];
        $message = match ($kind) {
            'trial_3d', 'pack_7d', 'pack_3d', 'schedule_3d' => "{$label} for \"{$wedding->title}\" is in {$daysLeft} day(s).",
            'trial_1d', 'pack_1d', 'schedule_1d' => "{$label} for \"{$wedding->title}\" is tomorrow.",
            'trial_expired', 'pack_expired' => "{$label} for \"{$wedding->title}\" has ended.",
            default => "{$label} update for \"{$wedding->title}\".",
        };

        return $this->notifyOnce($wedding, $user, $kind, $message);
    }

    private function notifyOnce(Wedding $wedding, $user, string $kind, string $message): int
    {
        $exists = BillingExpiryNotification::query()
            ->where('event_id', $wedding->id)
            ->where('kind', $kind)
            ->exists();

        if ($exists) {
            return 0;
        }

        BillingExpiryNotification::query()->create([
            'event_id' => $wedding->id,
            'kind' => $kind,
            'sent_at' => now(),
        ]);

        $user->notify(new SiteBillingAlert($wedding, $kind, $message));

        return 1;
    }
}
