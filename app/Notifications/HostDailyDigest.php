<?php

namespace App\Notifications;

use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HostDailyDigest extends Notification implements ShouldQueue
{
    use QueuesMail;

    /**
     * @param  array{
     *     total: int,
     *     since: string,
     *     events: list<array{id: int, title: string, rsvps: int, wishes: int, photos: int, url: string}>
     * }  $digest
     */
    public function __construct(public array $digest) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Evitely digest — '.$this->digest['total'].' new guest update'.($this->digest['total'] === 1 ? '' : 's'))
            ->greeting('Hi '.($notifiable->name ?? 'there').',')
            ->line('Here’s what happened on your events since yesterday:');

        foreach ($this->digest['events'] as $event) {
            $bits = [];
            if ($event['rsvps'] > 0) {
                $bits[] = $event['rsvps'].' RSVP'.($event['rsvps'] === 1 ? '' : 's');
            }
            if ($event['wishes'] > 0) {
                $bits[] = $event['wishes'].' wish'.($event['wishes'] === 1 ? '' : 'es');
            }
            if ($event['photos'] > 0) {
                $bits[] = $event['photos'].' photo'.($event['photos'] === 1 ? '' : 's');
            }
            $mail->line('• '.$event['title'].' — '.implode(', ', $bits));
        }

        $firstUrl = $this->digest['events'][0]['url'] ?? url('/dashboard');

        return $this->withPreferredMailer(
            $mail->action('Open studio', $firstUrl)
                ->line('You’re receiving this because host digests are on. Configure delivery keys in Settings → Ops.'),
        );
    }
}
