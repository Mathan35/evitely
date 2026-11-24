<?php

namespace Tests\Feature;

use App\Enums\WeddingStatus;
use App\Models\User;
use App\Models\Wedding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WeddingPreviewPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_page_passes_gallery_design_and_saved_details(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'venue_name' => 'Crystal Hall',
        ]);

        $wedding->hosts()->delete();
        $wedding->hosts()->createMany([
            ['name' => 'Priya', 'role' => 'bride', 'sort_order' => 1],
            ['name' => 'Arun', 'role' => 'groom', 'sort_order' => 2],
        ]);

        $wedding->setting()->updateOrCreate([], [
            'details' => [
                'gallery_template' => 'wedding-link-glasshouse',
                'hero_message' => 'Join us under glass.',
                'ceremony_json' => json_encode([
                    'title' => 'Ceremony',
                    'name' => 'Crystal Hall Preview',
                    'time' => '4:00 PM',
                    'address' => '100 Preview Lane',
                    'image' => 'https://cdn.example.com/ceremony.jpg',
                    'map_image' => '',
                    'maps_url' => 'https://maps.google.com/?q=Crystal+Hall',
                ]),
                'guests_json' => json_encode([
                    ['id' => 'g1', 'name' => 'Live Guest', 'party' => '1 guest', 'status' => 'Attending'],
                ]),
                'hero_image' => 'https://cdn.example.com/hero.jpg',
            ],
        ]);

        $this->actingAs($user)
            ->get(route('weddings.preview', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/preview')
                ->where('galleryDesign.id', 'wedding-link-glasshouse')
                ->where('gallerySlug', 'wedding')
                ->where('wedding.venue_name', 'Crystal Hall')
                ->where('wedding.details.hero_message', 'Join us under glass.')
                ->where('wedding.details.hero_image', 'https://cdn.example.com/hero.jpg')
                ->where('wedding.details.ceremony_json', fn ($value) => is_string($value) && str_contains($value, 'Crystal Hall Preview'))
                ->where('wedding.details.guests_json', fn ($value) => is_string($value) && str_contains($value, 'Live Guest'))
            );
    }

    public function test_preview_without_gallery_template_still_renders(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
        ]);

        $this->actingAs($user)
            ->get(route('weddings.preview', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/preview')
                ->where('galleryDesign', null)
            );
    }

    public function test_card_mode_preview_includes_saved_card_document(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'card',
        ]);

        $art = '/images/gallery/cards/wedding-card-black-tie.jpg';
        $wedding->card()->create([
            'format' => 'portrait',
            'width' => 1080,
            'height' => 1920,
            'status' => 'draft',
            'document' => [
                'background' => '#f4efe6',
                'backgroundImage' => $art,
                'elements' => [
                    [
                        'id' => 'names',
                        'type' => 'text',
                        'text' => 'Alexander & Emma',
                        'x' => 120,
                        'y' => 420,
                        'width' => 840,
                        'height' => 90,
                        'fontSize' => 88,
                        'font' => 'serif',
                        'color' => '#1c1712',
                        'align' => 'center',
                    ],
                ],
            ],
        ]);

        $this->actingAs($user)
            ->get(route('weddings.preview', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/preview')
                ->where('selectedUserCard.event_id', $wedding->id)
                ->where('selectedUserCard.document.backgroundImage', $art)
                ->where('selectedUserCard.document.elements.0.text', 'Alexander & Emma')
                ->where('selectedUserCard.document.elements.0.fontSize', 88)
                ->where('selectedUserCard.document.elements.0.align', 'center')
                ->where('editorHref', route('weddings.card.edit', $wedding, absolute: false))
                ->where('previewKind', 'card')
            );
    }

    public function test_preview_back_link_targets_website_editor_for_link_mode(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
        ]);

        $this->actingAs($user)
            ->get(route('weddings.preview', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/preview')
                ->where('editorHref', route('weddings.edit', $wedding, absolute: false))
                ->where('previewKind', 'site')
            );
    }

    public function test_preview_publish_and_unpublish_routes_work(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'card',
            'status' => WeddingStatus::Draft,
        ]);

        $this->actingAs($user)
            ->post(route('weddings.publish', $wedding))
            ->assertRedirect();

        $this->assertSame(WeddingStatus::Published, $wedding->fresh()->status);

        $this->actingAs($user)
            ->delete(route('weddings.unpublish', $wedding))
            ->assertRedirect();

        $this->assertSame(WeddingStatus::Draft, $wedding->fresh()->status);
    }

    public function test_card_editor_and_preview_back_path_round_trip(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'card',
        ]);
        $wedding->card()->create([
            'format' => 'portrait',
            'width' => 1080,
            'height' => 1440,
            'status' => 'draft',
            'document' => ['background' => '#f4efe6', 'elements' => []],
        ]);

        $this->actingAs($user)
            ->get(route('weddings.card.edit', $wedding))
            ->assertOk();

        $preview = $this->actingAs($user)
            ->get(route('weddings.preview', $wedding))
            ->assertOk();

        $preview->assertInertia(fn (Assert $page) => $page
            ->where('editorHref', route('weddings.card.edit', $wedding, absolute: false))
            ->where('previewKind', 'card')
        );

        $this->actingAs($user)
            ->get(route('weddings.card.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('events/card'));
    }

    public function test_preview_from_card_query_returns_to_card_editor_even_for_link_mode(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'both',
        ]);

        $this->actingAs($user)
            ->get(route('weddings.preview', ['wedding' => $wedding, 'from' => 'card']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/preview')
                ->where('editorHref', route('weddings.card.edit', $wedding, absolute: false))
                ->where('previewKind', 'card')
            );
    }
}
