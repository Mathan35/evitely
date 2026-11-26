<?php

namespace App\Services\Billing;

use App\Models\BillingPayment;
use App\Models\User;
use App\Models\Wedding;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Cashier\Cashier;

class StripeSiteCheckoutService
{
    public function __construct(
        private PlanCatalog $catalog,
        private BillingService $billing,
        private SiteBillingService $siteBilling,
    ) {}

    public function ready(): bool
    {
        return $this->billing->stripeReady()
            || (filled(config('cashier.secret')) && filled(config('cashier.key')));
    }

    /**
     * @param  array{go_live_mode?: string, scheduled_publish_at?: string|null}  $options
     */
    public function checkoutSitePack(
        User $user,
        Wedding $wedding,
        string $sku,
        string $currency,
        array $options = [],
    ): string {
        $pack = $this->catalog->sitePack($sku);
        if ($pack === null) {
            throw ValidationException::withMessages(['sku' => 'Unknown site pack.']);
        }

        $includeCredits = array_key_exists('include_credits', $options)
            ? (bool) $options['include_credits']
            : true;
        $offer = $this->catalog->sitePackOffer($pack, 'usd', $includeCredits);
        $amount = max(100, (int) ($options['amount_minor'] ?? $offer['amount_minor']));
        $credits = max(0, (int) ($options['credits'] ?? $offer['credits']));
        $currency = 'usd';

        $payment = BillingPayment::query()->create([
            'user_id' => $user->id,
            'event_id' => $wedding->id,
            'provider' => 'stripe',
            'kind' => 'site_pack',
            'sku' => $sku,
            'amount_paise' => $amount,
            'currency' => 'USD',
            'status' => 'created',
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

        return $this->sessionUrl($user, $payment, (string) ($pack['name'] ?? 'Site pack'), $amount);
    }

    /**
     * @param  array{days: int, credits: int, amount_minor: int, starts_on: string, ends_on: string, price_label: string}  $quote
     * @param  array{go_live_mode?: string, currency?: string}  $options
     */
    public function checkoutSiteCustom(User $user, Wedding $wedding, array $quote, array $options = []): string
    {
        $amount = max(100, (int) $quote['amount_minor']);

        $payment = BillingPayment::query()->create([
            'user_id' => $user->id,
            'event_id' => $wedding->id,
            'provider' => 'stripe',
            'kind' => 'site_custom',
            'sku' => 'site_custom',
            'amount_paise' => $amount,
            'currency' => 'USD',
            'status' => 'created',
            'meta' => [
                'event_id' => $wedding->id,
                'days' => $quote['days'],
                'credits' => $quote['credits'],
                'starts_on' => $quote['starts_on'],
                'ends_on' => $quote['ends_on'],
                'go_live_mode' => ($options['go_live_mode'] ?? 'schedule') === 'now' ? 'now' : 'schedule',
                'scheduled_publish_at' => $quote['starts_on'].' 00:00:00',
                'coupon_id' => $options['coupon_id'] ?? null,
                'coupon_discount_minor' => $options['coupon_discount_minor'] ?? 0,
            ],
        ]);

        return $this->sessionUrl($user, $payment, 'Custom site · '.$quote['days'].' days', $amount);
    }

    public function checkoutCredits(User $user, string $packKey, string $currency = 'usd'): string
    {
        $pack = $this->catalog->pack($packKey);
        if ($pack === null) {
            throw ValidationException::withMessages(['pack' => 'Unknown credit pack.']);
        }

        $amount = max(100, (int) ($pack['price_usd_cents'] ?? $pack['price_cents'] ?? 0));

        $payment = BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'stripe',
            'kind' => 'credit_pack',
            'sku' => $packKey,
            'amount_paise' => $amount,
            'currency' => 'USD',
            'status' => 'created',
            'meta' => [
                'pack' => $packKey,
                'credits' => (int) ($pack['credits'] ?? 0),
            ],
        ]);

        return $this->sessionUrl($user, $payment, (string) ($pack['name'] ?? 'Credits'), $amount);
    }

