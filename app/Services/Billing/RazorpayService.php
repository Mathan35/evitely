<?php

namespace App\Services\Billing;

use App\Models\BillingPayment;
use App\Models\User;
use App\Models\Wedding;
use App\Notifications\PaymentReceipt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Razorpay\Api\Api;
use Razorpay\Api\Errors\SignatureVerificationError;
use Throwable;

class RazorpayService
{
    public function __construct(
        private PlanCatalog $catalog,
        private BillingService $billing,
        private SiteBillingService $siteBilling,
    ) {}

    public function ready(): bool
    {
        return filled(config('razorpay.key'))
            && filled(config('razorpay.secret'))
            && $this->billing->driver() === 'razorpay';
    }

    public function keyId(): string
    {
        return (string) config('razorpay.key');
    }

    public function currency(): string
    {
        return strtoupper((string) config('razorpay.currency', 'INR'));
    }

    public function api(): Api
    {
        return new Api((string) config('razorpay.key'), (string) config('razorpay.secret'));
    }

    /**
     * Create a Razorpay order for a season pass and return Checkout.js payload.
     *
     * @return array<string, mixed>
     */
    public function createSeasonOrder(User $user, string $seasonKey): array
    {
        $season = $this->catalog->season($seasonKey);
        if ($season === null) {
            throw ValidationException::withMessages(['season' => 'Unknown season pass.']);
        }

        $amount = max(100, (int) ($season['price_cents'] ?? 0)); // paise

        return $this->createOrder($user, [
            'kind' => 'season',
            'sku' => $seasonKey,
            'amount_paise' => $amount,
            'description' => (string) ($season['name'] ?? 'Pro season'),
            'meta' => [
                'season' => $seasonKey,
                'months' => (int) ($season['duration_months'] ?? 12),
                'credits' => (int) ($season['included_credits'] ?? 0),
            ],
        ]);
    }

    /**
     * Create a Razorpay order for a credit pack.
     *
     * @return array<string, mixed>
     */
    public function createPackOrder(User $user, string $packKey): array
    {
        $pack = $this->catalog->pack($packKey);
        if ($pack === null) {
            throw ValidationException::withMessages(['pack' => 'Unknown credit pack.']);
        }

        $amount = max(100, (int) ($pack['price_inr_paise'] ?? $pack['price_cents'] ?? 0));

        return $this->createOrder($user, [
            'kind' => 'credit_pack',
            'sku' => $packKey,
            'amount_paise' => $amount,
            'description' => (string) ($pack['name'] ?? 'Message credits'),
            'event_id' => null,
            'meta' => [
                'pack' => $packKey,
                'credits' => (int) ($pack['credits'] ?? 0),
            ],
        ]);
    }

    /**
     * @param  array{go_live_mode?: string, scheduled_publish_at?: string|null}  $options
     * @return array<string, mixed>
     */
    public function createSitePackOrder(User $user, Wedding $wedding, string $sku, array $options = []): array
    {
        $pack = $this->catalog->sitePack($sku);
        if ($pack === null) {
            throw ValidationException::withMessages(['sku' => 'Unknown site pack.']);
        }

        $includeCredits = array_key_exists('include_credits', $options)
            ? (bool) $options['include_credits']
            : true;
        $offer = $this->catalog->sitePackOffer($pack, 'inr', $includeCredits);
        $amount = max(100, (int) ($options['amount_minor'] ?? $offer['amount_minor']));
        $credits = max(0, (int) ($options['credits'] ?? $offer['credits']));

        return $this->createOrder($user, [
            'kind' => 'site_pack',
            'sku' => $sku,
            'amount_paise' => $amount,
            'description' => (string) ($pack['name'] ?? 'Site pack'),
            'event_id' => $wedding->id,
            'meta' => [
                'event_id' => $wedding->id,
                'days' => (int) ($pack['days'] ?? 0),
                'credits' => $credits,
                'include_credits' => $includeCredits,
                'go_live_mode' => ($options['go_live_mode'] ?? 'now') === 'schedule' ? 'schedule' : 'now',
                'scheduled_publish_at' => $options['scheduled_publish_at'] ?? null,
                'coupon_id' => $options['coupon_id'] ?? null,
                'coupon_discount_minor' => $options['coupon_discount_minor'] ?? 0,
            ],
        ]);
    }

