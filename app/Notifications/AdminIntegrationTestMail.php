<?php

namespace App\Notifications;

use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminIntegrationTestMail extends Notification implements ShouldQueue
{
    use QueuesMail;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->withPreferredMailer(
            (new MailMessage)
                ->subject('Admin integration test')
                ->line('This is a safe test message from the owner admin Integrations hub.')
                ->line('If you received this, outbound mail is working for this environment.'),
        );
    }
}
