<?php

namespace Tests\Feature;

use App\Enums\RsvpStatus;
use App\Models\EventTable;
use App\Models\GuestGroup;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Services\SeatingAutoAssignService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeatingAutoAssignTest extends TestCase
{
    use RefreshDatabase;

    public function test_auto_assign_seats_unassigned_guests_by_capacity(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $tableA = EventTable::query()->create([
            'event_id' => $wedding->id,
            'name' => 'Table 1',
            'capacity' => 4,
            'sort_order' => 1,
        ]);
        EventTable::query()->create([
            'event_id' => $wedding->id,
            'name' => 'Table 2',
            'capacity' => 4,
            'sort_order' => 2,
        ]);

        WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'rsvp_status' => RsvpStatus::Attending,
            'number_of_guests' => 2,
            'table_id' => null,
        ]);
        WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'rsvp_status' => RsvpStatus::Pending,
            'number_of_guests' => 3,
            'table_id' => null,
        ]);

        $this->actingAs($user)
            ->post(route('weddings.tables.auto-assign', $wedding), ['reset' => false])
            ->assertRedirect();

        $this->assertSame(0, $wedding->guests()->whereNull('table_id')->count());
        $this->assertTrue($wedding->guests()->where('table_id', $tableA->id)->exists());
    }

    public function test_auto_assign_keeps_guest_groups_together_when_possible(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $group = GuestGroup::query()->create([
            'event_id' => $wedding->id,
            'name' => 'Family',
        ]);

        EventTable::query()->create([
            'event_id' => $wedding->id,
            'name' => 'Head',
            'capacity' => 6,
            'sort_order' => 1,
        ]);

        $a = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'guest_group_id' => $group->id,
            'rsvp_status' => RsvpStatus::Attending,
            'number_of_guests' => 1,
        ]);
        $b = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'guest_group_id' => $group->id,
            'rsvp_status' => RsvpStatus::Attending,
            'number_of_guests' => 1,
        ]);

        $result = app(SeatingAutoAssignService::class)->assign($wedding);

        $this->assertSame(2, $result['assigned']);
        $a->refresh();
        $b->refresh();
        $this->assertNotNull($a->table_id);
        $this->assertSame($a->table_id, $b->table_id);
    }
}
