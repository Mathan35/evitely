<?php

namespace App\Services\Billing;

use App\Models\BillingPayment;
use App\Models\User;
use App\Models\Wedding;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Laravel\Cashier\Checkout;

class BillingService
{
    public function __construct(private PlanCatalog $catalog) {}

    public function stripeReady(): bool
    {
        // Stripe stays installed but hidden unless BILLING_STRIPE_ENABLED=true.
        if (! (bool) config('billing.stripe_enabled', false)) {
            return false;
        }

        return filled(config('cashier.secret')) && filled(config('cashier.key'));
    }

    public function driver(): string
    {
        $driver = strtolower(trim((string) config('billing.driver', 'local')));

        return in_array($driver, ['razorpay', 'stripe', 'local'], true) ? $driver : 'local';
    }

    public function razorpayReady(): bool
    {
        return filled(config('razorpay.key')) && filled(config('razorpay.secret'));
    }

    public function allowLocalActivate(): bool
    {
        // Opt-in only via BILLING_ALLOW_LOCAL_ACTIVATE / config.
        // Billing UI no longer renders free-bypass buttons; this gates the API routes.
        return (bool) config('billing.allow_local_activate', false);
    }

    public function effectivePlan(User $user): string
    {
        $plan = strtolower(trim((string) ($user->plan ?: 'free')));

        if ($plan === 'pro' && $user->plan_ends_at && $user->plan_ends_at->isPast()) {
            if (! $user->subscribed('default')) {
                return 'free';
            }
        }

        if ($user->subscribed('default')) {
            return 'pro';
        }

        if ($plan === 'pro' && $user->plan_ends_at && $user->plan_ends_at->isFuture()) {
            return 'pro';
        }

        if ($plan === 'pro' && $user->plan_ends_at === null) {
            // Legacy / local Pro without expiry — treat as active.
            return 'pro';
        }

        return in_array($plan, ['free', 'pro'], true) ? $plan : 'free';
    }

    public function isPro(User $user): bool
    {
        return $this->effectivePlan($user) === 'pro';
    }

    public function canUseAutomatedMessaging(User $user, ?Wedding $wedding = null): bool
    {
        if ($wedding !== null) {
            return app(SiteBillingService::class)->state($wedding)->canAutomate;
        }

        return $this->catalog->allowsAutomated($this->effectivePlan($user));
    }

    public function guestLimit(User $user, ?Wedding $wedding = null): int
    {
        if ($wedding !== null) {
            return app(SiteBillingService::class)->state($wedding)->guestLimit;
        }

        return $this->catalog->guestLimit($this->effectivePlan($user));
    }

    public function coHostLimit(User $user, ?Wedding $wedding = null): int
    {
        if ($wedding !== null) {
            return app(SiteBillingService::class)->state($wedding)->coHostLimit;
        }

        return $this->catalog->coHostLimit($this->effectivePlan($user));
    }

    /**
     * Max events the account may own. Null = unlimited (Pro / paid unlock).
     */
    public function eventLimit(User $user): ?int
    {
        return $this->catalog->eventLimit($this->effectivePlan($user));
    }

    public function ownedEventCount(User $user): int
    {
        return (int) $user->weddings()->count();
    }

    /**
     * Guest websites that count toward the free-trial slot (My Events listed / saved).
     * Invitation cards are free forever and never consume this limit.
     * Unsaved gallery drafts do not block creating or switching the first site.
     */
    public function listedEventCount(User $user): int
    {
        return $user->weddings()
            ->with('setting')
            ->get()
            ->filter(function (Wedding $wedding): bool {
                if (($wedding->invitation_mode ?? 'link') === 'card') {
                    return false;
                }

                return $wedding->isListedInMyEvents();
            })
            ->count();
    }

    public function canCreateEvent(User $user, ?string $invitationMode = null): bool
    {
        // Cards stay free forever — never gated by the site event limit.
        if ($invitationMode === 'card') {
            return true;
        }

        $limit = $this->eventLimit($user);
        if ($limit === null) {
            return true;
        }

        return $this->listedEventCount($user) < $limit;
    }

