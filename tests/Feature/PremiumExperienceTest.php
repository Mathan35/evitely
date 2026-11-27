<?php

namespace Tests\Feature;

use App\Enums\WeddingStatus;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Services\Premium\PostEventExperienceService;
use App\Services\Premium\ShareKitService;
use App\Support\IndianWeddingItinerary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PremiumExperienceTest extends TestCase
{
    use RefreshDatabase;

    public function test_indian_itinerary_preset_applies_multi_day_schedule(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'starts_on' => '2026-12-20',
            'status' => WeddingStatus::Draft,
        ]);

        $this->actingAs($user)
            ->post(route('weddings.events.apply-itinerary', $wedding), [
                'preset' => 'classic_north',
                'replace' => true,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(5, $wedding->events()->count());
        $this->assertDatabaseHas('event_schedules', [
            'event_id' => $wedding->id,
            'title' => 'Mehendi',
            'event_type' => 'mehendi',
        ]);
        $this->assertDatabaseHas('event_schedules', [
            'event_id' => $wedding->id,
            'title' => 'Wedding ceremony',
            'event_type' => 'ceremony',
        ]);
        $wedding->refresh()->load('setting');
        $this->assertSame(
            'classic_north',
            $wedding->setting?->details['itinerary_pack_id'] ?? null,
        );
    }

    public function test_share_kit_builds_host_facing_payload(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'title' => 'Asha & Rohan',
            'status' => WeddingStatus::Published,
        ]);

        $kit = app(ShareKitService::class)->forWedding($wedding);

        $this->assertSame('Asha & Rohan', $kit['title']);
        $this->assertNotEmpty($kit['public_url']);
        $this->assertNotEmpty($kit['public_text']);
        $this->assertStringContainsString('wa.me', $kit['whatsapp_url']);
        $this->assertNotEmpty($kit['story_caption']);
    }

    public function test_expired_published_site_shows_celebration_ended_page(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'both',
            'site_billing_status' => 'expired',
            'site_pack_ends_at' => now()->subDay(),
            'live_paused_at' => null,
        ]);

        $this->assertTrue(app(PostEventExperienceService::class)->shouldShowEnded($wedding));

        $this->get('/invite/'.$wedding->slug)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('public/celebration-ended'));
    }

    public function test_rsvp_flashes_named_thank_you_by_default(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'both',
            'site_billing_status' => 'paid',
            'site_pack_ends_at' => now()->addDays(10),
        ]);
        $wedding->setting()->update([
            'details' => array_merge(
                is_array($wedding->setting?->details) ? $wedding->setting->details : [],
                ['rsvp_thank_you_enabled' => '1'],
            ),
        ]);

        $this->post(route('weddings.rsvp', $wedding->slug), [
            'guest_name' => 'Priya Sharma',
            'email' => 'priya@example.com',
            'status' => 'attending',
            'guest_count' => 2,
        ])->assertRedirect();

        $this->assertTrue(session()->has('rsvp_thank_you'));
        $this->assertSame('Priya Sharma', session('rsvp_thank_you.guest_name'));
    }

    public function test_home_marketing_includes_flagships(): void
    {
        $payload = \App\Support\HomeMarketing::payload();

        $this->assertArrayHasKey('flagships', $payload);
        $this->assertNotEmpty($payload['flagships']);
        $this->assertArrayHasKey('title', $payload['flagships'][0]);
        $this->assertArrayHasKey('href', $payload['flagships'][0]);
    }

    public function test_itinerary_presets_catalog_is_complete(): void
    {
        $presets = IndianWeddingItinerary::presets();
        $this->assertArrayHasKey('classic_north', $presets);
        $this->assertArrayHasKey('classic_south', $presets);
        $rows = IndianWeddingItinerary::expand('intimate', now()->addMonth());
        $this->assertCount(3, $rows);
        $this->assertSame('Haldi', $rows[0]['title']);
    }

    public function test_owner_manage_payload_includes_share_kit_and_itinerary_presets(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('weddings.show', $wedding))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('weddings/show')
                ->has('wedding.share_kit')
                ->has('wedding.itinerary_presets'));
    }

    public function test_personal_guest_link_includes_named_guest_on_public_page(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'both',
            'site_billing_status' => 'paid',
            'site_pack_ends_at' => now()->addDays(10),
        ]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'first_name' => 'Ananya',
            'last_name' => 'Iyer',
        ]);

        $this->get(route('weddings.guest', ['slug' => $wedding->slug, 'token' => $guest->guest_token]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('public/wedding')
                ->where('wedding.guest.name', 'Ananya Iyer'));
    }
}
