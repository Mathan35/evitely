<?php

namespace App\Notifications;

use App\Models\EventCollaborator;
use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CollaboratorInvite extends Notification implements ShouldQueue
{
    use QueuesMail;

    public function __construct(public EventCollaborator $collaborator) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $wedding = $this->collaborator->wedding;
        $url = route('collaborators.accept', $this->collaborator->invite_token);

        return $this->withPreferredMailer(
            (new MailMessage)
                ->subject('You\'re invited to co-host '.$wedding->displayTitle())
                ->line('You\'ve been invited to help manage this invitation as a '.$this->collaborator->role.'.')
                ->action('Accept invitation', $url)
                ->line('If you don\'t have an Invidora account yet, create one with this email first, then open the link again.'),
        );
    }
}
