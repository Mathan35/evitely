<?php

namespace Tests\Feature;

use App\Enums\WeddingStatus;
use App\Models\User;
use App\Models\Wedding;
use App\Services\ScheduleSync;
use App\Support\ScheduleClock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduleSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_clock_round_trips_display_and_storage(): void
    {
        $this->assertSame('16:00', ScheduleClock::toStorage('4:00 PM'));
        $this->assertSame('09:30', ScheduleClock::toStorage('9:30 AM'));
        $this->assertSame('4:00 PM', ScheduleClock::toDisplay('16:00'));
        $this->assertSame('9:30 AM', ScheduleClock::toDisplay('09:30:00'));
    }

    public function test_saving_schedule_json_creates_relational_events(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Draft,
            'starts_on' => '2026-12-20',
            'timezone' => 'Asia/Kolkata',
            'venue_name' => 'Rose Hall',
            'city' => 'Chennai',
        ]);

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'details' => [
                    'schedule_json' => json_encode([
                        ['time' => '4:00 PM', 'title' => 'Ceremony'],
                        ['time' => '7:30 PM', 'title' => 'Reception'],
                    ]),
                ],
            ])
            ->assertRedirect();

        $wedding->refresh();
        $events = $wedding->events()->orderBy('sort_order')->get();

        $this->assertCount(2, $events);
        $this->assertSame('Ceremony', $events[0]->title);
        $this->assertSame('16:00', substr((string) $events[0]->start_time, 0, 5));
        $this->assertSame('moment', $events[0]->event_type);
        $this->assertTrue($events[0]->is_public);
        $this->assertSame('Reception', $events[1]->title);
        $this->assertSame('19:30', substr((string) $events[1]->start_time, 0, 5));

        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $mirrored = json_decode((string) ($details['schedule_json'] ?? '[]'), true);
        $this->assertSame('Ceremony', $mirrored[0]['title'] ?? null);
    }

    public function test_schedule_sync_preserves_row_ids_when_updating_in_place(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        app(ScheduleSync::class)->syncItinerary($wedding, [
            ['time' => '5:00 PM', 'title' => 'Welcome'],
        ]);

        $firstId = $wedding->events()->first()?->id;
        $this->assertNotNull($firstId);

        app(ScheduleSync::class)->syncItinerary($wedding->fresh(['setting', 'events']), [
            ['time' => '5:30 PM', 'title' => 'Welcome drinks'],
            ['time' => '8:00 PM', 'title' => 'Dinner'],
        ]);

        $events = $wedding->events()->orderBy('sort_order')->get();
        $this->assertCount(2, $events);
        $this->assertSame($firstId, $events[0]->id);
        $this->assertSame('Welcome drinks', $events[0]->title);
        $this->assertSame('Dinner', $events[1]->title);
    }

    public function test_import_from_details_when_events_empty(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $setting = $wedding->setting;
        $this->assertNotNull($setting);
        $setting->details = array_merge($setting->details ?? [], [
            'schedule_json' => json_encode([
                ['time' => '6:00 PM', 'title' => 'Sangeet'],
            ]),
        ]);
        $setting->save();

        app(ScheduleSync::class)->importFromDetailsIfEmpty($wedding->fresh(['setting', 'events']));

        $this->assertSame(1, $wedding->events()->count());
        $this->assertSame('Sangeet', $wedding->events()->first()?->title);
    }

    public function test_published_calendar_uses_synced_itinerary(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'slug' => 'schedule-sync-demo',
            'starts_on' => '2026-11-21',
            'timezone' => 'UTC',
        ]);

        app(ScheduleSync::class)->syncItinerary($wedding, [
            ['time' => '10:00 AM', 'title' => 'The Ceremony'],
        ]);

        $this->get(route('weddings.calendar', ['slug' => $wedding->slug]))
            ->assertOk()
            ->assertHeader('content-type', 'text/calendar; charset=utf-8')
            ->assertSee('The Ceremony');
    }
}
