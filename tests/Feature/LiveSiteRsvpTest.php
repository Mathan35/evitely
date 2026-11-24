<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LiveSiteRsvpTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_invite_page_accepts_a_real_rsvp(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->for($user)->create([
            'status' => 'published',
            'slug' => 'celebration-rsvp-live',
            'invitation_mode' => 'link',
        ]);

        $this->get(route('weddings.public', $wedding->slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('public/wedding')
                ->where('preview', false)
                ->where('wedding.slug', 'celebration-rsvp-live'));

        $this->post(route('weddings.rsvp', $wedding->slug), [
            'guest_name' => 'Alex Guest',
            'email' => 'alex.guest@example.com',
            'status' => 'attending',
            'guest_count' => 2,
            'message' => 'Cannot wait!',
        ])->assertRedirect();

        $this->assertDatabaseHas('event_rsvps', [
            'event_id' => $wedding->id,
            'email' => 'alex.guest@example.com',
            'guest_name' => 'Alex Guest',
            'guest_count' => 2,
        ]);
    }

    public function test_owner_view_site_preview_still_posts_real_rsvps_for_the_event_slug(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->for($user)->create([
            'status' => 'published',
            'slug' => 'owner-view-site-rsvp',
            'invitation_mode' => 'link',
        ]);

        $this->actingAs($user)
            ->get(route('weddings.preview', $wedding))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('weddings/preview')
                ->where('wedding.slug', 'owner-view-site-rsvp'));

        // View site uses the same invite RSVP endpoints as the public page.
        $this->post(route('weddings.rsvp', $wedding->slug), [
            'guest_name' => 'Owner Test',
            'email' => 'owner.test@example.com',
            'status' => 'maybe',
            'guest_count' => 1,
        ])->assertRedirect();

        $this->assertDatabaseHas('event_rsvps', [
            'event_id' => $wedding->id,
            'email' => 'owner.test@example.com',
            'guest_name' => 'Owner Test',
        ]);
    }
}
