<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use App\Support\CardLibrary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EventCardEditorTest extends TestCase
{
    use RefreshDatabase;

    public function test_card_editor_page_renders_studio_payload(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'card',
        ]);

        $wedding->card()->create([
            'format' => 'portrait',
            'width' => 1080,
            'height' => 1920,
            'status' => 'draft',
            'document' => [
                'background' => '#f4efe6',
                'elements' => [
                    [
                        'id' => 'text-1',
                        'type' => 'text',
                        'text' => 'Together forever',
                        'x' => 80,
                        'y' => 200,
                        'width' => 900,
                        'height' => 120,
                        'fontSize' => 48,
                        'font' => 'serif',
                        'color' => '#1c1712',
                        'align' => 'center',
                    ],
                ],
            ],
        ]);

        $this->actingAs($user)
            ->get(route('weddings.card.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('events/card')
                ->where('eventId', $wedding->id)
                // syncCardGeometry rematerializes outdated canvases to the invitation preset.
                ->where('card.format', 'invite')
                ->where('card.width', 1080)
                ->where('card.height', 1440)
                ->where('card.document.layout_version', CardLibrary::LAYOUT_VERSION)
                ->has('presets')
                ->has('inviteUrl')
                ->where('cardUrl', route('weddings.card', ['slug' => $wedding->slug]))
                ->has('galleryHref')
                ->has('eventsHref')
                ->where('weddingStatus', $wedding->status->value)
            );
    }

    public function test_site_edit_redirects_card_only_events_to_card_studio(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'card',
        ]);

        $this->actingAs($user)
            ->get(route('weddings.edit', $wedding))
            ->assertRedirect(route('weddings.card.edit', $wedding));
    }

    public function test_card_editor_auto_materializes_template_card(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'title' => 'Nora & Ethan',
        ]);
        $wedding->setting()->update([
            'details' => array_merge($wedding->setting->details ?? [], [
                'card_template' => 'wedding-card-secret-garden',
                'blessing' => 'Together with their families',
                'request_line' => 'request the pleasure of your company',
            ]),
        ]);

        $this->assertNull($wedding->fresh()->card);

        $this->actingAs($user)
            ->get(route('weddings.card.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('events/card')
                ->where('card.document.template', 'wedding-card-secret-garden')
                ->where('card.width', 1080)
                ->where('card.height', 1440)
                ->where('card.format', 'invite')
                ->has('card.document.elements')
            );

        $card = $wedding->fresh()->card;
        $this->assertNotNull($card);
        $this->assertNotEmpty($card->document['backgroundImage'] ?? null);
        $this->assertNotEmpty($card->document['elements'] ?? []);
        $this->assertTrue(
            collect($card->document['elements'])->contains(fn ($element) => ($element['id'] ?? null) === 'blessing'),
        );
    }

    public function test_card_generate_accepts_format_override(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'both',
        ]);
        $wedding->setting()->update([
            'details' => array_merge($wedding->setting->details ?? [], [
                'card_template' => 'wedding-card-secret-garden',
            ]),
        ]);
        $wedding->card()->create([
            'format' => 'portrait',
            'width' => 1080,
            'height' => 1920,
            'status' => 'draft',
            'document' => ['background' => '#f4efe6', 'elements' => []],
        ]);

        $this->actingAs($user)
            ->post(route('weddings.card.generate', $wedding), ['format' => 'landscape'])
            ->assertRedirect();

        $card = $wedding->fresh()->card;
        $this->assertSame('landscape', $card->format);
        $this->assertSame(1200, $card->width);
        $this->assertSame(628, $card->height);
        $this->assertNotEmpty($card->document['elements'] ?? []);
    }

    public function test_card_format_update_persists_scaled_dimensions(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
        ]);

        $wedding->card()->create([
            'format' => 'portrait',
            'width' => 1080,
            'height' => 1920,
            'status' => 'draft',
            'document' => [
                'background' => '#f4efe6',
                'elements' => [
                    [
                        'id' => 'names',
                        'type' => 'text',
                        'text' => 'Alex & Emma',
                        'x' => 189,
                        'y' => 373,
                        'width' => 702,
                        'height' => 68,
                        'fontSize' => 48,
                        'color' => '#1c1712',
                        'align' => 'center',
                        'font' => 'serif',
                    ],
                ],
            ],
        ]);

        $scaled = [
            'background' => '#f4efe6',
            'elements' => [
                [
                    'id' => 'names',
                    'type' => 'text',
                    'text' => 'Alex & Emma',
                    'x' => 210,
                    'y' => 210,
                    'width' => 780,
                    'height' => 38,
                    'fontSize' => 27,
                    'color' => '#1c1712',
                    'align' => 'center',
                    'font' => 'serif',
                ],
            ],
        ];

        $this->actingAs($user)
            ->put(route('weddings.card.update', $wedding), [
                'format' => 'square',
                'width' => 1080,
                'height' => 1080,
                'document' => $scaled,
            ])
            ->assertRedirect();

        $card = $wedding->fresh()->card;
        $this->assertSame('square', $card->format);
        $this->assertSame(1080, $card->width);
        $this->assertSame(1080, $card->height);
        $this->assertSame(210, $card->document['elements'][0]['x'] ?? null);
        $this->assertSame(27, $card->document['elements'][0]['fontSize'] ?? null);
    }

    public function test_card_document_update_persists_typography_fields(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
        ]);

        $document = [
            'background' => '#efe6d8',
            'elements' => [
                [
                    'id' => 'text-1',
                    'type' => 'text',
                    'text' => 'Crystal Hall',
                    'x' => 100,
                    'y' => 240,
                    'width' => 880,
                    'height' => 100,
                    'fontSize' => 64,
                    'fontWeight' => 600,
                    'letterSpacing' => 1.5,
                    'font' => 'display',
                    'color' => '#c6a36a',
                    'align' => 'center',
                ],
            ],
        ];

        $this->actingAs($user)
            ->put(route('weddings.card.update', $wedding), [
                'format' => 'portrait',
                'width' => 1080,
                'height' => 1920,
                'document' => $document,
            ])
            ->assertRedirect();

        $card = $wedding->refresh()->card;
        $this->assertNotNull($card);
        $this->assertSame('#efe6d8', $card->document['background'] ?? null);
        $this->assertSame('display', $card->document['elements'][0]['font'] ?? null);
        $this->assertSame(64, $card->document['elements'][0]['fontSize'] ?? null);
        $this->assertSame(600, $card->document['elements'][0]['fontWeight'] ?? null);
    }

    public function test_card_document_update_keeps_background_image(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
        ]);

        $art = '/images/gallery/cards/wedding-card-black-tie.jpg';
        $document = [
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
                    'fontSize' => 54,
                    'font' => 'serif',
                    'color' => '#1c1712',
                    'align' => 'center',
                ],
            ],
        ];

        $this->actingAs($user)
            ->put(route('weddings.card.update', $wedding), [
                'format' => 'portrait',
                'width' => 1080,
                'height' => 1920,
                'document' => $document,
            ])
            ->assertRedirect();

        $card = $wedding->refresh()->card;
        $this->assertNotNull($card);
        $this->assertSame($art, $card->document['backgroundImage'] ?? null);
        $this->assertSame('Alexander & Emma', $card->document['elements'][0]['text'] ?? null);
    }

    public function test_saved_card_edits_survive_editor_revisit(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'card',
        ]);

        $wedding->card()->create([
            'format' => 'invite',
            'width' => 1080,
            'height' => 1440,
            'status' => 'draft',
            'document' => [
                'background' => '#f4efe6',
                'layout_version' => CardLibrary::LAYOUT_VERSION,
                'elements' => [
                    [
                        'id' => 'names',
                        'type' => 'text',
                        'text' => 'Original Bride & Original Groom',
                        'x' => 120,
                        'y' => 420,
                        'width' => 840,
                        'height' => 90,
                        'fontSize' => 54,
                        'font' => 'serif',
                        'color' => '#1c1712',
                        'align' => 'center',
                    ],
                ],
            ],
        ]);

        $edited = [
            'background' => '#f4efe6',
            'layout_version' => CardLibrary::LAYOUT_VERSION,
            'elements' => [
                [
                    'id' => 'names',
                    'type' => 'text',
                    'text' => 'Saved Host Names',
                    'x' => 140,
                    'y' => 440,
                    'width' => 800,
                    'height' => 96,
                    'fontSize' => 58,
                    'font' => 'serif',
                    'color' => '#1c1712',
                    'align' => 'center',
                ],
            ],
        ];

        $this->actingAs($user)
            ->put(route('weddings.card.update', $wedding), [
                'format' => 'invite',
                'width' => 1080,
                'height' => 1440,
                'document' => $edited,
            ])
            ->assertRedirect();

        $this->actingAs($user)
            ->get(route('weddings.card.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('events/card')
                ->where('card.document.elements.0.text', 'Saved Host Names')
                ->where('card.document.elements.0.fontSize', 58)
                ->where('card.document.layout_version', CardLibrary::LAYOUT_VERSION)
            );

        $card = $wedding->fresh()->card;
        $this->assertSame('Saved Host Names', $card->document['elements'][0]['text'] ?? null);
        $this->assertSame('1', (string) (($wedding->fresh()->setting?->details['editor_saved'] ?? null)));
    }
}
