<?php

namespace Tests\Feature;

use App\Models\BillingPayment;
use App\Models\User;
use App\Services\Billing\MessageCreditActivationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageCreditActivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_scheduler_activates_due_message_packs(): void
    {
        config(['billing.message_credits.activation_hours' => 24]);

        $user = User::factory()->create(['message_credits' => 5]);

        $payment = BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'credit_pack',
            'sku' => 'credits_200',
            'amount_paise' => 59900,
            'currency' => 'INR',
            'status' => 'paid',
            'paid_at' => now()->subHours(25),
            'razorpay_order_id' => 'order_credits_due',
            'meta' => [
                'pack' => 'credits_200',
                'credits' => 200,
                MessageCreditActivationService::META_KEY => [
                    'status' => MessageCreditActivationService::STATUS_PENDING,
                    'credits' => 200,
                    'queued_at' => now()->subHours(25)->toIso8601String(),
                    'activate_after' => now()->subHour()->toIso8601String(),
                    'activated_at' => null,
                    'activated_by' => null,
                ],
            ],
        ]);

        $this->artisan('billing:site-lifecycle')->assertSuccessful();

        $this->assertSame(205, $user->fresh()->message_credits);
        $this->assertTrue(app(MessageCreditActivationService::class)->isActivated($payment->fresh()));
    }

    public function test_scheduler_does_not_activate_before_window(): void
    {
        $user = User::factory()->create(['message_credits' => 5]);

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'credit_pack',
            'sku' => 'credits_200',
            'amount_paise' => 59900,
            'currency' => 'INR',
            'status' => 'paid',
            'paid_at' => now(),
            'razorpay_order_id' => 'order_credits_soon',
            'meta' => [
                'credits' => 200,
                MessageCreditActivationService::META_KEY => [
                    'status' => MessageCreditActivationService::STATUS_PENDING,
                    'credits' => 200,
                    'queued_at' => now()->toIso8601String(),
                    'activate_after' => now()->addHours(23)->toIso8601String(),
                    'activated_at' => null,
                    'activated_by' => null,
                ],
            ],
        ]);

        $this->artisan('billing:site-lifecycle')->assertSuccessful();

        $this->assertSame(5, $user->fresh()->message_credits);
    }

    public function test_admin_can_activate_pending_message_pack_early(): void
    {
        config(['platform.admin_emails' => ['ops@invidora.test']]);
        $admin = User::factory()->create(['email' => 'ops@invidora.test']);
        $user = User::factory()->create(['message_credits' => 0]);

        $payment = BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'pack',
            'sku' => 'credits_200',
            'amount_paise' => 59900,
            'currency' => 'INR',
            'status' => 'paid',
            'paid_at' => now(),
            'razorpay_order_id' => 'order_admin_activate',
            'meta' => [
                'credits' => 200,
                MessageCreditActivationService::META_KEY => [
                    'status' => MessageCreditActivationService::STATUS_PENDING,
                    'credits' => 200,
                    'queued_at' => now()->toIso8601String(),
                    'activate_after' => now()->addDay()->toIso8601String(),
                    'activated_at' => null,
                    'activated_by' => null,
                ],
            ],
        ]);

        $this->actingAs($admin)
            ->post(route('admin.payments.activate-credits', $payment))
            ->assertRedirect();

        $this->assertSame(200, $user->fresh()->message_credits);
        $this->assertTrue(app(MessageCreditActivationService::class)->isActivated($payment->fresh()));
    }

    public function test_activation_is_idempotent(): void
    {
        $user = User::factory()->create(['message_credits' => 0]);
        $service = app(MessageCreditActivationService::class);

        $payment = BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'credit_pack',
            'sku' => 'credits_200',
            'amount_paise' => 59900,
            'currency' => 'INR',
            'status' => 'paid',
            'paid_at' => now()->subDay(),
            'meta' => [
                'credits' => 200,
                MessageCreditActivationService::META_KEY => [
                    'status' => MessageCreditActivationService::STATUS_PENDING,
                    'credits' => 200,
                    'queued_at' => now()->subDay()->toIso8601String(),
                    'activate_after' => now()->subMinute()->toIso8601String(),
                    'activated_at' => null,
                    'activated_by' => null,
                ],
            ],
        ]);

        $this->assertTrue($service->activate($payment));
        $this->assertFalse($service->activate($payment->fresh()));
        $this->assertSame(200, $user->fresh()->message_credits);
    }

    public function test_billing_summary_exposes_pending_message_packs_only(): void
    {
        $user = User::factory()->create(['message_credits' => 3]);

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'credit_pack',
            'sku' => 'credits_200',
            'amount_paise' => 59900,
            'currency' => 'INR',
            'status' => 'paid',
            'paid_at' => now(),
            'meta' => [
                'credits' => 200,
                MessageCreditActivationService::META_KEY => [
                    'status' => MessageCreditActivationService::STATUS_PENDING,
                    'credits' => 200,
                    'queued_at' => now()->toIso8601String(),
                    'activate_after' => now()->addDay()->toIso8601String(),
                    'activated_at' => null,
                    'activated_by' => null,
                ],
            ],
        ]);

        // Site pack payment must not appear as a pending message pack.
        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'site_pack',
            'sku' => 'site_30',
            'amount_paise' => 99900,
            'currency' => 'INR',
            'status' => 'paid',
            'paid_at' => now(),
            'meta' => ['credits' => 50],
        ]);

        $summary = app(\App\Services\Billing\BillingService::class)->summary($user);

        $this->assertCount(1, $summary['pending_message_packs']);
        $this->assertSame(200, $summary['pending_message_packs'][0]['credits']);
        $this->assertStringContainsString('24 hours', $summary['pending_message_packs'][0]['message']);
    }
}
