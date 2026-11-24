<?php

namespace App\Notifications;

use App\Models\WeddingGuest;
use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Personal invite email. Prefer SendGuestInvitationMail (notifyNow) so delivery
 * status is recorded after a successful send; still queueable if used directly.
 */
class InvitationSent extends Notification implements ShouldQueue
{
    use QueuesMail;

    public function __construct(public WeddingGuest $guest) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $wedding = $this->guest->wedding()->with(['eventType'])->first() ?? $this->guest->wedding;
        $url = route('weddings.guest', [
            'slug' => $wedding->slug,
            'token' => $this->guest->guest_token,
        ]);
        $name = trim($this->guest->first_name) ?: 'there';
        $title = $wedding->displayTitle();
        $when = $wedding->starts_on?->format('j F Y');
        $place = collect([$wedding->venue_name, $wedding->city])->filter()->implode(', ');

        $mail = (new MailMessage)
            ->subject('You are invited — '.$title)
            ->greeting('Dear '.$name.',')
            ->line('Your personal invitation to '.$title.' is ready.');

        if ($when) {
            $mail->line('Date: '.$when);
        }
        if ($place !== '') {
            $mail->line('Place: '.$place);
        }

        return $this->withPreferredMailer(
            $mail
                ->action('Open your invitation', $url)
                ->line('This link is personal to you — please do not forward it.'),
        );
    }
}
