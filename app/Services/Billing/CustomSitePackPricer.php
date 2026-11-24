<?php

namespace App\Services\Billing;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class CustomSitePackPricer
{
    public function __construct(private PlanCatalog $catalog) {}

    /**
     * @return array{
     *   days: int,
     *   credits: int,
     *   currency: string,
     *   amount_minor: int,
     *   price_label: string,
     *   starts_on: string,
     *   ends_on: string,
     *   include_credits: bool
     * }
     */
    public function quote(
        CarbonInterface|string $startsOn,
        CarbonInterface|string $endsOn,
        string $currency = 'inr',
        bool $includeCredits = true,
    ): array {
        $currency = strtolower($currency) === 'usd' ? 'usd' : 'inr';
        $includeCredits = (bool) $includeCredits;
        $cfg = config('billing.site_custom', []);
        $min = max(1, (int) ($cfg['min_days'] ?? 8));
        $max = max($min, (int) ($cfg['max_days'] ?? 180));

        $start = Carbon::parse($startsOn)->startOfDay();
        $end = Carbon::parse($endsOn)->startOfDay();
        $today = now()->startOfDay();

        if ($start->lt($today)) {
            throw ValidationException::withMessages([
                'starts_on' => 'From date must be today or a future date.',
            ]);
        }

        if ($end->lt($start)) {
            throw ValidationException::withMessages([
                'ends_on' => 'To date must be on or after the From date.',
            ]);
        }

        $days = (int) $start->diffInDays($end) + 1;

        if ($days < $min) {
            throw ValidationException::withMessages([
                'ends_on' => sprintf('Custom packs need at least %d days.', $min),
            ]);
        }

        if ($days > $max) {
            throw ValidationException::withMessages([
                'ends_on' => sprintf('Custom packs allow at most %d days.', $max),
            ]);
        }

        if ($includeCredits) {
            $daily = $currency === 'usd'
                ? (int) ($cfg['daily_usd_cents'] ?? 75)
                : (int) ($cfg['daily_inr_paise'] ?? 3800);
        } else {
            $daily = $currency === 'usd'
                ? (int) ($cfg['daily_bare_usd_cents'] ?? $cfg['daily_usd_cents'] ?? 75)
                : (int) ($cfg['daily_bare_inr_paise'] ?? $cfg['daily_inr_paise'] ?? 3800);
        }

        $raw = $days * max(1, $daily);
        $floor = $this->undercutFloor($days, $currency, $includeCredits);
        $amount = max($raw, $floor);

        $creditsPerDay = max(0, (float) ($cfg['credits_per_day'] ?? 4));
        $credits = $includeCredits ? (int) floor($days * $creditsPerDay) : 0;

        return [
            'days' => $days,
            'credits' => $credits,
            'currency' => $currency,
            'amount_minor' => $amount,
            'price_label' => $currency === 'usd'
                ? '$'.number_format($amount / 100, $amount % 100 === 0 ? 0 : 2, '.', ',')
                : '₹'.number_format($amount / 100, 0, '.', ','),
            'starts_on' => $start->toDateString(),
            'ends_on' => $end->toDateString(),
            'include_credits' => $includeCredits,
        ];
    }

    private function undercutFloor(int $days, string $currency, bool $includeCredits): int
    {
        $markup = (float) (config('billing.site_custom.undercut_floor_markup') ?? 1.10);
        $best = 0;

        foreach ($this->catalog->sitePacks() as $pack) {
            $packDays = (int) ($pack['days'] ?? 0);
            if ($packDays < 1 || $packDays > $days) {
                continue;
            }
            $offer = $this->catalog->sitePackOffer($pack, $currency, $includeCredits);
            $best = max($best, (int) $offer['amount_minor']);
        }

        return (int) ceil($best * $markup);
    }
}
