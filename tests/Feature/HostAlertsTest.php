<?php

namespace Tests\Feature;

use App\Enums\GuestbookStatus;
use App\Enums\RsvpStatus;
use App\Enums\WeddingStatus;
use App\Models\GuestbookEntry;
use App\Models\GuestPhoto;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingRsvp;
use App\Services\HostAlertsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HostAlertsTest extends TestCase
{
    use RefreshDatabase;

    public function test_host_alerts_service_aggregates_rsvp_wish_and_photo_activity(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
            'title' => 'Asha & Rohan',
        ]);

        WeddingRsvp::query()->create([
            'event_id' => $wedding->id,
            'guest_name' => 'Maya',
            'email' => 'maya@example.com',
            'status' => RsvpStatus::Attending,
            'guest_count' => 2,
        ]);

        GuestbookEntry::query()->create([
            'event_id' => $wedding->id,
            'name' => 'Dev',
            'message' => 'Congratulations!',
            'status' => GuestbookStatus::Pending,
        ]);

        GuestPhoto::query()->create([
            'event_id' => $wedding->id,
            'name' => 'Neha',
            'caption' => 'From the mehndi',
            'photo_path' => 'guest-photos/neha.jpg',
            'status' => GuestbookStatus::Pending,
        ]);

        $alerts = app(HostAlertsService::class)->forUser($user);

        $this->assertSame(1, $alerts['rsvps']);
        $this->assertSame(1, $alerts['wishes']);
        $this->assertSame(1, $alerts['photos']);
        $this->assertSame(3, $alerts['total']);
        $this->assertCount(3, $alerts['items']);
        $this->assertContains('wish', array_column($alerts['items'], 'type'));
        $this->assertContains('photo', array_column($alerts['items'], 'type'));
        $this->assertContains('rsvp', array_column($alerts['items'], 'type'));
    }

    public function test_authenticated_studio_pages_share_host_alerts(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);

        GuestbookEntry::query()->create([
            'event_id' => $wedding->id,
            'name' => 'Pending Wish',
            'message' => 'So happy for you',
            'status' => GuestbookStatus::Pending,
        ]);

        $this->actingAs($user)
            ->get(route('weddings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('hostAlerts')
                ->where('hostAlerts.wishes', 1)
                ->where('hostAlerts.total', 1));
    }
}
