<?php

namespace App\Services\Billing;

use App\Models\User;
use App\Models\Wedding;
use App\Services\WeddingPublishingService;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class SiteBillingService
{
    public function __construct(
        private BillingService $billing,
        private PlanCatalog $catalog,
        private CustomSitePackPricer $customPricer,
    ) {}

    public function isSiteMode(Wedding $wedding): bool
    {
        return in_array($wedding->invitation_mode, ['link', 'both'], true);
    }

    public function isCardOnly(Wedding $wedding): bool
    {
        return $wedding->invitation_mode === 'card';
    }

    public function ensureDraftReady(Wedding $wedding): void
    {
        if ($this->isCardOnly($wedding)) {
            if ($wedding->site_billing_status !== 'none') {
                $wedding->forceFill(['site_billing_status' => 'none'])->save();
            }

            return;
        }

        if (in_array($wedding->site_billing_status, [null, '', 'none'], true)) {
            $wedding->forceFill(['site_billing_status' => 'draft_ready'])->save();
        }
    }

    public function legacyAccountPro(User $user): bool
    {
        return $this->billing->isPro($user);
    }

    public function state(Wedding $wedding): SiteBillingState
    {
        $wedding->refresh();
        $user = $wedding->user;
        $legacy = $user ? $this->legacyAccountPro($user) : false;
        $isCard = $this->isCardOnly($wedding);
        $isSite = $this->isSiteMode($wedding);
        $status = (string) ($wedding->site_billing_status ?: ($isCard ? 'none' : 'draft_ready'));

        // Lazy expire
        $status = $this->normalizeStatus($wedding, $status, $legacy);

        $paidActive = $status === 'paid' || ($legacy && $isSite && ! in_array($status, ['expired'], true) && $wedding->isPublic());
        if ($legacy && $isSite && in_array($status, ['draft_ready', 'trial', 'awaiting_go_live', 'none'], true)) {
            // Grandfather: treat as paid-equivalent for entitlements while account Pro is active.
            $paidActive = true;
        }

        $awaiting = $status === 'awaiting_go_live';
        $trial = $status === 'trial';
        $expired = $status === 'expired';

        // Free / trial sites stay on basic features even in draft — paid or legacy unlock the full set.
        $features = $paidActive || $awaiting || $legacy
            ? (array) config('billing.paid.features', [])
            : (array) config('billing.trial.features', []);

        $guestLimit = $paidActive
            ? (int) config('billing.paid.guest_limit', 500)
            : (int) config('billing.trial.guest_limit', 100);

        $coHostLimit = $paidActive
            ? (int) config('billing.paid.co_host_limit', 5)
            : (int) config('billing.trial.co_host_limit', 1);

        $canAutomate = ($paidActive && ! $awaiting && $status === 'paid') || ($legacy && $paidActive && $status !== 'awaiting_go_live');
        if ($legacy && $status !== 'awaiting_go_live') {
            $canAutomate = true;
        }
        if ($status === 'paid') {
            $canAutomate = true;
        }
        if (in_array($status, ['trial', 'awaiting_go_live', 'expired', 'draft_ready'], true) && ! $legacy) {
            $canAutomate = false;
        }
        if ($legacy && $status === 'awaiting_go_live') {
            $canAutomate = false;
        }

        $hasPaidPack = filled($wedding->site_pack_paid_at) || filled($wedding->site_pack_sku) || $legacy;
        $canSchedule = $isSite && ($status === 'awaiting_go_live' || ($legacy && ! $wedding->isPublic())) && $hasPaidPack;

        $canEdit = ! $expired;
        if ($expired) {
            $canEdit = false;
        }

        $canPremium = $paidActive || $awaiting || $legacy;

        return new SiteBillingState(
            status: $status,
            isCardOnly: $isCard,
            isSite: $isSite,
            canEdit: $isCard || $canEdit,
            canUsePremium: $isCard || $canPremium,
            canAutomate: $isSite && $canAutomate,
            canSchedulePublish: $canSchedule || ($legacy && $isSite && ! $wedding->isPublic()),
            isPublicLive: $wedding->isPublic() && ! $expired,
            isViewOnly: $expired || ($wedding->isPublic() && $status === 'expired'),
            isScheduled: $status === 'awaiting_go_live' && $wedding->scheduled_publish_status === 'pending',
            hasPaidPack: $hasPaidPack,
            legacyAccountPro: $legacy,
            guestLimit: $isCard ? 500 : $guestLimit,
            coHostLimit: $isCard ? 5 : $coHostLimit,
            packSku: $wedding->site_pack_sku,
            packDays: $wedding->site_pack_days !== null ? (int) $wedding->site_pack_days : null,
            trialEndsAt: $wedding->site_trial_ends_at,
            packStartsAt: $wedding->site_pack_starts_at,
            packEndsAt: $wedding->site_pack_ends_at,
            scheduledPublishAt: $wedding->scheduled_publish_at,
            scheduledPublishStatus: (string) ($wedding->scheduled_publish_status ?: 'none'),
            customStartsOn: $wedding->site_custom_starts_on?->toDateString(),
            customEndsOn: $wedding->site_custom_ends_on?->toDateString(),
            features: $features,
            upgradeUrl: '/events/'.$wedding->id.'/billing',
        );
    }

    private function normalizeStatus(Wedding $wedding, string $status, bool $legacy): string
    {
        if ($this->isCardOnly($wedding)) {
            return 'none';
        }

        if ($status === 'trial' && $wedding->site_trial_ends_at && $wedding->site_trial_ends_at->isPast()) {
            $wedding->forceFill(['site_billing_status' => 'expired'])->save();

            return 'expired';
        }

        if ($status === 'paid' && $wedding->site_pack_ends_at && $wedding->site_pack_ends_at->isPast()) {
            $wedding->forceFill(['site_billing_status' => 'expired'])->save();

            return 'expired';
        }

        return $status ?: 'draft_ready';
    }

    /**
     * Called from WeddingPublishingService after status=published.
     */
    public function handleAfterPublish(Wedding $wedding): void
    {
        if ($this->isCardOnly($wedding)) {
            return;
        }

        $status = (string) ($wedding->site_billing_status ?: 'draft_ready');

        if ($status === 'paid') {
            return;
        }

        if ($status === 'awaiting_go_live' || filled($wedding->site_pack_paid_at) || filled($wedding->site_pack_sku)) {
            $this->activateGoLive($wedding, alreadyPublished: true);

            return;
        }

        if ($this->legacyAccountPro($wedding->user)) {
            $wedding->forceFill([
                'site_billing_status' => 'paid',
                'site_pack_starts_at' => now(),
                'site_pack_ends_at' => $wedding->user?->plan_ends_at,
                'site_pack_sku' => $wedding->site_pack_sku ?: 'legacy_pro',
                'scheduled_publish_status' => 'published',
            ])->save();

            return;
        }

        if (in_array($status, ['trial', 'expired'], true)) {
            return;
        }

        $days = max(1, (int) config('billing.trial_days', 30));
        $wedding->forceFill([
            'site_billing_status' => 'trial',
            'site_trial_started_at' => now(),
            'site_trial_ends_at' => now()->addDays($days),
        ])->save();
    }

    /** @deprecated Use handleAfterPublish */
    public function startTrialOnImmediatePublish(Wedding $wedding): void
    {
        $this->handleAfterPublish($wedding);
    }

    /**
     * @param  array{go_live_mode?: string, scheduled_publish_at?: string|null, currency?: string}  $options
     */
    public function fulfillFixedPackPayment(Wedding $wedding, User $user, string $sku, int $credits, array $options = []): void
    {
        $pack = $this->catalog->sitePack($sku);
        if ($pack === null) {
            throw ValidationException::withMessages(['sku' => 'Unknown site pack.']);
        }

        $days = (int) ($pack['days'] ?? 0);
        $wedding->forceFill([
            'site_pack_sku' => $sku,
            'site_pack_days' => $days,
            'site_pack_paid_at' => now(),
            'site_credits_granted' => (int) ($wedding->site_credits_granted ?? 0) + $credits,
            'site_custom_starts_on' => null,
            'site_custom_ends_on' => null,
        ])->save();

        if ($credits > 0) {
            $this->billing->grantCredits($user, $credits);
        }

        $mode = ($options['go_live_mode'] ?? 'now') === 'schedule' ? 'schedule' : 'now';
        $scheduleAt = $options['scheduled_publish_at'] ?? null;

        if ($mode === 'schedule' || ($scheduleAt && Carbon::parse($scheduleAt)->isFuture())) {
            $when = $scheduleAt ? Carbon::parse($scheduleAt) : now()->addDay();
            $this->putAwaitingGoLive($wedding, $when);

            return;
        }

        if ($wedding->isPublic() || $mode === 'now') {
            if (! $wedding->isPublic()) {
                app(WeddingPublishingService::class)->publish($wedding, skipBillingHook: true);
                $wedding->refresh();
            }
            $this->activatePaidWindow($wedding, now(), now()->addDays($days));

            return;
        }

        $this->putAwaitingGoLive($wedding, null);
    }

    /**
     * @param  array{go_live_mode?: string, currency?: string}  $options
     */
    public function fulfillCustomPackPayment(
        Wedding $wedding,
        User $user,
        string $startsOn,
        string $endsOn,
        int $credits,
        array $options = [],
    ): void {
        $currency = strtolower((string) ($options['currency'] ?? 'inr')) === 'usd' ? 'usd' : 'inr';
        $quote = $this->customPricer->quote($startsOn, $endsOn, $currency);

        $start = Carbon::parse($quote['starts_on'])->startOfDay();
        $end = Carbon::parse($quote['ends_on'])->endOfDay();

        $wedding->forceFill([
            'site_pack_sku' => 'site_custom',
            'site_pack_days' => $quote['days'],
            'site_pack_paid_at' => now(),
            'site_custom_starts_on' => $quote['starts_on'],
            'site_custom_ends_on' => $quote['ends_on'],
            'site_credits_granted' => (int) ($wedding->site_credits_granted ?? 0) + $credits,
        ])->save();

        if ($credits > 0) {
            $this->billing->grantCredits($user, $credits);
        }

        if ($start->isFuture()) {
            $this->putAwaitingGoLive($wedding, $start->copy()->startOfDay());

            return;
        }

        if (! $wedding->isPublic()) {
            app(WeddingPublishingService::class)->publish($wedding, skipBillingHook: true);
            $wedding->refresh();
        }

        $this->activatePaidWindow($wedding, $start, $end);
    }

    public function putAwaitingGoLive(Wedding $wedding, ?Carbon $scheduledAt): void
    {
        $payload = [
            'site_billing_status' => 'awaiting_go_live',
            'site_pack_starts_at' => null,
            'site_pack_ends_at' => null,
        ];

        if ($scheduledAt !== null) {
            $payload['scheduled_publish_at'] = $scheduledAt;
            $payload['scheduled_publish_status'] = 'pending';
            $payload['scheduled_publish_attempts'] = 0;
        } else {
            $payload['scheduled_publish_status'] = 'none';
        }

        $wedding->forceFill($payload)->save();
    }

    public function assertCanSchedulePublish(Wedding $wedding): void
    {
        $state = $this->state($wedding);

        if (! $state->isSite) {
            throw ValidationException::withMessages([
                'schedule' => 'Only site invitations can schedule publish.',
            ]);
        }

        if (! $state->hasPaidPack && ! $state->legacyAccountPro) {
            throw ValidationException::withMessages([
                'schedule' => 'Pay for a site pack before scheduling publish.',
            ]);
        }

        if (! in_array($state->status, ['awaiting_go_live', 'draft_ready'], true) && ! $state->legacyAccountPro) {
            if ($state->status === 'paid') {
                throw ValidationException::withMessages([
                    'schedule' => 'This site is already live on a paid plan.',
                ]);
            }
        }

        if ($wedding->isPublic() && $state->status === 'paid') {
            throw ValidationException::withMessages([
                'schedule' => 'Already published on a paid plan.',
            ]);
        }
    }

    public function schedulePublish(Wedding $wedding, Carbon|\DateTimeInterface|string $when): void
    {
        $this->assertCanSchedulePublish($wedding);

        $at = Carbon::parse($when);
        $minLead = max(0, (int) config('billing.schedule.min_lead_hours', 1));
        $maxLead = max(1, (int) config('billing.schedule.max_lead_days', 180));

        if ($at->lt(now()->addHours($minLead))) {
            throw ValidationException::withMessages([
                'scheduled_publish_at' => sprintf('Schedule at least %d hour(s) ahead.', $minLead),
            ]);
        }

        if ($at->gt(now()->addDays($maxLead))) {
            throw ValidationException::withMessages([
                'scheduled_publish_at' => sprintf('Schedule within %d days.', $maxLead),
            ]);
        }

        if ($wedding->site_pack_sku === 'site_custom' && $wedding->site_custom_starts_on) {
            $from = Carbon::parse($wedding->site_custom_starts_on)->startOfDay();
            if (! $at->isSameDay($from)) {
                throw ValidationException::withMessages([
                    'scheduled_publish_at' => 'Custom packs must publish on the From date ('.$from->toDateString().').',
                ]);
            }
            $at = $from->copy()->startOfDay();
        }

        if (! filled($wedding->site_pack_paid_at) && ! $this->legacyAccountPro($wedding->user)) {
            throw ValidationException::withMessages([
                'schedule' => 'Pay for a site pack before scheduling publish.',
            ]);
        }

        $wedding->forceFill([
            'site_billing_status' => 'awaiting_go_live',
            'scheduled_publish_at' => $at,
            'scheduled_publish_status' => 'pending',
            'scheduled_publish_attempts' => 0,
        ])->save();
    }

    public function activateGoLive(Wedding $wedding, bool $alreadyPublished = false): void
    {
        $wedding->refresh();

        if (! $alreadyPublished && ! $wedding->isPublic()) {
            app(WeddingPublishingService::class)->publish($wedding, skipBillingHook: true);
            $wedding->refresh();
        }

        $starts = now();
        $ends = null;

        if ($wedding->site_pack_sku === 'site_custom' && $wedding->site_custom_ends_on) {
            $starts = $wedding->site_custom_starts_on
                ? Carbon::parse($wedding->site_custom_starts_on)->startOfDay()
                : now();
            if ($starts->isFuture()) {
                $starts = now();
            }
            $ends = Carbon::parse($wedding->site_custom_ends_on)->endOfDay();
        } elseif ((int) $wedding->site_pack_days > 0) {
            $ends = $starts->copy()->addDays((int) $wedding->site_pack_days);
        } elseif ($this->legacyAccountPro($wedding->user)) {
            $ends = $wedding->user?->plan_ends_at;
        } else {
            $ends = $starts->copy()->addDays(30);
        }

        $this->activatePaidWindow($wedding, $starts, $ends);
        $wedding->forceFill([
            'scheduled_publish_status' => 'published',
            'scheduled_publish_at' => $wedding->scheduled_publish_at ?? now(),
        ])->save();
    }

    public function activatePaidWindow(Wedding $wedding, Carbon $starts, ?Carbon $ends): void
    {
        $wedding->forceFill([
            'site_billing_status' => 'paid',
            'site_pack_starts_at' => $starts,
            'site_pack_ends_at' => $ends,
            'scheduled_publish_status' => $wedding->scheduled_publish_status === 'pending'
                ? 'published'
                : ($wedding->scheduled_publish_status ?: 'none'),
        ])->save();
    }

    public function activateDueSchedules(): int
    {
        $count = 0;
        $maxAttempts = max(1, (int) config('billing.schedule.max_publish_retries', 5));

        Wedding::query()
            ->where('site_billing_status', 'awaiting_go_live')
            ->where('scheduled_publish_status', 'pending')
            ->whereNotNull('scheduled_publish_at')
            ->where('scheduled_publish_at', '<=', now())
            ->orderBy('id')
            ->limit(100)
            ->get()
            ->each(function (Wedding $wedding) use (&$count, $maxAttempts): void {
                try {
                    $this->activateGoLive($wedding);
                    $count++;
                } catch (\Throwable $e) {
                    $attempts = (int) $wedding->scheduled_publish_attempts + 1;
                    $wedding->forceFill([
                        'scheduled_publish_attempts' => $attempts,
                        'scheduled_publish_status' => $attempts >= $maxAttempts ? 'failed' : 'pending',
                    ])->save();
                    report($e);
                }
            });

        return $count;
    }

    public function markExpiredIfNeeded(): int
    {
        $n = 0;

        $n += Wedding::query()
            ->where('site_billing_status', 'trial')
            ->whereNotNull('site_trial_ends_at')
            ->where('site_trial_ends_at', '<=', now())
            ->update(['site_billing_status' => 'expired']);

        $n += Wedding::query()
            ->where('site_billing_status', 'paid')
            ->whereNotNull('site_pack_ends_at')
            ->where('site_pack_ends_at', '<=', now())
            ->update(['site_billing_status' => 'expired']);

        return $n;
    }

    public function assertCanEditSite(Wedding $wedding): void
    {
        $state = $this->state($wedding);
        if ($state->isCardOnly || $state->canEdit) {
            return;
        }

        throw ValidationException::withMessages([
            'site' => 'This site plan has expired. Extend or buy a pack to keep editing.',
        ]);
    }

    public function assertCanAutomate(Wedding $wedding): void
    {
        $state = $this->state($wedding);
        if ($state->canAutomate) {
            return;
        }

        throw ValidationException::withMessages([
            'mode' => 'Automated messaging needs an active paid site plan. Open '.$state->upgradeUrl,
        ]);
    }

    public function assertCanAddGuests(Wedding $wedding, int $adding = 1): void
    {
        $state = $this->state($wedding);
        $used = $wedding->guests()->count();
        if ($used + $adding <= $state->guestLimit) {
            return;
        }

        throw ValidationException::withMessages([
            'guests' => sprintf(
                'This site allows %d guests (%d used). Upgrade the site plan to raise the limit.',
                $state->guestLimit,
                $used,
            ),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function eventBillingSummary(Wedding $wedding, User $user, string $currency = 'inr'): array
    {
        $state = $this->state($wedding);
        $currency = strtolower($currency) === 'usd' ? 'usd' : 'inr';

        $currencyHelper = app(BillingCurrency::class);
        $gateway = $currencyHelper->gatewayForCurrency($currency);

        return [
            'event_id' => $wedding->id,
            'state' => $state->toArray(),
            'currency' => $currency,
            'currency_symbol' => $currencyHelper->symbol($currency),
            'gateway' => $gateway,
            'gateway_label' => $currencyHelper->gatewayLabel($gateway),
            'message_credits' => $this->billing->messageCredits($user),
            'site_packs' => collect($this->catalog->sitePacks())->map(function (array $row, string $key) use ($currency): array {
                $withCredits = $this->catalog->sitePackOffer($row, $currency, true);
                $bare = $this->catalog->sitePackOffer($row, $currency, false);

                return [
                    'id' => $key,
                    'name' => $row['name'] ?? $key,
                    'tagline' => $row['tagline'] ?? '',
                    'days' => (int) ($row['days'] ?? 0),
                    'included_credits' => (int) ($row['included_credits'] ?? 0),
                    'popular' => (bool) ($row['popular'] ?? false),
                    'price_label' => $withCredits['price_label'],
                    'amount_minor' => $withCredits['amount_minor'],
                    'price_label_with_credits' => $withCredits['price_label'],
                    'amount_minor_with_credits' => $withCredits['amount_minor'],
                    'price_label_bare' => $bare['price_label'],
                    'amount_minor_bare' => $bare['amount_minor'],
                    'features' => array_values($row['features'] ?? []),
                    'checkout_ready' => $withCredits['amount_minor'] >= 100 && $bare['amount_minor'] >= 100,
                ];
            })->values()->all(),
            'site_custom' => [
                'min_days' => (int) config('billing.site_custom.min_days', 8),
                'max_days' => (int) config('billing.site_custom.max_days', 180),
                'name' => (string) config('billing.site_custom.name', 'Custom dates'),
                'tagline' => (string) config('billing.site_custom.tagline', ''),
                'features' => array_values((array) config('billing.site_custom.features', [])),
            ],
            'feature_comparison' => array_values((array) config('billing.feature_comparison', [])),
            'credit_packs' => collect($this->catalog->creditPacks())->map(function (array $row, string $key) use ($currency): array {
                $amount = $currency === 'usd'
                    ? (int) ($row['price_usd_cents'] ?? $row['price_cents'] ?? 0)
                    : (int) ($row['price_inr_paise'] ?? $row['price_cents'] ?? 0);

                return [
                    'id' => $key,
                    'name' => $row['name'] ?? $key,
                    'credits' => (int) ($row['credits'] ?? 0),
                    'price_label' => $currency === 'usd'
                        ? ($row['price_label_usd'] ?? '$'.($amount / 100))
                        : ($row['price_label_inr'] ?? $row['price_label'] ?? '₹'.($amount / 100)),
                    'price_note' => $row['price_note'] ?? '',
                    'amount_minor' => $amount,
                    'checkout_ready' => $amount >= 100,
                ];
            })->values()->all(),
            'razorpay_ready' => $this->billing->razorpayReady(),
            'stripe_ready' => $this->billing->stripeReady(),
            'razorpay_key' => $this->billing->razorpayReady() ? (string) config('razorpay.key') : null,
            'allow_local_activate' => $this->billing->allowLocalActivate(),
        ];
    }
}
