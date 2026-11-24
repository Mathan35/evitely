<?php

namespace Tests\Feature;

use App\Enums\RsvpStatus;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Notifications\RsvpReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RsvpReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_host_can_manually_send_rsvp_reminders_to_pending_guests(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $pending = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'pending@example.com',
            'rsvp_status' => RsvpStatus::Pending,
        ]);
        WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'attending@example.com',
            'rsvp_status' => RsvpStatus::Attending,
        ]);
        WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => null,
            'rsvp_status' => RsvpStatus::Pending,
        ]);

        $this->actingAs($user)
            ->post(route('weddings.rsvp-reminders.store', $wedding))
            ->assertRedirect();

        Notification::assertSentOnDemand(RsvpReminder::class, function ($notification, $channels, $notifiable) use ($pending) {
            return $notification->guest->is($pending)
                && ($notifiable->routes['mail'] ?? null) === 'pending@example.com';
        });
    }

    public function test_scheduled_command_only_sends_when_reminders_enabled(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $enabled = Wedding::factory()->create(['user_id' => $user->id]);
        $enabled->setting()->updateOrCreate([], [
            'details' => ['rsvp_reminders_enabled' => '1'],
        ]);
        $enabledGuest = WeddingGuest::factory()->create([
            'event_id' => $enabled->id,
            'email' => 'enabled@example.com',
            'rsvp_status' => RsvpStatus::Pending,
        ]);

        $disabled = Wedding::factory()->create(['user_id' => $user->id]);
        $disabled->setting()->updateOrCreate([], [
            'details' => ['rsvp_reminders_enabled' => '0'],
        ]);
        WeddingGuest::factory()->create([
            'event_id' => $disabled->id,
            'email' => 'disabled@example.com',
            'rsvp_status' => RsvpStatus::Pending,
        ]);

        Artisan::call('rsvp:remind');

        Notification::assertSentOnDemand(RsvpReminder::class, function ($notification) use ($enabledGuest) {
            return $notification->guest->is($enabledGuest);
        });
        Notification::assertSentOnDemandTimes(RsvpReminder::class, 1);
    }

    public function test_scheduled_command_respects_cooldown_and_max_sends(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $wedding->setting()->updateOrCreate([], [
            'details' => [
                'rsvp_reminders_enabled' => '1',
                'rsvp_reminder_cooldown_days' => '3',
                'rsvp_reminder_max' => '2',
            ],
        ]);

        $fresh = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'fresh@example.com',
            'rsvp_status' => RsvpStatus::Pending,
            'reminder_send_count' => 0,
            'reminder_sent_at' => null,
        ]);
        WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'cooldown@example.com',
            'rsvp_status' => RsvpStatus::Pending,
            'reminder_send_count' => 1,
            'reminder_sent_at' => now()->subDay(),
        ]);
        WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'maxed@example.com',
            'rsvp_status' => RsvpStatus::Pending,
            'reminder_send_count' => 2,
            'reminder_sent_at' => now()->subDays(10),
        ]);

        Artisan::call('rsvp:remind');

        Notification::assertSentOnDemandTimes(RsvpReminder::class, 1);
        Notification::assertSentOnDemand(RsvpReminder::class, function ($notification) use ($fresh) {
            return $notification->guest->is($fresh);
        });

        $fresh->refresh();
        $this->assertSame(1, (int) $fresh->reminder_send_count);
        $this->assertNotNull($fresh->reminder_sent_at);
    }

    public function test_manual_send_bypasses_cooldown(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'recent@example.com',
            'rsvp_status' => RsvpStatus::Pending,
            'reminder_send_count' => 1,
            'reminder_sent_at' => now()->subHour(),
        ]);

        $this->actingAs($user)
            ->post(route('weddings.rsvp-reminders.store', $wedding))
            ->assertRedirect();

        Notification::assertSentOnDemand(RsvpReminder::class, function ($notification) use ($guest) {
            return $notification->guest->is($guest);
        });
        $guest->refresh();
        $this->assertSame(2, (int) $guest->reminder_send_count);
    }
}
