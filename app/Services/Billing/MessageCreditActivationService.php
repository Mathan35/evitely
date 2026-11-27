<?php

namespace App\Services\Billing;

use App\Models\BillingPayment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Paid message-credit packs stay pending for a short window (default 24h),
 * then credits are granted by the scheduler or an admin — same pattern as
 * awaiting_go_live for site packs.
 */
class MessageCreditActivationService
{
    public const META_KEY = 'message_credits_activation';

    public const STATUS_PENDING = 'pending';

    public const STATUS_ACTIVATED = 'activated';

    public function __construct(
        private BillingService $billing,
        private PlanCatalog $catalog,
    ) {}

    public function isCreditPack(BillingPayment $payment): bool
    {
        return in_array($payment->kind, ['pack', 'credit_pack'], true);
    }

    public function activationHours(): int
    {
        return max(1, (int) config('billing.message_credits.activation_hours', 24));
    }

    public function userNotice(): string
    {
        $hours = $this->activationHours();

        return "Payment received. Your message pack will be activated within {$hours} hours.";
    }

    /**
     * Queue credits for later grant. Idempotent if already pending/activated.
     */
    public function queuePending(BillingPayment $payment): void
    {
        if (! $this->isCreditPack($payment)) {
            return;
        }

        $existing = $this->activationMeta($payment);
        if (($existing['status'] ?? null) === self::STATUS_ACTIVATED) {
            return;
        }
        if (($existing['status'] ?? null) === self::STATUS_PENDING) {
            return;
        }

        $credits = $this->creditsFor($payment);
        $queuedAt = now();
        $activateAfter = $queuedAt->copy()->addHours($this->activationHours());

        $meta = is_array($payment->meta) ? $payment->meta : [];
        $meta['credits'] = $credits;
        $meta[self::META_KEY] = [
            'status' => self::STATUS_PENDING,
            'credits' => $credits,
            'queued_at' => $queuedAt->toIso8601String(),
            'activate_after' => $activateAfter->toIso8601String(),
            'activated_at' => null,
            'activated_by' => null,
        ];

        $payment->forceFill(['meta' => $meta])->save();
    }

    public function isPending(BillingPayment $payment): bool
    {
        return ($this->activationMeta($payment)['status'] ?? null) === self::STATUS_PENDING;
    }

    public function isActivated(BillingPayment $payment): bool
    {
        return ($this->activationMeta($payment)['status'] ?? null) === self::STATUS_ACTIVATED;
    }

    /**
     * Grant wallet credits for a pending pack. Idempotent.
     *
     * @return bool true when credits were granted on this call
     */
    public function activate(BillingPayment $payment, ?User $actor = null, string $via = 'scheduler'): bool
    {
        if (! $this->isCreditPack($payment) || ! $payment->isPaid()) {
            return false;
        }

        if ($this->isActivated($payment)) {
            return false;
        }

        // Legacy paid packs (fulfilled before this feature) have no activation meta —
        // treat as already settled so we never double-grant.
        $metaBlock = $this->activationMeta($payment);
        if ($metaBlock === [] || ($metaBlock['status'] ?? null) !== self::STATUS_PENDING) {
            return false;
        }

        $user = $payment->user ?? User::query()->find($payment->user_id);
        if ($user === null) {
            return false;
        }

        $credits = (int) ($metaBlock['credits'] ?? $this->creditsFor($payment));
        if ($credits > 0) {
            $this->billing->grantCredits($user, $credits);
        }

        $meta = is_array($payment->meta) ? $payment->meta : [];
        $meta[self::META_KEY] = array_merge($metaBlock, [
            'status' => self::STATUS_ACTIVATED,
            'credits' => $credits,
            'activated_at' => now()->toIso8601String(),
            'activated_by' => $actor
                ? 'admin:'.($actor->email ?? (string) $actor->id)
                : $via,
        ]);
        $payment->forceFill(['meta' => $meta])->save();

        return true;
    }

    /**
     * Auto-activate packs whose activate_after has passed.
     */
    public function activateDue(int $limit = 100): int
    {
        $activated = 0;

        $this->pendingQuery()
            ->orderBy('id')
            ->limit($limit)
            ->get()
            ->each(function (BillingPayment $payment) use (&$activated): void {
                $after = $this->activateAfterAt($payment);
                if ($after === null || $after->isFuture()) {
                    return;
                }

                if ($this->activate($payment, null, 'scheduler')) {
                    $activated++;
                }
            });

        return $activated;
    }

    /**
     * @return Collection<int, array{id: int, sku: string, credits: int, paid_at: string|null, activate_after: string|null, message: string}>
     */
    public function pendingForUser(User $user): Collection
    {
        $notice = $this->userNotice();

        return $this->pendingQuery()
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(function (BillingPayment $payment) use ($notice): array {
                $block = $this->activationMeta($payment);

                return [
                    'id' => $payment->id,
                    'sku' => $payment->sku,
                    'credits' => (int) ($block['credits'] ?? $this->creditsFor($payment)),
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                    'activate_after' => isset($block['activate_after']) ? (string) $block['activate_after'] : null,
                    'message' => $notice,
                ];
            })
            ->values();
    }

    public function pendingCount(): int
    {
        return $this->pendingQuery()->count();
    }

    /**
     * @return array<string, mixed>
     */
    public function activationMeta(BillingPayment $payment): array
    {
        $meta = is_array($payment->meta) ? $payment->meta : [];
        $block = $meta[self::META_KEY] ?? null;

        return is_array($block) ? $block : [];
    }

    public function creditsFor(BillingPayment $payment): int
    {
        $fromMeta = (int) (($payment->meta['credits'] ?? null) ?: 0);
        if ($fromMeta > 0) {
            return $fromMeta;
        }

        return (int) ($this->catalog->pack($payment->sku)['credits'] ?? 0);
    }

    private function pendingQuery()
    {
        return BillingPayment::query()
            ->where('status', 'paid')
            ->whereIn('kind', ['pack', 'credit_pack'])
            ->where('meta->'.self::META_KEY.'->status', self::STATUS_PENDING);
    }

    private function activateAfterAt(BillingPayment $payment): ?Carbon
    {
        $raw = $this->activationMeta($payment)['activate_after'] ?? null;
        if (! is_string($raw) || $raw === '') {
            return null;
        }

        try {
            return Carbon::parse($raw);
        } catch (\Throwable) {
            return null;
        }
    }
}
