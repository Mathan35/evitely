<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use App\Services\Billing\CustomSitePackPricer;
use App\Services\Billing\SiteBillingService;
use App\Services\WeddingPublishingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteBillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_unpaid_publish_starts_trial_once(): void
    {
        config(['billing.allow_local_activate' => true, 'billing.driver' => 'local']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
        ]);

        app(WeddingPublishingService::class)->publish($wedding);
        $wedding->refresh();

        $this->assertSame('trial', $wedding->site_billing_status);
        $this->assertNotNull($wedding->site_trial_ends_at);
        $this->assertTrue(
            $wedding->site_trial_ends_at->greaterThan(now()->addDays(25)),
            'Trial should last about 30 days',
        );

        $ends = $wedding->site_trial_ends_at->copy();
        app(WeddingPublishingService::class)->publish($wedding->fresh());
        $this->assertTrue($wedding->fresh()->site_trial_ends_at->equalTo($ends));
    }

    public function test_schedule_without_pay_fails(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
        ]);

        $this->actingAs($user)
            ->postJson(route('weddings.billing.schedule', $wedding), [
                'scheduled_publish_at' => now()->addDays(3)->toDateTimeString(),
            ])
            ->assertStatus(422);
    }

    public function test_fixed_pack_local_activates_and_schedule_job_publishes(): void
    {
        config(['billing.allow_local_activate' => true, 'billing.driver' => 'local']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
            'status' => \App\Enums\WeddingStatus::Draft,
        ]);

        $site = app(SiteBillingService::class);
        $site->fulfillFixedPackPayment($wedding, $user, 'site_30', 150, [
            'go_live_mode' => 'schedule',
            'scheduled_publish_at' => now()->subMinute()->toDateTimeString(),
        ]);

        $wedding->refresh();
        $this->assertSame('awaiting_go_live', $wedding->site_billing_status);
        $this->assertSame('pending', $wedding->scheduled_publish_status);
        $this->assertNotNull($wedding->scheduled_publish_at);

        // Ensure due for the lifecycle query even if clock skew.
        $wedding->forceFill([
            'scheduled_publish_at' => now()->subMinutes(2),
            'scheduled_publish_status' => 'pending',
            'site_billing_status' => 'awaiting_go_live',
        ])->save();

        $count = $site->activateDueSchedules();
        $this->assertGreaterThanOrEqual(1, $count);

        $wedding->refresh();
        $this->assertSame('paid', $wedding->site_billing_status);
        $this->assertTrue($wedding->isPublic());
        $this->assertSame(150, (int) $user->fresh()->message_credits);
    }

    public function test_custom_quote_costs_more_than_fixed_thirty(): void
    {
        $pricer = app(CustomSitePackPricer::class);
        $quote = $pricer->quote(now()->toDateString(), now()->addDays(29)->toDateString(), 'inr');
        $fixed = (int) config('billing.site_packs.site_30.price_inr_paise');

        $this->assertSame(30, $quote['days']);
        $this->assertGreaterThan($fixed, $quote['amount_minor']);
    }

    public function test_card_only_never_starts_trial(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'card',
            'site_billing_status' => 'none',
        ]);

        app(WeddingPublishingService::class)->publish($wedding);
        $this->assertSame('none', $wedding->fresh()->site_billing_status);
    }

    public function test_automation_blocked_on_trial(): void
    {
        $user = User::factory()->create(['message_credits' => 10]);
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'trial',
            'site_trial_ends_at' => now()->addDays(3),
        ]);

        $state = app(SiteBillingService::class)->state($wedding);
        $this->assertFalse($state->canAutomate);
        $this->assertSame(100, $state->guestLimit);
    }

    public function test_custom_aligns_schedule_to_from_date(): void
    {
        config(['billing.allow_local_activate' => true, 'billing.driver' => 'local']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
            'status' => \App\Enums\WeddingStatus::Draft,
        ]);

        $from = now()->addDays(10)->toDateString();
        $to = now()->addDays(24)->toDateString();

        $site = app(SiteBillingService::class);
        $site->fulfillCustomPackPayment($wedding, $user, $from, $to, 60, [
            'go_live_mode' => 'schedule',
            'currency' => 'inr',
        ]);

        $wedding->refresh();
        $this->assertSame('awaiting_go_live', $wedding->site_billing_status);
        $this->assertSame($from, $wedding->site_custom_starts_on?->toDateString());
        $this->assertSame('pending', $wedding->scheduled_publish_status);
        $this->assertTrue(
            $wedding->scheduled_publish_at?->toDateString() === $from
        );
    }

    public function test_legacy_pro_can_schedule_without_new_pay(): void
    {
        $user = User::factory()->create([
            'plan' => 'pro',
            'plan_ends_at' => now()->addMonth(),
        ]);
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
            'status' => \App\Enums\WeddingStatus::Draft,
        ]);

        $site = app(SiteBillingService::class);
        $site->schedulePublish($wedding, now()->addDays(2));

        $wedding->refresh();
        $this->assertSame('awaiting_go_live', $wedding->site_billing_status);
        $this->assertSame('pending', $wedding->scheduled_publish_status);
    }

    public function test_early_publish_while_awaiting_starts_paid_immediately(): void
    {
        config(['billing.allow_local_activate' => true, 'billing.driver' => 'local']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
            'status' => \App\Enums\WeddingStatus::Draft,
        ]);

        $site = app(SiteBillingService::class);
        $site->fulfillFixedPackPayment($wedding, $user, 'site_15', 50, [
            'go_live_mode' => 'schedule',
            'scheduled_publish_at' => now()->addDays(5)->toDateTimeString(),
        ]);

        $this->assertSame('awaiting_go_live', $wedding->fresh()->site_billing_status);

        app(WeddingPublishingService::class)->publish($wedding->fresh());
        $wedding->refresh();

        $this->assertSame('paid', $wedding->site_billing_status);
        $this->assertTrue($wedding->isPublic());
        $this->assertNotNull($wedding->site_pack_starts_at);
        $this->assertNotNull($wedding->site_pack_ends_at);
    }

    public function test_guest_limit_paid_vs_trial(): void
    {
        $user = User::factory()->create();
        $trial = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'trial',
            'site_trial_ends_at' => now()->addDays(2),
        ]);
        $paid = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'paid',
            'site_pack_ends_at' => now()->addDays(20),
        ]);

        $site = app(SiteBillingService::class);
        $this->assertSame(100, $site->state($trial)->guestLimit);
        $this->assertSame(500, $site->state($paid)->guestLimit);
    }

    public function test_expired_blocks_edit(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'expired',
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        app(SiteBillingService::class)->assertCanEditSite($wedding);
    }
}
