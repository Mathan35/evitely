<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudioGuestsDirectoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_directory_includes_share_url_and_events(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'slug' => 'priya-arun',
            'title' => 'Priya & Arun',
        ]);

        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'first_name' => 'Maya',
            'last_name' => 'Shah',
            'guest_token' => 'tokendemo123456',
        ]);

        $this->actingAs($user)
            ->get(route('guests.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('studio/guests')
                ->has('events', 1)
                ->has('guests', 1)
                ->where('guests.0.name', $guest->fullName())
                ->where('guests.0.guest_url', fn ($url) => is_string($url) && str_contains($url, 'tokendemo123456'))
                ->where('events.0.id', $wedding->id)
            );
    }
}
