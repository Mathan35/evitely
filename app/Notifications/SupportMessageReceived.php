<?php

namespace App\Notifications;

use App\Models\SupportMessage;
use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SupportMessageReceived extends Notification implements ShouldQueue
{
    use QueuesMail;

    public function __construct(public SupportMessage $supportMessage) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = $this->supportMessage;
        $app = (string) config('app.name', 'Invidora');

        $mail = (new MailMessage)
            ->subject("[{$app} support] {$message->topicLabel()}")
            ->greeting('New support message')
            ->line("**Topic:** {$message->topicLabel()}")
            ->line("**From:** {$message->name} · {$message->email}")
            ->line('**Message:**')
            ->line($message->message);

        if ($message->page_url) {
            $mail->line("**Page:** {$message->page_url}");
        }

        if ($message->user_id) {
            $mail->line("**Account user ID:** {$message->user_id}");
        }

        $mail->line("**Reference:** #{$message->id}");

        return $this->withPreferredMailer($mail);
    }
}
