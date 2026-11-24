<?php

namespace Tests\Feature;

use App\Enums\WeddingStatus;
use App\Models\User;
use App\Models\Wedding;
use App\Services\TravelStaysSync;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TravelStaysSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_saving_travel_stays_json_creates_accommodations(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Draft,
        ]);

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'details' => [
                    'travel_stays_notes' => 'Fly into the main airport.',
                    'travel_stays_json' => json_encode([
                        [
                            'id' => 'stay-a',
                            'name' => 'The Grand Hotel',
                            'detail' => 'Room block',
                            'code' => 'CELEBRATE26',
                            'url' => 'https://example.com/hotel',
                        ],
                        [
                            'id' => 'stay-b',
                            'name' => 'Riverfront Suites',
                            'detail' => 'Breakfast included',
                        ],
                    ]),
                ],
            ])
            ->assertRedirect();

        $wedding->refresh();
        $stays = $wedding->accommodations()->orderBy('sort_order')->get();

        $this->assertCount(2, $stays);
        $this->assertSame('The Grand Hotel', $stays[0]->hotel_name);
        $this->assertSame('Room block', $stays[0]->description);
        $this->assertSame('CELEBRATE26', $stays[0]->price_info);
        $this->assertSame('https://example.com/hotel', $stays[0]->booking_url);
        $this->assertSame('Riverfront Suites', $stays[1]->hotel_name);

        $notes = $wedding->travelDetails()
            ->where('title', TravelStaysSync::NOTES_TITLE)
            ->first();
        $this->assertNotNull($notes);
        $this->assertSame('Fly into the main airport.', $notes->description);

        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $mirrored = json_decode((string) ($details['travel_stays_json'] ?? '[]'), true);
        $this->assertSame('The Grand Hotel', $mirrored[0]['name'] ?? null);
        $this->assertSame('Fly into the main airport.', $details['travel_stays_notes'] ?? null);
    }

    public function test_travel_stays_sync_preserves_row_ids(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        app(TravelStaysSync::class)->syncFromDetails($wedding, [
            ['name' => 'Hotel One', 'detail' => 'Near venue'],
        ], 'Airport taxi');

        $firstId = $wedding->accommodations()->first()?->id;
        $this->assertNotNull($firstId);

        app(TravelStaysSync::class)->syncFromDetails($wedding->fresh(['setting', 'accommodations', 'travelDetails']), [
            ['name' => 'Hotel One Updated', 'detail' => 'Shuttle included'],
            ['name' => 'Hotel Two', 'detail' => 'Budget'],
        ], 'Airport taxi · 45 min');

        $stays = $wedding->accommodations()->orderBy('sort_order')->get();
        $this->assertCount(2, $stays);
        $this->assertSame($firstId, $stays[0]->id);
        $this->assertSame('Hotel One Updated', $stays[0]->hotel_name);
        $this->assertSame('Hotel Two', $stays[1]->hotel_name);
    }

    public function test_import_from_details_when_accommodations_empty(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $setting = $wedding->setting;
        $this->assertNotNull($setting);
        $setting->details = array_merge($setting->details ?? [], [
            'travel_stays_notes' => 'Take the blue line.',
            'travel_stays_json' => json_encode([
                ['name' => 'Harbor Inn', 'detail' => 'Waterfront'],
            ]),
        ]);
        $setting->save();

        app(TravelStaysSync::class)->importFromDetailsIfEmpty($wedding->fresh(['setting', 'accommodations', 'travelDetails']));

        $this->assertSame(1, $wedding->accommodations()->count());
        $this->assertSame('Harbor Inn', $wedding->accommodations()->first()?->hotel_name);
        $this->assertSame(
            'Take the blue line.',
            $wedding->travelDetails()->where('title', TravelStaysSync::NOTES_TITLE)->value('description'),
        );
    }
}
