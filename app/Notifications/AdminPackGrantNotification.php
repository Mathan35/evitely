<?php

namespace App\Notifications;

use App\Models\Wedding;
use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminPackGrantNotification extends Notification implements ShouldQueue
{
    use QueuesMail;

    public function __construct(
        public Wedding $wedding,
        public string $sitePackSku,
        public string $sitePackName,
        public ?string $creditPackSku,
        public ?string $creditPackName,
        public int $messageCredits,
        public string $pricing,
        public bool $createdUser,
        public ?string $note = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $pricingLabel = match ($this->pricing) {
            'paid' => 'recorded as paid',
            'complimentary' => 'complimentary',
            default => 'free',
        };

        $mail = (new MailMessage)
            ->subject('Your Invidora site pack is ready')
            ->greeting('Hi '.($notifiable->name ?? 'there').',')
            ->line('An Invidora admin assigned a site pack to your account ('.$pricingLabel.').')
            ->line('Event: '.$this->wedding->displayTitle())
            ->line('Site pack: '.$this->sitePackName);

        if ($this->creditPackName) {
            $mail->line('Message pack: '.$this->creditPackName);
        }

        if ($this->messageCredits > 0) {
            $mail->line($this->messageCredits.' message credits are active on your wallet now.');
        }

        if (filled($this->note)) {
            $mail->line('Note: '.$this->note);
        }

        if ($this->createdUser) {
            $mail->line('Your account was created for you. Use the password reset email (sent separately) to set a password, then sign in.');
        }

        return $this->withPreferredMailer(
            $mail
                ->action('Open event billing', url('/events/'.$this->wedding->id.'/billing'))
                ->line('You can manage the site from Studio after you sign in.'),
        );
    }
}
