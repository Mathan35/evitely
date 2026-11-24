<?php

namespace App\Services\Billing;

class PlanCatalog
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public function plans(): array
    {
        return config('billing.plans', []);
    }

    /**
     * @return array<string, mixed>
     */
    public function plan(string $key): array
    {
        $plans = $this->plans();
        $key = strtolower(trim($key));

        return $plans[$key] ?? $plans['free'] ?? [
            'name' => 'Free',
            'guest_limit' => 75,
            'co_host_limit' => 1,
            'monthly_credits' => 0,
            'automated_messaging' => false,
            'features' => [],
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function seasons(): array
    {
        return config('billing.seasons', []);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function season(string $key): ?array
    {
        $seasons = $this->seasons();

        return $seasons[$key] ?? null;
    }

    public function defaultSeasonKey(): string
    {
        foreach ($this->seasons() as $key => $season) {
            if (! empty($season['popular'])) {
                return (string) $key;
            }
        }

        $keys = array_keys($this->seasons());

        return (string) ($keys[0] ?? 'pro_season_12');
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function packs(): array
    {
        $credit = config('billing.credit_packs', []);
        $legacy = config('billing.packs', []);

        return $credit !== [] ? $credit + $legacy : $legacy;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function pack(string $key): ?array
    {
        $packs = $this->packs();

        return $packs[$key] ?? null;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function sitePacks(): array
    {
        return config('billing.site_packs', []);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function sitePack(string $key): ?array
    {
        $packs = $this->sitePacks();

        return $packs[$key] ?? null;
    }

    /**
     * Resolve site-only vs site+credits pricing for a fixed pack.
     *
     * @param  array<string, mixed>  $pack
     * @return array{amount_minor: int, price_label: string, credits: int, include_credits: bool}
     */
    public function sitePackOffer(array $pack, string $currency = 'inr', bool $includeCredits = true): array
    {
        $currency = strtolower($currency) === 'usd' ? 'usd' : 'inr';
        $includeCredits = (bool) $includeCredits;

        if ($currency === 'usd') {
            $amount = $includeCredits
                ? (int) ($pack['price_usd_cents'] ?? 0)
                : (int) ($pack['price_bare_usd_cents'] ?? $pack['price_usd_cents'] ?? 0);
            $label = $includeCredits
                ? (string) ($pack['price_label_usd'] ?? '$'.number_format($amount / 100, $amount % 100 === 0 ? 0 : 2))
                : (string) ($pack['price_label_bare_usd'] ?? '$'.number_format($amount / 100, $amount % 100 === 0 ? 0 : 2));
        } else {
            $amount = $includeCredits
                ? (int) ($pack['price_inr_paise'] ?? 0)
                : (int) ($pack['price_bare_inr_paise'] ?? $pack['price_inr_paise'] ?? 0);
            $label = $includeCredits
                ? (string) ($pack['price_label_inr'] ?? '₹'.number_format($amount / 100, 0, '.', ','))
                : (string) ($pack['price_label_bare_inr'] ?? '₹'.number_format($amount / 100, 0, '.', ','));
        }

        return [
            'amount_minor' => max(0, $amount),
            'price_label' => $label,
            'credits' => $includeCredits ? max(0, (int) ($pack['included_credits'] ?? 0)) : 0,
            'include_credits' => $includeCredits,
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function creditPacks(): array
    {
        $packs = config('billing.credit_packs', []);

        return $packs !== [] ? $packs : $this->packs();
    }

    public function guestLimit(string $plan): int
    {
        return max(1, (int) ($this->plan($plan)['guest_limit'] ?? 75));
    }

    public function coHostLimit(string $plan): int
    {
        return max(0, (int) ($this->plan($plan)['co_host_limit'] ?? 1));
    }

    /**
     * Max owned events for a plan. Null = unlimited.
     */
    public function eventLimit(string $plan): ?int
    {
        $raw = $this->plan($plan)['event_limit'] ?? null;
        if ($raw === null || $raw === '') {
            return null;
        }

        $limit = (int) $raw;

        return $limit > 0 ? $limit : null;
    }

    public function monthlyCredits(string $plan): int
    {
        return max(0, (int) ($this->plan($plan)['monthly_credits'] ?? 0));
    }

    public function allowsAutomated(string $plan): bool
    {
        return (bool) ($this->plan($plan)['automated_messaging'] ?? false);
    }
}