    public function assertCanCreateEvent(User $user, ?string $invitationMode = null): void
    {
        if ($this->canCreateEvent($user, $invitationMode)) {
            return;
        }

        $limit = $this->eventLimit($user) ?? 1;

        throw ValidationException::withMessages([
            'event' => $limit === 1
                ? 'Your free trial includes one guest website. Keep editing the one in My Events, or upgrade to create another. Invitation cards stay free.'
                : sprintf(
                    'Your free trial includes %d guest websites. Keep editing what you have, or upgrade to create more. Invitation cards stay free.',
                    $limit,
                ),
        ]);
    }

    /**
     * Drop unsaved gallery drafts so a free user can switch templates before their first Save.
     */
    public function discardUnlistedDrafts(User $user, ?int $exceptId = null): void
    {
        $user->weddings()
            ->with('setting')
            ->get()
            ->filter(function (Wedding $wedding) use ($exceptId): bool {
                if ($exceptId !== null && $wedding->id === $exceptId) {
                    return false;
                }

                return ! $wedding->isListedInMyEvents();
            })
            ->each(function (Wedding $wedding): void {
                $wedding->delete();
            });
    }

    public function messageCredits(User $user): int
    {
        return max(0, (int) $user->message_credits);
    }

    /**
     * @return array{limit: int, used: int, remaining: int, at_limit: bool}
     */
    public function guestCapacity(User $user, Wedding $wedding): array
    {
        $limit = $this->guestLimit($user, $wedding);
        $used = $wedding->guests()->count();

        return [
            'limit' => $limit,
            'used' => $used,
            'remaining' => max(0, $limit - $used),
            'at_limit' => $used >= $limit,
        ];
    }

    public function assertCanAddGuests(User $user, Wedding $wedding, int $adding = 1): void
    {
        app(SiteBillingService::class)->assertCanAddGuests($wedding, $adding);
    }

    public function assertCanInviteCoHost(User $user, Wedding $wedding): void
    {
        $limit = $this->coHostLimit($user, $wedding);
        $used = $wedding->collaborators()->count();
        if ($used < $limit) {
            return;
        }

        throw ValidationException::withMessages([
            'email' => sprintf(
                'Your plan allows %d co-host%s. Upgrade the site pack to invite more.',
                $limit,
                $limit === 1 ? '' : 's',
            ),
        ]);
    }

    public function assertCanUseAutomated(User $user, ?Wedding $wedding = null): void
    {
        if ($wedding !== null) {
            app(SiteBillingService::class)->assertCanAutomate($wedding);

            return;
        }

        if ($this->canUseAutomatedMessaging($user)) {
            return;
        }

        throw ValidationException::withMessages([
            'mode' => 'Automated messaging needs an active paid site plan. Open the event Billing page to buy a pack.',
        ]);
    }

    public function assertHasCredits(User $user, int $needed = 1): void
    {
        if ($this->messageCredits($user) >= $needed) {
            return;
        }

        throw ValidationException::withMessages([
            'guest_ids' => 'Not enough message credits for this send. Buy a credit pack in Settings → Billing (WhatsApp-first pricing).',
        ]);
    }

    public function isBillingAdmin(User $user): bool
    {
        if (app(\App\Services\PlatformReadinessService::class)->isAdmin($user)) {
            return true;
        }

        $emails = collect(config('billing.admin_emails', []))
            ->filter()
            ->map(fn ($email) => strtolower(trim((string) $email)))
            ->unique()
            ->values()
            ->all();

        return $emails !== [] && in_array(strtolower((string) $user->email), $emails, true);
    }

