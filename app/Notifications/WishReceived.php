<?php

namespace App\Notifications;

use App\Models\GuestbookEntry;
use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class WishReceived extends Notification implements ShouldQueue
{
    use QueuesMail;

    public function __construct(public GuestbookEntry $entry) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $wedding = $this->entry->wedding;

        return $this->withPreferredMailer(
            (new MailMessage)
                ->subject($this->entry->name.' left a wish for '.$wedding->displayTitle())
                ->line($this->entry->name.' wrote a guestbook message awaiting your review.')
                ->line('"'.Str::limit($this->entry->message, 140).'"')
                ->action('Review wishes', route('weddings.show', $wedding).'?tab=wishes'),
        );
    }
}
