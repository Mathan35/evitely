<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Services\Billing\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_billing_settings_page_loads(): void
    {
        $user = User::factory()->create(['plan' => 'free']);

        $this->actingAs($user)
            ->get(route('billing.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('settings/billing')
                ->where('billing.plan', 'free')
                ->where('billing.is_pro', false));
    }

    public function test_local_activate_grants_pro_season_and_credits(): void
    {
        config(['billing.allow_local_activate' => true]);

        $user = User::factory()->create(['plan' => 'free', 'message_credits' => 0]);

        $this->actingAs($user)
            ->post(route('billing.local.activate'), ['season' => 'pro_season_12'])
            ->assertRedirect();

        $user->refresh();
        $this->assertSame('pro', $user->plan);
        $this->assertNotNull($user->plan_ends_at);
        $this->assertTrue($user->plan_ends_at->greaterThan(now()->addMonths(11)));
        $this->assertSame(400, $user->message_credits);
    }

    public function test_billing_page_lists_site_pack_model(): void
    {
        $user = User::factory()->create(['plan' => 'free']);

        $this->actingAs($user)
            ->get(route('billing.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('settings/billing')
                ->where('billing.billing_model', 'site_packs')
                ->has('billing.packs')
                ->where('billing.seasons', []));
    }

    public function test_free_user_cannot_enable_automated_delivery(): void
    {
        $user = User::factory()->create(['plan' => 'free']);
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->put(route('weddings.invite-delivery-mode', $wedding), ['mode' => 'automated'])
            ->assertSessionHasErrors('mode');
    }

    public function test_pro_user_can_enable_automated_delivery(): void
    {
        $user = User::factory()->create(['plan' => 'pro', 'message_credits' => 50]);
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->put(route('weddings.invite-delivery-mode', $wedding), ['mode' => 'automated'])
            ->assertRedirect();

        $details = $wedding->fresh('setting')->setting?->details ?? [];
        $this->assertSame('automated', $details['invite_delivery_mode'] ?? null);
    }

    public function test_guest_limit_blocks_new_guests_on_free_plan(): void
    {
        config([
            'billing.plans.free.guest_limit' => 2,
            'billing.trial.guest_limit' => 2,
        ]);

        $user = User::factory()->create(['plan' => 'free']);
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'trial',
            'site_trial_ends_at' => now()->addDays(10),
        ]);
        WeddingGuest::factory()->count(2)->create(['event_id' => $wedding->id]);

        $this->actingAs($user)
            ->post(route('weddings.guests.store', $wedding), [
                'first_name' => 'Extra',
                'last_name' => 'Guest',
                'number_of_guests' => 1,
            ])
            ->assertSessionHasErrors('guests');
    }

    public function test_free_trial_allows_only_one_event_per_account(): void
    {
        $user = User::factory()->create(['plan' => 'free']);
        Wedding::factory()->create(['user_id' => $user->id]);

        $billing = app(BillingService::class);
        $this->assertSame(1, $billing->eventLimit($user));
        $this->assertFalse($billing->canCreateEvent($user));

        $this->actingAs($user)
            ->post(route('weddings.store'), [
                'event_type' => 'wedding',
                'invitation_mode' => 'link',
                'theme' => 'classic',
                'title' => 'Second Event',
                'bride_name' => 'Ada',
                'groom_name' => 'Alan',
            ])
            ->assertSessionHasErrors('event');
    }

    public function test_free_cards_never_consume_site_event_limit(): void
    {
        $user = User::factory()->create(['plan' => 'free']);
        Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
        ]);

        $billing = app(BillingService::class);
        $this->assertFalse($billing->canCreateEvent($user));
        $this->assertFalse($billing->canCreateEvent($user, 'link'));
        $this->assertTrue($billing->canCreateEvent($user, 'card'));

        $this->actingAs($user)
            ->post(route('weddings.store'), [
                'event_type' => 'wedding',
                'invitation_mode' => 'card',
                'theme' => 'classic',
                'title' => 'Free Card Invite',
                'bride_name' => 'Ada',
                'groom_name' => 'Alan',
            ])
            ->assertRedirect();

        $this->assertSame(1, $billing->listedEventCount($user));
        $this->assertSame(2, $user->weddings()->count());
        $this->assertTrue($billing->canCreateEvent($user, 'card'));
        $this->assertFalse($billing->canCreateEvent($user, 'link'));
    }

    public function test_card_only_events_do_not_block_first_free_site(): void
    {
        $user = User::factory()->create(['plan' => 'free']);
        Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'card',
        ]);

        $billing = app(BillingService::class);
        $this->assertSame(0, $billing->listedEventCount($user));
        $this->assertTrue($billing->canCreateEvent($user));
        $this->assertTrue($billing->canCreateEvent($user, 'link'));

        $this->actingAs($user)
            ->post(route('weddings.store'), [
                'event_type' => 'wedding',
                'invitation_mode' => 'link',
                'theme' => 'classic',
                'title' => 'First Site',
                'bride_name' => 'Ada',
                'groom_name' => 'Alan',
            ])
            ->assertRedirect();

        $this->assertSame(1, $billing->listedEventCount($user));
    }

    public function test_unsaved_gallery_draft_does_not_block_first_free_trial_event(): void
    {
        $user = User::factory()->create(['plan' => 'free']);
        $draft = Wedding::factory()->create(['user_id' => $user->id]);
        $draft->setting()->update([
            'details' => array_merge(
                is_array($draft->setting?->details) ? $draft->setting->details : [],
                ['editor_saved' => '0'],
            ),
        ]);

        $billing = app(BillingService::class);
        $this->assertSame(0, $billing->listedEventCount($user));
        $this->assertTrue($billing->canCreateEvent($user));

        $this->actingAs($user)
            ->post(route('weddings.store'), [
                'title' => 'First real invite',
                'event_type' => 'custom',
                'invitation_mode' => 'link',
            ])
            ->assertRedirect();

        $this->assertSame(0, Wedding::query()->whereKey($draft->id)->count());
        $this->assertSame(1, $user->weddings()->count());
    }

    public function test_pro_user_can_create_multiple_events(): void
    {
        $user = User::factory()->create(['plan' => 'pro']);
        Wedding::factory()->create(['user_id' => $user->id]);

        $this->assertTrue(app(BillingService::class)->canCreateEvent($user));

        $this->actingAs($user)
            ->post(route('weddings.store'), [
                'event_type' => 'wedding',
                'invitation_mode' => 'link',
                'theme' => 'classic',
                'title' => 'Second Event',
                'bride_name' => 'Ada',
                'groom_name' => 'Alan',
            ])
            ->assertRedirect();
    }

    public function test_billing_set_command_updates_plan(): void
    {
        $user = User::factory()->create(['plan' => 'free', 'email' => 'host@example.com']);

        $this->artisan('billing:set', [
            'email' => 'host@example.com',
            'plan' => 'pro',
            '--credits' => 120,
        ])->assertSuccessful();

        $user->refresh();
        $this->assertSame('pro', app(BillingService::class)->effectivePlan($user));
        $this->assertSame(120, $user->message_credits);
    }
}
