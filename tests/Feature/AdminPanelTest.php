<?php

namespace Tests\Feature;

use App\Enums\GuestbookStatus;
use App\Models\AdminAuditLog;
use App\Models\GuestbookEntry;
use App\Models\User;
use App\Models\Wedding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        config(['platform.admin_emails' => ['owner@example.com']]);

        return User::factory()->create(['email' => 'owner@example.com']);
    }

    public function test_non_admin_cannot_access_admin(): void
    {
        config([
            'platform.admin_emails' => ['owner@example.com'],
            'billing.admin_emails' => ['billing@example.com'],
        ]);
        $user = User::factory()->create(['email' => 'guest@example.com']);
        $billingOnly = User::factory()->create(['email' => 'billing@example.com']);

        $this->actingAs($user)->get(route('admin.dashboard'))->assertNotFound();
        $this->actingAs($billingOnly)->get(route('admin.dashboard'))->assertNotFound();
        $this->actingAs($user)->get(route('admin.login'))->assertNotFound();
    }

    public function test_guest_is_redirected_to_admin_login(): void
    {
        $this->get(route('admin.dashboard'))
            ->assertRedirect(route('admin.login'));

        $this->get(route('admin.login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/login'));
    }

    public function test_admin_can_sign_in_via_admin_login(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $admin = User::factory()->create([
            'email' => 'owner@example.com',
            'password' => bcrypt('secret-pass'),
        ]);
        $guest = User::factory()->create([
            'email' => 'guest@example.com',
            'password' => bcrypt('secret-pass'),
        ]);

        $this->post(route('admin.login.store'), [
            'email' => $guest->email,
            'password' => 'secret-pass',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();

        $this->post(route('admin.login.store'), [
            'email' => $admin->email,
            'password' => 'secret-pass',
        ])->assertRedirect(route('admin.dashboard'));

        $this->assertAuthenticatedAs($admin);
    }

    public function test_admin_can_access_dashboard(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->get(route('admin.dashboard', ['preset' => '30d', 'plan' => 'free']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/dashboard')
                ->has('platform.checklist')
                ->has('analytics.kpis')
                ->has('analytics.totals')
                ->has('analytics.funnel')
                ->has('filters')
                ->where('filters.preset', '30d')
                ->where('filters.plan', 'free')
                ->has('recent.users'));
    }

    public function test_ops_url_redirects_to_admin(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->get(route('ops.index'))
            ->assertRedirect(route('admin.dashboard'));
    }

    public function test_admin_can_update_user_plan_and_audit(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create(['plan' => 'free', 'message_credits' => 0]);

        $this->actingAs($admin)
            ->post(route('admin.users.update', $user), [
                'plan' => 'pro',
                'message_credits' => 100,
            ])
            ->assertRedirect();

        $user->refresh();
        $this->assertSame('pro', $user->plan);
        $this->assertSame(100, (int) $user->message_credits);
        $this->assertDatabaseHas('admin_audit_logs', [
            'actor_user_id' => $admin->id,
            'action' => 'user.update_plan',
            'subject_id' => $user->id,
        ]);
    }

    public function test_admin_can_override_event_site_billing(): void
    {
        $admin = $this->admin();
        $owner = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $owner->id,
            'site_billing_status' => 'draft_ready',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.events.billing', $wedding), ['action' => 'trial'])
            ->assertRedirect();

        $this->assertSame('trial', $wedding->fresh()->site_billing_status);
        $this->assertTrue(AdminAuditLog::query()->where('action', 'event.billing_override')->exists());
    }

    public function test_admin_can_moderate_guestbook(): void
    {
        $admin = $this->admin();
        $wedding = Wedding::factory()->create();
        $entry = GuestbookEntry::query()->create([
            'event_id' => $wedding->id,
            'name' => 'Guest',
            'message' => 'Hello',
            'status' => GuestbookStatus::Pending,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.moderation.guestbook', $entry), ['status' => 'approved'])
            ->assertRedirect();

        $this->assertSame(GuestbookStatus::Approved, $entry->fresh()->status);
    }

    public function test_admin_can_retry_failed_job(): void
    {
        $admin = $this->admin();
        $uuid = '11111111-1111-1111-1111-111111111111';
        DB::table('failed_jobs')->insert([
            'uuid' => $uuid,
            'connection' => 'database',
            'queue' => 'default',
            'payload' => json_encode(['displayName' => 'TestJob']),
            'exception' => 'boom',
            'failed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.queues.retry', ['id' => $uuid]))
            ->assertRedirect();

        $this->assertTrue(AdminAuditLog::query()->where('action', 'queue.retry')->exists());
    }

    public function test_disabled_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'email' => 'disabled@example.com',
            'password' => bcrypt('password'),
            'disabled_at' => now(),
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertSessionHasErrors();

        $this->assertGuest();
    }

    public function test_analytics_export_is_admin_only(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $user = User::factory()->create(['email' => 'guest@example.com']);
        $admin = $this->admin();

        $this->actingAs($user)->get(route('admin.analytics.export'))->assertNotFound();

        $this->actingAs($admin)
            ->get(route('admin.analytics.export', ['preset' => '7d']))
            ->assertOk()
            ->assertHeader('content-disposition');
    }

    public function test_admin_analytics_page_loads(): void
    {
        $admin = $this->admin();
        Wedding::factory()->create(['site_billing_status' => 'draft_ready']);

        $this->actingAs($admin)
            ->get(route('admin.analytics.index', ['preset' => '7d']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/analytics/index')
                ->has('analytics.kpis')
                ->has('analytics.billing_health')
                ->has('analytics.series.growth'));
    }

    public function test_admin_event_detail_includes_analytics_and_card(): void
    {
        $admin = $this->admin();
        $wedding = Wedding::factory()->create(['site_billing_status' => 'trial']);

        $this->actingAs($admin)
            ->get(route('admin.events.show', $wedding))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/events/show')
                ->has('event.analytics')
                ->has('event.traffic_14d')
                ->has('event.card')
                ->has('event.guest_stats')
                ->has('event.recent_guests'));
    }
}


