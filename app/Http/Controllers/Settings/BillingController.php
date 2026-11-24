<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Billing\BillingService;
use App\Services\Billing\PlanCatalog;
use App\Services\Billing\RazorpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BillingController extends Controller
{
    public function edit(Request $request, BillingService $billing): Response
    {
        return Inertia::render('settings/billing', [
            'billing' => $billing->summary($request->user()),
        ]);
    }

    /**
     * Create a Razorpay Order and return Checkout.js options (JSON for XHR).
     */
    public function razorpaySeasonOrder(
        Request $request,
        RazorpayService $razorpay,
        PlanCatalog $catalog,
    ): JsonResponse {
        $seasonKey = $request->validate([
            'season' => ['required', 'string'],
        ])['season'];

        if ($catalog->season($seasonKey) === null) {
            return response()->json(['message' => 'Unknown season pass.'], 422);
        }

        $options = $razorpay->createSeasonOrder($request->user(), $seasonKey);

        return response()->json(['checkout' => $options]);
    }

    public function razorpayPackOrder(
        Request $request,
        RazorpayService $razorpay,
        PlanCatalog $catalog,
    ): JsonResponse {
        $packKey = $request->validate([
            'pack' => ['required', 'string'],
        ])['pack'];

        if ($catalog->pack($packKey) === null) {
            return response()->json(['message' => 'Unknown credit pack.'], 422);
        }

        $options = $razorpay->createPackOrder($request->user(), $packKey);

        return response()->json(['checkout' => $options]);
    }

    /**
     * Verify Razorpay Checkout.js success callback and unlock entitlements.
     */
    public function razorpayVerify(Request $request, RazorpayService $razorpay): RedirectResponse|JsonResponse
    {
        $data = $request->validate([
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_signature' => ['required', 'string'],
        ]);

        $payment = $razorpay->verifyAndFulfill($request->user(), $data);

        $message = $payment->kind === 'season'
            ? 'Payment successful. Pro season is now active.'
            : 'Payment successful. Message credits added.';

        if ($request->expectsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'ok' => true,
                'message' => $message,
                'billing' => app(BillingService::class)->summary($request->user()->fresh()),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect()->route('billing.edit');
    }

    public function checkoutSeason(
        Request $request,
        BillingService $billing,
        PlanCatalog $catalog,
        RazorpayService $razorpay,
    ): RedirectResponse|SymfonyResponse|JsonResponse {
        // Prefer Razorpay JSON order flow when the client asks for JSON.
        if ($billing->razorpayReady() && ($request->expectsJson() || $request->wantsJson())) {
            return $this->razorpaySeasonOrder($request, $razorpay, $catalog);
        }

        if ($billing->razorpayReady()) {
            // Inertia form posts: bounce back with hint to use Checkout button (JS).
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Use Pay with Razorpay on the Billing page.',
            ]);

            return back();
        }

        $seasonKey = $request->validate([
            'season' => ['required', 'string'],
        ])['season'];

        if ($catalog->season($seasonKey) === null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Unknown season pass.']);

            return back();
        }

        $checkout = $billing->checkoutSeason(
            $request->user(),
            $seasonKey,
            route('billing.success').'?session_id={CHECKOUT_SESSION_ID}',
            route('billing.edit'),
        );

        if ($checkout === null) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Payment gateway is not configured. Set RAZORPAY_KEY / RAZORPAY_SECRET.',
            ]);

            return back();
        }

        return Inertia::location($checkout->asStripeCheckoutSession()->url);
    }

    /** @deprecated Prefer checkoutSeason */
    public function checkoutPro(Request $request, BillingService $billing, PlanCatalog $catalog, RazorpayService $razorpay): RedirectResponse|SymfonyResponse|JsonResponse
    {
        $request->merge(['season' => $catalog->defaultSeasonKey()]);

        return $this->checkoutSeason($request, $billing, $catalog, $razorpay);
    }

    public function checkoutPack(
        Request $request,
        BillingService $billing,
        PlanCatalog $catalog,
        RazorpayService $razorpay,
    ): RedirectResponse|SymfonyResponse|JsonResponse {
        if ($billing->razorpayReady() && ($request->expectsJson() || $request->wantsJson())) {
            return $this->razorpayPackOrder($request, $razorpay, $catalog);
        }

        if ($billing->razorpayReady()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Use Pay with Razorpay on the Billing page.',
            ]);

            return back();
        }

        $packKey = $request->validate([
            'pack' => ['required', 'string'],
        ])['pack'];

        if ($catalog->pack($packKey) === null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Unknown credit pack.']);

            return back();
        }

        $checkout = $billing->checkoutPack(
            $request->user(),
            $packKey,
            route('billing.success').'?session_id={CHECKOUT_SESSION_ID}',
            route('billing.edit'),
        );

        if ($checkout === null) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Payment gateway is not configured.',
            ]);

            return back();
        }

        return Inertia::location($checkout->asStripeCheckoutSession()->url);
    }

    public function portal(Request $request, BillingService $billing): RedirectResponse|SymfonyResponse
    {
        if (! $billing->stripeReady() || ! $request->user()->hasStripeId()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Stripe portal is only available for Stripe customers. Razorpay invoices are in your Razorpay dashboard / email receipts.',
            ]);

            return back();
        }

        return Inertia::location($request->user()->billingPortalUrl(route('billing.edit')));
    }

    public function success(
        Request $request,
        BillingService $billing,
        \App\Services\Billing\StripeSiteCheckoutService $stripeCheckout,
    ): RedirectResponse {
        $sessionId = (string) $request->query('session_id', '');
        if ($sessionId !== '' && str_starts_with($sessionId, 'cs_')) {
            $stripeCheckout->fulfillSession($sessionId);
        }

        $billing->syncFromSubscription($request->user()->fresh());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Payment received. Your site plan or credits are updated.',
        ]);

        $eventId = (int) $request->query('event_id', 0);
        if ($eventId > 0) {
            return redirect()->to('/events/'.$eventId.'/billing');
        }

        return redirect()->route('billing.edit');
    }

    public function activateLocal(Request $request, BillingService $billing, PlanCatalog $catalog): RedirectResponse
    {
        if (! $billing->allowLocalActivate()) {
            abort(403);
        }

        $seasonKey = $request->input('season') ?: $catalog->defaultSeasonKey();
        if ($catalog->season((string) $seasonKey) === null) {
            $seasonKey = $catalog->defaultSeasonKey();
        }

        $billing->activateSeason($request->user(), (string) $seasonKey);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pro season activated locally (no charge).',
        ]);

        return back();
    }

    public function buyPackLocal(Request $request, BillingService $billing, PlanCatalog $catalog): RedirectResponse
    {
        if (! $billing->allowLocalActivate()) {
            abort(403);
        }

        $packKey = $request->validate([
            'pack' => ['required', 'string'],
        ])['pack'];

        $pack = $catalog->pack($packKey);
        if ($pack === null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Unknown credit pack.']);

            return back();
        }

        $billing->grantCredits($request->user(), (int) ($pack['credits'] ?? 0));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => sprintf('Added %d message credits (local).', (int) ($pack['credits'] ?? 0)),
        ]);

        return back();
    }

    public function downgradeLocal(Request $request, BillingService $billing): RedirectResponse
    {
        if (! $billing->allowLocalActivate()) {
            abort(403);
        }

        $billing->downgradeToFree($request->user());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Moved back to Free (local).',
        ]);

        return back();
    }
}
