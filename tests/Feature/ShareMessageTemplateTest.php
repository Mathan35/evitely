<?php

namespace Tests\Feature;

use App\Jobs\SendGuestTwilioMessage;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Services\TwilioMessagingService;
use App\Support\InviteHost;
use App\Support\ShareMessageFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use Tests\TestCase;

class ShareMessageTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_custom_public_template_appears_in_share_message_and_links(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'title' => 'Priya & Arun',
            'venue_name' => 'The Glass House',
            'city' => 'Chennai',
        ]);

        $wedding->setting()->update([
            'details' => [
                'share_public_template' => 'Celebrate {{title}} with us at {{place}}. RSVP: {{url}}',
            ],
        ]);

        $shareUrl = InviteHost::publicUrl($wedding->slug);
        $expected = ShareMessageFactory::publicText($wedding->fresh(['eventType', 'setting']), $shareUrl);

        $this->assertStringContainsString('Celebrate Priya & Arun with us at The Glass House, Chennai', $expected);
        $this->assertStringContainsString($shareUrl, $expected);

        $this->get(route('weddings.public', $wedding->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/wedding')
                ->where('wedding.share_message', $expected)
                ->where('wedding.share_templates.public', 'Celebrate {{title}} with us at {{place}}. RSVP: {{url}}')
                ->where('wedding.share_links.whatsapp', 'https://wa.me/?text='.rawurlencode($expected)));
    }

    public function test_empty_public_template_falls_back_to_occasion_default(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'title' => "Rahul's birthday",
            'event_type_id' => \App\Models\EventType::query()->where('slug', 'birthday')->value('id'),
        ]);

        $wedding->setting()->update([
            'details' => [
                'share_public_template' => '',
            ],
        ]);

        $shareUrl = route('weddings.public', $wedding->slug);
        $message = ShareMessageFactory::publicText($wedding->fresh(['eventType', 'setting']), $shareUrl);

        $this->assertStringContainsString("You're invited to Rahul's birthday", $message);
        $this->assertStringContainsString($shareUrl, $message);
        $this->assertStringNotContainsString('{{title}}', $message);
    }

    public function test_twilio_job_uses_custom_guest_template_placeholders(): void
    {
        $captured = null;
        $twilio = Mockery::mock(TwilioMessagingService::class);
        $twilio->shouldReceive('e164')->once()->andReturn('+919042018876');
        $twilio->shouldReceive('sendSms')->once()->withArgs(function (string $to, string $body) use (&$captured): bool {
            $captured = $body;

            return $to === '+919042018876';
        });
        $this->app->instance(TwilioMessagingService::class, $twilio);

        $user = User::factory()->pro()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'title' => 'Priya & Arun',
        ]);
        $wedding->setting()->update([
            'details' => [
                'share_guest_template' => 'Hey {{guest_name}}! Join {{title}}: {{guest_url}}',
            ],
        ]);

        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'first_name' => 'Amira',
            'country_code' => '+91',
            'phone' => '9042018876',
        ]);

        (new SendGuestTwilioMessage($guest->id, 'sms'))->handle($twilio);

        $guestUrl = InviteHost::guestUrl($wedding->slug, (string) $guest->guest_token);
        $this->assertSame("Hey Amira! Join Priya & Arun: {$guestUrl}", $captured);
    }

    public function test_empty_guest_template_falls_back_to_default_copy(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'title' => 'Priya & Arun',
        ]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'first_name' => 'Amira',
        ]);

        $body = ShareMessageFactory::guestText($wedding->fresh(['eventType', 'setting']), $guest);
        $guestUrl = InviteHost::guestUrl($wedding->slug, (string) $guest->guest_token);

        $this->assertSame(
            "Hi Amira, you're invited to Priya & Arun. Open your personal invite: {$guestUrl}",
            $body,
        );
    }

    public function test_guest_template_appends_url_when_placeholder_missing(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'title' => 'Priya & Arun',
        ]);
        $wedding->setting()->update([
            'details' => [
                'share_guest_template' => 'Hi {{guest_name}}, see you at {{title}}!',
            ],
        ]);
        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'first_name' => 'Amira',
        ]);

        $body = ShareMessageFactory::guestText($wedding->fresh(['eventType', 'setting']), $guest);
        $guestUrl = InviteHost::guestUrl($wedding->slug, (string) $guest->guest_token);

        $this->assertStringContainsString('Hi Amira, see you at Priya & Arun!', $body);
        $this->assertStringContainsString($guestUrl, $body);
    }

    public function test_wedding_update_persists_share_templates(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'title' => $wedding->title,
                'details' => [
                    'share_public_template' => 'Public: {{title}} {{url}}',
                    'share_guest_template' => 'Guest: {{guest_name}} {{guest_url}}',
                ],
            ])
            ->assertRedirect();

        $details = $wedding->fresh()->setting?->details ?? [];
        $this->assertSame('Public: {{title}} {{url}}', $details['share_public_template'] ?? null);
        $this->assertSame('Guest: {{guest_name}} {{guest_url}}', $details['share_guest_template'] ?? null);
    }

    public function test_billing_schedule_persists_guest_share_template(): void
    {
        config(['billing.allow_local_activate' => true, 'billing.driver' => 'local']);

        $user = User::factory()->create(['message_credits' => 20]);
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
        ]);

        app(\App\Services\Billing\SiteBillingService::class)->fulfillFixedPackPayment(
            $wedding,
            $user,
            'site_30',
            0,
            ['go_live_mode' => 'schedule', 'scheduled_publish_at' => now()->addDay()->toDateTimeString()],
        );

        $guest = WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'friend@example.com',
            'phone' => null,
        ]);

        $this->actingAs($user)
            ->postJson(route('weddings.billing.schedule', $wedding), [
                'scheduled_publish_at' => now()->addDays(2)->toDateTimeString(),
                'share_guest_template' => 'Hey {{guest_name}} from billing: {{guest_url}}',
                'auto_share' => [
                    'enabled' => true,
                    'channel_mode' => 'email',
                    'guest_ids' => [$guest->id],
                    'new_contacts' => [],
                ],
            ])
            ->assertOk();

        $details = $wedding->fresh()->setting?->details ?? [];
        $this->assertSame(
            'Hey {{guest_name}} from billing: {{guest_url}}',
            $details['share_guest_template'] ?? null,
        );
    }

    public function test_billing_payload_includes_share_templates(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);
        $wedding->setting()->update([
            'details' => [
                'share_guest_template' => 'Custom guest {{guest_name}}',
            ],
        ]);

        $this->actingAs($user)
            ->get(route('weddings.billing', $wedding))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weddings/billing')
                ->where('billing.share_templates.guest', 'Custom guest {{guest_name}}')
                ->has('billing.share_templates.default_guest')
                ->has('billing.share_templates.preview.title'));
    }
}