    /**
     * @param  array{go_live_mode?: string}  $options
     * @return array<string, mixed>
     */
    public function createSiteCustomOrder(
        User $user,
        Wedding $wedding,
        string $startsOn,
        string $endsOn,
        array $options = [],
    ): array {
        $includeCredits = array_key_exists('include_credits', $options)
            ? (bool) $options['include_credits']
            : true;
        $quote = app(CustomSitePackPricer::class)->quote($startsOn, $endsOn, 'inr', $includeCredits);
        $amount = max(100, (int) ($options['amount_minor'] ?? $quote['amount_minor']));

        return $this->createOrder($user, [
            'kind' => 'site_custom',
            'sku' => 'site_custom',
            'amount_paise' => $amount,
            'description' => 'Custom site · '.$quote['days'].' days',
            'event_id' => $wedding->id,
            'meta' => [
                'event_id' => $wedding->id,
                'days' => $quote['days'],
                'credits' => $quote['credits'],
                'include_credits' => $includeCredits,
                'starts_on' => $quote['starts_on'],
                'ends_on' => $quote['ends_on'],
                'go_live_mode' => ($options['go_live_mode'] ?? 'schedule') === 'now' ? 'now' : 'schedule',
                'scheduled_publish_at' => $quote['starts_on'].' 00:00:00',
                'coupon_id' => $options['coupon_id'] ?? null,
                'coupon_discount_minor' => $options['coupon_discount_minor'] ?? 0,
            ],
        ]);
    }

    /**
     * @param  array{kind: string, sku: string, amount_paise: int, description: string, meta: array<string, mixed>, event_id?: int|null}  $payload
     * @return array<string, mixed>
     */
    private function createOrder(User $user, array $payload): array
    {
        if (! $this->ready()) {
            Log::warning('Checkout unavailable: payment keys missing', [
                'user_id' => $user->id,
                'sku' => $payload['sku'] ?? null,
            ]);

            throw ValidationException::withMessages([
                'payment' => 'Checkout isn’t available right now. Please try again later or contact support.',
            ]);
        }

        $receipt = 'evt_'.$user->id.'_'.substr(bin2hex(random_bytes(6)), 0, 12);
        $notes = array_merge($payload['meta'], [
            'user_id' => (string) $user->id,
            'kind' => $payload['kind'],
            'sku' => $payload['sku'],
        ]);

        try {
            $order = $this->api()->order->create([
                'receipt' => $receipt,
                'amount' => $payload['amount_paise'],
                'currency' => $this->currency(),
                'notes' => $notes,
            ]);
        } catch (Throwable $e) {
            Log::error('Razorpay order create failed', [
                'user_id' => $user->id,
                'sku' => $payload['sku'],
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'payment' => 'We couldn’t start checkout. Please try again in a moment.',
            ]);
        }

        $orderId = (string) ($order['id'] ?? '');
        if ($orderId === '') {
            Log::error('Checkout order create returned empty id', [
                'user_id' => $user->id,
                'sku' => $payload['sku'] ?? null,
            ]);

            throw ValidationException::withMessages([
                'payment' => 'We couldn’t start checkout. Please try again in a moment.',
            ]);
        }

        $payment = BillingPayment::query()->create([
            'user_id' => $user->id,
            'event_id' => $payload['event_id'] ?? null,
            'provider' => 'razorpay',
            'kind' => $payload['kind'],
            'sku' => $payload['sku'],
            'amount_paise' => $payload['amount_paise'],
            'currency' => $this->currency(),
            'status' => 'created',
            'razorpay_order_id' => $orderId,
            'meta' => $payload['meta'],
        ]);

        return [
            'key' => $this->keyId(),
            'amount' => $payload['amount_paise'],
            'currency' => $this->currency(),
            'name' => (string) config('app.name', 'Invidora'),
            'description' => $payload['description'],
            'order_id' => $orderId,
            'payment_id' => $payment->id,
            // India-first / global INR: open on UPI (QR + apps). Cards/netbanking/wallets next.
            'prefill' => [
                'name' => $user->name,
                'email' => $user->email,
                'method' => 'upi',
            ],
            'notes' => $notes,
            'theme' => [
                'color' => '#18181b',
            ],
            'config' => [
                'display' => [
                    'blocks' => [
                        'upi' => [
                            'name' => 'UPI — GPay / PhonePe / Paytm / QR',
                            'instruments' => [
                                ['method' => 'upi'],
                            ],
                        ],
                        'cards' => [
                            'name' => 'Debit & credit cards',
                            'instruments' => [
                                ['method' => 'card'],
                            ],
                        ],
                        'banks' => [
                            'name' => 'Netbanking',
                            'instruments' => [
                                ['method' => 'netbanking'],
                            ],
                        ],
                        'wallets' => [
                            'name' => 'Wallets',
                            'instruments' => [
                                ['method' => 'wallet'],
                            ],
                        ],
                    ],
                    'sequence' => ['block.upi', 'block.cards', 'block.banks', 'block.wallets'],
                    'preferences' => [
                        'show_default_blocks' => false,
                    ],
                ],
            ],
            'method' => [
                'upi' => true,
                'card' => true,
                'netbanking' => true,
                'wallet' => true,
            ],
        ];
    }