    /**
     * Product go-live checklist for Razorpay (shown on Billing).
     *
     * @return list<array{id: string, label: string, done: bool, hint: string}>
     */
    public function launchChecklist(): array
    {
        $key = (string) config('razorpay.key');
        $isLiveKey = str_starts_with($key, 'rzp_live_');
        $isTestKey = str_starts_with($key, 'rzp_test_');

        return [
            [
                'id' => 'keys',
                'label' => 'Razorpay API keys configured',
                'done' => $this->razorpayReady(),
                'hint' => 'Set RAZORPAY_KEY and RAZORPAY_SECRET',
            ],
            [
                'id' => 'webhook_secret',
                'label' => 'Webhook secret set',
                'done' => filled(config('razorpay.webhook_secret')),
                'hint' => 'RAZORPAY_WEBHOOK_SECRET + Dashboard URL '.url('/razorpay/webhook'),
            ],
            [
                'id' => 'test_mode',
                'label' => 'Test keys active (safe for UPI success@razorpay)',
                'done' => $this->razorpayReady() && $isTestKey,
                'hint' => 'Use rzp_test_… until go-live',
            ],
            [
                'id' => 'live_keys',
                'label' => 'Live keys ready for production',
                'done' => $this->razorpayReady() && $isLiveKey,
                'hint' => 'Switch to rzp_live_… only after Dashboard activation',
            ],
            [
                'id' => 'mail',
                'label' => 'Receipt email mailer configured',
                'done' => filled(config('mail.from.address')) && config('mail.default') !== null,
                'hint' => 'MAIL_FROM_ADDRESS + SendGrid/SMTP',
            ],
        ];
    }

    public function consumeCredits(User $user, int $amount = 1): bool
    {
        if ($amount < 1) {
            return true;
        }

        return DB::transaction(function () use ($user, $amount): bool {
            /** @var User|null $fresh */
            $fresh = User::query()->lockForUpdate()->find($user->id);
            if ($fresh === null || (int) $fresh->message_credits < $amount) {
                return false;
            }

            $fresh->forceFill([
                'message_credits' => (int) $fresh->message_credits - $amount,
            ])->save();

            $user->message_credits = $fresh->message_credits;

            return true;
        });
    }

    public function grantCredits(User $user, int $amount): void
    {
        if ($amount < 1) {
            return;
        }

        DB::transaction(function () use ($user, $amount): void {
            User::query()->whereKey($user->id)->increment('message_credits', $amount);
            $user->message_credits = (int) User::query()->whereKey($user->id)->value('message_credits');
        });
    }

    /**
     * Activate Pro for a wedding-season window and optionally grant included credits.
     */
    public function activatePro(
        User $user,
        ?\DateTimeInterface $endsAt = null,
        int $includedCredits = 0,
    ): void {
        $ends = $endsAt
            ? \Illuminate\Support\Carbon::parse($endsAt)
            : now()->addMonths(12);

        $user->forceFill([
            'plan' => 'pro',
            'plan_ends_at' => $ends,
            'message_credits' => (int) $user->message_credits + max(0, $includedCredits),
        ])->save();
    }

    public function activateSeason(User $user, string $seasonKey): void
    {
        $season = $this->catalog->season($seasonKey);
        if ($season === null) {
            throw ValidationException::withMessages([
                'season' => 'Unknown season pass.',
            ]);
        }

        $months = max(1, (int) ($season['duration_months'] ?? 12));
        $credits = max(0, (int) ($season['included_credits'] ?? 0));

        $base = ($user->plan === 'pro' && $user->plan_ends_at && $user->plan_ends_at->isFuture())
            ? $user->plan_ends_at->copy()
            : now();

        $this->activatePro($user, $base->addMonths($months), $credits);
    }

    public function downgradeToFree(User $user): void
    {
        $user->forceFill([
            'plan' => 'free',
            'plan_ends_at' => null,
        ])->save();
    }

    public function syncFromSubscription(User $user): void
    {
        if ($user->subscribed('default')) {
            $subscription = $user->subscription('default');
            $this->activatePro($user, $subscription?->ends_at, 0);

            return;
        }

        // Season / local Pro is driven by plan_ends_at — do not wipe active seasons.
        if ($this->effectivePlan($user) === 'pro') {
            return;
        }

        if ($user->plan === 'pro' && $user->plan_ends_at && $user->plan_ends_at->isPast()) {
            $this->downgradeToFree($user);
        }
    }

