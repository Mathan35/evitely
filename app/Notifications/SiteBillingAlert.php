<?php

namespace App\Notifications;

use App\Models\Wedding;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SiteBillingAlert extends Notification
{
    use Queueable;

    public function __construct(
        public Wedding $wedding,
        public string $kind,
        public string $message,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = url('/events/'.$this->wedding->id.'/billing');

        return (new MailMessage)
            ->subject('Evitely · '.$this->wedding->title)
            ->line($this->message)
            ->action('Manage site plan', $url)
            ->line('Thank you for using Evitely.');
    }
}
