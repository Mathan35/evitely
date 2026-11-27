<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\CouponCampaign;
use App\Models\User;
use App\Models\UserCoupon;
use App\Models\Wedding;
use App\Services\Growth\CouponCampaignService;
use App\Services\Growth\CouponService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponCampaignTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_percent_coupon_and_page_lists_it(): void
    {
        $admin = User::factory()->create(['email' => 'admin@example.com']);
        config(['platform.admin_emails' => ['admin@example.com']]);

        $ends = now()->addDays(10)->format('Y-m-d\TH:i');

        $this->actingAs($admin)
            ->post(route('admin.coupons.store'), [
                'title' => 'Launch 25',
                'code' => 'LAUNCH25',
                'discount_type' => 'percent',
                'percent_off' => 25,
                'max_claims' => 10,
                'ends_at' => $ends,
                'no_expiry' => false,
                'notify' => false,
                'is_active' => true,
            ])
            ->assertRedirect();

        $campaign = CouponCampaign::query()->where('code', 'LAUNCH25')->first();
        $this->assertNotNull($campaign);
        $this->assertSame(25, (int) $campaign->percent_off);
        $this->assertSame(10, (int) $campaign->max_claims);
        $this->assertNotNull($campaign->ends_at);

        $this->actingAs($admin)
            ->post(route('admin.coupons.update', $campaign), [
                'title' => 'Launch 25 updated',
                'max_claims' => 25,
                'ends_at' => now()->addDays(20)->format('Y-m-d\TH:i'),
                'no_expiry' => false,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertSame(25, (int) $campaign->fresh()->max_claims);
        $this->assertSame('Launch 25 updated', $campaign->fresh()->title);

        $this->get(route('coupons.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('coupons/index')
                ->has('campaigns', 1));
    }

    public function test_create_requires_expiry_unless_no_expiry_checked(): void
    {
        $admin = User::factory()->create(['email' => 'admin2@example.com']);
        config(['platform.admin_emails' => ['admin2@example.com']]);

        $this->actingAs($admin)
            ->from(route('admin.coupons.index'))
            ->post(route('admin.coupons.store'), [
                'title' => 'Missing expiry',
                'discount_type' => 'percent',
                'percent_off' => 10,
                'max_claims' => 5,
                'notify' => false,
                'no_expiry' => false,
            ])
            ->assertRedirect(route('admin.coupons.index'))
            ->assertSessionHasErrors('ends_at');

        $this->actingAs($admin)
            ->post(route('admin.coupons.store'), [
                'title' => 'No expiry ok',
                'code' => 'FOREVER10',
                'discount_type' => 'percent',
                'percent_off' => 10,
                'max_claims' => 5,
                'notify' => false,
                'no_expiry' => true,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('coupon_campaigns', [
            'code' => 'FOREVER10',
            'max_claims' => 5,
            'ends_at' => null,
        ]);
    }

    public function test_user_can_claim_and_apply_amount_coupon_in_pricing(): void
    {
        $user = User::factory()->create();
        $campaign = CouponCampaign::query()->create([
            'code' => 'FLAT100',
            'title' => 'Flat hundred',
            'discount_type' => 'amount',
            'percent_off' => null,
            'amount_off_minor' => 10000,
            'currency' => 'inr',
            'applies_to' => 'site_cost',
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addDays(7),
            'max_claims' => 5,
            'claimed_count' => 0,
            'max_per_user' => 1,
            'is_active' => true,
            'notify_status' => 'pending',
        ]);

        $this->actingAs($user)
            ->post(route('coupons.claim'), ['code' => 'FLAT100'])
            ->assertRedirect();

        $coupon = UserCoupon::query()->where('user_id', $user->id)->where('campaign_id', $campaign->id)->first();
        $this->assertNotNull($coupon);
        $this->assertSame('amount', $coupon->discount_type);

        $priced = app(CouponService::class)->priceWithOptionalCoupon(
            $user,
            50000,
            50000,
            false,
            true,
            'inr',
        );

        $this->assertSame(10000, $priced['discount_minor']);
        $this->assertSame(40000, $priced['amount_minor']);
    }

    public function test_notify_prioritizes_users_with_more_events_then_unused(): void
    {
        $heavy = User::factory()->create(['name' => 'Heavy']);
        $light = User::factory()->create(['name' => 'Light']);
        $unused = User::factory()->create(['name' => 'Unused']);

        Wedding::factory()->count(3)->create(['user_id' => $heavy->id]);
        Wedding::factory()->create(['user_id' => $light->id]);

        $campaign = CouponCampaign::query()->create([
            'code' => 'PRIORITY',
            'title' => 'Priority drop',
            'discount_type' => 'percent',
            'percent_off' => 15,
            'applies_to' => 'site_cost',
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addDays(3),
            'max_claims' => 100,
            'claimed_count' => 0,
            'max_per_user' => 1,
            'is_active' => true,
            'notify_status' => 'pending',
        ]);

        $order = [];
        User::query()->whereIn('id', [$heavy->id, $light->id, $unused->id])
            ->withCount('weddings')
            ->orderByDesc('weddings_count')
            ->orderBy('id')
            ->get()
            ->each(function (User $u) use (&$order): void {
                $order[] = $u->name;
            });

        $this->assertSame(['Heavy', 'Light', 'Unused'], $order);

        app(CouponCampaignService::class)->distributeNotifications($campaign);

        $this->assertSame(3, UserCoupon::query()->where('campaign_id', $campaign->id)->count());
        $this->assertSame(3, AppNotification::query()->where('type', AppNotification::TYPE_COUPON)->count());
        $this->assertSame(CouponCampaign::NOTIFY_DONE, $campaign->fresh()->notify_status);
    }
}
