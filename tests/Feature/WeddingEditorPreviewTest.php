<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WeddingEditorPreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_edit_preview_props_include_live_template_and_library(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
        ]);

        $wedding->setting()->updateOrCreate([], [
            'details' => [
                'gallery_template' => 'wedding-link-glasshouse',
                'ceremony_json' => json_encode([
                    'title' => 'Ceremony',
                    'name' => 'Glass Pavilion',
                    'time' => '4:00 PM',
                    'address' => '742 Evergreen',
                    'image' => 'https://cdn.example.com/ceremony.jpg',
                    'map_image' => '',
                    'maps_url' => 'https://maps.google.com/?q=Glass+Pavilion',
                ]),
                'guests_json' => json_encode([
                    ['id' => 'g1', 'name' => 'Amira Shah', 'party' => '2 guests', 'status' => 'Attending'],
                ]),
            ],
        ]);

        $response = $this->actingAs($user)
            ->get(route('weddings.edit', $wedding))
            ->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('weddings/edit')
            ->where('galleryDesign.id', 'wedding-link-glasshouse')
            ->where('invitationCard', null)
            ->has('libraryImages')
            ->has('createCardUrl')
            ->has('wedding.details')
        );

        $details = $wedding->refresh()->setting?->details ?? [];
        $ceremony = json_decode((string) ($details['ceremony_json'] ?? '{}'), true);
        $guests = json_decode((string) ($details['guests_json'] ?? '[]'), true);
        $this->assertSame('https://cdn.example.com/ceremony.jpg', $ceremony['image'] ?? null);
        $this->assertSame('Amira Shah', $guests[0]['name'] ?? null);
    }

    public function test_photo_upload_flashes_url_and_keeps_editor_usable(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
        ]);

        $wedding->setting()->updateOrCreate([], [
            'details' => ['gallery_template' => 'wedding-link-glasshouse'],
        ]);

        $file = UploadedFile::fake()->image('venue.jpg', 1200, 800);

        $this->actingAs($user)
            ->post(route('weddings.photos.store', $wedding), [
                'photo' => $file,
                'caption' => 'Venue photo',
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('event_photos', 1);

        $this->actingAs($user)
            ->get(route('weddings.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/edit')
                ->has('libraryImages')
            );
    }

    public function test_venue_and_guest_details_round_trip_for_preview(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
        ]);

        $ceremony = [
            'title' => 'Ceremony',
            'name' => 'Updated Pavilion',
            'time' => '5:00 PM',
            'address' => '100 Preview Lane',
            'image' => 'https://cdn.example.com/new-ceremony.jpg',
            'map_image' => '',
            'maps_url' => 'https://maps.google.com/?q=Updated+Pavilion',
        ];

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'bride_name' => 'Priya',
                'groom_name' => 'Arun',
                'details' => [
                    'gallery_template' => 'wedding-link-glasshouse',
                    'ceremony_json' => json_encode($ceremony),
                    'schedule_json' => json_encode([
                        ['time' => '5:00 PM', 'title' => 'Ceremony'],
                        ['time' => '7:00 PM', 'title' => 'Reception'],
                    ]),
                    'guests_json' => json_encode([
                        ['id' => 'g-new', 'name' => 'Live Guest', 'party' => '1 guest', 'status' => 'Attending'],
                    ]),
                    'hero_image' => 'https://cdn.example.com/hero.jpg',
                ],
            ])
            ->assertRedirect();

        $details = $wedding->refresh()->setting?->details ?? [];
        $savedCeremony = json_decode((string) ($details['ceremony_json'] ?? '{}'), true);
        $savedGuests = json_decode((string) ($details['guests_json'] ?? '[]'), true);

        $this->assertSame('Updated Pavilion', $savedCeremony['name'] ?? null);
        $this->assertSame('https://cdn.example.com/new-ceremony.jpg', $savedCeremony['image'] ?? null);
        $this->assertSame('Live Guest', $savedGuests[0]['name'] ?? null);
        $this->assertSame('https://cdn.example.com/hero.jpg', $details['hero_image'] ?? null);
    }
}
