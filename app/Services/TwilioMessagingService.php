<?php

namespace App\Services;

use RuntimeException;
use Twilio\Rest\Client;

class TwilioMessagingService
{
    public function configured(): bool
    {
        return $this->emailReady() || $this->smsReady() || $this->whatsappReady();
    }

    public function emailReady(): bool
    {
        return $this->sendgridApiKey() !== '';
    }

    public function smsReady(): bool
    {
        return $this->accountSid() !== ''
            && $this->authToken() !== ''
            && $this->smsFrom() !== '';
    }

    public function whatsappReady(): bool
    {
        return $this->accountSid() !== ''
            && $this->authToken() !== ''
            && $this->whatsappFrom() !== '';
    }

    /**
     * Prefer Twilio SendGrid when configured, otherwise Resend, else app default.
     */
    public function preferredMailer(): ?string
    {
        if ($this->emailReady()) {
            return 'twilio_email';
        }

        if (trim((string) config('services.resend.key')) !== '') {
            return 'resend';
        }

        return null;
    }

    /**
     * @return array{
     *     configured: bool,
     *     email: bool,
     *     sms: bool,
     *     whatsapp: bool,
     *     hints: array{email: string, sms: string, whatsapp: string}
     * }
     */
    public function status(): array
    {
        return [
            'configured' => $this->configured(),
            'email' => $this->emailReady() || trim((string) config('services.resend.key')) !== '' || config('mail.default') !== 'log',
            'sms' => $this->smsReady(),
            'whatsapp' => $this->whatsappReady(),
            'hints' => [
                'email' => $this->emailReady()
                    ? 'SendGrid connected'
                    : (trim((string) config('services.resend.key')) !== ''
                        ? 'Resend connected'
                        : 'Add TWILIO_SENDGRID_API_KEY or RESEND_API_KEY'),
                'sms' => $this->smsReady()
                    ? 'SMS sender ready'
                    : 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM',
                'whatsapp' => $this->whatsappReady()
                    ? 'WhatsApp sender ready (sandbox or approved Business)'
                    : 'Set TWILIO_WHATSAPP_FROM after Twilio WhatsApp sandbox / Business approval',
            ],
        ];
    }

    public function sendSms(string $toE164, string $body): string
    {
        if (! $this->smsReady()) {
            throw new RuntimeException('Automated SMS is temporarily unavailable.');
        }

        $message = $this->client()->messages->create($toE164, [
            'from' => $this->smsFrom(),
            'body' => $body,
        ]);

        return (string) $message->sid;
    }

    public function sendWhatsApp(string $toE164, string $body): string
    {
        if (! $this->whatsappReady()) {
            throw new RuntimeException('Automated WhatsApp is temporarily unavailable.');
        }

        $to = str_starts_with($toE164, 'whatsapp:') ? $toE164 : 'whatsapp:'.$toE164;
        $from = $this->whatsappFrom();
        if (! str_starts_with($from, 'whatsapp:')) {
            $from = 'whatsapp:'.$from;
        }

        $message = $this->client()->messages->create($to, [
            'from' => $from,
            'body' => $body,
        ]);

        return (string) $message->sid;
    }

    public function e164(?string $countryCode, ?string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', ($countryCode ?? '').($phone ?? '')) ?: '';
        if (strlen($digits) < 8) {
            return null;
        }

        return '+'.$digits;
    }

    private function client(): Client
    {
        return new Client($this->accountSid(), $this->authToken());
    }

    private function accountSid(): string
    {
        return trim((string) config('services.twilio.account_sid'));
    }

    private function authToken(): string
    {
        return trim((string) config('services.twilio.auth_token'));
    }

    private function smsFrom(): string
    {
        return trim((string) config('services.twilio.sms_from'));
    }

    private function whatsappFrom(): string
    {
        return trim((string) config('services.twilio.whatsapp_from'));
    }

    private function sendgridApiKey(): string
    {
        return trim((string) (
            config('services.twilio.sendgrid_api_key')
            ?: config('services.sendgrid.key')
        ));
    }
}
