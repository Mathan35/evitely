<?php

namespace App\Notifications;

use App\Models\WeddingRsvp;
use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RsvpReceived extends Notification implements ShouldQueue
{
    use QueuesMail;

    public function __construct(public WeddingRsvp $rsvp) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $wedding = $this->rsvp->wedding;

        return $this->withPreferredMailer(
            (new MailMessage)
                ->subject($this->rsvp->guest_name.' replied to '.$wedding->displayTitle())
                ->line($this->rsvp->guest_name.' marked '.$this->rsvp->status->value.'.')
                ->action('Open the wedding', route('weddings.show', $wedding)),
        );
    }
}