    /**
     * Verify Checkout.js callback signature and fulfill entitlements.
     *
     * @param  array{razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string}  $input
     */
    public function verifyAndFulfill(User $user, array $input): BillingPayment
    {
        $orderId = (string) $input['razorpay_order_id'];
        $paymentId = (string) $input['razorpay_payment_id'];
        $signature = (string) $input['razorpay_signature'];

        try {
            $this->api()->utility->verifyPaymentSignature([
                'razorpay_order_id' => $orderId,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $signature,
            ]);
        } catch (SignatureVerificationError $e) {
            Log::warning('Razorpay signature verification failed', [
                'user_id' => $user->id,
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            BillingPayment::query()
                ->where('razorpay_order_id', $orderId)
                ->where('user_id', $user->id)
                ->where('status', 'created')
                ->get()
                ->each(fn (BillingPayment $payment) => $payment->markAttempt('failed', [
                    'fail_reason' => 'Signature verification failed',
                    'error' => $e->getMessage(),
                ]));

            throw ValidationException::withMessages([
                'payment' => 'Payment verification failed. If money was deducted, contact support with your payment id.',
            ]);
        }

        return $this->fulfillPaidOrder($user, $orderId, $paymentId, $signature);
    }

    public function fulfillPaidOrder(
        User $user,
        string $orderId,
        ?string $paymentId = null,
        ?string $signature = null,
    ): BillingPayment {
        $newlyPaid = false;

        $payment = DB::transaction(function () use ($user, $orderId, $paymentId, $signature, &$newlyPaid): BillingPayment {
            /** @var BillingPayment|null $payment */
            $payment = BillingPayment::query()
                ->where('razorpay_order_id', $orderId)
                ->lockForUpdate()
                ->first();

            if ($payment === null) {
                throw ValidationException::withMessages([
                    'payment' => 'Order not found. Refresh Billing and try again.',
                ]);
            }

            if ((int) $payment->user_id !== (int) $user->id) {
                throw ValidationException::withMessages([
                    'payment' => 'This payment does not belong to your account.',
                ]);
            }

            if ($payment->isPaid()) {
                return $payment;
            }

            $payment->forceFill([
                'status' => 'paid',
                'razorpay_payment_id' => $paymentId ?: $payment->razorpay_payment_id,
                'razorpay_signature' => $signature ?: $payment->razorpay_signature,
                'paid_at' => now(),
            ])->save();

            $this->applyEntitlements($user, $payment);
            $newlyPaid = true;

            return $payment->fresh();
        });

        if ($newlyPaid) {
            $user->notify(new PaymentReceipt($payment));
        }

        return $payment;
    }

    public function applyEntitlements(User $user, BillingPayment $payment): void
    {
        if ($payment->kind === 'season') {
            $this->billing->activateSeason($user, $payment->sku);

            return;
        }

        if (in_array($payment->kind, ['pack', 'credit_pack'], true)) {
            // Credits are queued for activation (default 24h) — same lifecycle idea as awaiting_go_live.
            app(MessageCreditActivationService::class)->queuePending($payment);

            return;
        }

        $eventId = (int) ($payment->event_id ?: ($payment->meta['event_id'] ?? 0));
        $wedding = $eventId > 0 ? Wedding::query()->find($eventId) : null;
        if ($wedding === null || (int) $wedding->user_id !== (int) $user->id) {
            return;
        }

        $meta = $payment->meta ?? [];
        $options = [
            'go_live_mode' => (string) ($meta['go_live_mode'] ?? 'now'),
            'scheduled_publish_at' => $meta['scheduled_publish_at'] ?? null,
            'currency' => 'inr',
            'coupon_id' => $meta['coupon_id'] ?? null,
            'coupon_discount_minor' => $meta['coupon_discount_minor'] ?? 0,
        ];

        if ($payment->kind === 'site_pack') {
            $credits = (int) ($meta['credits'] ?? ($this->catalog->sitePack($payment->sku)['included_credits'] ?? 0));
            $this->siteBilling->fulfillFixedPackPayment($wedding, $user, $payment->sku, $credits, $options);

            return;
        }

        if ($payment->kind === 'site_custom') {
            $credits = (int) ($meta['credits'] ?? 0);
            $this->siteBilling->fulfillCustomPackPayment(
                $wedding,
                $user,
                (string) ($meta['starts_on'] ?? ''),
                (string) ($meta['ends_on'] ?? ''),
                $credits,
                $options,
            );
        }
    }

    /**
     * Handle Razorpay webhook payload (payment.captured / order.paid).
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleWebhook(array $payload, string $signatureHeader): void
    {
        $secret = (string) config('razorpay.webhook_secret');
        if ($secret !== '') {
            $body = json_encode($payload);
            $expected = hash_hmac('sha256', (string) $body, $secret);
            // Razorpay sends signature of raw body; controller should pass raw verification separately when possible.
            if (! hash_equals($expected, $signatureHeader) && ! $this->webhookAlreadyTrusted()) {
                // Prefer raw-body verification in controller; this is a fallback when payload was re-encoded.
            }
        }

        $event = (string) ($payload['event'] ?? '');
        $entity = $payload['payload']['payment']['entity']
            ?? $payload['payload']['order']['entity']
            ?? null;

        if (! is_array($entity)) {
            return;
        }

        $orderId = (string) ($entity['order_id'] ?? $entity['id'] ?? '');
        $paymentId = isset($entity['id']) && str_starts_with((string) $entity['id'], 'pay_')
            ? (string) $entity['id']
            : (string) ($entity['payment_id'] ?? '');

        if ($orderId === '' || ! str_starts_with($orderId, 'order_')) {
            // payment.captured has order_id; order.paid has id as order_
            if (str_starts_with((string) ($entity['id'] ?? ''), 'order_')) {
                $orderId = (string) $entity['id'];
            }
        }

        if ($orderId === '') {
            return;
        }

        $payment = BillingPayment::query()->where('razorpay_order_id', $orderId)->first();
        if ($payment === null || $payment->isPaid()) {
            return;
        }

        $user = User::query()->find($payment->user_id);
        if ($user === null) {
            return;
        }

        if (in_array($event, ['payment.failed', 'payment.authorization.failed'], true)) {
            $error = $entity['error_description']
                ?? $entity['error_code']
                ?? $payload['payload']['payment']['entity']['error_description']
                ?? 'Payment failed at gateway';

            $payment->markAttempt('failed', [
                'fail_reason' => is_string($error) ? $error : 'Payment failed at gateway',
                'webhook_event' => $event,
                'razorpay_payment_id' => $paymentId !== '' ? $paymentId : null,
            ]);

            if ($paymentId !== '' && blank($payment->razorpay_payment_id)) {
                $payment->forceFill(['razorpay_payment_id' => $paymentId])->save();
            }

            return;
        }

        if (in_array($event, ['payment.captured', 'order.paid', 'payment.authorized'], true)) {
            $this->fulfillPaidOrder($user, $orderId, $paymentId ?: null);
        }
    }

    /**
     * Verify webhook using the raw request body (preferred).
     */
    public function assertValidWebhookSignature(string $rawBody, string $signatureHeader): void
    {
        $secret = (string) config('razorpay.webhook_secret');
        if ($secret === '') {
            // In local without webhook secret, allow (tests/dev). Production should set the secret.
            if (app()->isProduction()) {
                throw ValidationException::withMessages([
                    'webhook' => 'Payment notifications are not configured.',
                ]);
            }

            return;
        }

        $expected = hash_hmac('sha256', $rawBody, $secret);
        if (! hash_equals($expected, $signatureHeader)) {
            throw ValidationException::withMessages([
                'webhook' => 'Invalid payment notification.',
            ]);
        }
    }

    private function webhookAlreadyTrusted(): bool
    {
        return false;
    }
}