    /**
     * One-time Stripe Checkout for a wedding-season Pro pass.
     *
     * @return Checkout|null
     */
    public function checkoutSeason(User $user, string $seasonKey, string $successUrl, string $cancelUrl): mixed
    {
        $season = $this->catalog->season($seasonKey);
        $priceId = $season['stripe_price_id'] ?? null;
        if (! $this->stripeReady() || $season === null || ! filled($priceId)) {
            return null;
        }

        return $user->checkout([(string) $priceId => 1], [
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'mode' => 'payment',
            'metadata' => [
                'user_id' => (string) $user->id,
                'type' => 'pro_season',
                'season' => $seasonKey,
                'months' => (string) ($season['duration_months'] ?? 12),
                'credits' => (string) ($season['included_credits'] ?? 0),
            ],
            'payment_intent_data' => [
                'metadata' => [
                    'user_id' => (string) $user->id,
                    'type' => 'pro_season',
                    'season' => $seasonKey,
                    'months' => (string) ($season['duration_months'] ?? 12),
                    'credits' => (string) ($season['included_credits'] ?? 0),
                ],
            ],
        ]);
    }

    /**
     * @deprecated Use checkoutSeason — kept for older routes
     * @return Checkout|null
     */
    public function checkoutPro(User $user, string $successUrl, string $cancelUrl): mixed
    {
        return $this->checkoutSeason(
            $user,
            $this->catalog->defaultSeasonKey(),
            $successUrl,
            $cancelUrl,
        );
    }

