<?php

namespace Tests\Feature;

use App\Models\PartnerCode;
use App\Models\User;
use App\Models\Wedding;
use App\Services\Growth\GrowthService;
use App\Services\WeddingPublishingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GrowthReferralTest extends TestCase
{
    use RefreshDatabase;

    public function test_referral_code_assigned_on_register_and_reward_on_friend_publish(): void
    {
        config([
            'billing.allow_local_activate' => true,
            'billing.driver' => 'local',
            'billing.trial_days' => 30,
            'growth.referral.enabled' => true,
            'growth.referral.reward_site_days' => 7,
            'growth.referral.reward_credits' => 25,
        ]);

        $growth = app(GrowthService::class);
        $growth->seedPartnerCodes();

        $referrer = User::factory()->create();
        $code = $growth->ensureReferralCode($referrer);
        $this->assertNotSame('', $code);

        $referrerWedding = Wedding::factory()->create([
            'user_id' => $referrer->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'trial',
            'site_trial_ends_at' => now()->addDays(10),
        ]);
        $beforeEnds = $referrerWedding->site_trial_ends_at->copy();
        $beforeCredits = (int) $referrer->message_credits;

        $friend = User::factory()->create();
        $growth->attachSignupCodes($friend, $code, null);
        $friend->refresh();
        $this->assertSame($referrer->id, (int) $friend->referred_by_user_id);

        $friendWedding = Wedding::factory()->create([
            'user_id' => $friend->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
        ]);

        app(WeddingPublishingService::class)->publish($friendWedding);

        $referrerWedding->refresh();
        $referrer->refresh();
        $friend->refresh();

        $this->assertNotNull($friend->referral_rewarded_at);
        $this->assertTrue($referrerWedding->site_trial_ends_at->greaterThan($beforeEnds->addDays(6)));
        $this->assertSame($beforeCredits + 25, (int) $referrer->message_credits);
    }

    public function test_partner_code_extends_trial_on_publish(): void
    {
        config([
            'billing.allow_local_activate' => true,
            'billing.driver' => 'local',
            'billing.trial_days' => 30,
            'growth.partner.enabled' => true,
        ]);

        $growth = app(GrowthService::class);
        $growth->seedPartnerCodes();
        $partner = PartnerCode::query()->where('code', 'PHOTOGRAPHY')->first();
        $this->assertNotNull($partner);

        $user = User::factory()->create();
        $growth->attachSignupCodes($user, null, 'PHOTOGRAPHY');
        $user->refresh();
        $this->assertSame($partner->id, (int) $user->partner_code_id);

        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
        ]);

        app(WeddingPublishingService::class)->publish($wedding);
        $wedding->refresh();
        $user->refresh();

        $this->assertSame('trial', $wedding->site_billing_status);
        $this->assertNotNull($user->partner_rewarded_at);
        // 30 trial + 14 partner bonus
        $this->assertTrue($wedding->site_trial_ends_at->greaterThan(now()->addDays(40)));
    }

    public function test_record_share_increments_growth_counters(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'growth_share_count' => 0,
        ]);

        $this->actingAs($user)
            ->postJson(route('weddings.growth.share', $wedding))
            ->assertOk()
            ->assertJsonPath('growth.share_count', 1)
            ->assertJsonPath('growth.has_shared', true);

        $this->assertSame(1, (int) $wedding->fresh()->growth_share_count);
        $this->assertNotNull($wedding->fresh()->first_shared_at);
    }

    public function test_trial_and_guest_limits_from_config(): void
    {
        $this->assertSame(30, (int) config('billing.trial_days'));
        $this->assertSame(100, (int) config('billing.trial.guest_limit'));
        $this->assertSame(100, (int) config('billing.plans.free.guest_limit'));
    }
}
