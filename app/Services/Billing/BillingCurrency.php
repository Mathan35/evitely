<?php

namespace App\Services\Billing;

use App\Models\User;
use Illuminate\Http\Request;

class BillingCurrency
{
    public function forRequest(?Request $request = null, ?User $user = null): string
    {
        $request ??= request();

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

        // India → INR / Razorpay. Everywhere else with a known country → USD / Stripe.
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
        $currency = strtolower($currency);

        if ($currency === 'inr') {
            return (string) config('billing.gateways.in', 'razorpay');
        }

        return (string) config('billing.gateways.global', 'stripe');
    }

    public function symbol(string $currency): string
    {
        return strtolower($currency) === 'inr' ? '₹' : '$';
    }

    public function gatewayLabel(string $gateway): string
    {
        return match (strtolower($gateway)) {
            'razorpay' => 'Razorpay',
            'stripe' => 'Stripe',
            'local' => 'Local',
            default => ucfirst($gateway),
        };
    }
}
