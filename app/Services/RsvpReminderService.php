<?php

namespace App\Services;

use App\Enums\RsvpStatus;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Notifications\RsvpReminder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Throwable;

class RsvpReminderService
{
    /**
     * @return array{sent: int, skipped: int, failed: int, cooldown: int}
     */
    public function sendForWedding(Wedding $wedding, bool $force = false): array
    {
        $sent = 0;
        $skipped = 0;
        $failed = 0;
        $cooldown = 0;

        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $cooldownDays = max(1, (int) ($details['rsvp_reminder_cooldown_days'] ?? 3));
        $maxSends = max(1, (int) ($details['rsvp_reminder_max'] ?? 2));
        $daysBefore = isset($details['rsvp_reminder_days_before'])
            ? (int) $details['rsvp_reminder_days_before']
            : null;

        // Auto window: only send once we are inside [starts_on - N days, starts_on).
        if (! $force && $daysBefore !== null && $daysBefore > 0 && $wedding->starts_on) {
            $starts = Carbon::parse($wedding->starts_on)->startOfDay();
            $windowStart = $starts->copy()->subDays($daysBefore);
            $today = now()->startOfDay();
            if ($today->lt($windowStart) || $today->gte($starts)) {
                return ['sent' => 0, 'skipped' => 0, 'failed' => 0, 'cooldown' => 0];
            }
        }

        $guests = $wedding->guests()
            ->where('rsvp_status', RsvpStatus::Pending)
            ->get();

        foreach ($guests as $guest) {
            $email = trim((string) $guest->email);
            if ($email === '') {
                $skipped++;

                continue;
            }

            if (! $force && ! $this->withinPolicy($guest, $cooldownDays, $maxSends)) {
                $cooldown++;

                continue;
            }

            try {
                // notifyNow so reminder counters only bump after a real send attempt
                Notification::route('mail', $email)->notifyNow(new RsvpReminder($guest));
                $guest->forceFill([
                    'reminder_sent_at' => now(),
                    'reminder_send_count' => (int) $guest->reminder_send_count + 1,
                    'reminder_last_error' => null,
                ])->save();
                $sent++;
            } catch (Throwable $exception) {
                $failed++;
                $guest->forceFill([
                    'reminder_last_error' => mb_substr($exception->getMessage(), 0, 255),
                ])->save();
                Log::warning('RSVP reminder failed', [
                    'guest_id' => $guest->id,
                    'event_id' => $wedding->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return compact('sent', 'skipped', 'failed', 'cooldown');
    }

    public function remindersEnabled(Wedding $wedding): bool
    {
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $raw = strtolower(trim((string) ($details['rsvp_reminders_enabled'] ?? '')));

        return $raw !== '' && $raw !== '0' && $raw !== 'false' && $raw !== 'off';
    }

    private function withinPolicy(WeddingGuest $guest, int $cooldownDays, int $maxSends): bool
    {
        if ((int) $guest->reminder_send_count >= $maxSends) {
            return false;
        }

        if ($guest->reminder_sent_at) {
            $sentAt = $guest->reminder_sent_at instanceof Carbon
                ? $guest->reminder_sent_at
                : Carbon::parse($guest->reminder_sent_at);

            if ($sentAt->greaterThan(now()->subDays($cooldownDays))) {
                return false;
            }
        }

        return true;
    }
}
