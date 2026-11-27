<?php

namespace App\Notifications;

use App\Models\WeddingRsvp;
use App\Notifications\Concerns\QueuesMail;
use App\Support\InviteHost;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RsvpThankYou extends Notification implements ShouldQueue
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
        $title = $wedding->displayTitle();
        $status = str_replace('_', ' ', $this->rsvp->status->value);

        $wedding->loadMissing('setting');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $custom = trim((string) ($details['rsvp_thank_you_message'] ?? ''));
        $body = $custom !== ''
            ? strtr($custom, [
                '{{guest_name}}' => (string) $this->rsvp->guest_name,
                '{{title}}' => $title,
                '{{status}}' => $status,
            ])
            : 'Thank you for replying to '.$title.'. We recorded your response as “'.$status.'”.';

        return $this->withPreferredMailer(
            (new MailMessage)
                ->subject('Thank you — we have your RSVP for '.$title)
                ->greeting('Hi '.$this->rsvp->guest_name.',')
                ->line($body)
                ->line('You can reopen your personal invitation anytime with the link below.')
                ->action('Open invitation', InviteHost::publicUrl($wedding->slug)),
        );
    }
}
