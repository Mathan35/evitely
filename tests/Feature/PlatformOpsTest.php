<?php

namespace Tests\Feature;

use App\Enums\RsvpStatus;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Models\GuestbookEntry;
use App\Models\WeddingRsvp;
use App\Notifications\HostDailyDigest;
use App\Notifications\RsvpReminder;
use App\Services\HostDigestService;
use App\Services\PlatformReadinessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PlatformOpsTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_status_command_runs(): void
    {
        $this->artisan('platform:status')->assertSuccessful();
    }

    public function test_ops_page_redirects_admins_to_admin_dashboard(): void
    {
        config(['platform.admin_emails' => ['ops@example.com']]);

        $user = User::factory()->create(['email' => 'guest@example.com']);
        $admin = User::factory()->create(['email' => 'ops@example.com']);

        $this->actingAs($user)->get(route('ops.index'))->assertNotFound();
        $this->actingAs($user)->get(route('admin.dashboard'))->assertNotFound();

        $this->actingAs($admin)
            ->get(route('ops.index'))
            ->assertRedirect(route('admin.dashboard'));
    }

    public function test_host_digest_sends_when_there_is_activity(): void
    {
        Notification::fake();

        $host = User::factory()->create();
        $quiet = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $host->id]);
        Wedding::factory()->create(['user_id' => $quiet->id]);

        WeddingRsvp::query()->create([
            'event_id' => $wedding->id,
            'guest_name' => 'Asha',
            'email' => 'asha@example.com',
            'status' => RsvpStatus::Attending,
            'guest_count' => 1,
            'created_at' => now()->subHours(2),
            'updated_at' => now()->subHours(2),
        ]);
        GuestbookEntry::query()->create([
            'event_id' => $wedding->id,
            'name' => 'Asha',
            'message' => 'Congrats!',
            'status' => \App\Enums\GuestbookStatus::Approved,
            'created_at' => now()->subHours(1),
            'updated_at' => now()->subHours(1),
        ]);

        $result = app(HostDigestService::class)->sendDaily(now()->subDay());

        $this->assertSame(1, $result['sent']);
        Notification::assertSentTo($host, HostDailyDigest::class);
        Notification::assertNotSentTo($quiet, HostDailyDigest::class);
    }

    public function test_host_digest_command_runs(): void
    {
        Notification::fake();
        $this->artisan('host:digest')->assertSuccessful();
    }

    public function test_new_wedding_enables_rsvp_reminders_by_default(): void
    {
        config([
            'platform.rsvp_reminders_default_enabled' => true,
            'platform.rsvp_reminder_days_before' => 7,
        ]);

        $user = User::factory()->create();
        $wedding = app(\App\Services\WeddingService::class)->create($user->id, [
            'title' => 'Test Event',
            'event_type' => 'wedding',
            'invitation_mode' => 'site',
        ]);

        $details = $wedding->setting?->details ?? [];
        $this->assertSame('1', (string) ($details['rsvp_reminders_enabled'] ?? ''));
        $this->assertSame('7', (string) ($details['rsvp_reminder_days_before'] ?? ''));
    }

    public function test_reminder_window_only_inside_days_before_event(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'starts_on' => now()->addDays(10)->toDateString(),
        ]);
        $wedding->setting()->updateOrCreate([], [
            'details' => [
                'rsvp_reminders_enabled' => '1',
                'rsvp_reminder_days_before' => '7',
            ],
        ]);
        WeddingGuest::factory()->create([
            'event_id' => $wedding->id,
            'email' => 'pending@example.com',
            'rsvp_status' => RsvpStatus::Pending,
        ]);

        // Too early (10 days out, window opens at 7).
        Artisan::call('rsvp:remind');
        Notification::assertNothingSent();

        $wedding->forceFill(['starts_on' => now()->addDays(5)->toDateString()])->save();
        Artisan::call('rsvp:remind');
        Notification::assertSentOnDemandTimes(RsvpReminder::class, 1);
    }

    public function test_readiness_checklist_includes_pwa_manifest(): void
    {
        $checklist = collect(app(PlatformReadinessService::class)->checklist())
            ->keyBy('id');

        $this->assertTrue($checklist['pwa']['done']);
    }

    public function test_scheduler_readiness_requires_fresh_heartbeat(): void
    {
        $platform = app(PlatformReadinessService::class);
        $checklist = collect($platform->checklist())->keyBy('id');
        $this->assertFalse($checklist['schedule']['done']);

        $platform->touchSchedulerHeartbeat();
        $checklist = collect($platform->checklist())->keyBy('id');
        $this->assertTrue($checklist['schedule']['done']);
    }
}
