<?php

namespace Tests\Feature;

use App\Enums\GuestbookStatus;
use App\Enums\WeddingStatus;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingEvent;
use App\Models\WeddingGuest;
use App\Notifications\RsvpReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WeddingPlatformTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_host_can_create_update_publish_and_delete_a_wedding(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('weddings.store'), [
                'bride_name' => 'Priya Sharma',
                'groom_name' => 'Arun Kumar',
                'city' => 'Chennai',
                'theme' => 'south-indian',
                'events' => [
                    ['title' => 'Wedding Ceremony', 'event_type' => 'wedding', 'event_date' => '2026-12-15'],
                ],
            ])
            ->assertRedirect();

        $wedding = Wedding::query()->first();
        $this->assertNotNull($wedding);
        $this->assertSame(WeddingStatus::Draft, $wedding->status);
        $this->assertSame('priya-sharma-arun-kumar', $wedding->slug);
        $this->assertSame(1, $wedding->events()->count());

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'city' => 'Madurai',
                'theme' => 'royal',
            ])
            ->assertRedirect();

        $this->assertSame('Madurai', $wedding->refresh()->city);

        $this->actingAs($user)
            ->post(route('weddings.publish', $wedding))
            ->assertRedirect();

        $this->assertSame(WeddingStatus::Published, $wedding->refresh()->status);
        $this->assertNotNull($wedding->published_at);

        $this->get(route('weddings.public', ['slug' => $wedding->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('public/wedding')
                ->where('wedding.city', 'Madurai')
                ->where('wedding.theme.id', 'royal'));

        $this->actingAs($user)
            ->delete(route('weddings.unpublish', $wedding))
            ->assertRedirect();

        $this->assertSame(WeddingStatus::Draft, $wedding->refresh()->status);

        $this->actingAs($user)
            ->delete(route('weddings.destroy', $wedding))
            ->assertRedirect(route('weddings.index'));

        $this->assertSoftDeleted($wedding);
    }

    public function test_a_host_cannot_edit_another_users_wedding(): void
    {
        $wedding = Wedding::factory()->create();
        $intruder = User::factory()->create();

        $this->actingAs($intruder)->get(route('weddings.edit', $wedding))->assertForbidden();
        $this->actingAs($intruder)->put(route('weddings.update', $wedding), ['city' => 'Paris'])->assertForbidden();
        $this->actingAs($intruder)->delete(route('weddings.destroy', $wedding))->assertForbidden();
    }

    public function test_events_are_managed_on_the_owning_wedding(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $other = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('weddings.events.store', $wedding), [
                'title' => 'Sangeet',
                'event_type' => 'sangeet',
                'event_date' => '2026-12-14',
            ])
            ->assertRedirect();

        $event = WeddingEvent::query()->where('title', 'Sangeet')->first();
        $this->assertNotNull($event);

        $this->actingAs($user)
            ->put(route('weddings.events.update', [$wedding, $event]), ['title' => 'Sangeet Night'])
            ->assertRedirect();

        $this->assertSame('Sangeet Night', $event->refresh()->title);

        $this->actingAs($user)
            ->put(route('weddings.events.update', [$other, $event]), ['title' => 'Nope'])
            ->assertNotFound();

        $this->actingAs($user)
            ->delete(route('weddings.events.destroy', [$wedding, $event]))
            ->assertRedirect();

        $this->assertSoftDeleted($event);
    }

    public function test_guests_receive_a_token_that_is_not_their_id(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('weddings.guests.store', $wedding), [
                'first_name' => 'Meera',
                'last_name' => 'Iyer',
                'email' => 'meera@example.com',
            ])
            ->assertRedirect();

        $guest = WeddingGuest::query()->first();
        $this->assertNotNull($guest);
        $this->assertNotSame((string) $guest->id, $guest->guest_token);
        $this->assertSame(32, strlen($guest->guest_token));

        $this->actingAs($user)
            ->put(route('weddings.guests.update', [$wedding, $guest]), ['relationship' => 'Friend'])
            ->assertRedirect();

        $this->assertSame('Friend', $guest->refresh()->relationship);

        $this->actingAs($user)
            ->delete(route('weddings.guests.destroy', [$wedding, $guest]))
            ->assertRedirect();

        $this->assertSoftDeleted($guest);
    }

    public function test_rsvp_is_replay_safe_and_rejects_an_invalid_guest_token(): void
    {
        Notification::fake();

        $wedding = Wedding::factory()->published()->create();
        $event = WeddingEvent::factory()->create(['event_id' => $wedding->id]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'ramesh@example.com',
        ]);

        $payload = [
            'guest_name' => 'Ramesh Kumar',
            'email' => 'ramesh@example.com',
            'status' => 'attending',
            'guest_count' => 4,
            'meal_preference' => 'vegetarian',
            'message' => 'We will be there.',
            'events' => [$event->id => true],
        ];

        $this->post(route('weddings.guest.rsvp', ['slug' => $wedding->slug, 'token' => $guest->guest_token]), $payload)
            ->assertRedirect();

        $this->post(route('weddings.guest.rsvp', ['slug' => $wedding->slug, 'token' => $guest->guest_token]), [
            ...$payload,
            'guest_count' => 2,
            'message' => 'Two of us, in the end.',
        ])->assertRedirect();

        $this->assertSame(1, $wedding->rsvps()->count());
        $this->assertSame(2, $wedding->rsvps()->first()?->guest_count);
        $this->assertSame(1, $wedding->rsvps()->first()?->eventReplies()->count());
        $this->assertSame('responded', $guest->refresh()->invitation_status->value);

        Notification::assertSentTimes(RsvpReceived::class, 2);

        $this->get(route('weddings.guest', ['slug' => $wedding->slug, 'token' => 'not-a-real-token']))
            ->assertNotFound();

        $this->post(route('weddings.guest.rsvp', ['slug' => $wedding->slug, 'token' => 'not-a-real-token']), $payload)
            ->assertNotFound();
    }

    public function test_public_pages_hide_drafts_and_follow_old_addresses(): void
    {
        $published = Wedding::factory()->published()->create(['slug' => 'arun-priya']);
        $draft = Wedding::factory()->create(['slug' => 'still-writing']);

        $this->get(route('weddings.public', ['slug' => $published->slug]))->assertOk();
        $this->get(route('weddings.public', ['slug' => $draft->slug]))->assertNotFound();
        $this->get(route('weddings.public', ['slug' => 'missing']))->assertNotFound();
        $this->get('/i/arun-priya')->assertRedirect(\App\Support\InviteHost::publicUrl('arun-priya'));

        $this->actingAs($published->user)
            ->put(route('weddings.update', $published), ['slug' => 'priya-and-arun'])
            ->assertRedirect();

        $this->get('/invite/arun-priya')->assertRedirect(\App\Support\InviteHost::publicUrl('priya-and-arun'));
    }

    public function test_duplicate_copies_the_design_and_not_the_guests(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id, 'theme' => 'luxury']);
        WeddingGuest::factory()->create(['event_id' => $wedding->id]);
        WeddingEvent::factory()->create(['event_id' => $wedding->id, 'title' => 'Haldi']);

        $this->actingAs($user)
            ->post(route('weddings.duplicate', $wedding))
            ->assertRedirect();

        $copy = Wedding::query()->where('id', '!=', $wedding->id)->first();
        $this->assertNotNull($copy);
        $this->assertSame('luxury', $copy->theme);
        $this->assertSame(0, $copy->guests()->count());
        $this->assertSame(1, $copy->events()->count());
        $this->assertSame(WeddingStatus::Draft, $copy->status);
    }

    public function test_unapproved_guestbook_notes_stay_off_the_public_page(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create(['user_id' => $user->id]);

        $this->post(route('weddings.guestbook', ['slug' => $wedding->slug]), [
            'name' => 'Lakshmi',
            'message' => 'Travel safely.',
        ])->assertRedirect();

        $entry = $wedding->guestbookEntries()->first();
        $this->assertNotNull($entry);
        $this->assertSame(GuestbookStatus::Pending, $entry->status);

        $this->get(route('weddings.public', ['slug' => $wedding->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('wedding.guestbook', []));

        $this->actingAs($user)
            ->post(route('weddings.guestbook.approve', [$wedding, $entry]))
            ->assertRedirect();

        $this->get(route('weddings.public', ['slug' => $wedding->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('wedding.guestbook.0.message', 'Travel safely.'));
    }

    public function test_photos_reject_non_images_and_store_a_generated_name(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('weddings.photos.store', $wedding), [
                'photo' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
            ])
            ->assertSessionHasErrors('photo');

        $this->actingAs($user)
            ->post(route('weddings.photos.store', $wedding), [
                'photo' => UploadedFile::fake()->image('family.jpg', 800, 600),
                'caption' => 'The families',
            ])
            ->assertRedirect();

        $photo = $wedding->photos()->first();
        $this->assertNotNull($photo);
        $this->assertStringEndsWith('.jpg', $photo->path);
        $this->assertStringNotContainsString('family', $photo->path);
        Storage::disk('public')->assertExists($photo->path);
    }

    public function test_the_studio_pages_render_for_the_owner(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('dashboard'));

        $this->actingAs($user)->get(route('weddings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('weddings/index')
                ->has('weddings', 1)
                ->where('weddings.0.id', $wedding->id)
                ->where('weddings.0.invitation_mode', $wedding->invitation_mode)
                ->has('eventTypes')
                ->where('eventTypes.0.available', true)
                ->where('eventTypes.0.designs_href', fn ($href) => is_string($href) && str_starts_with($href, '/designs/')));
        $this->actingAs($user)->get(route('weddings.create'))
            ->assertRedirect('/designs');

        $this->actingAs($user)->get(route('weddings.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('weddings/edit')
                ->where('wedding.owner.guests', []));

        $this->actingAs($user)->get(route('weddings.show', $wedding))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('weddings/show')->has('wedding.qr_url'));

        $this->actingAs($user)->get(route('weddings.preview', $wedding))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('weddings/preview'));
    }

    public function test_seo_pages_are_distinct(): void
    {
        $this->get(route('seo.tamil-wedding-invitation'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('seo/landing')
                ->where('page.title', fn (string $title): bool => str_contains($title, 'Tamil')));

        $this->get(route('seo.wedding-website'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('page.title', fn (string $title): bool => str_contains($title, 'website')));
    }
}
