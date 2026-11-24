<?php

namespace App\Notifications;

use App\Models\GuestPhoto;
use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GuestPhotoReceived extends Notification implements ShouldQueue
{
    use QueuesMail;

    public function __construct(public GuestPhoto $photo) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $wedding = $this->photo->wedding;

        return $this->withPreferredMailer(
            (new MailMessage)
                ->subject($this->photo->name.' shared a photo for '.$wedding->displayTitle())
                ->line($this->photo->name.' uploaded a photo to your invitation wall.')
                ->action('Review photos', route('weddings.show', $wedding).'#photos'),
        );
    }
}
