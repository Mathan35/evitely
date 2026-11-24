<?php

namespace Tests\Feature;

use App\Enums\GuestbookStatus;
use App\Enums\RsvpStatus;
use App\Enums\WeddingStatus;
use App\Models\EventCollaborator;
use App\Models\GuestbookEntry;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Models\WeddingRsvp;
use App\Notifications\WishReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class GuestOpsAndAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_host_can_export_and_import_guests_csv(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'first_name' => 'Asha',
            'email' => 'asha@example.com',
        ]);

        $this->actingAs($user)
            ->get(route('weddings.guests.export', $wedding))
            ->assertOk()
            ->assertHeader('content-disposition');

        $this->actingAs($user)
            ->get(route('weddings.guests.import-sample', $wedding))
            ->assertOk()
            ->assertHeader('content-disposition');

        $csv = "first_name,last_name,email,phone,group\nRavi,Kumar,ravi@example.com,9999999999,Family\n";
        $file = UploadedFile::fake()->createWithContent('guests.csv', $csv);

        $this->actingAs($user)
            ->post(route('weddings.guests.import', $wedding), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseHas('event_guests', [
            'event_id' => $wedding->id,
            'first_name' => 'Ravi',
            'email' => 'ravi@example.com',
        ]);
        $this->assertDatabaseHas('event_guest_groups', [
            'event_id' => $wedding->id,
            'name' => 'Family',
        ]);
    }

    public function test_guest_import_rejects_invalid_and_duplicate_emails(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'taken@example.com',
        ]);

        $csv = implode("\n", [
            'first_name,last_name,email,phone,number_of_guests',
            'Bad,,not-an-email,999,1',
            'Dup,,taken@example.com,999,1',
            'Ok,Guest,ok.guest@example.org,9876543210,2',
            ',MissingFirst,someone@example.com,1,1',
        ]);
        $file = UploadedFile::fake()->createWithContent('guests.csv', $csv);

        $this->actingAs($user)
            ->post(route('weddings.guests.import', $wedding), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseHas('event_guests', [
            'event_id' => $wedding->id,
            'first_name' => 'Ok',
            'email' => 'ok.guest@example.org',
        ]);
        $this->assertDatabaseMissing('event_guests', [
            'event_id' => $wedding->id,
            'first_name' => 'Bad',
        ]);
        $this->assertDatabaseMissing('event_guests', [
            'event_id' => $wedding->id,
            'first_name' => 'Dup',
        ]);
    }

    public function test_guest_import_skips_unchanged_sample_placeholder_rows(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $csv = "first_name,last_name,email,phone,country_code,relationship,number_of_guests,notes,group\nPriya,Sharma,priya@example.com,9876543210,+91,Bride side,2,Vegetarian,Family\n";
        $file = UploadedFile::fake()->createWithContent('guest-import-sample.csv', $csv);

        $this->actingAs($user)
            ->from(route('weddings.show', $wedding))
            ->post(route('weddings.guests.import', $wedding), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseMissing('event_guests', [
            'event_id' => $wedding->id,
            'email' => 'priya@example.com',
        ]);
    }

    public function test_host_can_export_rsvps_csv(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        WeddingRsvp::query()->create([
            'event_id' => $wedding->id,
            'guest_name' => 'Neha',
            'email' => 'neha@example.com',
            'status' => RsvpStatus::Attending,
            'guest_count' => 2,
        ]);

        $this->actingAs($user)
            ->get(route('weddings.rsvps.export', $wedding))
            ->assertOk();
    }

    public function test_guestbook_bulk_moderation_and_wish_alert(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);

        $this->post("/invite/{$wedding->slug}/guestbook", [
            'name' => 'Guest',
            'message' => 'Congrats!',
        ])->assertRedirect();

        Notification::assertSentTo($user, WishReceived::class);

        $entries = GuestbookEntry::query()->where('event_id', $wedding->id)->get();
        $this->assertCount(1, $entries);

        $this->actingAs($user)
            ->post(route('weddings.guestbook.bulk', $wedding), [
                'action' => 'approve',
                'entry_ids' => [$entries->first()->id],
            ])
            ->assertRedirect();

        $this->assertSame(GuestbookStatus::Approved, $entries->first()->fresh()->status);
    }

    public function test_owner_can_invite_collaborator_and_editor_can_manage(): void
    {
        $owner = User::factory()->create();
        $editor = User::factory()->create(['email' => 'editor@example.com']);
        $wedding = Wedding::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->post(route('weddings.collaborators.store', $wedding), [
                'email' => 'editor@example.com',
                'role' => 'editor',
            ])
            ->assertRedirect();

        $collaborator = EventCollaborator::query()->where('event_id', $wedding->id)->firstOrFail();

        $this->actingAs($editor)
            ->get(route('collaborators.accept', $collaborator->invite_token))
            ->assertRedirect(route('weddings.show', $wedding));

        $this->assertNotNull($collaborator->fresh()->accepted_at);

        $this->actingAs($editor)
            ->post(route('weddings.guests.store', $wedding), [
                'first_name' => 'CoHostGuest',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('event_guests', [
            'event_id' => $wedding->id,
            'first_name' => 'CoHostGuest',
        ]);
    }

    public function test_host_can_create_tables_and_assign_guests(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'rsvp_status' => RsvpStatus::Attending,
            'number_of_guests' => 2,
        ]);

        $this->actingAs($user)
            ->post(route('weddings.tables.store', $wedding), [
                'name' => 'Table 1',
                'capacity' => 8,
            ])
            ->assertRedirect();

        $tableId = $wedding->tables()->value('id');
        $this->assertNotNull($tableId);

        $this->actingAs($user)
            ->post(route('weddings.tables.assign', $wedding), [
                'guest_id' => $guest->id,
                'table_id' => $tableId,
            ])
            ->assertRedirect();

        $this->assertSame((int) $tableId, (int) $guest->fresh()->table_id);
    }
}
