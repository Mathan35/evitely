<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EditorTemplateMediaTest extends TestCase
{
    use RefreshDatabase;

    public function test_editor_persists_hero_gallery_and_venue_media_details(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        WeddingSetting::query()->updateOrCreate(
            ['event_id' => $wedding->id],
            ['details' => ['gallery_template' => 'wedding-glasshouse']],
        );

        $gallery = [
            [
                'id' => 'slot-0',
                'title' => 'First look',
                'note' => 'Garden',
                'src' => '/storage/photos/custom-gallery.jpg',
                'span' => 'square',
                'zoom' => 1.2,
                'position_x' => 40,
                'position_y' => 55,
            ],
        ];

        $ceremony = [
            'title' => 'Ceremony',
            'name' => 'Glasshouse Lawn',
            'time' => '4:00 PM',
            'address' => 'Hudson Valley',
            'image' => '/storage/photos/ceremony.jpg',
            'map_image' => '',
            'maps_url' => 'https://maps.google.com/?q=Hudson+Valley',
        ];

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'bride_name' => $wedding->bride_name,
                'groom_name' => $wedding->groom_name,
                'details' => [
                    'hero_image' => '/storage/photos/hero-custom.jpg',
                    'hero_blur' => '2.5',
                    'hero_zoom' => '1.4',
                    'hero_position_x' => '35',
                    'hero_position_y' => '60',
                    'gallery_json' => json_encode($gallery),
                    'ceremony_json' => json_encode($ceremony),
                    'reception_json' => json_encode([
                        ...$ceremony,
                        'title' => 'Reception',
                        'image' => '/storage/photos/reception.jpg',
                    ]),
                    'custom_texts_json' => '[]',
                ],
            ])
            ->assertRedirect();

        $wedding->refresh()->load('setting');
        $details = $wedding->setting?->details ?? [];

        $this->assertSame('/storage/photos/hero-custom.jpg', $details['hero_image'] ?? null);
        $this->assertSame('2.5', $details['hero_blur'] ?? null);
        $this->assertSame('1.4', $details['hero_zoom'] ?? null);
        $this->assertSame('35', $details['hero_position_x'] ?? null);
        $this->assertSame('60', $details['hero_position_y'] ?? null);

        $savedGallery = json_decode((string) ($details['gallery_json'] ?? '[]'), true);
        $this->assertIsArray($savedGallery);
        $this->assertSame('/storage/photos/custom-gallery.jpg', $savedGallery[0]['src'] ?? null);
        $this->assertSame(1.2, $savedGallery[0]['zoom'] ?? null);

        $savedCeremony = json_decode((string) ($details['ceremony_json'] ?? '{}'), true);
        $this->assertSame('/storage/photos/ceremony.jpg', $savedCeremony['image'] ?? null);

        $this->actingAs($user)
            ->get(route('weddings.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('weddings/edit')
                ->where('wedding.details.hero_image', '/storage/photos/hero-custom.jpg')
                ->where('wedding.details.hero_blur', '2.5')
                ->where('wedding.details.gallery_json', json_encode($gallery)));
    }
}