    public function markSessionFailed(string $sessionId, string $reason = 'Checkout failed', string $status = 'failed'): ?BillingPayment
    {
        $payment = BillingPayment::query()->where('stripe_session_id', $sessionId)->first();

        if ($payment === null) {
            $paymentId = null;
            try {
                if (filled(config('cashier.secret'))) {
                    $session = Cashier::stripe()->checkout->sessions->retrieve($sessionId, []);
                    $paymentId = (int) ($session->metadata['billing_payment_id'] ?? 0);
                }
            } catch (\Throwable) {
                $paymentId = null;
            }

            if ($paymentId) {
                $payment = BillingPayment::query()->find($paymentId);
            }
        }

        if ($payment === null || $payment->isPaid()) {
            return $payment;
        }

        $payment->markAttempt($status, [
            'fail_reason' => $reason,
            'stripe_session_id' => $sessionId,
        ]);

        if (blank($payment->stripe_session_id)) {
            $payment->forceFill(['stripe_session_id' => $sessionId])->save();
        }

        return $payment->fresh();
    }

    public function fulfillSession(string $sessionId): ?BillingPayment
    {
        if (! filled(config('cashier.secret'))) {
            return null;
        }

        $stripe = Cashier::stripe();
        $session = $stripe->checkout->sessions->retrieve($sessionId, []);
        if (($session->payment_status ?? '') !== 'paid' && ($session->status ?? '') !== 'complete') {
            if (($session->status ?? '') === 'expired') {
                return $this->markSessionFailed($sessionId, 'Checkout session expired', 'expired');
            }

            return null;
        }

        $paymentId = (int) ($session->metadata['billing_payment_id'] ?? 0);
        $payment = BillingPayment::query()->find($paymentId);
        if ($payment === null || $payment->isPaid()) {
            return $payment;
        }

        $payment->forceFill([
            'status' => 'paid',
            'stripe_session_id' => $sessionId,
            'stripe_payment_intent' => is_string($session->payment_intent ?? null)
                ? $session->payment_intent
                : ($session->payment_intent->id ?? null),
            'paid_at' => now(),
        ])->save();

        $user = User::query()->find($payment->user_id);
        if ($user === null) {
            return $payment;
        }

        $this->applyEntitlements($user, $payment);

        return $payment->fresh();
    }

    public function applyEntitlements(User $user, BillingPayment $payment): void
    {
        if (in_array($payment->kind, ['pack', 'credit_pack'], true)) {
            $credits = (int) (($payment->meta['credits'] ?? null) ?: ($this->catalog->pack($payment->sku)['credits'] ?? 0));
            $this->billing->grantCredits($user, $credits);

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
            'currency' => strtolower((string) $payment->currency) === 'usd' ? 'usd' : 'inr',
            'coupon_id' => $meta['coupon_id'] ?? null,
            'coupon_discount_minor' => $meta['coupon_discount_minor'] ?? 0,
        ];

        if ($payment->kind === 'site_pack') {
            $credits = (int) ($meta['credits'] ?? ($this->catalog->sitePack($payment->sku)['included_credits'] ?? 0));
            $this->siteBilling->fulfillFixedPackPayment($wedding, $user, $payment->sku, $credits, $options);

            return;
        }

        if ($payment->kind === 'site_custom') {
            $this->siteBilling->fulfillCustomPackPayment(
                $wedding,
                $user,
                (string) ($meta['starts_on'] ?? ''),
                (string) ($meta['ends_on'] ?? ''),
                (int) ($meta['credits'] ?? 0),
                $options,
            );
        }
    }

    private function sessionUrl(User $user, BillingPayment $payment, string $name, int $amountUsdCents): string
    {
        if (! filled(config('cashier.secret'))) {
            throw ValidationException::withMessages([
                'payment' => 'Stripe is not configured for USD checkout.',
            ]);
        }

        $success = url('/settings/billing/success').'?session_id={CHECKOUT_SESSION_ID}&event_id='.$payment->event_id;
        $cancel = $payment->event_id
            ? url('/events/'.$payment->event_id.'/billing')
            : url('/settings/billing');

        $session = Cashier::stripe()->checkout->sessions->create([
            'mode' => 'payment',
            'success_url' => $success,
            'cancel_url' => $cancel,
            'customer_email' => $user->email,
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => 'usd',
                    'unit_amount' => $amountUsdCents,
                    'product_data' => [
                        'name' => $name,
                    ],
                ],
            ]],
            'metadata' => [
                'billing_payment_id' => (string) $payment->id,
                'user_id' => (string) $user->id,
                'kind' => $payment->kind,
                'sku' => $payment->sku,
                'event_id' => (string) ($payment->event_id ?? ''),
            ],
        ]);

        $payment->forceFill([
            'stripe_session_id' => $session->id,
        ])->save();

        return (string) $session->url;
    }
}
