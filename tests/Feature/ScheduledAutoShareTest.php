<?php

namespace Tests\Feature;

use App\Enums\WeddingStatus;
use App\Jobs\DispatchScheduledAutoShare;
use App\Jobs\SendGuestInvitationMail;
use App\Jobs\SendGuestTwilioMessage;
use App\Models\ScheduledAutoShare;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Services\Billing\SiteBillingService;
use App\Services\ScheduledAutoShareService;
use App\Services\TwilioMessagingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Tests\TestCase;

class ScheduledAutoShareTest extends TestCase
{
    use RefreshDatabase;

    private function paidScheduledWedding(User $user): Wedding
    {
        config(['billing.allow_local_activate' => true, 'billing.driver' => 'local']);

        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
            'status' => WeddingStatus::Draft,
        ]);

        app(SiteBillingService::class)->fulfillFixedPackPayment($wedding, $user, 'site_30', 50, [
            'go_live_mode' => 'schedule',
            'scheduled_publish_at' => now()->addDays(2)->toDateTimeString(),
        ]);

        return $wedding->fresh();
    }

    public function test_schedule_reserves_credits_for_phone_recipients(): void
    {
        $user = User::factory()->create(['message_credits' => 5]);
        $wedding = $this->paidScheduledWedding($user);

        $withPhone = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => null,
            'phone' => '9876543210',
            'country_code' => '91',
        ]);
        $emailOnly = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'guest@example.com',
            'phone' => null,
        ]);

        $beforeCredits = (int) $user->fresh()->message_credits;

        $this->actingAs($user)
            ->postJson(route('weddings.billing.schedule', $wedding), [
                'scheduled_publish_at' => now()->addDays(3)->toDateTimeString(),
                'auto_share' => [
                    'enabled' => true,
                    'channel_mode' => 'smart',
                    'guest_ids' => [$withPhone->id, $emailOnly->id],
                    'new_contacts' => [],
                ],
            ])
            ->assertOk();

        $this->assertSame($beforeCredits - 1, (int) $user->fresh()->message_credits);

        $share = ScheduledAutoShare::query()->where('event_id', $wedding->id)->where('status', 'pending')->first();
        $this->assertNotNull($share);
        $this->assertSame(1, (int) $share->reserved_credits);
        $this->assertSame(2, $share->recipients()->count());
    }

    public function test_cancel_auto_share_refunds_reserved_credits(): void
    {
        $user = User::factory()->create(['message_credits' => 3]);
        $wedding = $this->paidScheduledWedding($user);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'phone' => '9876543210',
            'country_code' => '91',
            'email' => null,
        ]);

        $beforeCredits = (int) $user->fresh()->message_credits;

        $this->actingAs($user)->postJson(route('weddings.billing.schedule', $wedding), [
            'scheduled_publish_at' => now()->addDays(3)->toDateTimeString(),
            'auto_share' => [
                'enabled' => true,
                'channel_mode' => 'whatsapp',
                'guest_ids' => [$guest->id],
            ],
        ])->assertOk();

        $this->assertSame($beforeCredits - 1, (int) $user->fresh()->message_credits);

        $this->actingAs($user)->postJson(route('weddings.billing.schedule', $wedding), [
            'scheduled_publish_at' => now()->addDays(4)->toDateTimeString(),
            'auto_share' => [
                'enabled' => false,
            ],
        ])->assertOk();

        $this->assertSame($beforeCredits, (int) $user->fresh()->message_credits);
        $this->assertSame(
            0,
            ScheduledAutoShare::query()->where('event_id', $wedding->id)->where('status', 'pending')->count(),
        );
    }

    public function test_activate_go_live_dispatches_auto_share_job(): void
    {
        Queue::fake();

        $user = User::factory()->create(['message_credits' => 5]);
        $wedding = $this->paidScheduledWedding($user);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'a@example.com',
            'phone' => null,
        ]);

        app(ScheduledAutoShareService::class)->upsertPending($wedding, $user, [
            'enabled' => true,
            'channel_mode' => 'email',
            'guest_ids' => [$guest->id],
            'scheduled_for' => now()->addDay(),
        ]);

        $wedding->forceFill([
            'scheduled_publish_at' => now()->subMinute(),
            'scheduled_publish_status' => 'pending',
            'site_billing_status' => 'awaiting_go_live',
        ])->save();

        app(SiteBillingService::class)->activateGoLive($wedding->fresh());

        Queue::assertPushed(DispatchScheduledAutoShare::class);
        $this->assertSame('paid', $wedding->fresh()->site_billing_status);
    }

    public function test_run_smart_skips_guest_without_contact_and_queues_email(): void
    {
        Queue::fake();

        $twilio = Mockery::mock(TwilioMessagingService::class);
        $twilio->shouldReceive('whatsappReady')->andReturn(false);
        $twilio->shouldReceive('smsReady')->andReturn(false);
        $twilio->shouldReceive('e164')->andReturnUsing(function (?string $cc, ?string $phone) {
            $digits = preg_replace('/\D+/', '', ($cc ?? '').($phone ?? '')) ?: '';

            return strlen($digits) >= 8 ? '+'.$digits : null;
        });
        $this->app->instance(TwilioMessagingService::class, $twilio);

        $user = User::factory()->create(['message_credits' => 5]);
        $wedding = $this->paidScheduledWedding($user);

        $emailGuest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'host-friend@example.com',
            'phone' => null,
        ]);
        $blankGuest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => null,
            'phone' => null,
        ]);

        $share = app(ScheduledAutoShareService::class)->upsertPending($wedding, $user, [
            'enabled' => true,
            'channel_mode' => 'smart',
            'guest_ids' => [$emailGuest->id, $blankGuest->id],
        ]);

        $this->assertNotNull($share);
        // No phone → no credits reserved for smart email-only.
        $this->assertSame(0, (int) $share->reserved_credits);

        app(ScheduledAutoShareService::class)->run($share->fresh());

        $share->refresh();
        $this->assertContains($share->status, ['completed', 'partial']);

        $emailRecipient = $share->recipients()->where('event_guest_id', $emailGuest->id)->first();
        $blankRecipient = $share->recipients()->where('event_guest_id', $blankGuest->id)->first();

        $this->assertSame('queued', $emailRecipient?->send_status);
        $this->assertSame('email', $emailRecipient?->resolved_channel);
        $this->assertSame('skipped', $blankRecipient?->send_status);

        Queue::assertPushed(SendGuestInvitationMail::class);
        Queue::assertNotPushed(SendGuestTwilioMessage::class);
    }

    public function test_new_contacts_are_created_as_guests(): void
    {
        $user = User::factory()->create(['message_credits' => 10]);
        $wedding = $this->paidScheduledWedding($user);

        $this->actingAs($user)->postJson(route('weddings.billing.schedule', $wedding), [
            'scheduled_publish_at' => now()->addDays(3)->toDateTimeString(),
            'auto_share' => [
                'enabled' => true,
                'channel_mode' => 'email',
                'guest_ids' => [],
                'new_contacts' => [
                    [
                        'first_name' => 'Priya',
                        'last_name' => 'Shah',
                        'email' => 'priya@example.com',
                        'phone' => '',
                        'country_code' => '+91',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('event_guests', [
            'event_id' => $wedding->id,
            'first_name' => 'Priya',
            'email' => 'priya@example.com',
        ]);
    }
}
