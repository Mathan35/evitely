<?php

namespace App\Notifications;

use App\Models\WeddingGuest;
use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RsvpReminder extends Notification implements ShouldQueue
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
        $wedding = $this->guest->wedding;

        return $this->withPreferredMailer(
            (new MailMessage)
                ->subject('A reminder from '.$wedding->displayTitle())
                ->line('We would love to know if you can join us.')
                ->action('Reply', route('weddings.guest', [
                    'slug' => $wedding->slug,
                    'token' => $this->guest->guest_token,
                ])),
        );
    }
}
