<?php

namespace App\Services\Admin;

use App\Models\BillingPayment;
use App\Models\User;
use App\Models\Wedding;
use App\Notifications\AdminPackGrantNotification;
use App\Services\Billing\BillingService;
use App\Services\Billing\MessageCreditActivationService;
use App\Services\Billing\PlanCatalog;
use App\Services\Billing\SiteBillingService;
use App\Services\WeddingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Ops-only pack assignment. Isolated from Razorpay/Stripe checkout:
 * - provider = admin (never fulfilled by payment webhooks)
 * - message credits activate immediately (no 24h pending queue)
 * - site entitlements use SiteBillingService the same way paid packs do
 */
class AdminPackGrantService
{
    public const PROVIDER = 'admin';

    public function __construct(
        private PlanCatalog $catalog,
        private SiteBillingService $siteBilling,
        private BillingService $billing,
        private WeddingService $weddings,
        private MessageCreditActivationService $messageCredits,
    ) {}

    /**
     * @param  array{
     *   mode?: string,
     *   user_id?: int|null,
     *   name?: string|null,
     *   email?: string|null,
     *   event_id?: int|null,
     *   event_title?: string|null,
     *   site_pack_sku: string,
     *   credit_pack_sku?: string|null,
     *   include_site_credits?: bool,
     *   pricing: string,
     *   go_live_mode?: string,
     *   note?: string|null,
     *   send_email?: bool
     * }  $input
     * @return array{user: User, wedding: Wedding, payments: list<BillingPayment>, created_user: bool}
     */
    public function grant(User $admin, array $input): array
    {
        $siteSku = (string) $input['site_pack_sku'];
        $sitePack = $this->catalog->sitePack($siteSku);
        if ($sitePack === null) {
            throw ValidationException::withMessages(['site_pack_sku' => 'Unknown site day pack.']);
        }

        $creditSku = filled($input['credit_pack_sku'] ?? null) ? (string) $input['credit_pack_sku'] : null;
        $creditPack = null;
        if ($creditSku !== null) {
            $creditPack = $this->catalog->pack($creditSku);
            if ($creditPack === null) {
                throw ValidationException::withMessages(['credit_pack_sku' => 'Unknown message credit pack.']);
            }
        }

        $pricing = in_array(($input['pricing'] ?? 'free'), ['free', 'paid', 'complimentary'], true)
            ? (string) $input['pricing']
            : 'free';
        $goLive = (($input['go_live_mode'] ?? 'now') === 'schedule') ? 'schedule' : 'now';
        $includeSiteCredits = (bool) ($input['include_site_credits'] ?? false);
        $sendEmail = (bool) ($input['send_email'] ?? true);
        $note = trim((string) ($input['note'] ?? ''));
        $grantId = (string) Str::uuid();

        $result = DB::transaction(function () use (
            $admin,
            $input,
            $siteSku,
            $sitePack,
            $creditSku,
            $creditPack,
            $pricing,
            $goLive,
            $includeSiteCredits,
            $sendEmail,
            $note,
            $grantId,
        ): array {
            [$user, $createdUser] = $this->resolveUser($input);

            $wedding = $this->resolveWedding($user, $input);

            $siteCredits = $includeSiteCredits ? (int) ($sitePack['included_credits'] ?? 0) : 0;
            $siteAmount = $this->amountForSitePack($sitePack, $pricing, $includeSiteCredits);

            $this->siteBilling->fulfillFixedPackPayment(
                $wedding,
                $user,
                $siteSku,
                $siteCredits,
                ['go_live_mode' => $goLive],
            );

            $payments = [];
            $payments[] = $this->recordPayment(
                user: $user,
                wedding: $wedding,
                kind: 'site_pack',
                sku: $siteSku,
                amountPaise: $siteAmount,
                pricing: $pricing,
                admin: $admin,
                grantId: $grantId,
                note: $note,
                extraMeta: [
                    'days' => (int) ($sitePack['days'] ?? 0),
                    'credits_granted' => $siteCredits,
                    'include_site_credits' => $includeSiteCredits,
                    'go_live_mode' => $goLive,
                ],
            );

            $messageCreditsGranted = 0;
            if ($creditPack !== null && $creditSku !== null) {
                $messageCreditsGranted = (int) ($creditPack['credits'] ?? 0);
                $creditAmount = $this->amountForCreditPack($creditPack, $pricing);
                if ($messageCreditsGranted > 0) {
                    $this->billing->grantCredits($user, $messageCreditsGranted);
                }

                $payments[] = $this->recordPayment(
                    user: $user,
                    wedding: $wedding,
                    kind: 'credit_pack',
                    sku: $creditSku,
                    amountPaise: $creditAmount,
                    pricing: $pricing,
                    admin: $admin,
                    grantId: $grantId,
                    note: $note,
                    extraMeta: [
                        'credits' => $messageCreditsGranted,
                        // Mark activated immediately so 24h pending never applies to admin grants.
                        MessageCreditActivationService::META_KEY => [
                            'status' => MessageCreditActivationService::STATUS_ACTIVATED,
                            'credits' => $messageCreditsGranted,
                            'queued_at' => now()->toIso8601String(),
                            'activate_after' => now()->toIso8601String(),
                            'activated_at' => now()->toIso8601String(),
                            'activated_by' => 'admin_grant:'.($admin->email ?? (string) $admin->id),
                        ],
                    ],
                );
            }

            return [
                'user' => $user->fresh(),
                'wedding' => $wedding->fresh(),
                'payments' => $payments,
                'created_user' => $createdUser,
                'grant_id' => $grantId,
                'email_payload' => $sendEmail ? [
                    'site_pack_sku' => $siteSku,
                    'site_pack_name' => (string) ($sitePack['name'] ?? $siteSku),
                    'credit_pack_sku' => $creditSku,
                    'credit_pack_name' => $creditPack ? (string) ($creditPack['name'] ?? $creditSku) : null,
                    'message_credits' => $messageCreditsGranted + $siteCredits,
                    'pricing' => $pricing,
                    'note' => $note !== '' ? $note : null,
                ] : null,
            ];
        });

        // Emails / reset links run after commit so a mail failure never rolls back the grant.
        if (is_array($result['email_payload'] ?? null)) {
            if ($result['created_user']) {
                Password::sendResetLink(['email' => $result['user']->email]);
            }
            $payload = $result['email_payload'];
            $result['user']->notify(new AdminPackGrantNotification(
                wedding: $result['wedding'],
                sitePackSku: $payload['site_pack_sku'],
                sitePackName: $payload['site_pack_name'],
                creditPackSku: $payload['credit_pack_sku'],
                creditPackName: $payload['credit_pack_name'],
                messageCredits: (int) $payload['message_credits'],
                pricing: $payload['pricing'],
                createdUser: $result['created_user'],
                note: $payload['note'],
            ));
        }
        unset($result['email_payload']);

        return $result;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function recentGrants(int $limit = 40): array
    {
        return BillingPayment::query()
            ->with(['user:id,name,email'])
            ->where('provider', self::PROVIDER)
            ->where('status', 'paid')
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map(function (BillingPayment $p): array {
                $meta = is_array($p->meta) ? $p->meta : [];

                return [
                    'id' => $p->id,
                    'grant_id' => $meta['admin_grant_id'] ?? null,
                    'user' => $p->user?->email,
                    'user_id' => $p->user_id,
                    'event_id' => $p->event_id,
                    'kind' => $p->kind,
                    'sku' => $p->sku,
                    'pricing' => $meta['pricing'] ?? null,
                    'amount_paise' => $p->amount_paise,
                    'credits' => $meta['credits'] ?? $meta['credits_granted'] ?? null,
                    'granted_by' => $meta['granted_by'] ?? null,
                    'note' => $meta['note'] ?? null,
                    'paid_at' => $p->paid_at?->toIso8601String(),
                    'created_at' => $p->created_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{0: User, 1: bool}
     */
    private function resolveUser(array $input): array
    {
        $mode = ($input['mode'] ?? 'existing') === 'new' ? 'new' : 'existing';

        if ($mode === 'existing') {
            $userId = (int) ($input['user_id'] ?? 0);
            $user = $userId > 0 ? User::query()->find($userId) : null;
            if ($user === null && filled($input['email'] ?? null)) {
                $user = User::query()->where('email', strtolower(trim((string) $input['email'])))->first();
            }
            if ($user === null) {
                throw ValidationException::withMessages(['user_id' => 'Select an existing user.']);
            }

            return [$user, false];
        }

        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $name = trim((string) ($input['name'] ?? ''));
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw ValidationException::withMessages(['email' => 'A valid email is required for a new account.']);
        }
        if ($name === '') {
            throw ValidationException::withMessages(['name' => 'Name is required for a new account.']);
        }
        if (User::query()->where('email', $email)->exists()) {
            throw ValidationException::withMessages(['email' => 'That email already has an account — use existing user mode.']);
        }

        $user = User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => Str::password(32),
            'plan' => 'free',
            'message_credits' => 0,
        ]);
        // email_verified_at is not fillable — set explicitly for admin-created accounts.
        $user->forceFill(['email_verified_at' => now()])->save();

        return [$user->fresh(), true];
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function resolveWedding(User $user, array $input): Wedding
    {
        $eventId = (int) ($input['event_id'] ?? 0);
        if ($eventId > 0) {
            $wedding = Wedding::query()->find($eventId);
            if ($wedding === null || (int) $wedding->user_id !== (int) $user->id) {
                throw ValidationException::withMessages(['event_id' => 'Event not found for this user.']);
            }

            return $wedding;
        }

        $title = trim((string) ($input['event_title'] ?? ''));
        if ($title === '') {
            throw ValidationException::withMessages(['event_title' => 'Event title is required when creating a new event.']);
        }

        return $this->weddings->createWithoutQuota($user->id, [
            'title' => $title,
            'invitation_mode' => 'both',
            'event_type' => 'wedding',
            'timezone' => config('app.timezone', 'Asia/Kolkata'),
            'language' => 'en',
        ]);
    }

    /**
     * @param  array<string, mixed>  $pack
     */
    private function amountForSitePack(array $pack, string $pricing, bool $includeCredits): int
    {
        if (in_array($pricing, ['free', 'complimentary'], true)) {
            return 0;
        }

        $offer = $this->catalog->sitePackOffer($pack, 'inr', $includeCredits);

        return max(0, (int) $offer['amount_minor']);
    }

    /**
     * @param  array<string, mixed>  $pack
     */
    private function amountForCreditPack(array $pack, string $pricing): int
    {
        if (in_array($pricing, ['free', 'complimentary'], true)) {
            return 0;
        }

        return max(0, (int) ($pack['price_inr_paise'] ?? $pack['price_cents'] ?? 0));
    }

    /**
     * @param  array<string, mixed>  $extraMeta
     */
    private function recordPayment(
        User $user,
        Wedding $wedding,
        string $kind,
        string $sku,
        int $amountPaise,
        string $pricing,
        User $admin,
        string $grantId,
        string $note,
        array $extraMeta = [],
    ): BillingPayment {
        return BillingPayment::query()->create([
            'user_id' => $user->id,
            'event_id' => $wedding->id,
            'provider' => self::PROVIDER,
            'kind' => $kind,
            'sku' => $sku,
            'amount_paise' => $amountPaise,
            'currency' => 'INR',
            'status' => 'paid',
            'paid_at' => now(),
            'meta' => array_merge([
                'admin_grant' => true,
                'admin_grant_id' => $grantId,
                'pricing' => $pricing,
                'granted_by' => $admin->email ?? (string) $admin->id,
                'granted_by_user_id' => $admin->id,
                'note' => $note !== '' ? $note : null,
            ], $extraMeta),
        ]);
    }
}
