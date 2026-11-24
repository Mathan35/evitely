<?php

namespace Tests\Feature;

use App\Models\BillingPayment;
use App\Models\User;
use App\Notifications\PaymentReceipt;
use App\Services\Billing\RazorpayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RazorpayBillingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'billing.driver' => 'razorpay',
            'razorpay.key' => 'rzp_test_key',
            'razorpay.secret' => 'test_secret_key',
            'razorpay.webhook_secret' => 'whsec_test',
            'razorpay.currency' => 'INR',
        ]);
    }

    public function test_billing_page_marks_razorpay_ready(): void
    {
        $user = User::factory()->create(['plan' => 'free']);

        $this->actingAs($user)
            ->get(route('billing.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('settings/billing')
                ->where('billing.razorpay_ready', true)
                ->where('billing.gateway', 'razorpay')
                ->where('billing.billing_model', 'site_packs')
                ->has('billing.packs'));
    }

    public function test_season_order_requires_configured_razorpay(): void
    {
        config([
            'razorpay.key' => null,
            'razorpay.secret' => null,
        ]);

        $user = User::factory()->create(['plan' => 'free']);

        $this->actingAs($user)
            ->postJson(route('billing.razorpay.season'), ['season' => 'pro_season_12'])
            ->assertStatus(422)
            ->assertJsonMissing(['payment' => 'Razorpay is not configured. Set RAZORPAY_KEY and RAZORPAY_SECRET.'])
            ->assertJsonFragment(['payment' => ['Checkout isn’t available right now. Please try again later or contact support.']]);
    }

    public function test_live_razorpay_creates_season_and_pack_orders(): void
    {
        $key = (string) env('RAZORPAY_KEY');
        $secret = (string) env('RAZORPAY_SECRET');

        if ($key === '' || $secret === '' || ! str_starts_with($key, 'rzp_')) {
            $this->markTestSkipped('Live Razorpay keys not present in .env');
        }

        config([
            'billing.driver' => 'razorpay',
            'razorpay.key' => $key,
            'razorpay.secret' => $secret,
        ]);

        $user = User::factory()->create([
            'plan' => 'free',
            'name' => 'Billing Test',
            'email' => 'billing-test@example.com',
        ]);

        $season = $this->actingAs($user)
            ->postJson(route('billing.razorpay.season'), ['season' => 'pro_season_12'])
            ->assertOk()
            ->assertJsonPath('checkout.currency', 'INR')
            ->assertJsonStructure([
                'checkout' => ['key', 'amount', 'currency', 'order_id', 'description'],
            ])
            ->json('checkout');

        $this->assertNotEmpty($season['order_id']);
        $this->assertStringStartsWith('order_', $season['order_id']);
        $this->assertSame(249900, $season['amount']);
        $this->assertDatabaseHas('billing_payments', [
            'user_id' => $user->id,
            'kind' => 'season',
            'sku' => 'pro_season_12',
            'razorpay_order_id' => $season['order_id'],
            'status' => 'created',
        ]);

        $pack = $this->actingAs($user)
            ->postJson(route('billing.razorpay.pack'), ['pack' => 'credits_200'])
            ->assertOk()
            ->json('checkout');

        $this->assertStringStartsWith('order_', $pack['order_id']);
        $this->assertSame(59900, $pack['amount']);
        $this->assertDatabaseHas('billing_payments', [
            'user_id' => $user->id,
            'kind' => 'pack',
            'sku' => 'credits_200',
            'razorpay_order_id' => $pack['order_id'],
            'status' => 'created',
        ]);

        // 6-month season + 500-credit pack
        $season6 = $this->actingAs($user)
            ->postJson(route('billing.razorpay.season'), ['season' => 'pro_season_6'])
            ->assertOk()
            ->json('checkout');
        $this->assertSame(149900, $season6['amount']);

        $pack500 = $this->actingAs($user)
            ->postJson(route('billing.razorpay.pack'), ['pack' => 'credits_500'])
            ->assertOk()
            ->json('checkout');
        $this->assertSame(119900, $pack500['amount']);
    }

    public function test_fulfill_season_payment_activates_pro(): void
    {
        $user = User::factory()->create(['plan' => 'free', 'message_credits' => 0]);

        $payment = BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'season',
            'sku' => 'pro_season_12',
            'amount_paise' => 249900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => 'order_test_season_1',
            'meta' => [
                'season' => 'pro_season_12',
                'months' => 12,
                'credits' => 400,
            ],
        ]);

        $fulfilled = app(RazorpayService::class)->fulfillPaidOrder(
            $user,
            'order_test_season_1',
            'pay_test_season_1',
            'sig_test',
        );

        $this->assertTrue($fulfilled->isPaid());
        $this->assertSame('pay_test_season_1', $fulfilled->razorpay_payment_id);

        $user->refresh();
        $this->assertSame('pro', $user->plan);
        $this->assertNotNull($user->plan_ends_at);
        $this->assertSame(400, $user->message_credits);
        $this->assertSame('paid', $payment->fresh()->status);
    }

    public function test_fulfill_pack_payment_grants_credits(): void
    {
        $user = User::factory()->create(['plan' => 'pro', 'message_credits' => 10]);

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'pack',
            'sku' => 'credits_200',
            'amount_paise' => 59900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => 'order_test_pack_1',
            'meta' => [
                'pack' => 'credits_200',
                'credits' => 200,
            ],
        ]);

        app(RazorpayService::class)->fulfillPaidOrder(
            $user,
            'order_test_pack_1',
            'pay_test_pack_1',
        );

        $this->assertSame(210, $user->fresh()->message_credits);
    }

    public function test_fulfill_is_idempotent(): void
    {
        $user = User::factory()->create(['plan' => 'free', 'message_credits' => 0]);

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'season',
            'sku' => 'pro_season_6',
            'amount_paise' => 149900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => 'order_test_idem',
            'meta' => ['season' => 'pro_season_6', 'credits' => 200],
        ]);

        $service = app(RazorpayService::class);
        $service->fulfillPaidOrder($user, 'order_test_idem', 'pay_1');
        $creditsAfterFirst = $user->fresh()->message_credits;

        $service->fulfillPaidOrder($user, 'order_test_idem', 'pay_1');

        $this->assertSame($creditsAfterFirst, $user->fresh()->message_credits);
        $this->assertSame(1, BillingPayment::query()->where('status', 'paid')->count());
    }

    public function test_verify_endpoint_rejects_bad_signature(): void
    {
        $user = User::factory()->create(['plan' => 'free']);

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'season',
            'sku' => 'pro_season_12',
            'amount_paise' => 249900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => 'order_bad_sig',
            'meta' => ['season' => 'pro_season_12'],
        ]);

        $this->actingAs($user)
            ->postJson(route('billing.razorpay.verify'), [
                'razorpay_order_id' => 'order_bad_sig',
                'razorpay_payment_id' => 'pay_bad',
                'razorpay_signature' => 'not_a_valid_signature',
            ])
            ->assertStatus(422);

        $this->assertSame('free', $user->fresh()->plan);
    }

    public function test_verify_endpoint_fulfills_with_valid_signature(): void
    {
        $user = User::factory()->create(['plan' => 'free', 'message_credits' => 0]);
        $orderId = 'order_valid_sig';
        $paymentId = 'pay_valid_sig';
        $secret = (string) config('razorpay.secret');
        $signature = hash_hmac('sha256', $orderId.'|'.$paymentId, $secret);

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'season',
            'sku' => 'pro_season_12',
            'amount_paise' => 249900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => $orderId,
            'meta' => [
                'season' => 'pro_season_12',
                'months' => 12,
                'credits' => 400,
            ],
        ]);

        $this->actingAs($user)
            ->postJson(route('billing.razorpay.verify'), [
                'razorpay_order_id' => $orderId,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $signature,
            ])
            ->assertOk()
            ->assertJsonPath('ok', true);

        $user->refresh();
        $this->assertSame('pro', $user->plan);
        $this->assertSame(400, $user->message_credits);
    }

    public function test_webhook_fulfills_payment_captured(): void
    {
        $user = User::factory()->create(['plan' => 'free', 'message_credits' => 0]);
        $orderId = 'order_webhook_1';

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'season',
            'sku' => 'pro_season_12',
            'amount_paise' => 249900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => $orderId,
            'meta' => [
                'season' => 'pro_season_12',
                'credits' => 400,
            ],
        ]);

        $payload = [
            'event' => 'payment.captured',
            'payload' => [
                'payment' => [
                    'entity' => [
                        'id' => 'pay_webhook_1',
                        'order_id' => $orderId,
                        'status' => 'captured',
                        'amount' => 249900,
                    ],
                ],
            ],
        ];

        $raw = json_encode($payload, JSON_THROW_ON_ERROR);
        $signature = hash_hmac('sha256', $raw, (string) config('razorpay.webhook_secret'));

        $this->call(
            'POST',
            route('razorpay.webhook'),
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_RAZORPAY_SIGNATURE' => $signature,
            ],
            $raw,
        )->assertOk();

        $user->refresh();
        $this->assertSame('pro', $user->plan);
        $this->assertSame(400, $user->message_credits);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        $payload = json_encode(['event' => 'payment.captured'], JSON_THROW_ON_ERROR);

        $this->call(
            'POST',
            route('razorpay.webhook'),
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_RAZORPAY_SIGNATURE' => 'bad_signature',
            ],
            $payload,
        )->assertStatus(400);
    }

    public function test_successful_payment_sends_receipt_email_once(): void
    {
        Notification::fake();

        $user = User::factory()->create(['plan' => 'free', 'message_credits' => 0]);

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'season',
            'sku' => 'pro_season_12',
            'amount_paise' => 249900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => 'order_receipt_1',
            'meta' => ['season' => 'pro_season_12', 'credits' => 400],
        ]);

        $service = app(RazorpayService::class);
        $service->fulfillPaidOrder($user, 'order_receipt_1', 'pay_receipt_1');
        $service->fulfillPaidOrder($user, 'order_receipt_1', 'pay_receipt_1');

        Notification::assertSentToTimes($user, PaymentReceipt::class, 1);
        $this->assertSame('pro', $user->fresh()->plan);
    }

    public function test_webhook_also_sends_receipt_when_verify_was_missed(): void
    {
        Notification::fake();

        $user = User::factory()->create(['plan' => 'free', 'message_credits' => 0]);
        $orderId = 'order_webhook_receipt';

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'pack',
            'sku' => 'credits_200',
            'amount_paise' => 59900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => $orderId,
            'meta' => ['pack' => 'credits_200', 'credits' => 200],
        ]);

        $payload = [
            'event' => 'payment.captured',
            'payload' => [
                'payment' => [
                    'entity' => [
                        'id' => 'pay_webhook_receipt',
                        'order_id' => $orderId,
                        'status' => 'captured',
                        'amount' => 59900,
                    ],
                ],
            ],
        ];
        $raw = json_encode($payload, JSON_THROW_ON_ERROR);
        $signature = hash_hmac('sha256', $raw, (string) config('razorpay.webhook_secret'));

        $this->call(
            'POST',
            route('razorpay.webhook'),
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_RAZORPAY_SIGNATURE' => $signature,
            ],
            $raw,
        )->assertOk();

        Notification::assertSentTo($user, PaymentReceipt::class);
        $this->assertSame(200, $user->fresh()->message_credits);
    }

    public function test_billing_admin_can_view_payments_ops_page(): void
    {
        config([
            'billing.admin_emails' => ['ops@example.com'],
            'platform.admin_emails' => ['ops@example.com'],
        ]);

        $admin = User::factory()->create(['email' => 'ops@example.com']);
        $other = User::factory()->create(['email' => 'guest@example.com']);

        $this->actingAs($other)
            ->get(route('billing.payments'))
            ->assertForbidden();

        $this->actingAs($admin)
            ->get(route('billing.payments'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('settings/billing-payments')
                ->has('checklist')
                ->has('payments'));
    }

    public function test_end_to_end_verify_unlocks_pro_like_test_upi_success(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'plan' => 'free',
            'message_credits' => 0,
            'email' => 'payer@example.com',
        ]);

        $orderId = 'order_e2e_upi';
        $paymentId = 'pay_e2e_upi';
        $signature = hash_hmac(
            'sha256',
            $orderId.'|'.$paymentId,
            (string) config('razorpay.secret'),
        );

        BillingPayment::query()->create([
            'user_id' => $user->id,
            'provider' => 'razorpay',
            'kind' => 'season',
            'sku' => 'pro_season_6',
            'amount_paise' => 149900,
            'currency' => 'INR',
            'status' => 'created',
            'razorpay_order_id' => $orderId,
            'meta' => [
                'season' => 'pro_season_6',
                'months' => 6,
                'credits' => 200,
            ],
        ]);

        $this->actingAs($user)
            ->postJson(route('billing.razorpay.verify'), [
                'razorpay_order_id' => $orderId,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $signature,
            ])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('billing.is_pro', true);

        $user->refresh();
        $this->assertSame('pro', $user->plan);
        $this->assertSame(200, $user->message_credits);
        $this->assertNotNull($user->plan_ends_at);
        Notification::assertSentTo($user, PaymentReceipt::class);

        $this->actingAs($user)
            ->get(route('billing.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('billing.is_pro', true)
                ->has('billing.launch_checklist')
                ->has('billing.recent_payments', 1));
    }
}
