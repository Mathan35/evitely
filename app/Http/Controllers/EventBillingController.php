<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use App\Services\Billing\BillingCurrency;
use App\Services\Billing\BillingService;
use App\Services\Billing\CustomSitePackPricer;
use App\Services\Billing\PlanCatalog;
use App\Services\Billing\RazorpayService;
use App\Services\Billing\SiteBillingService;
use App\Services\Billing\StripeSiteCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EventBillingController extends Controller
{
    public function show(
        Request $request,
        Wedding $wedding,
        SiteBillingService $siteBilling,
        BillingCurrency $currencyHelper,
    ): Response {
        Gate::authorize('update', $wedding);
        $siteBilling->ensureDraftReady($wedding);

        $user = $request->user();
        $currency = $currencyHelper->forRequest($request, $user);

        return Inertia::render('weddings/billing', [
            'wedding' => [
                'id' => $wedding->id,
                'title' => $wedding->title,
                'invitation_mode' => $wedding->invitation_mode,
                'status' => $wedding->status?->value ?? (string) $wedding->status,
            ],
            'billing' => $siteBilling->eventBillingSummary($wedding, $user, $currency),
        ]);
    }

    public function quote(
        Request $request,
        Wedding $wedding,
        CustomSitePackPricer $pricer,
        BillingCurrency $currencyHelper,
    ): JsonResponse {
        $this->authorize('update', $wedding);

        $data = $request->validate([
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'currency' => ['nullable', 'in:inr,usd'],
            'include_credits' => ['nullable', 'boolean'],
        ]);

        $currency = $data['currency'] ?? $currencyHelper->forRequest($request, $request->user());
        $includeCredits = array_key_exists('include_credits', $data)
            ? (bool) $data['include_credits']
            : false;
        $quote = $pricer->quote($data['starts_on'], $data['ends_on'], $currency, $includeCredits);

        return response()->json(['quote' => $quote]);
    }

    public function schedule(
        Request $request,
        Wedding $wedding,
        SiteBillingService $siteBilling,
        \App\Services\ScheduledAutoShareService $autoShare,
    ): RedirectResponse|JsonResponse {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'scheduled_publish_at' => ['required', 'date'],
            'auto_share' => ['nullable', 'array'],
            'auto_share.enabled' => ['nullable', 'boolean'],
            'auto_share.channel_mode' => ['nullable', 'in:smart,whatsapp,sms,email'],
            'auto_share.guest_ids' => ['nullable', 'array'],
            'auto_share.guest_ids.*' => ['integer'],
            'auto_share.new_contacts' => ['nullable', 'array', 'max:200'],
            'auto_share.new_contacts.*.first_name' => ['nullable', 'string', 'max:80'],
            'auto_share.new_contacts.*.last_name' => ['nullable', 'string', 'max:80'],
            'auto_share.new_contacts.*.email' => ['nullable', 'email', 'max:160'],
            'auto_share.new_contacts.*.phone' => ['nullable', 'string', 'max:40'],
            'auto_share.new_contacts.*.country_code' => ['nullable', 'string', 'max:8'],
            'share_guest_template' => ['nullable', 'string', 'max:800'],
            'share_public_template' => ['nullable', 'string', 'max:800'],
        ]);

        $at = Carbon::parse($data['scheduled_publish_at']);
        $siteBilling->schedulePublish($wedding, $at);

        $templateInput = array_filter([
            'share_guest_template' => $data['share_guest_template'] ?? null,
            'share_public_template' => $data['share_public_template'] ?? null,
        ], fn ($value) => $value !== null);
        if ($templateInput !== []) {
            \App\Support\ShareMessageFactory::persistTemplates($wedding, $templateInput);
        }

        $auto = $data['auto_share'] ?? null;
        if (is_array($auto)) {
            $autoShare->upsertPending($wedding, $request->user(), [
                'enabled' => (bool) ($auto['enabled'] ?? false),
                'channel_mode' => $auto['channel_mode'] ?? 'smart',
                'guest_ids' => $auto['guest_ids'] ?? [],
                'new_contacts' => $auto['new_contacts'] ?? [],
                'scheduled_for' => $at,
            ]);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'ok' => true,
                'state' => $siteBilling->state($wedding->fresh())->toArray(),
                'auto_share' => $autoShare->pendingSummary($wedding->fresh()),
            ]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Publish scheduled. Your plan starts when the site goes live.',
        ]);

        return back();
    }

    public function checkoutSitePack(
        Request $request,
        Wedding $wedding,
        PlanCatalog $catalog,
        RazorpayService $razorpay,
        StripeSiteCheckoutService $stripe,
        BillingCurrency $currencyHelper,
        BillingService $billing,
    ): JsonResponse|RedirectResponse {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'sku' => ['required', 'string'],
            'go_live_mode' => ['nullable', 'in:now,schedule'],
            'scheduled_publish_at' => ['nullable', 'date'],
            'currency' => ['nullable', 'in:inr,usd'],
            'include_credits' => ['nullable', 'boolean'],
        ]);

        $pack = $catalog->sitePack($data['sku']);
        if ($pack === null) {
            return response()->json(['message' => 'Unknown site pack.'], 422);
        }

        $user = $request->user();
        $currency = $data['currency'] ?? $currencyHelper->forRequest($request, $user);
        $gateway = $currencyHelper->gatewayForCurrency($currency);
        $includeCredits = array_key_exists('include_credits', $data)
            ? (bool) $data['include_credits']
            : false;
        $offer = $catalog->sitePackOffer($pack, $currency, $includeCredits);
        $options = [
            'go_live_mode' => $data['go_live_mode'] ?? 'now',
            'scheduled_publish_at' => $data['scheduled_publish_at'] ?? null,
            'include_credits' => $includeCredits,
            'credits' => $offer['credits'],
            'amount_minor' => $offer['amount_minor'],
        ];

        if ($billing->allowLocalActivate() && ! $billing->razorpayReady() && ! $billing->stripeReady()) {
            app(SiteBillingService::class)->fulfillFixedPackPayment(
                $wedding,
                $user,
                $data['sku'],
                $offer['credits'],
                $options,
            );

            return response()->json([
                'ok' => true,
                'local' => true,
                'message' => 'Site pack activated.',
            ]);
        }

        if ($gateway === 'razorpay' || $currency === 'inr') {
            if (! $billing->razorpayReady()) {
                return response()->json([
                    'message' => 'Checkout isn’t available right now. Please try again later or contact support.',
                ], 422);
            }

            $checkout = $razorpay->createSitePackOrder($user, $wedding, $data['sku'], $options);

            return response()->json(['checkout' => $checkout, 'gateway' => 'razorpay']);
        }

        if (! $billing->stripeReady()) {
            return response()->json([
                'message' => 'Checkout isn’t available right now. Please try again later or contact support.',
            ], 422);
        }

        $url = $stripe->checkoutSitePack($user, $wedding, $data['sku'], $currency, $options);

        return response()->json(['checkout_url' => $url, 'gateway' => 'stripe']);
    }

    public function checkoutSiteCustom(
        Request $request,
        Wedding $wedding,
        RazorpayService $razorpay,
        StripeSiteCheckoutService $stripe,
        BillingCurrency $currencyHelper,
        CustomSitePackPricer $pricer,
        BillingService $billing,
        SiteBillingService $siteBilling,
    ): JsonResponse {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date'],
            'go_live_mode' => ['nullable', 'in:now,schedule'],
            'currency' => ['nullable', 'in:inr,usd'],
            'include_credits' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $currency = $data['currency'] ?? $currencyHelper->forRequest($request, $user);
        $includeCredits = array_key_exists('include_credits', $data)
            ? (bool) $data['include_credits']
            : false;
        $quote = $pricer->quote($data['starts_on'], $data['ends_on'], $currency, $includeCredits);
        $options = [
            'go_live_mode' => $data['go_live_mode'] ?? 'schedule',
            'currency' => $currency,
            'include_credits' => $includeCredits,
        ];

        if ($billing->allowLocalActivate() && ! $billing->razorpayReady() && ! $billing->stripeReady()) {
            $siteBilling->fulfillCustomPackPayment(
                $wedding,
                $user,
                $quote['starts_on'],
                $quote['ends_on'],
                $quote['credits'],
                $options,
            );

            return response()->json(['ok' => true, 'local' => true, 'message' => 'Custom pack activated.']);
        }

        $gateway = $currencyHelper->gatewayForCurrency($currency);

        if ($gateway === 'razorpay' || $currency === 'inr') {
            if (! $billing->razorpayReady()) {
                return response()->json([
                    'message' => 'Checkout isn’t available right now. Please try again later or contact support.',
                ], 422);
            }

            $checkout = $razorpay->createSiteCustomOrder(
                $user,
                $wedding,
                $quote['starts_on'],
                $quote['ends_on'],
                $options,
            );

            return response()->json(['checkout' => $checkout, 'gateway' => 'razorpay', 'quote' => $quote]);
        }

        if (! $billing->stripeReady()) {
            return response()->json([
                'message' => 'Checkout isn’t available right now. Please try again later or contact support.',
            ], 422);
        }

        $url = $stripe->checkoutSiteCustom($user, $wedding, $quote, $options);

        return response()->json(['checkout_url' => $url, 'gateway' => 'stripe', 'quote' => $quote]);
    }

    public function checkoutCredits(
        Request $request,
        Wedding $wedding,
        PlanCatalog $catalog,
        RazorpayService $razorpay,
        StripeSiteCheckoutService $stripe,
        BillingCurrency $currencyHelper,
        BillingService $billing,
    ): JsonResponse {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'pack' => ['required', 'string'],
            'currency' => ['nullable', 'in:inr,usd'],
        ]);

        if ($catalog->pack($data['pack']) === null) {
            return response()->json(['message' => 'Unknown credit pack.'], 422);
        }

        $user = $request->user();
        $currency = $data['currency'] ?? $currencyHelper->forRequest($request, $user);

        if ($billing->allowLocalActivate() && ! $billing->razorpayReady() && ! $billing->stripeReady()) {
            $credits = (int) ($catalog->pack($data['pack'])['credits'] ?? 0);
            $billing->grantCredits($user, $credits);

            return response()->json(['ok' => true, 'local' => true]);
        }

        if ($currency === 'inr' || $currencyHelper->gatewayForCurrency($currency) === 'razorpay') {
            if (! $billing->razorpayReady()) {
                return response()->json([
                    'message' => 'Checkout isn’t available right now. Please try again later or contact support.',
                ], 422);
            }

            return response()->json([
                'checkout' => $razorpay->createPackOrder($user, $data['pack']),
                'gateway' => 'razorpay',
            ]);
        }

        if (! $billing->stripeReady()) {
            return response()->json([
                'message' => 'Checkout isn’t available right now. Please try again later or contact support.',
            ], 422);
        }

        return response()->json([
            'checkout_url' => $stripe->checkoutCredits($user, $data['pack'], $currency),
            'gateway' => 'stripe',
        ]);
    }
}
