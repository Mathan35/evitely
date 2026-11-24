<?php

namespace Tests\Feature;

use App\Enums\InvitationDeliveryStatus;
use App\Jobs\SendGuestTwilioMessage;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class TwilioInviteSendTest extends TestCase
{
    use RefreshDatabase;

    public function test_host_can_queue_automated_twilio_sms_for_selected_guests(): void
    {
        Queue::fake();
        config([
            'services.twilio.account_sid' => 'ACtest',
            'services.twilio.auth_token' => 'token',
            'services.twilio.sms_from' => '+15555550100',
            'services.twilio.whatsapp_from' => '',
        ]);

        $user = User::factory()->pro()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'country_code' => '+91',
            'phone' => '9042018876',
            'invitation_status' => InvitationDeliveryStatus::Pending,
        ]);

        $this->actingAs($user)
            ->post(route('weddings.guests.bulk', $wedding), [
                'action' => 'send_sms',
                'guest_ids' => [$guest->id],
            ])
            ->assertRedirect();

        Queue::assertPushed(SendGuestTwilioMessage::class, function (SendGuestTwilioMessage $job) use ($guest): bool {
            return $job->guestId === $guest->id && $job->channel === 'sms';
        });

        $this->assertSame(199, $user->fresh()->message_credits);
    }

    public function test_host_can_switch_invite_delivery_mode(): void
    {
        $user = User::factory()->pro()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->put(route('weddings.invite-delivery-mode', $wedding), [
                'mode' => 'automated',
            ])
            ->assertRedirect();

        $wedding->refresh();
        $this->assertSame('automated', $wedding->setting?->details['invite_delivery_mode'] ?? null);
    }

    public function test_twilio_sms_skips_when_not_configured(): void
    {
        Queue::fake();
        config([
            'services.twilio.account_sid' => '',
            'services.twilio.auth_token' => '',
            'services.twilio.sms_from' => '',
        ]);

        $user = User::factory()->pro()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'country_code' => '+91',
            'phone' => '9042018876',
        ]);

        $this->actingAs($user)
            ->post(route('weddings.guests.bulk', $wedding), [
                'action' => 'send_sms',
                'guest_ids' => [$guest->id],
            ])
            ->assertRedirect();

        Queue::assertNothingPushed();
        // Credit refunded when Twilio queue is skipped.
        $this->assertSame(200, $user->fresh()->message_credits);
    }
}
