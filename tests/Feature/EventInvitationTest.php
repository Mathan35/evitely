<?php

namespace Tests\Feature;

use App\Models\AnalyticsEvent;
use App\Models\User;
use App\Models\Wedding;
use App\Support\ShareMessageFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_custom_event_does_not_need_a_couple(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('weddings.store'), [
            'title' => 'Studio open house',
            'event_type' => 'custom',
            'invitation_mode' => 'link',
        ])->assertRedirect();

        $event = Wedding::query()->where('title', 'Studio open house')->first();
        $this->assertNotNull($event);
        $this->assertSame(0, $event->hosts()->count());
        $this->assertSame('custom', $event->eventType?->slug);
    }

    public function test_a_birthday_page_does_not_render_a_wedding_story(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('weddings.store'), [
            'title' => "Rahul's birthday",
            'event_type' => 'birthday',
            'invitation_mode' => 'link',
            'city' => 'Chennai',
            'publish' => true,
            'hosts' => [['name' => 'Rahul', 'role' => 'celebrant']],
        ])->assertRedirect();

        $event = Wedding::query()->where('title', "Rahul's birthday")->firstOrFail();

        $this->get(route('weddings.public', $event->slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('public/wedding')
                ->where('wedding.sections.story', false)
                ->where('wedding.sections.couple', false)
                ->where('wedding.event_type', 'birthday')
                ->where('wedding.rsvp_fields', ['attend', 'party_size']));

        $message = ShareMessageFactory::text($event->fresh('eventType'), route('weddings.public', $event->slug));
        $this->assertStringContainsString("You're invited to Rahul's birthday", $message);
        $this->assertStringNotContainsString('Join us to celebrate', $message);
    }

    public function test_a_corporate_page_renders_agenda_and_registration(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('weddings.store'), [
            'title' => 'Northwind launch',
            'event_type' => 'corporate-event',
            'invitation_mode' => 'link',
            'publish' => true,
            'details' => ['agenda' => 'Keynote at 10', 'speakers' => 'Mina Rao'],
        ])->assertRedirect();

        $event = Wedding::query()->where('title', 'Northwind launch')->firstOrFail();

        $this->get(route('weddings.public', $event->slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('wedding.sections.agenda', true)
                ->where('wedding.sections.couple', false)
                ->where('wedding.details.agenda', 'Keynote at 10')
                ->where('wedding.rsvp_fields', ['attend', 'company', 'job_title', 'dietary']));

        $this->assertNotSame('classic', $event->theme);
    }

    public function test_a_card_only_event_publishes_the_card(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('weddings.store'), [
            'title' => 'Garden party',
            'event_type' => 'party',
            'invitation_mode' => 'card',
            'publish' => true,
            'generate_card' => true,
        ])->assertRedirect();

        $event = Wedding::query()->where('title', 'Garden party')->firstOrFail();
        $this->assertSame(0, $event->travelDetails()->count());
        $this->assertSame(0, $event->events()->count());

        $this->get(route('weddings.public', $event->slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('public/card'));
    }

    public function test_a_card_and_link_qr_points_at_the_invitation(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('weddings.store'), [
            'title' => 'Priya and Arun',
            'event_type' => 'wedding',
            'invitation_mode' => 'both',
            'bride_name' => 'Priya',
            'groom_name' => 'Arun',
        ])->assertRedirect();

        $event = Wedding::query()->where('title', 'Priya and Arun')->firstOrFail();
        $qr = collect($event->card?->document['elements'] ?? [])->firstWhere('id', 'qr')
            ?? collect($event->card?->document['elements'] ?? [])->firstWhere('type', 'qr');

        $this->assertIsArray($qr);
        $this->assertSame(route('weddings.public', $event->slug), $qr['text']);
    }

    public function test_a_wedding_card_includes_invitation_anatomy(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('weddings.store'), [
            'title' => 'Priya and Arun',
            'event_type' => 'wedding',
            'invitation_mode' => 'both',
            'bride_name' => 'Priya',
            'groom_name' => 'Arun',
            'starts_on' => '2026-09-12',
            'venue_name' => 'The Glasshouse',
            'venue_address' => 'Hudson Valley, New York',
            'city' => 'Hudson Valley',
            'generate_card' => true,
        ])->assertRedirect();

        $event = Wedding::query()->where('title', 'Priya and Arun')->firstOrFail();
        $texts = collect($event->card?->document['elements'] ?? [])->where('type', 'text')->pluck('text')->implode(' ');
        $map = collect($event->card?->document['elements'] ?? [])->firstWhere('id', 'map-qr');

        $this->assertStringContainsString('Together with their families', $texts);
        $this->assertStringContainsString('Priya', $texts);
        $this->assertStringContainsString('Arun', $texts);
        $this->assertStringContainsString('Saturday, 12 September 2026', $texts);
        $this->assertStringContainsString('The Glasshouse', $texts);
        $this->assertStringContainsString('RSVP', $texts);
        $this->assertIsArray($map);
        $this->assertStringContainsString('google.com/maps', (string) ($map['text'] ?? ''));
    }

    public function test_a_housewarming_card_includes_ceremony_details(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('weddings.store'), [
            'title' => 'Riley',
            'event_type' => 'housewarming',
            'invitation_mode' => 'card',
            'host_name' => 'Riley',
            'starts_on' => '2026-10-18',
            'starts_at' => '09:00',
            'venue_name' => 'Willow Porch',
            'venue_address' => 'Villa 18, Green Meadows, Portland',
            'city' => 'Portland',
            'generate_card' => true,
            'details' => [
                'puja_time' => 'Puja · 9:00 AM',
                'meal_time' => 'Lunch · 12:30 PM onwards',
                'contact' => '+1 (555) 014-2218',
            ],
        ])->assertRedirect();

        $event = Wedding::query()->where('title', 'Riley')->firstOrFail();
        $texts = collect($event->card?->document['elements'] ?? [])->where('type', 'text')->pluck('text')->implode(' ');
        $map = collect($event->card?->document['elements'] ?? [])->firstWhere('id', 'map-qr');

        $this->assertStringContainsString('Overwhelmed with Gratitude', $texts);
        $this->assertStringContainsString('Griha Pravesh', $texts);
        $this->assertStringContainsString('Sunday, 18 October 2026', $texts);
        $this->assertStringContainsString('Puja · 9:00 AM', $texts);
        $this->assertStringContainsString('Lunch · 12:30 PM onwards', $texts);
        $this->assertStringContainsString('Willow Porch', $texts);
        $this->assertStringContainsString('Riley & Family', $texts);
        $this->assertStringContainsString('+1 (555) 014-2218', $texts);
        $this->assertIsArray($map);
    }

    public function test_generating_a_card_rebuilds_the_document(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('weddings.store'), [
            'title' => 'Priya and Arun',
            'event_type' => 'wedding',
            'invitation_mode' => 'both',
            'bride_name' => 'Priya',
            'groom_name' => 'Arun',
        ])->assertRedirect();

        $event = Wedding::query()->where('title', 'Priya and Arun')->firstOrFail();
        $event->update(['venue_name' => 'The Glasshouse', 'city' => 'Hudson Valley']);
        $event->card?->update([
            'document' => ['background' => '#f4efe6', 'elements' => []],
            'status' => 'draft',
        ]);

        $this->actingAs($user)
            ->post(route('weddings.card.generate', $event))
            ->assertRedirect();

        $texts = collect($event->fresh('card')->card?->document['elements'] ?? [])->where('type', 'text')->pluck('text')->implode(' ');
        $this->assertStringContainsString('The Glasshouse', $texts);
        $this->assertSame('generated', $event->fresh('card')->card?->status);
    }

    public function test_card_png_export_is_recorded(): void
    {
        $user = User::factory()->create();
        $event = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('weddings.card.export', $event), ['kind' => 'png'])
            ->assertRedirect();

        $this->assertTrue(
            AnalyticsEvent::query()->where('event_id', $event->id)->where('type', 'card_download')->exists()
        );
    }

    public function test_card_share_export_marks_shared_and_is_recorded(): void
    {
        $user = User::factory()->create();
        $event = Wedding::factory()->create(['user_id' => $user->id]);
        $event->card()->create([
            'format' => 'invite',
            'width' => 1080,
            'height' => 1440,
            'document' => ['background' => '#f4efe6', 'elements' => []],
            'status' => 'draft',
        ]);

        $this->actingAs($user)
            ->post(route('weddings.card.export', $event), ['kind' => 'share'])
            ->assertRedirect();

        $this->assertSame('shared', $event->fresh('card')->card?->status);
        $this->assertTrue(
            AnalyticsEvent::query()->where('event_id', $event->id)->where('type', 'card_share')->exists()
        );
    }

    public function test_card_print_export_is_recorded(): void
    {
        $user = User::factory()->create();
        $event = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('weddings.card.export', $event), ['kind' => 'pdf'])
            ->assertRedirect();

        $this->assertTrue(
            AnalyticsEvent::query()
                ->where('event_id', $event->id)
                ->where('type', 'card_download')
                ->where('channel', 'pdf')
                ->exists()
        );
    }

    public function test_the_dashboard_invites_the_host_to_create_an_invitation(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('cta', 'Create Invitation'));
    }

    public function test_a_draft_link_stays_private_and_an_unknown_slug_is_missing(): void
    {
        $event = Wedding::factory()->create();

        $this->get(route('weddings.public', $event->slug))->assertNotFound();
        $this->get('/invite/not-a-real-celebration')->assertNotFound();
    }

    public function test_an_rsvp_with_the_same_email_updates_the_original(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('weddings.store'), [
            'title' => 'Dinner',
            'event_type' => 'dinner',
            'invitation_mode' => 'link',
            'publish' => true,
        ]);
        $event = Wedding::query()->where('title', 'Dinner')->firstOrFail();

        $this->post(route('weddings.rsvp', $event->slug), [
            'guest_name' => 'Mina',
            'email' => 'mina@example.com',
            'status' => 'attending',
            'guest_count' => 2,
        ])->assertRedirect();

        $this->post(route('weddings.rsvp', $event->slug), [
            'guest_name' => 'Mina Rao',
            'email' => 'mina@example.com',
            'status' => 'not_attending',
            'guest_count' => 1,
        ])->assertRedirect();

        $this->assertSame(1, $event->rsvps()->count());
        $this->assertSame('Mina Rao', $event->rsvps()->first()?->guest_name);
    }
}
