<?php

namespace Tests\Feature;

use App\Models\BillingPayment;
use App\Models\User;
use App\Models\Wedding;
use App\Notifications\AdminPackGrantNotification;
use App\Services\Admin\AdminPackGrantService;
use App\Services\Billing\MessageCreditActivationService;
use App\Services\Billing\RazorpayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminPackGrantTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        config(['platform.admin_emails' => ['owner@example.com']]);

        return User::factory()->create(['email' => 'owner@example.com']);
    }

    public function test_admin_can_grant_free_pack_to_existing_user_with_new_event(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $user = User::factory()->create(['email' => 'guest@example.com', 'message_credits' => 0]);

        $this->actingAs($admin)
            ->post(route('admin.grants.store'), [
                'mode' => 'existing',
                'user_id' => $user->id,
                'event_title' => 'Asha & Rohan',
                'site_pack_sku' => 'site_30',
                'credit_pack_sku' => 'credits_100',
                'include_site_credits' => false,
                'pricing' => 'free',
                'go_live_mode' => 'now',
                'note' => 'Partner giveaway',
                'send_email' => true,
            ])
            ->assertRedirect();

        $wedding = Wedding::query()->where('user_id', $user->id)->first();
        $this->assertNotNull($wedding);
        $this->assertSame('site_30', $wedding->site_pack_sku);
        $this->assertSame('paid', $wedding->site_billing_status);
        $this->assertSame(100, $user->fresh()->message_credits);

        $this->assertDatabaseHas('billing_payments', [
            'user_id' => $user->id,
            'provider' => AdminPackGrantService::PROVIDER,
            'kind' => 'site_pack',
            'sku' => 'site_30',
            'status' => 'paid',
            'amount_paise' => 0,
        ]);
        $this->assertDatabaseHas('billing_payments', [
            'user_id' => $user->id,
            'provider' => AdminPackGrantService::PROVIDER,
            'kind' => 'credit_pack',
            'sku' => 'credits_100',
            'status' => 'paid',
            'amount_paise' => 0,
        ]);
        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'pack.grant',
            'actor_user_id' => $admin->id,
        ]);

        Notification::assertSentTo($user, AdminPackGrantNotification::class);

        $creditPayment = BillingPayment::query()
            ->where('user_id', $user->id)
            ->where('kind', 'credit_pack')
            ->first();
        $this->assertNotNull($creditPayment);
        $this->assertTrue(app(MessageCreditActivationService::class)->isActivated($creditPayment));
        $this->assertFalse(app(MessageCreditActivationService::class)->isPending($creditPayment));
    }

    public function test_admin_can_create_account_and_grant_paid_pack(): void
    {
        Notification::fake();
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.grants.store'), [
                'mode' => 'new',
                'name' => 'New Couple',
                'email' => 'new.couple@example.com',
                'event_title' => 'New Couple Wedding',
                'site_pack_sku' => 'site_15',
                'include_site_credits' => '1',
                'pricing' => 'paid',
                'go_live_mode' => 'now',
                'send_email' => '1',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $user = User::query()->where('email', 'new.couple@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);

        $wedding = Wedding::query()->where('user_id', $user->id)->first();
        $this->assertNotNull($wedding);
        $this->assertSame('site_15', $wedding->site_pack_sku);

        $payment = BillingPayment::query()
            ->where('user_id', $user->id)
            ->where('kind', 'site_pack')
            ->first();
        $this->assertNotNull($payment);
        $this->assertSame(AdminPackGrantService::PROVIDER, $payment->provider);
        $this->assertGreaterThan(0, $payment->amount_paise);
        $this->assertSame('paid', $payment->meta['pricing'] ?? null);

        // Bundled site credits granted immediately.
        $this->assertGreaterThan(0, $user->fresh()->message_credits);
        Notification::assertSentTo($user, AdminPackGrantNotification::class);
    }

    public function test_admin_grant_does_not_affect_other_users_or_checkout_pending_logic(): void
    {
        $admin = $this->admin();
        $receiver = User::factory()->create(['message_credits' => 0]);
        $other = User::factory()->create(['message_credits' => 40, 'plan' => 'pro']);

        $this->actingAs($admin)
            ->post(route('admin.grants.store'), [
                'mode' => 'existing',
                'user_id' => $receiver->id,
                'event_title' => 'Granted Event',
                'site_pack_sku' => 'site_30',
                'credit_pack_sku' => 'credits_100',
                'pricing' => 'complimentary',
                'go_live_mode' => 'now',
                'send_email' => false,
            ])
            ->assertRedirect();

        $this->assertSame(40, $other->fresh()->message_credits);
        $this->assertSame(0, Wedding::query()->where('user_id', $other->id)->count());
        $this->assertSame(0, BillingPayment::query()->where('user_id', $other->id)->count());

        // Self-serve Razorpay credit pack still queues 24h pending (unchanged).
        BillingPayment::query()->create([
            'user_id' => $other->id,
            'provider' => 'razorpay',
            'kind' => 'credit_pack',
            'sku' => 'credits_100',
            'amount_paise' => 29900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => 'order_other_pack',
            'meta' => ['pack' => 'credits_100', 'credits' => 100],
        ]);

        app(RazorpayService::class)->fulfillPaidOrder($other, 'order_other_pack', 'pay_other_pack');

        $this->assertSame(40, $other->fresh()->message_credits);
        $pending = BillingPayment::query()->where('razorpay_order_id', 'order_other_pack')->first();
        $this->assertTrue(app(MessageCreditActivationService::class)->isPending($pending));
        $this->assertCount(1, app(MessageCreditActivationService::class)->pendingForUser($other));
        $this->assertCount(0, app(MessageCreditActivationService::class)->pendingForUser($receiver->fresh()));
    }

    public function test_non_admin_cannot_grant_packs(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $user = User::factory()->create(['email' => 'guest@example.com']);

        $this->actingAs($user)
            ->post(route('admin.grants.store'), [
                'mode' => 'existing',
                'user_id' => $user->id,
                'event_title' => 'Nope',
                'site_pack_sku' => 'site_30',
                'pricing' => 'free',
                'go_live_mode' => 'now',
            ])
            ->assertNotFound();
    }

    public function test_grants_index_renders_for_admin(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->get(route('admin.grants.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/grants/index')
                ->has('catalog.site_packs')
                ->has('catalog.credit_packs')
                ->has('grants'));
    }
}
