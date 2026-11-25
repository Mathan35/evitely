<?php

namespace App\Notifications;

use App\Models\BillingPayment;
use App\Notifications\Concerns\QueuesMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
class PaymentReceipt extends Notification implements ShouldQueue
{
    use QueuesMail;

    public function __construct(public BillingPayment $payment) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $rupees = '₹'.number_format($this->payment->amount_paise / 100, 0, '.', ',');
        $when = $this->payment->paid_at?->timezone(config('app.timezone'))->format('d M Y, g:i A')
            ?? now()->format('d M Y, g:i A');

        $lines = match ($this->payment->kind) {
            'season' => [
                'Thank you for purchasing a Pro wedding-season pass.',
                'Automated Twilio messaging and higher guest limits are now unlocked on your account.',
            ],
            'pack' => [
                'Thank you for buying message credits.',
                sprintf(
                    '%d credits were added to your Invidora account.',
                    (int) ($this->payment->meta['credits'] ?? 0),
                ),
            ],
            default => [
                'Thank you for your payment.',
                'Your Invidora account has been updated.',
            ],
        };

        $mail = (new MailMessage)
            ->subject('Invidora payment receipt — '.$rupees)
            ->greeting('Hi '.($notifiable->name ?? 'there').',')
            ->line($lines[0])
            ->line($lines[1])
            ->line('Amount: '.$rupees)
            ->line('Paid at: '.$when);

        if (filled($this->payment->razorpay_payment_id)) {
            $mail->line('Razorpay payment id: '.$this->payment->razorpay_payment_id);
        }

        return $this->withPreferredMailer(
            $mail
                ->action('Open Billing', route('billing.edit'))
                ->line('Keep this email for your records. Razorpay may also send its own receipt.'),
        );
    }
}
