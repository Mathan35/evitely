<?php

namespace App\Services\Billing;

use App\Models\User;
use Illuminate\Http\Request;

class BillingCurrency
{
    public function forRequest(?Request $request = null, ?User $user = null): string
    {
        $request ??= request();

        // Razorpay-only mode charges INR worldwide (international cards still work).
        if (! $this->stripeEnabled()) {
            return 'inr';
        }

        $pref = strtolower(trim((string) ($user?->billing_currency_pref ?? '')));
        if (in_array($pref, ['inr', 'usd'], true)) {
            return $pref;
        }

        $explicit = strtolower(trim((string) $request->query('currency', $request->input('currency', ''))));
        if (in_array($explicit, ['inr', 'usd'], true)) {
            return $explicit;
        }

        $country = strtoupper(trim((string) (
            $request->header('CF-IPCountry')
            ?: $request->header('X-Vercel-IP-Country')
            ?: $request->header('X-Country-Code')
            ?: $user?->billing_region
            ?: ''
        )));

        // India → INR. Elsewhere → USD only when Stripe is enabled.
        if ($country === 'IN') {
            return 'inr';
        }

        if ($country !== '' && $country !== 'XX') {
            return 'usd';
        }

        if ($user && str_starts_with((string) ($user->phone ?? ''), '+91')) {
            return 'inr';
        }

        $lang = strtolower((string) $request->header('Accept-Language', ''));
        if (
            str_contains($lang, 'en-in')
            || str_contains($lang, 'hi-in')
            || str_contains($lang, 'hi,')
            || str_starts_with($lang, 'hi')
        ) {
            return 'inr';
        }

        // Unknown geo (local/dev): honor BILLING_CURRENCY, default INR for India-first product.
        $fallback = strtolower(trim((string) config('billing.currency', 'inr')));

        return in_array($fallback, ['inr', 'usd'], true) ? $fallback : 'inr';
    }

    public function gatewayForCurrency(string $currency): string
    {
        if (! $this->stripeEnabled()) {
            return (string) config('billing.gateways.in', 'razorpay');
        }

        $currency = strtolower($currency);

        if ($currency === 'inr') {
            return (string) config('billing.gateways.in', 'razorpay');
        }

        return (string) config('billing.gateways.global', 'razorpay');
    }

    /**
     * Checkout currency while Stripe is disabled is always INR (Razorpay worldwide).
     */
    public function normalizeCheckoutCurrency(?string $currency): string
    {
        if (! $this->stripeEnabled()) {
            return 'inr';
        }

        $currency = strtolower(trim((string) $currency));

        return in_array($currency, ['inr', 'usd'], true) ? $currency : 'inr';
    }

    public function stripeEnabled(): bool
    {
        return (bool) config('billing.stripe_enabled', false);
    }

    public function symbol(string $currency): string
    {
        return strtolower($currency) === 'inr' ? '₹' : '$';
    }

    public function gatewayLabel(string $gateway): string
    {
        // Host-facing label — never expose third-party processor brand names.
        return match (strtolower($gateway)) {
            'razorpay', 'stripe' => 'Secure checkout',
            'local' => 'Local checkout',
            default => 'Secure checkout',
        };
    }
}
