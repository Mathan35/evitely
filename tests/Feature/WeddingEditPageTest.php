<?php

namespace Tests\Feature;

use App\Models\EventCard;
use App\Models\EventType;
use App\Models\User;
use App\Models\Wedding;
use App\Support\CardLibrary;
use App\Support\DesignGallery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WeddingEditPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_edit_page_renders_owner_wedding_payload(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
        ]);

        $wedding->hosts()->delete();
        $wedding->hosts()->createMany([
            ['name' => 'Priya', 'role' => 'bride', 'sort_order' => 1],
            ['name' => 'Arun', 'role' => 'groom', 'sort_order' => 2],
        ]);

        $wedding->setting()->updateOrCreate([], [
            'details' => ['gallery_template' => 'wedding-link-glasshouse'],
            'sections' => [
                'countdown' => true,
                'story' => true,
                'gallery' => true,
                'venue' => true,
                'rsvp' => true,
            ],
        ]);

        $this->actingAs($user)
            ->get(route('weddings.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/edit')
                ->where('wedding.id', $wedding->id)
                ->where('wedding.bride_name', 'Priya')
                ->where('wedding.groom_name', 'Arun')
                ->where('galleryDesign.id', 'wedding-link-glasshouse')
                ->where('gallerySlug', 'wedding')
                ->where('invitationCard', null)
                ->has('userCards')
                ->has('libraryImages')
                ->where('createCardUrl', url('/designs/wedding?tab=cards'))
            );

        $this->assertNotNull(DesignGallery::find('wedding-link-glasshouse'));
    }

    public function test_edit_page_lists_user_created_cards_and_hero_library(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'title' => 'Priya & Arun',
        ]);

        EventCard::query()->create([
            'event_id' => $wedding->id,
            'format' => 'portrait',
            'width' => 400,
            'height' => 640,
            'status' => 'draft',
            'document' => [
                'version' => 1,
                'background' => '#fff',
                'elements' => [],
            ],
        ]);

        $wedding->setting()->updateOrCreate([], [
            'details' => [
                'gallery_template' => 'wedding-link-glasshouse',
                'user_card_event_id' => (string) $wedding->id,
            ],
        ]);

        $this->actingAs($user)
            ->get(route('weddings.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/edit')
                ->has('userCards', 1)
                ->where('userCards.0.event_id', $wedding->id)
                ->where('selectedUserCard.event_id', $wedding->id)
                ->has('libraryImages')
                ->where('createCardUrl', url('/designs/wedding?tab=cards'))
            );
    }

    public function test_edit_page_autosave_fields_persist(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'music_enabled' => false,
            'music_url' => null,
        ]);

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'bride_name' => 'Sophia',
                'groom_name' => 'Daniel',
                'headline' => 'Together with their families',
                'venue_name' => 'The Glasshouse',
                'city' => 'Hudson Valley',
                'state' => 'New York',
                'music_url' => 'https://example.com/song.mp3',
                'music_enabled' => true,
                'details' => [
                    'gallery_template' => 'wedding-link-glasshouse',
                    'dress_code' => 'Cocktail',
                ],
            ])
            ->assertRedirect();

        $wedding->refresh()->load(['hosts', 'setting']);

        $this->assertSame('Sophia', $wedding->displayBride());
        $this->assertSame('Daniel', $wedding->displayGroom());
        $this->assertSame('The Glasshouse', $wedding->venue_name);
        $this->assertSame('Hudson Valley', $wedding->city);
        $this->assertSame('New York', $wedding->state);
        $this->assertTrue($wedding->music_enabled);
        $this->assertSame('https://example.com/song.mp3', $wedding->music_url);
        $this->assertSame('wedding-link-glasshouse', $wedding->setting?->details['gallery_template'] ?? null);
        $this->assertSame('Cocktail', $wedding->setting?->details['dress_code'] ?? null);
    }

    public function test_template_editor_details_persist_guests_venues_hero_and_card(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
        ]);

        $guests = [
            ['id' => 'g1', 'name' => 'Amira Shah', 'party' => '2 guests', 'status' => 'Attending'],
            ['id' => 'g-new', 'name' => 'Priya Nair', 'party' => '1 guest', 'status' => 'Attending'],
        ];
        $ceremony = [
            'title' => 'Ceremony',
            'name' => 'Glass Pavilion',
            'time' => '4:00 PM',
            'address' => '742 Evergreen Terrace, Vancouver',
            'image' => '/images/gallery/previews/glasshouse/venue-ceremony.jpg?v=3',
            'map_image' => '/images/gallery/previews/glasshouse/map-ceremony.jpg?v=3',
            'maps_url' => 'https://www.google.com/maps/search/?api=1&query=Glass+Pavilion',
        ];
        $schedule = [
            ['time' => '3:30 PM', 'title' => 'Guest arrival'],
            ['time' => '4:00 PM', 'title' => 'Ceremony'],
        ];

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'bride_name' => 'Priya',
                'groom_name' => 'Arun',
                'venue_name' => 'The Glasshouse',
                'venue_address' => '742 Evergreen Terrace',
                'city' => 'Vancouver',
                'details' => [
                    'gallery_template' => 'wedding-link-glasshouse',
                    'hero_image' => '/images/gallery/previews/wedding/glasshouse-hero-desktop.jpg?v=11',
                    'hero_message' => 'Join us for an evening under glass.',
                    'story_heading' => "With Our\nFamilies",
                    'guests_json' => json_encode($guests),
                    'ceremony_json' => json_encode($ceremony),
                    'reception_json' => json_encode([
                        'title' => 'Reception',
                        'name' => 'Garden Hall',
                        'time' => '7:00 PM',
                        'address' => '742 Evergreen Terrace, Vancouver',
                        'image' => '/images/gallery/previews/glasshouse/venue-reception.jpg?v=3',
                        'map_image' => '/images/gallery/previews/glasshouse/map-reception.jpg?v=3',
                        'maps_url' => 'https://www.google.com/maps/search/?api=1&query=Garden+Hall',
                    ]),
                    'schedule_json' => json_encode($schedule),
                    'user_card_event_id' => (string) $wedding->id,
                    'card_template' => '',
                    'site_bg_id' => 'blush',
                    'site_bg' => '#faf2f0',
                    'site_surface' => '#f3e6e3',
                ],
            ])
            ->assertRedirect();

        $details = $wedding->refresh()->setting?->details ?? [];

        $this->assertSame('/images/gallery/previews/wedding/glasshouse-hero-desktop.jpg?v=11', $details['hero_image'] ?? null);
        $this->assertSame('Join us for an evening under glass.', $details['hero_message'] ?? null);
        $this->assertSame((string) $wedding->id, $details['user_card_event_id'] ?? null);
        $this->assertSame('blush', $details['site_bg_id'] ?? null);
        $this->assertSame('#faf2f0', $details['site_bg'] ?? null);
        $this->assertSame('#f3e6e3', $details['site_surface'] ?? null);

        $savedGuests = json_decode((string) ($details['guests_json'] ?? '[]'), true);
        $this->assertCount(2, $savedGuests);
        $this->assertSame('Priya Nair', $savedGuests[1]['name']);

        $savedCeremony = json_decode((string) ($details['ceremony_json'] ?? '{}'), true);
        $this->assertSame('Glass Pavilion', $savedCeremony['name'] ?? null);
        $this->assertStringContainsString('maps', (string) ($savedCeremony['maps_url'] ?? ''));

        $savedSchedule = json_decode((string) ($details['schedule_json'] ?? '[]'), true);
        $this->assertCount(2, $savedSchedule);
        $this->assertSame('Guest arrival', $savedSchedule[0]['title']);
    }

    public function test_site_background_persists_for_any_occasion_website(): void
    {
        $user = User::factory()->create();
        $birthdayTypeId = \App\Models\EventType::query()->where('slug', 'birthday')->value('id');

        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'event_type_id' => $birthdayTypeId,
        ]);

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'bride_name' => 'Leo',
                'groom_name' => 'Party',
                'details' => [
                    'gallery_template' => 'birthday-link-neon-glow',
                    'site_bg_id' => 'sage',
                    'site_bg' => '#f2f6f2',
                    'site_surface' => '#e4ede5',
                ],
            ])
            ->assertRedirect();

        $details = $wedding->refresh()->setting?->details ?? [];
        $this->assertSame('sage', $details['site_bg_id'] ?? null);
        $this->assertSame('#f2f6f2', $details['site_bg'] ?? null);
        $this->assertSame('#e4ede5', $details['site_surface'] ?? null);

        $this->actingAs($user)
            ->get(route('weddings.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/edit')
                ->where('wedding.details.site_bg_id', 'sage')
                ->where('wedding.details.site_bg', '#f2f6f2')
                ->where('wedding.details.site_surface', '#e4ede5'));
    }

    public function test_edit_page_reflects_related_event_card_document(): void
    {
        $user = User::factory()->create();
        $eventTypeId = EventType::query()->where('slug', 'wedding')->value('id');

        $website = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'title' => 'Website Event',
            'event_type_id' => $eventTypeId,
        ]);

        $related = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'card',
            'title' => 'Related Card Event',
            'event_type_id' => $eventTypeId,
        ]);

        EventCard::query()->create([
            'event_id' => $related->id,
            'format' => 'invite',
            'width' => 1080,
            'height' => 1440,
            'status' => 'draft',
            'document' => [
                'background' => '#f4efe6',
                'layout_version' => CardLibrary::LAYOUT_VERSION,
                'backgroundImage' => '/images/gallery/cards/wedding-card-black-tie.jpg',
                'elements' => [
                    [
                        'id' => 'names',
                        'type' => 'text',
                        'text' => 'Related Host Names',
                        'x' => 120,
                        'y' => 420,
                        'width' => 840,
                        'height' => 90,
                        'fontSize' => 58,
                        'font' => 'serif',
                        'color' => '#1c1712',
                        'align' => 'center',
                    ],
                ],
            ],
        ]);

        $website->setting()->updateOrCreate([], [
            'details' => [
                'gallery_template' => 'wedding-link-glasshouse',
                'user_card_event_id' => (string) $related->id,
                'card_template' => '',
            ],
        ]);

        $this->actingAs($user)
            ->get(route('weddings.edit', $website))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/edit')
                ->has('userCards', 1)
                ->where('userCards.0.event_id', $related->id)
                ->where('userCards.0.is_current', false)
                ->where('selectedUserCard.event_id', $related->id)
                ->where('selectedUserCard.document.elements.0.text', 'Related Host Names')
                ->where('selectedUserCard.document.elements.0.fontSize', 58)
                ->where('selectedUserCard.document.backgroundImage', '/images/gallery/cards/wedding-card-black-tie.jpg')
            );

        $edited = [
            'background' => '#f4efe6',
            'layout_version' => CardLibrary::LAYOUT_VERSION,
            'backgroundImage' => '/images/gallery/cards/wedding-card-black-tie.jpg',
            'elements' => [
                [
                    'id' => 'names',
                    'type' => 'text',
                    'text' => 'Updated Related Names',
                    'x' => 140,
                    'y' => 440,
                    'width' => 800,
                    'height' => 96,
                    'fontSize' => 62,
                    'font' => 'serif',
                    'color' => '#1c1712',
                    'align' => 'center',
                ],
            ],
        ];

        $this->actingAs($user)
            ->put(route('weddings.card.update', $related), [
                'format' => 'invite',
                'width' => 1080,
                'height' => 1440,
                'document' => $edited,
            ])
            ->assertRedirect();

        $this->actingAs($user)
            ->get(route('weddings.edit', $website))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/edit')
                ->where('selectedUserCard.event_id', $related->id)
                ->where('selectedUserCard.document.elements.0.text', 'Updated Related Names')
                ->where('selectedUserCard.document.elements.0.fontSize', 62)
                ->where('userCards.0.document.elements.0.text', 'Updated Related Names')
            );
    }
}
