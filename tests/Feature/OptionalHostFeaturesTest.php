<?php

namespace Tests\Feature;

use App\Enums\RsvpStatus;
use App\Enums\WeddingStatus;
use App\Models\GiftClaim;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingRsvp;
use App\Models\WeddingSetting;
use App\Services\InvitationTranslationSync;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OptionalHostFeaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_host_can_export_catering_csv(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        WeddingRsvp::query()->create([
            'event_id' => $wedding->id,
            'guest_name' => 'Asha',
            'email' => 'asha@example.com',
            'status' => RsvpStatus::Attending,
            'guest_count' => 2,
            'meal_preference' => 'vegetarian',
            'dietary_restrictions' => 'No nuts',
        ]);
        WeddingRsvp::query()->create([
            'event_id' => $wedding->id,
            'guest_name' => 'Declined',
            'email' => 'no@example.com',
            'status' => RsvpStatus::NotAttending,
            'guest_count' => 1,
            'meal_preference' => 'vegetarian',
        ]);

        $response = $this->actingAs($user)
            ->get(route('weddings.rsvps.catering-export', $wedding))
            ->assertOk();

        $csv = $response->streamedContent();
        $this->assertStringContainsString('meal_preference', $csv);
        $this->assertStringContainsString('Asha', $csv);
        $this->assertStringContainsString('No nuts', $csv);
        $this->assertStringNotContainsString('Declined', $csv);
    }

    public function test_guest_can_claim_gift_when_enabled(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);
        WeddingSetting::query()->updateOrCreate(
            ['event_id' => $wedding->id],
            ['details' => ['gifts_claims_enabled' => '1']],
        );

        $this->post(route('weddings.gift-claims.store', $wedding->slug), [
            'gift_item_id' => 'gift-1',
            'gift_label' => 'Home registry',
            'name' => 'Priya',
            'email' => 'priya@example.com',
            'note' => 'Happy to get this',
        ])->assertRedirect();

        $this->assertDatabaseHas('gift_claims', [
            'event_id' => $wedding->id,
            'gift_item_id' => 'gift-1',
            'name' => 'Priya',
            'status' => 'claimed',
        ]);

        $claim = GiftClaim::query()->where('event_id', $wedding->id)->firstOrFail();

        $this->actingAs($user)
            ->post(route('weddings.gift-claims.release', [$wedding, $claim]))
            ->assertRedirect();

        $this->assertSame('released', $claim->fresh()->status);
    }

    public function test_gift_claim_blocked_when_disabled(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);

        $this->from(route('weddings.public', $wedding->slug))
            ->post(route('weddings.gift-claims.store', $wedding->slug), [
                'gift_item_id' => 'gift-1',
                'name' => 'Priya',
            ])
            ->assertRedirect();

        $this->assertDatabaseMissing('gift_claims', [
            'event_id' => $wedding->id,
            'gift_item_id' => 'gift-1',
        ]);
    }

    public function test_bilingual_sync_includes_schedule_and_extras(): void
    {
        config(['services.translation.driver' => 'fake']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'language' => 'en',
            'secondary_language' => 'es',
        ]);
        WeddingSetting::query()->updateOrCreate(
            ['event_id' => $wedding->id],
            [
                'details' => [
                    'gifts_intro' => 'Please enjoy our registry.',
                    'attire_title' => 'Dress code',
                    'attire_body' => 'Festive formal.',
                    'travel_stays_notes' => 'Fly into the main airport.',
                    'schedule_json' => json_encode([
                        ['id' => 's1', 'title' => 'Ceremony', 'time' => '16:00', 'note' => 'Be seated early'],
                    ], JSON_THROW_ON_ERROR),
                    'gifts_json' => json_encode([
                        ['id' => 'g1', 'label' => 'Home registry', 'url' => 'https://example.com/r'],
                    ], JSON_THROW_ON_ERROR),
                ],
            ],
        );

        $result = app(InvitationTranslationSync::class)->sync($wedding->fresh(['setting', 'translations', 'hosts']), force: true);

        $this->assertTrue($result['synced']);
        $content = $wedding->fresh('translations')->translations->firstWhere('locale', 'es')?->content ?? [];
        $this->assertStringContainsString('[es]', (string) ($content['gifts_intro'] ?? ''));
        $this->assertStringContainsString('[es]', (string) ($content['attire_body'] ?? ''));
        $this->assertStringContainsString('[es]', (string) ($content['schedule_json'] ?? ''));
        $giftsJson = (string) ($content['gifts_json'] ?? '');
        $this->assertStringContainsString('example.com', $giftsJson);
        $this->assertStringContainsString('[es]Home registry', $giftsJson);
    }

    public function test_host_can_save_planning_checklist(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $checklist = json_encode([
            ['id' => 'venue', 'label' => 'Confirm venue', 'done' => true],
            ['id' => 'catering', 'label' => 'Lock catering', 'done' => false],
        ], JSON_THROW_ON_ERROR);

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'details' => [
                    'planning_checklist_enabled' => '1',
                    'planning_checklist_json' => $checklist,
                ],
            ])
            ->assertRedirect();

        $details = $wedding->fresh('setting')->setting?->details ?? [];
        $this->assertSame('1', $details['planning_checklist_enabled'] ?? null);
        $this->assertStringContainsString('Confirm venue', (string) ($details['planning_checklist_json'] ?? ''));
    }
}
