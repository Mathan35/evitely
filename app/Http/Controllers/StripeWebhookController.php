<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Billing\BillingService;
use App\Services\Billing\PlanCatalog;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierController;
use Symfony\Component\HttpFoundation\Response;

class StripeWebhookController extends CashierController
{
    protected function handleCustomerSubscriptionCreated(array $payload): Response
    {
        $response = parent::handleCustomerSubscriptionCreated($payload);
        $this->syncUser($payload);

        return $response;
    }

    protected function handleCustomerSubscriptionUpdated(array $payload): Response
    {
        $response = parent::handleCustomerSubscriptionUpdated($payload);
        $this->syncUser($payload);

        return $response;
    }

    protected function handleCustomerSubscriptionDeleted(array $payload): Response
    {
        $response = parent::handleCustomerSubscriptionDeleted($payload);
        $this->syncUser($payload);

        return $response;
    }

    protected function handleInvoicePaid(array $payload): Response
    {
        $billingReason = $payload['data']['object']['billing_reason'] ?? null;
        if (in_array($billingReason, ['subscription_create', 'subscription_cycle'], true)) {
            $this->syncUser($payload);
        }

        return $this->successMethod();
    }

    protected function handleCheckoutSessionExpired(array $payload): Response
    {
        $session = $payload['data']['object'] ?? [];
        $sessionId = is_string($session['id'] ?? null) ? $session['id'] : null;
        if ($sessionId) {
            app(\App\Services\Billing\StripeSiteCheckoutService::class)
                ->markSessionFailed($sessionId, 'Checkout session expired', 'expired');
        }

        return $this->successMethod();
    }

    protected function handleCheckoutSessionCompleted(array $payload): Response
    {
        $session = $payload['data']['object'] ?? [];
        $metadata = is_array($session['metadata'] ?? null) ? $session['metadata'] : [];

        $sessionId = is_string($session['id'] ?? null) ? $session['id'] : null;
        if ($sessionId && filled($metadata['billing_payment_id'] ?? null)) {
            app(\App\Services\Billing\StripeSiteCheckoutService::class)->fulfillSession($sessionId);

            return $this->successMethod();
        }

        if (($metadata['type'] ?? '') === 'credit_pack') {
            $user = $this->userFromMetadata($metadata) ?? $this->getUserByStripeId($session['customer'] ?? null);
            if ($user) {
                $credits = (int) ($metadata['credits'] ?? 0);
                if ($credits < 1) {
                    $pack = app(PlanCatalog::class)->pack((string) ($metadata['pack'] ?? ''));
                    $credits = (int) ($pack['credits'] ?? 0);
                }
                app(BillingService::class)->grantCredits($user, $credits);
            }
        }

        if (($metadata['type'] ?? '') === 'pro_season') {
            $user = $this->userFromMetadata($metadata) ?? $this->getUserByStripeId($session['customer'] ?? null);
            if ($user) {
                $season = (string) ($metadata['season'] ?? '');
                if ($season !== '' && app(PlanCatalog::class)->season($season)) {
                    app(BillingService::class)->activateSeason($user, $season);
                } else {
                    $months = max(1, (int) ($metadata['months'] ?? 12));
                    $credits = max(0, (int) ($metadata['credits'] ?? 0));
                    $base = ($user->plan === 'pro' && $user->plan_ends_at && $user->plan_ends_at->isFuture())
                        ? $user->plan_ends_at->copy()
                        : now();
                    app(BillingService::class)->activatePro($user, $base->addMonths($months), $credits);
                }
            }
        }

        if (($metadata['type'] ?? '') === 'pro_subscription') {
            $this->syncUser($payload);
        }

        return $this->successMethod();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function syncUser(array $payload): void
    {
        $user = $this->resolveUser($payload);
        if ($user) {
            app(BillingService::class)->syncFromSubscription($user->fresh());
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveUser(array $payload): ?User
    {
        $object = $payload['data']['object'] ?? [];
        $metadata = is_array($object['metadata'] ?? null) ? $object['metadata'] : [];
        $fromMeta = $this->userFromMetadata($metadata);
        if ($fromMeta) {
            return $fromMeta;
        }

        $customer = $object['customer'] ?? null;

        return $this->getUserByStripeId(is_string($customer) ? $customer : null);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function userFromMetadata(array $metadata): ?User
    {
        $id = (int) ($metadata['user_id'] ?? 0);

        return $id > 0 ? User::query()->find($id) : null;
    }
}
