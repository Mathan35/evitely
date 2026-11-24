<?php

namespace App\Jobs;

use App\Enums\InvitationDeliveryStatus;
use App\Models\WeddingGuest;
use App\Notifications\InvitationSent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Throwable;

class SendGuestInvitationMail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [30, 120, 300];

    public function __construct(public int $guestId) {}

    public function handle(): void
    {
        $guest = WeddingGuest::query()->with('wedding')->find($this->guestId);
        if ($guest === null || $guest->revoked_at !== null) {
            return;
        }

        $email = trim((string) $guest->email);
        if ($email === '') {
            $guest->forceFill([
                'email_last_error' => 'No email on file',
                'invitation_last_error' => 'No email on file',
                'invitation_last_channel' => 'email',
            ])->save();

            return;
        }

        Notification::route('mail', $email)->notifyNow(new InvitationSent($guest));

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
            'invitation_last_channel' => 'email',
            'email_sent_at' => now(),
            'email_send_count' => (int) $guest->email_send_count + 1,
            'email_last_error' => null,
        ])->save();
    }

    public function failed(?Throwable $exception): void
    {
        $guest = WeddingGuest::query()->find($this->guestId);
        if ($guest === null) {
            return;
        }

        $message = 'Email failed to send';

        Log::warning('Guest invite email job failed', [
            'guest_id' => $guest->id,
            'email' => $guest->email,
            'error' => $exception?->getMessage(),
        ]);

        $guest->forceFill([
            'invitation_last_error' => $message,
            'invitation_last_channel' => 'email',
            'email_last_error' => $message,
        ])->save();
    }
}
