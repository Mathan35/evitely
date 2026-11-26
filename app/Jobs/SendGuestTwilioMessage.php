<?php

namespace App\Jobs;

use App\Enums\InvitationDeliveryStatus;
use App\Models\WeddingGuest;
use App\Services\TwilioMessagingService;
use App\Support\ShareMessageFactory;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendGuestTwilioMessage implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [30, 120, 300];

    /**
     * @param  'sms'|'whatsapp'  $channel
     */
    public function __construct(
        public int $guestId,
        public string $channel,
    ) {}

    public function handle(TwilioMessagingService $twilio): void
    {
        $channel = $this->channel === 'whatsapp' ? 'whatsapp' : 'sms';
        $guest = WeddingGuest::query()->with(['wedding.eventType'])->find($this->guestId);
        if ($guest === null || $guest->revoked_at !== null) {
            return;
        }

        $to = $twilio->e164($guest->country_code, $guest->phone);
        if ($to === null) {
            $message = 'Valid mobile number required';
            $guest->forceFill([
                'invitation_last_error' => $message,
                'invitation_last_channel' => $channel,
                $channel.'_last_error' => $message,
            ])->save();

            return;
        }

        $wedding = $guest->wedding;
        $body = ShareMessageFactory::guestText($wedding, $guest);

        if ($channel === 'whatsapp') {
            $twilio->sendWhatsApp($to, $body);
        } else {
            $twilio->sendSms($to, $body);
        }

        if (in_array($guest->invitation_status, [
            InvitationDeliveryStatus::Pending,
            InvitationDeliveryStatus::Sent,
        ], true)) {
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

    public function failed(?Throwable $exception): void
    {
        $channel = $this->channel === 'whatsapp' ? 'whatsapp' : 'sms';
        $guest = WeddingGuest::query()->find($this->guestId);
        if ($guest === null) {
            return;
        }

        $message = ucfirst($channel).' failed to send';

        Log::warning('Twilio invite message failed', [
            'guest_id' => $guest->id,
            'channel' => $channel,
            'error' => $exception?->getMessage(),
        ]);

        $guest->forceFill([
            'invitation_last_error' => $message,
            'invitation_last_channel' => $channel,
            $channel.'_last_error' => $message,
        ])->save();
    }
}
