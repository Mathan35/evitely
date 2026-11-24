<?php

namespace App\Notifications\Concerns;

use App\Services\TwilioMessagingService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Shared queue settings for outbound guest / host mail.
 * Prefers Twilio SendGrid when configured.
 */
trait QueuesMail
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [30, 120, 300];

    protected function withPreferredMailer(MailMessage $mail): MailMessage
    {
        $mailer = app(TwilioMessagingService::class)->preferredMailer();
        if ($mailer) {
            $mail->mailer($mailer);
        }

        return $mail;
    }
}