    /**
     * @return Checkout|null
     */
    public function checkoutPack(User $user, string $packKey, string $successUrl, string $cancelUrl): mixed
    {
        $pack = $this->catalog->pack($packKey);
        $priceId = $pack['stripe_price_id'] ?? null;
        if (! $this->stripeReady() || $pack === null || ! filled($priceId)) {
            return null;
        }

        return $user->checkout([(string) $priceId => 1], [
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'mode' => 'payment',
            'metadata' => [
                'user_id' => (string) $user->id,
                'type' => 'credit_pack',
                'pack' => $packKey,
                'credits' => (string) ($pack['credits'] ?? 0),
            ],
            'payment_intent_data' => [
                'metadata' => [
                    'user_id' => (string) $user->id,
                    'type' => 'credit_pack',
                    'pack' => $packKey,
                    'credits' => (string) ($pack['credits'] ?? 0),
                ],
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(User $user): array
    {
        $planKey = $this->effectivePlan($user);
        $plan = $this->catalog->plan($planKey);
        $subscriptionPayload = null;

        try {
            $subscription = $user->subscription('default');
            if ($subscription) {
                $subscriptionPayload = [
                    'active' => $user->subscribed('default'),
                    'on_grace_period' => $subscription->onGracePeriod(),
                    'ends_at' => $subscription->ends_at?->toIso8601String(),
                ];
            }
        } catch (\Throwable) {
            $subscriptionPayload = null;
        }

        return [
            'plan' => $planKey,
            'plan_name' => $plan['name'] ?? ucfirst($planKey),
            'is_pro' => $planKey === 'pro',
            'plan_ends_at' => $user->plan_ends_at?->toIso8601String(),
            'message_credits' => $this->messageCredits($user),
            'guest_limit' => $this->guestLimit($user),
            'co_host_limit' => $this->coHostLimit($user),
            'event_limit' => $this->eventLimit($user),
            'events_count' => $this->listedEventCount($user),
            'can_create_event' => $this->canCreateEvent($user),
            'automated_messaging' => $this->canUseAutomatedMessaging($user),
            'stripe_ready' => $this->stripeReady(),
            'razorpay_ready' => $this->razorpayReady(),
            'razorpay_key' => $this->razorpayReady() ? (string) config('razorpay.key') : null,
            'driver' => $this->driver(),
            'allow_local_activate' => $this->allowLocalActivate(),
            'billing_model' => 'site_packs',
            'gateway' => $this->razorpayReady() ? 'razorpay' : ($this->stripeReady() ? 'stripe' : 'local'),
            'pay_methods' => ['upi', 'card', 'netbanking', 'wallet'],
            'subscription' => $subscriptionPayload,
            'legacy_pro' => $this->isPro($user),
            'sites' => $user->weddings()
                ->whereIn('invitation_mode', ['link', 'both'])
                ->latest('id')
                ->limit(20)
                ->get(['id', 'title', 'site_billing_status', 'site_pack_ends_at', 'scheduled_publish_at', 'invitation_mode'])
                ->map(fn (Wedding $w): array => [
                    'id' => $w->id,
                    'title' => $w->title,
                    'status' => $w->site_billing_status,
                    'pack_ends_at' => $w->site_pack_ends_at?->toIso8601String(),
                    'scheduled_publish_at' => $w->scheduled_publish_at?->toIso8601String(),
                    'billing_url' => '/events/'.$w->id.'/billing',
                ])
                ->values()
                ->all(),
            'site_packs' => collect($this->catalog->sitePacks())->map(function (array $row, string $key): array {
                return [
                    'id' => $key,
                    'name' => $row['name'] ?? $key,
                    'tagline' => $row['tagline'] ?? '',
                    'days' => (int) ($row['days'] ?? 0),
                    'price_label' => $row['price_label_inr'] ?? '',
                    'included_credits' => (int) ($row['included_credits'] ?? 0),
                    'popular' => (bool) ($row['popular'] ?? false),
                    'features' => array_values($row['features'] ?? []),
                ];
            })->values()->all(),
            'plans' => collect($this->catalog->plans())->map(function (array $row, string $key): array {
                return [
                    'id' => $key,
                    'name' => $row['name'] ?? ucfirst($key),
                    'tagline' => $row['tagline'] ?? '',
                    'price_label' => $row['price_label'] ?? '',
                    'guest_limit' => (int) ($row['guest_limit'] ?? 0),
                    'co_host_limit' => (int) ($row['co_host_limit'] ?? 0),
                    'monthly_credits' => (int) ($row['monthly_credits'] ?? 0),
                    'automated_messaging' => (bool) ($row['automated_messaging'] ?? false),
                    'features' => array_values($row['features'] ?? []),
                    'checkout_ready' => false,
                ];
            })->values()->all(),
            // Seasons unsold — empty for UI; legacy fulfill still works via RazorpayService.
            'seasons' => [],
            'packs' => collect($this->catalog->creditPacks())->map(function (array $row, string $key): array {
                $amountReady = (int) ($row['price_inr_paise'] ?? $row['price_cents'] ?? 0) >= 100;

                return [
                    'id' => $key,
                    'name' => $row['name'] ?? $key,
                    'credits' => (int) ($row['credits'] ?? 0),
                    'price_label' => $row['price_label_inr'] ?? $row['price_label'] ?? '',
                    'price_note' => $row['price_note'] ?? '',
                    'price_cents' => (int) ($row['price_inr_paise'] ?? $row['price_cents'] ?? 0),
                    'checkout_ready' => ($this->razorpayReady() || $this->stripeReady() || $this->allowLocalActivate()) && $amountReady,
                ];
            })->values()->all(),
            'launch_checklist' => $this->isBillingAdmin($user) ? $this->launchChecklist() : [],
            'is_billing_admin' => $this->isBillingAdmin($user),
            'recent_payments' => BillingPayment::query()
                ->where('user_id', $user->id)
                ->latest('id')
                ->limit(8)
                ->get(['id', 'kind', 'sku', 'amount_paise', 'currency', 'status', 'razorpay_payment_id', 'paid_at', 'created_at', 'meta'])
                ->map(function (BillingPayment $row): array {
                    $activation = app(MessageCreditActivationService::class);
                    $pendingCredits = $activation->isCreditPack($row) && $activation->isPending($row);

                    return [
                        'id' => $row->id,
                        'kind' => $row->kind,
                        'sku' => $row->sku,
                        'amount_label' => '₹'.number_format($row->amount_paise / 100, 0, '.', ','),
                        'status' => $row->status,
                        'payment_id' => $row->razorpay_payment_id,
                        'paid_at' => $row->paid_at?->toIso8601String(),
                        'created_at' => $row->created_at?->toIso8601String(),
                        'credits_pending' => $pendingCredits,
                        'status_label' => $pendingCredits
                            ? 'paid · activating within '.$activation->activationHours().'h'
                            : $row->status,
                    ];
                })
                ->values()
                ->all(),
            'pending_message_packs' => app(MessageCreditActivationService::class)
                ->pendingForUser($user)
                ->all(),
        ];
    }
}
