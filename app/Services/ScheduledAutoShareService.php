<?php

namespace App\Services;

use App\Jobs\DispatchScheduledAutoShare;
use App\Models\ScheduledAutoShare;
use App\Models\ScheduledAutoShareRecipient;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Notifications\SiteBillingAlert;
use App\Services\Billing\BillingService;
use App\Services\Billing\SiteBillingService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ScheduledAutoShareService
{
    public function __construct(
        private BillingService $billing,
        private GuestInvitationService $guests,
        private TwilioMessagingService $twilio,
    ) {}

    /**
     * @param  array{
     *     enabled?: bool,
     *     channel_mode?: string,
     *     guest_ids?: list<int|string>,
     *     new_contacts?: list<array{first_name?: string, last_name?: string, email?: string|null, phone?: string|null, country_code?: string|null}>,
     *     scheduled_for?: Carbon|\DateTimeInterface|string|null
     * }  $payload
     */
    public function upsertPending(Wedding $wedding, User $user, array $payload): ?ScheduledAutoShare
    {
        $enabled = (bool) ($payload['enabled'] ?? false);
        if (! $enabled) {
            $this->cancelPending($wedding);

            return null;
        }

        $state = app(SiteBillingService::class)->state($wedding);
        if (! $state->hasPaidPack && ! $state->legacyAccountPro && ! $state->canSchedulePublish) {
            throw ValidationException::withMessages([
                'auto_share' => 'Pay for a site pack before scheduling auto-share.',
            ]);
        }

        $channelMode = $this->normalizeChannelMode((string) ($payload['channel_mode'] ?? 'smart'));
        $guestIds = collect($payload['guest_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values();

        $newContacts = array_values($payload['new_contacts'] ?? []);
        $adding = count($newContacts);
        if ($adding > 0) {
            $this->billing->assertCanAddGuests($user, $wedding, $adding);
        }

        return DB::transaction(function () use ($wedding, $user, $channelMode, $guestIds, $newContacts, $payload): ScheduledAutoShare {
            $this->cancelPending($wedding, refund: true);

            $createdIds = [];
            foreach ($newContacts as $contact) {
                $first = trim((string) ($contact['first_name'] ?? ''));
                $email = trim((string) ($contact['email'] ?? ''));
                $phone = trim((string) ($contact['phone'] ?? ''));
                if ($first === '' && $email === '' && $phone === '') {
                    continue;
                }
                if ($first === '') {
                    $first = $email !== '' ? strstr($email, '@', true) ?: 'Guest' : 'Guest';
                }

                $guest = $this->guests->create($wedding, [
                    'first_name' => $first,
                    'last_name' => trim((string) ($contact['last_name'] ?? '')) ?: null,
                    'email' => $email !== '' ? $email : null,
                    'phone' => $phone !== '' ? $phone : null,
                    'country_code' => trim((string) ($contact['country_code'] ?? '')) ?: null,
                ]);
                $createdIds[] = $guest->id;
            }

            $allIds = $guestIds->merge($createdIds)->unique()->values();
            $guests = $wedding->guests()->whereIn('id', $allIds)->get();
            if ($guests->isEmpty()) {
                throw ValidationException::withMessages([
                    'auto_share' => 'Pick at least one guest or add a contact for auto-share.',
                ]);
            }

            $creditsNeeded = $this->estimateCredits($guests, $channelMode);
            if ($creditsNeeded > 0 && ! $this->billing->consumeCredits($user, $creditsNeeded)) {
                throw ValidationException::withMessages([
                    'auto_share' => 'Not enough message credits to reserve this auto-share. Buy credits or remove phone recipients.',
                ]);
            }

            $scheduledFor = isset($payload['scheduled_for']) && $payload['scheduled_for']
                ? Carbon::parse($payload['scheduled_for'])
                : $wedding->scheduled_publish_at;

            $share = ScheduledAutoShare::query()->create([
                'event_id' => $wedding->id,
                'enabled' => true,
                'status' => 'pending',
                'channel_mode' => $channelMode,
                'reserved_credits' => $creditsNeeded,
                'spent_credits' => 0,
                'scheduled_for' => $scheduledFor,
            ]);

            foreach ($guests as $guest) {
                ScheduledAutoShareRecipient::query()->create([
                    'scheduled_auto_share_id' => $share->id,
                    'event_guest_id' => $guest->id,
                    'send_status' => 'pending',
                ]);
            }

            $this->setInviteDeliveryMode($wedding, 'automated');

            return $share->load('recipients');
        });
    }

    public function cancelPending(Wedding $wedding, bool $refund = true): void
    {
        $run = function () use ($wedding, $refund): void {
            $pending = ScheduledAutoShare::query()
                ->where('event_id', $wedding->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->get();

            foreach ($pending as $share) {
                if ($refund) {
                    $this->refundUnused($share);
                }
                $share->forceFill([
                    'enabled' => false,
                    'status' => 'cancelled',
                    'finished_at' => now(),
                ])->save();
            }
        };

        if (DB::transactionLevel() > 0) {
            $run();

            return;
        }

        DB::transaction($run);
    }

    public function refundUnusedCredits(ScheduledAutoShare $share): void
    {
        $this->refundUnused($share);
    }

    public function dispatchPending(Wedding $wedding): void
    {
        $share = ScheduledAutoShare::query()
            ->where('event_id', $wedding->id)
            ->where('status', 'pending')
            ->where('enabled', true)
            ->latest('id')
            ->first();

        if ($share === null) {
            return;
        }

        DispatchScheduledAutoShare::dispatch($share->id);
    }

    public function run(ScheduledAutoShare $share): void
    {
        $share->refresh();
        if ($share->status !== 'pending' || ! $share->enabled) {
            return;
        }

        $share->forceFill([
            'status' => 'running',
            'started_at' => now(),
            'last_error' => null,
        ])->save();

        $wedding = $share->wedding()->with('user')->first();
        $user = $wedding?->user;
        if ($wedding === null || $user === null) {
            $share->forceFill([
                'status' => 'failed',
                'finished_at' => now(),
                'last_error' => 'Event owner missing',
            ])->save();
            $this->refundUnused($share);

            return;
        }

        $recipients = $share->recipients()->with('guest')->get();
        $queued = 0;
        $failed = 0;
        $skipped = 0;
        $spent = 0;
        $reserveLeft = (int) $share->reserved_credits;

        foreach ($recipients as $recipient) {
            /** @var ScheduledAutoShareRecipient $recipient */
            $guest = $recipient->guest;
            if ($guest === null || $guest->revoked_at !== null) {
                $recipient->forceFill([
                    'send_status' => 'skipped',
                    'error' => 'Guest missing',
                ])->save();
                $skipped++;

                continue;
            }

            $channel = $this->resolveChannel($guest, $share->channel_mode, $recipient->channel_override);
            if ($channel === null) {
                $recipient->forceFill([
                    'send_status' => 'skipped',
                    'error' => 'No matching channel for this guest',
                ])->save();
                $skipped++;

                continue;
            }

            $needsCredit = in_array($channel, ['whatsapp', 'sms'], true);
            if ($needsCredit) {
                if ($reserveLeft < 1) {
                    $recipient->forceFill([
                        'send_status' => 'failed',
                        'resolved_channel' => $channel,
                        'error' => 'Out of reserved credits',
                    ])->save();
                    $failed++;

                    continue;
                }
                $reserveLeft--;
                $spent++;
            }

            $result = $channel === 'email'
                ? $this->guests->markSent($guest)
                : $this->guests->queueTwilio($guest, $channel, $this->twilio);

            if ($result['ok']) {
                $recipient->forceFill([
                    'send_status' => 'queued',
                    'resolved_channel' => $channel,
                    'error' => null,
                ])->save();
                $queued++;
            } else {
                if ($needsCredit) {
                    $reserveLeft++;
                    $spent = max(0, $spent - 1);
                }
                $recipient->forceFill([
                    'send_status' => $result['skipped'] ?? false ? 'skipped' : 'failed',
                    'resolved_channel' => $channel,
                    'error' => $result['message'] ?? 'Send failed',
                ])->save();
                if ($result['skipped'] ?? false) {
                    $skipped++;
                } else {
                    $failed++;
                }
            }
        }

        $share->forceFill([
            'spent_credits' => $spent,
            'reserved_credits' => max((int) $share->reserved_credits, $spent),
        ])->save();

        $this->refundUnused($share->fresh());

        $status = match (true) {
            $queued > 0 && $failed === 0 && $skipped === 0 => 'completed',
            $queued > 0 => 'partial',
            $failed > 0 => 'failed',
            default => 'completed',
        };

        $share->forceFill([
            'status' => $status,
            'finished_at' => now(),
            'last_error' => $failed > 0
                ? "{$failed} recipient(s) failed, {$queued} queued, {$skipped} skipped"
                : null,
        ])->save();

        $user->notify(new SiteBillingAlert(
            $wedding,
            'auto_share_done',
            $queued > 0
                ? "Auto-share for \"{$wedding->title}\" queued {$queued} invite(s)".($failed > 0 ? " ({$failed} failed)" : '').'.'
                : "Auto-share for \"{$wedding->title}\" finished with no sends ({$skipped} skipped).",
        ));
    }

    /**
     * @param  \Illuminate\Support\Collection<int, WeddingGuest>|iterable<WeddingGuest>  $guests
     */
    public function estimateCredits(iterable $guests, string $channelMode): int
    {
        $mode = $this->normalizeChannelMode($channelMode);
        $count = 0;

        foreach ($guests as $guest) {
            $channel = $this->estimateChannel($guest, $mode);
            if (in_array($channel, ['whatsapp', 'sms'], true)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function pendingSummary(Wedding $wedding): ?array
    {
        $share = ScheduledAutoShare::query()
            ->with(['recipients.guest'])
            ->where('event_id', $wedding->id)
            ->where('status', 'pending')
            ->where('enabled', true)
            ->latest('id')
            ->first();

        if ($share === null) {
            return null;
        }

        return [
            'id' => $share->id,
            'channel_mode' => $share->channel_mode,
            'reserved_credits' => (int) $share->reserved_credits,
            'scheduled_for' => $share->scheduled_for?->toIso8601String(),
            'guest_ids' => $share->recipients->pluck('event_guest_id')->values()->all(),
            'recipient_count' => $share->recipients->count(),
        ];
    }

    public function resolveChannel(
        WeddingGuest $guest,
        string $channelMode,
        ?string $override = null,
    ): ?string {
        $mode = $override
            ? $this->normalizeForcedChannel($override)
            : $this->normalizeChannelMode($channelMode);

        if ($mode !== 'smart') {
            return $this->channelAvailable($guest, $mode) ? $mode : null;
        }

        foreach (['whatsapp', 'sms', 'email'] as $channel) {
            if ($this->channelAvailable($guest, $channel)) {
                return $channel;
            }
        }

        return null;
    }

    private function estimateChannel(WeddingGuest $guest, string $mode): ?string
    {
        if ($mode !== 'smart') {
            return $this->hasContactFor($guest, $mode) ? $mode : null;
        }

        if ($this->hasContactFor($guest, 'whatsapp')) {
            return 'whatsapp';
        }
        if ($this->hasContactFor($guest, 'sms')) {
            return 'sms';
        }
        if ($this->hasContactFor($guest, 'email')) {
            return 'email';
        }

        return null;
    }

    private function channelAvailable(WeddingGuest $guest, string $channel): bool
    {
        if (! $this->hasContactFor($guest, $channel)) {
            return false;
        }

        return match ($channel) {
            'whatsapp' => $this->twilio->whatsappReady(),
            'sms' => $this->twilio->smsReady(),
            'email' => true,
            default => false,
        };
    }

    private function hasContactFor(WeddingGuest $guest, string $channel): bool
    {
        return match ($channel) {
            'whatsapp', 'sms' => $this->twilio->e164($guest->country_code, $guest->phone) !== null,
            'email' => trim((string) $guest->email) !== '',
            default => false,
        };
    }

    private function refundUnused(ScheduledAutoShare $share): void
    {
        $unused = max(0, (int) $share->reserved_credits - (int) $share->spent_credits);
        if ($unused < 1) {
            return;
        }

        $user = $share->wedding?->user;
        if ($user === null) {
            $user = Wedding::query()->with('user')->find($share->event_id)?->user;
        }
        if ($user === null) {
            return;
        }

        $this->billing->grantCredits($user, $unused);
        $share->forceFill([
            'reserved_credits' => (int) $share->spent_credits,
        ])->save();
    }

    private function setInviteDeliveryMode(Wedding $wedding, string $mode): void
    {
        $setting = $wedding->setting()->firstOrCreate([]);
        $details = is_array($setting->details) ? $setting->details : [];
        $details['invite_delivery_mode'] = $mode;
        $setting->details = $details;
        $setting->save();
    }

    private function normalizeChannelMode(string $mode): string
    {
        $mode = strtolower(trim($mode));

        return in_array($mode, ['smart', 'whatsapp', 'sms', 'email'], true) ? $mode : 'smart';
    }

    private function normalizeForcedChannel(string $mode): string
    {
        $mode = strtolower(trim($mode));

        return in_array($mode, ['whatsapp', 'sms', 'email'], true) ? $mode : 'email';
    }
}
