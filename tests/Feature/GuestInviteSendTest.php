<?php

namespace Tests\Feature;

use App\Enums\InvitationDeliveryStatus;
use App\Jobs\SendGuestInvitationMail;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Notifications\InvitationSent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class GuestInviteSendTest extends TestCase
{
    use RefreshDatabase;

    public function test_host_can_queue_invite_emails_and_mark_them_sent_when_processed(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $withEmail = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'guest@example.com',
            'invitation_status' => InvitationDeliveryStatus::Pending,
        ]);
        $withoutEmail = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => null,
            'invitation_status' => InvitationDeliveryStatus::Pending,
        ]);

        $this->actingAs($user)
            ->post(route('weddings.guests.bulk', $wedding), [
                'action' => 'mark_sent',
                'guest_ids' => [$withEmail->id, $withoutEmail->id],
            ])
            ->assertRedirect();

        $withEmail->refresh();
        $withoutEmail->refresh();

        // QUEUE_CONNECTION=sync in tests → job runs immediately via notifyNow
        $this->assertSame(InvitationDeliveryStatus::Sent, $withEmail->invitation_status);
        $this->assertNotNull($withEmail->invitation_sent_at);
        $this->assertSame(1, $withEmail->invitation_send_count);
        $this->assertNull($withEmail->invitation_last_error);

        $this->assertSame(InvitationDeliveryStatus::Pending, $withoutEmail->invitation_status);
        $this->assertNull($withoutEmail->invitation_sent_at);

        Notification::assertSentOnDemand(InvitationSent::class);
    }

    public function test_invite_emails_dispatch_a_background_job(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'queued@example.com',
            'invitation_status' => InvitationDeliveryStatus::Pending,
        ]);

        $this->actingAs($user)
            ->post(route('weddings.guests.bulk', $wedding), [
                'action' => 'mark_sent',
                'guest_ids' => [$guest->id],
            ])
            ->assertRedirect();

        Queue::assertPushed(SendGuestInvitationMail::class, function (SendGuestInvitationMail $job) use ($guest): bool {
            return $job->guestId === $guest->id;
        });

        $guest->refresh();
        $this->assertSame(InvitationDeliveryStatus::Pending, $guest->invitation_status);
        $this->assertNull($guest->invitation_sent_at);
    }

    public function test_host_can_retry_failed_channel_sends(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'retry@example.com',
            'invitation_status' => InvitationDeliveryStatus::Pending,
            'email_last_error' => 'Email failed to send',
            'invitation_last_error' => 'Email failed to send',
            'invitation_last_channel' => 'email',
        ]);

        $this->actingAs($user)
            ->post(route('weddings.guests.bulk', $wedding), [
                'action' => 'retry_failed',
                'guest_ids' => [$guest->id],
            ])
            ->assertRedirect();

        Queue::assertPushed(SendGuestInvitationMail::class, function (SendGuestInvitationMail $job) use ($guest): bool {
            return $job->guestId === $guest->id;
        });

        $guest->refresh();
        $this->assertNull($guest->email_last_error);
        $this->assertNull($guest->invitation_last_error);
    }

    public function test_successful_email_job_records_channel_delivery(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'channel@example.com',
            'invitation_status' => InvitationDeliveryStatus::Pending,
        ]);

        $this->actingAs($user)
            ->post(route('weddings.guests.bulk', $wedding), [
                'action' => 'mark_sent',
                'guest_ids' => [$guest->id],
            ])
            ->assertRedirect();

        $guest->refresh();
        $this->assertNotNull($guest->email_sent_at);
        $this->assertSame(1, $guest->email_send_count);
        $this->assertSame('email', $guest->invitation_last_channel);
        $this->assertNull($guest->email_last_error);
    }
}
