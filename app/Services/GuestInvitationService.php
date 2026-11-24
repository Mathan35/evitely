<?php

namespace App\Services;

use App\Enums\InvitationDeliveryStatus;
use App\Jobs\SendGuestInvitationMail;
use App\Jobs\SendGuestTwilioMessage;
use App\Models\Wedding;
use App\Models\WeddingGuest;

class GuestInvitationService
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(Wedding $wedding, array $attributes): WeddingGuest
    {
        return $wedding->guests()->create([
            ...$attributes,
            'guest_token' => bin2hex(random_bytes(16)),
            'invitation_status' => InvitationDeliveryStatus::Pending,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(WeddingGuest $guest, array $attributes): WeddingGuest
    {
        $guest->update($attributes);

        return $guest;
    }

    public function markViewed(WeddingGuest $guest): void
    {
        if ($guest->revoked_at !== null) {
            return;
        }

        if (in_array($guest->invitation_status, [InvitationDeliveryStatus::Pending, InvitationDeliveryStatus::Sent], true)) {
            $guest->invitation_status = InvitationDeliveryStatus::Viewed;
            $guest->save();
        }
    }

    /**
     * Queue the personal invite email. Delivery status is recorded by SendGuestInvitationMail.
     *
     * @return array{ok: bool, skipped: bool, message: string}
     */
    public function markSent(WeddingGuest $guest): array
    {
        $email = trim((string) $guest->email);
        if ($email === '') {
            return [
                'ok' => false,
                'skipped' => true,
                'message' => 'No email on file',
            ];
        }

        $guest->forceFill([
            'invitation_last_error' => null,
            'email_last_error' => null,
        ])->save();

        SendGuestInvitationMail::dispatch($guest->id);

        return [
            'ok' => true,
            'skipped' => false,
            'message' => 'Invite email queued',
        ];
    }

    /**
     * Record a non-email share (WhatsApp / SMS / copy) as delivered outreach.
     */
    public function markShared(WeddingGuest $guest, string $channel = 'whatsapp'): void
    {
        $channel = in_array($channel, ['whatsapp', 'sms'], true) ? $channel : 'whatsapp';

        if ($guest->invitation_status === InvitationDeliveryStatus::Pending) {
            $guest->invitation_status = InvitationDeliveryStatus::Sent;
        }

        $guest->forceFill([
            'invitation_sent_at' => now(),
            'invitation_send_count' => (int) $guest->invitation_send_count + 1,
            'invitation_last_error' => null,
            'invitation_last_channel' => $channel,
            $channel.'_sent_at' => now(),
            $channel.'_send_count' => (int) $guest->{$channel.'_send_count'} + 1,
            $channel.'_last_error' => null,
        ])->save();
    }

    /**
     * Re-queue failed channel sends for a guest.
     *
     * @return array{ok: bool, skipped: bool, message: string, queued: list<string>}
     */
    public function retryFailed(WeddingGuest $guest, TwilioMessagingService $twilio): array
    {
        $queued = [];

        if (filled($guest->email_last_error) || (
            filled($guest->invitation_last_error)
            && ($guest->invitation_last_channel === 'email' || $guest->invitation_last_channel === null)
            && trim((string) $guest->email) !== ''
            && ! $guest->email_sent_at
        )) {
            $result = $this->markSent($guest);
            if ($result['ok']) {
                $queued[] = 'email';
            }
        }

        if (filled($guest->whatsapp_last_error) || (
            $guest->invitation_last_channel === 'whatsapp' && filled($guest->invitation_last_error)
        )) {
            $result = $this->queueTwilio($guest, 'whatsapp', $twilio);
            if ($result['ok']) {
                $queued[] = 'whatsapp';
            }
        }

        if (filled($guest->sms_last_error) || (
            $guest->invitation_last_channel === 'sms' && filled($guest->invitation_last_error)
        )) {
            $result = $this->queueTwilio($guest, 'sms', $twilio);
            if ($result['ok']) {
                $queued[] = 'sms';
            }
        }

        if ($queued === []) {
            return [
                'ok' => false,
                'skipped' => true,
                'message' => 'Nothing to retry',
                'queued' => [],
            ];
        }

        return [
            'ok' => true,
            'skipped' => false,
            'message' => 'Retry queued',
            'queued' => $queued,
        ];
    }

    /**
     * Queue automated Twilio SMS or WhatsApp for a guest.
     *
     * @param  'sms'|'whatsapp'  $channel
     * @return array{ok: bool, skipped: bool, message: string}
     */
    public function queueTwilio(WeddingGuest $guest, string $channel, TwilioMessagingService $twilio): array
    {
        $channel = $channel === 'whatsapp' ? 'whatsapp' : 'sms';

        if ($channel === 'sms' && ! $twilio->smsReady()) {
            return [
                'ok' => false,
                'skipped' => true,
                'message' => 'Automated SMS is unavailable',
            ];
        }

        if ($channel === 'whatsapp' && ! $twilio->whatsappReady()) {
            return [
                'ok' => false,
                'skipped' => true,
                'message' => 'Automated WhatsApp is unavailable',
            ];
        }

        if ($twilio->e164($guest->country_code, $guest->phone) === null) {
            return [
                'ok' => false,
                'skipped' => true,
                'message' => 'No valid mobile number',
            ];
        }

        $guest->forceFill([
            'invitation_last_error' => null,
            $channel.'_last_error' => null,
        ])->save();

        SendGuestTwilioMessage::dispatch($guest->id, $channel);

        return [
            'ok' => true,
            'skipped' => false,
            'message' => ucfirst($channel).' queued via Twilio',
        ];
    }
}
