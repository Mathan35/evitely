<?php

namespace Tests\Feature;

use App\Enums\WeddingStatus;
use App\Models\User;
use App\Models\Wedding;
use App\Services\Billing\SiteBillingService;
use App\Services\WeddingPublishingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrialPublishAndLivePauseTest extends TestCase
{
    use RefreshDatabase;

    public function test_free_user_can_create_multiple_site_drafts(): void
    {
        $user = User::factory()->create(['plan' => 'free']);

        $this->assertTrue(app(\App\Services\Billing\BillingService::class)->canCreateEvent($user, 'link'));

        Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'status' => WeddingStatus::Draft,
            'site_billing_status' => 'draft_ready',
        ]);
        Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'status' => WeddingStatus::Draft,
            'site_billing_status' => 'draft_ready',
        ]);

        $this->assertTrue(app(\App\Services\Billing\BillingService::class)->canCreateEvent($user, 'link'));
    }

    public function test_only_one_trial_publish_per_account(): void
    {
        $user = User::factory()->create(['plan' => 'free']);
        $first = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'status' => WeddingStatus::Draft,
            'site_billing_status' => 'draft_ready',
            'title' => 'First Celebration',
        ]);
        $second = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'status' => WeddingStatus::Draft,
            'site_billing_status' => 'draft_ready',
            'title' => 'Second Celebration',
        ]);

        app(WeddingPublishingService::class)->publish($first);
        $first->refresh();
        $this->assertSame('trial', $first->site_billing_status);
        $this->assertNotNull($first->site_trial_started_at);

        $usage = app(SiteBillingService::class)->accountTrialUsage($user, $second);
        $this->assertFalse($usage['available']);
        $this->assertSame($first->id, $usage['used_on']['id'] ?? null);

        $this->actingAs($user)
            ->post(route('weddings.publish', $second))
            ->assertRedirect();

        $second->refresh();
        $this->assertSame(WeddingStatus::Draft, $second->status);
        $this->assertNotSame('trial', $second->site_billing_status);
    }

    public function test_stop_live_hides_from_guests_without_unpublishing(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'status' => WeddingStatus::Draft,
            'site_billing_status' => 'draft_ready',
            'slug' => 'pause-demo',
        ]);

        $publishing = app(WeddingPublishingService::class);
        $publishing->publish($wedding);
        $wedding->refresh();

        $this->assertTrue($wedding->isGuestAccessible());

        $this->actingAs($user)
            ->delete(route('weddings.unpublish', $wedding))
            ->assertRedirect();

        $wedding->refresh();
        $this->assertSame(WeddingStatus::Published, $wedding->status);
        $this->assertTrue($wedding->isLivePaused());
        $this->assertFalse($wedding->isGuestAccessible());
        $this->assertSame('trial', $wedding->site_billing_status);

        // Guests (logged out) see the paused notice — not a 404.
        auth()->logout();
        $this->get(route('weddings.public', $wedding->slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('public/paused')
                ->where('slug', $wedding->slug));

        // Owner still sees the full invite while paused (studio preview).
        $this->actingAs($user)
            ->get(route('weddings.public', $wedding->slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('public/wedding'));

        $this->actingAs($user)
            ->post(route('weddings.publish', $wedding))
            ->assertRedirect();

        $wedding->refresh();
        $this->assertFalse($wedding->isLivePaused());
        $this->assertTrue($wedding->isGuestAccessible());
    }

    public function test_expired_trial_is_not_guest_accessible(): void
    {
        $wedding = Wedding::factory()->create([
            'invitation_mode' => 'link',
            'status' => WeddingStatus::Published,
            'site_billing_status' => 'expired',
            'site_trial_started_at' => now()->subDays(40),
            'site_trial_ends_at' => now()->subDay(),
            'live_paused_at' => null,
        ]);

        $this->assertFalse($wedding->isGuestAccessible());
    }
}
