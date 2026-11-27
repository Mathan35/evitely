<?php

namespace App\Services\Admin;

use App\Enums\WeddingStatus;
use App\Models\BillingPayment;
use App\Models\EventCollaborator;
use App\Models\GalleryFavorite;
use App\Models\GrowthReward;
use App\Models\SocialAccount;
use App\Models\SupportMessage;
use App\Models\User;
use App\Models\UserCoupon;
use App\Models\Wedding;
use App\Services\PlatformReadinessService;
use App\Services\WeddingPublishingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AdminUserLifecycleService
{
    public function __construct(
        private PlatformReadinessService $platform,
        private WeddingPublishingService $publishing,
    ) {}

    /**
     * Snapshot of what deactivate / purge will touch.
     *
     * @return array{
     *     events: int,
     *     published_events: int,
     *     guests: int,
     *     payments: int,
     *     coupons: int,
     *     collaborations: int,
     *     support_messages: int,
     *     social_accounts: int,
     *     favorites: int,
     *     is_platform_admin: bool,
     *     can_deactivate: bool,
     *     can_purge: bool,
     *     block_reason: string|null
     * }
     */
    public function impact(User $user, ?User $actor = null): array
    {
        $events = Wedding::withTrashed()->where('user_id', $user->id);
        $eventIds = (clone $events)->pluck('id');

        $guests = 0;
        if ($eventIds->isNotEmpty()) {
            $guests = (int) Wedding::withTrashed()
                ->where('user_id', $user->id)
                ->withCount('guests')
                ->get()
                ->sum('guests_count');
        }

        $isAdmin = $this->platform->isAdmin($user) || $this->emailIsListedAdmin($user);
        $self = $actor !== null && (int) $actor->id === (int) $user->id;
        $block = null;
        if ($self) {
            $block = 'You cannot deactivate or delete your own account from admin.';
        } elseif ($isAdmin) {
            $block = 'Platform admin accounts cannot be deactivated or deleted here.';
        }

        return [
            'events' => (int) $events->count(),
            'published_events' => (int) (clone $events)->where('status', WeddingStatus::Published)->count(),
            'guests' => $guests,
            'payments' => (int) BillingPayment::query()->where('user_id', $user->id)->count(),
            'coupons' => (int) UserCoupon::query()->where('user_id', $user->id)->count(),
            'collaborations' => (int) EventCollaborator::query()->where('user_id', $user->id)->count(),
            'support_messages' => (int) SupportMessage::query()->where('user_id', $user->id)->count(),
            'social_accounts' => (int) SocialAccount::query()->where('user_id', $user->id)->count(),
            'favorites' => (int) GalleryFavorite::query()->where('user_id', $user->id)->count(),
            'is_platform_admin' => $isAdmin,
            'can_deactivate' => $block === null,
            'can_purge' => $block === null,
            'block_reason' => $block,
        ];
    }

    /**
     * Soft lock: blocks login, ends sessions, takes public sites offline.
     *
     * @return array{unpublished: int}
     */
    public function deactivate(User $user, User $actor): array
    {
        $this->assertMutable($user, $actor);

        $unpublished = 0;

        DB::transaction(function () use ($user, &$unpublished): void {
            $user->forceFill([
                'disabled_at' => now(),
                'remember_token' => null,
            ])->save();

            $published = Wedding::query()
                ->where('user_id', $user->id)
                ->where('status', WeddingStatus::Published)
                ->get();

            foreach ($published as $wedding) {
                $this->publishing->unpublish($wedding);
                $unpublished++;
            }

            $this->revokeSessions($user);
            $this->forgetPasswordResets($user);
        });

        return ['unpublished' => $unpublished];
    }

    public function reactivate(User $user, User $actor): void
    {
        if ((int) $actor->id === (int) $user->id) {
            // Allow self-enable only via other flows; admin enabling others is fine.
        }

        if ($this->emailIsListedAdmin($user) && $user->isDisabled()) {
            // Listed admins may be re-enabled so ops can recover.
        }

        $user->forceFill(['disabled_at' => null])->save();
    }

    /**
     * Permanently remove the account and owned product data.
     *
     * @return array<string, int|string>
     */
    public function purge(User $user, User $actor, string $confirmationEmail): array
    {
        $this->assertMutable($user, $actor);

        if (strcasecmp(trim($confirmationEmail), trim((string) $user->email)) !== 0) {
            throw ValidationException::withMessages([
                'confirmation' => 'Type the account email exactly to confirm permanent deletion.',
            ]);
        }

        $impact = $this->impact($user, $actor);
        $snapshot = [
            'user_id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'plan' => $user->plan,
            'impact' => $impact,
        ];

        DB::transaction(function () use ($user): void {
            $weddings = Wedding::withTrashed()->where('user_id', $user->id)->get();
            foreach ($weddings as $wedding) {
                $this->purgeWeddingAssets($wedding);
                $wedding->forceDelete();
            }

            // Cashier tables are not FK-constrained to users.
            if (Schema::hasTable('subscription_items') && Schema::hasTable('subscriptions')) {
                $subscriptionIds = DB::table('subscriptions')->where('user_id', $user->id)->pluck('id');
                if ($subscriptionIds->isNotEmpty()) {
                    DB::table('subscription_items')->whereIn('subscription_id', $subscriptionIds)->delete();
                }
                DB::table('subscriptions')->where('user_id', $user->id)->delete();
            }

            if (Schema::hasTable('growth_rewards')) {
                GrowthReward::query()->where('user_id', $user->id)->delete();
                GrowthReward::query()->where('source_user_id', $user->id)->update(['source_user_id' => null]);
            }

            UserCoupon::query()->where('source_user_id', $user->id)->update(['source_user_id' => null]);
            EventCollaborator::query()->where('user_id', $user->id)->update(['user_id' => null]);
            EventCollaborator::query()->where('invited_by', $user->id)->update(['invited_by' => null]);
            SupportMessage::query()->where('user_id', $user->id)->update(['user_id' => null]);

            // Detach referrals pointing at this user.
            User::query()->where('referred_by_user_id', $user->id)->update(['referred_by_user_id' => null]);

            $this->revokeSessions($user);
            $this->forgetPasswordResets($user);

            if (filled($user->avatar)) {
                $avatar = (string) $user->avatar;
                if (! str_starts_with($avatar, 'http') && Storage::disk('public')->exists($avatar)) {
                    Storage::disk('public')->delete($avatar);
                }
            }

            // Owned rows with cascadeOnDelete: payments, coupons, notifications,
            // social accounts, favorites, passkeys, events (already force-deleted).
            $user->delete();
        });

        return $snapshot;
    }

    private function assertMutable(User $user, User $actor): void
    {
        if ((int) $user->id === (int) $actor->id) {
            throw ValidationException::withMessages([
                'user' => 'You cannot deactivate or delete your own account from admin.',
            ]);
        }

        if ($this->platform->isAdmin($user) || $this->emailIsListedAdmin($user)) {
            throw ValidationException::withMessages([
                'user' => 'Platform admin accounts cannot be deactivated or deleted here.',
            ]);
        }
    }

    private function emailIsListedAdmin(User $user): bool
    {
        $emails = collect(config('platform.admin_emails', []))
            ->filter()
            ->map(fn ($email) => strtolower(trim((string) $email)))
            ->all();

        return in_array(strtolower((string) $user->email), $emails, true);
    }

    private function revokeSessions(User $user): void
    {
        if (! Schema::hasTable('sessions')) {
            return;
        }

        DB::table('sessions')->where('user_id', $user->id)->delete();
    }

    private function forgetPasswordResets(User $user): void
    {
        if (! Schema::hasTable('password_reset_tokens')) {
            return;
        }

        DB::table('password_reset_tokens')->where('email', $user->email)->delete();
    }

    private function purgeWeddingAssets(Wedding $wedding): void
    {
        $disk = Storage::disk('public');
        $dir = 'weddings/'.$wedding->id;
        if ($disk->exists($dir)) {
            $disk->deleteDirectory($dir);
        }

        if (filled($wedding->cover_image) && $disk->exists((string) $wedding->cover_image)) {
            $disk->delete((string) $wedding->cover_image);
        }

        if (filled($wedding->music_url)) {
            $music = (string) $wedding->music_url;
            // Stored as public disk path in newer uploads; ignore absolute URLs.
            if (! str_starts_with($music, 'http') && $disk->exists($music)) {
                $disk->delete($music);
            }
        }
    }
}
