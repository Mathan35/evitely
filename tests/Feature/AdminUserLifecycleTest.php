<?php

namespace Tests\Feature;

use App\Enums\WeddingStatus;
use App\Models\AdminAuditLog;
use App\Models\BillingPayment;
use App\Models\User;
use App\Models\UserCoupon;
use App\Models\Wedding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminUserLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        config(['platform.admin_emails' => ['owner@example.com']]);

        return User::factory()->create(['email' => 'owner@example.com']);
    }

    public function test_admin_can_deactivate_user_and_unpublish_sites(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create(['email' => 'host@example.com']);
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);

        DB::table('sessions')->insert([
            'id' => 'sess-host-1',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'payload' => 'x',
            'last_activity' => time(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.users.disable', $user))
            ->assertRedirect();

        $user->refresh();
        $wedding->refresh();

        $this->assertNotNull($user->disabled_at);
        $this->assertNull($user->remember_token);
        $this->assertSame(WeddingStatus::Draft, $wedding->status);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseHas('admin_audit_logs', [
            'actor_user_id' => $admin->id,
            'action' => 'user.disable',
            'subject_id' => $user->id,
        ]);
    }

    public function test_admin_can_reactivate_user(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create(['disabled_at' => now()]);

        $this->actingAs($admin)
            ->post(route('admin.users.enable', $user))
            ->assertRedirect();

        $this->assertNull($user->fresh()->disabled_at);
    }

    public function test_admin_cannot_deactivate_self_or_platform_admin(): void
    {
        $admin = $this->admin();
        $otherAdmin = User::factory()->create(['email' => 'ops2@example.com']);
        config(['platform.admin_emails' => ['owner@example.com', 'ops2@example.com']]);

        $this->actingAs($admin)
            ->post(route('admin.users.disable', $admin))
            ->assertSessionHasErrors('user');

        $this->actingAs($admin)
            ->post(route('admin.users.disable', $otherAdmin))
            ->assertSessionHasErrors('user');

        $this->assertNull($admin->fresh()->disabled_at);
        $this->assertNull($otherAdmin->fresh()->disabled_at);
    }

    public function test_admin_can_purge_user_and_all_owned_data(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create([
            'email' => 'purge-me@example.com',
            'name' => 'Purge Me',
            'message_credits' => 40,
        ]);
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'event_id' => $wedding->id,
            'provider' => 'razorpay',
            'kind' => 'site_pack',
            'sku' => 'site_30',
            'amount_paise' => 49900,
            'currency' => 'INR',
            'status' => 'paid',
            'razorpay_order_id' => 'order_purge_1',
            'paid_at' => now(),
        ]);

        UserCoupon::query()->create([
            'user_id' => $user->id,
            'code' => 'HOST20',
            'discount_type' => 'percent',
            'percent_off' => 20,
            'status' => 'available',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $user), [
                'confirmation' => 'purge-me@example.com',
                'acknowledge' => '1',
            ])
            ->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('events', ['id' => $wedding->id]);
        $this->assertDatabaseMissing('billing_payments', ['razorpay_order_id' => 'order_purge_1']);
        $this->assertDatabaseMissing('user_coupons', ['code' => 'HOST20', 'user_id' => $user->id]);
        $this->assertTrue(
            AdminAuditLog::query()->where('action', 'user.purge')->where('actor_user_id', $admin->id)->exists()
        );
    }

    public function test_purge_requires_exact_email_confirmation(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create(['email' => 'keep@example.com']);

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $user), [
                'confirmation' => 'wrong@example.com',
                'acknowledge' => '1',
            ])
            ->assertSessionHasErrors('confirmation');

        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_user_show_includes_lifecycle_impact(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();
        Wedding::factory()->count(2)->create(['user_id' => $user->id]);

        $this->actingAs($admin)
            ->get(route('admin.users.show', $user))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/users/show')
                ->where('lifecycle.events', 2)
                ->where('lifecycle.can_purge', true)
                ->where('user.is_platform_admin', false));
    }
}
