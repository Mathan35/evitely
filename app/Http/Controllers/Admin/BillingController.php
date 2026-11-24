<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BillingPayment;
use App\Services\Admin\AdminAuditLogger;
use App\Services\Billing\PlanCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(Request $request, PlanCatalog $catalog): Response
    {
        $this->expireStaleAttempts();

        $q = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('status', ''));
        $provider = trim((string) $request->query('provider', ''));

        $payments = BillingPayment::query()
            ->with(['user:id,name,email'])
            ->when($q !== '', function ($query) use ($q): void {
                $query->where(function ($inner) use ($q): void {
                    $inner->where('sku', 'like', "%{$q}%")
                        ->orWhere('razorpay_order_id', 'like', "%{$q}%")
                        ->orWhere('stripe_session_id', 'like', "%{$q}%")
                        ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$q}%"));
                });
            })
            ->when($status !== '', function ($query) use ($status): void {
                if ($status === 'pending') {
                    $query->where('status', 'created');

                    return;
                }

                if ($status === 'cancelled') {
                    $query->whereIn('status', ['cancelled', 'expired']);

                    return;
                }

                $query->where('status', $status);
            })
            ->when($provider !== '', fn ($query) => $query->where('provider', $provider))
            ->latest('id')
            ->paginate(40)
            ->withQueryString()
            ->through(fn (BillingPayment $p): array => [
                'id' => $p->id,
                'user' => $p->user?->email,
                'event_id' => $p->event_id,
                'provider' => $p->provider,
                'kind' => $p->kind,
                'sku' => $p->sku,
                'status' => $p->status,
                'amount_paise' => $p->amount_paise,
                'currency' => $p->currency,
                'paid_at' => $p->paid_at?->toIso8601String(),
                'created_at' => $p->created_at?->toIso8601String(),
                'fail_reason' => is_array($p->meta) ? ($p->meta['fail_reason'] ?? $p->meta['error'] ?? null) : null,
            ]);

        $counts = BillingPayment::query()
            ->select('status', DB::raw('count(*) as total'), DB::raw('coalesce(sum(amount_paise),0) as amount'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $paid = (int) ($counts->get('paid')?->total ?? 0);
        $failed = (int) ($counts->get('failed')?->total ?? 0);
        $cancelled = (int) ($counts->get('cancelled')?->total ?? 0) + (int) ($counts->get('expired')?->total ?? 0);
        $pending = (int) ($counts->get('created')?->total ?? 0);
        $revenuePaise = (int) ($counts->get('paid')?->amount ?? 0);

        return Inertia::render('admin/billing/index', [
            'payments' => $payments,
            'filters' => compact('q', 'status', 'provider'),
            'stats' => [
                'paid' => $paid,
                'failed' => $failed,
                'cancelled' => $cancelled,
                'pending' => $pending,
                'tries' => $paid + $failed + $cancelled + $pending,
                'revenue_paise' => $revenuePaise,
            ],
            'catalog' => [
                'site_packs' => collect($catalog->sitePacks())->map(fn (array $row, string $key): array => [
                    'id' => $key,
                    'name' => $row['name'] ?? $key,
                    'days' => $row['days'] ?? null,
                    'price_label_inr' => $row['price_label_inr'] ?? null,
                    'included_credits' => $row['included_credits'] ?? 0,
                ])->values()->all(),
                'credit_packs' => collect($catalog->creditPacks())->map(fn (array $row, string $key): array => [
                    'id' => $key,
                    'name' => $row['name'] ?? $key,
                    'credits' => $row['credits'] ?? 0,
                    'price_label_inr' => $row['price_label_inr'] ?? null,
                ])->values()->all(),
            ],
        ]);
    }

    public function show(BillingPayment $payment): Response
    {
        $payment->load(['user:id,name,email']);
        $meta = is_array($payment->meta) ? $payment->meta : [];
        unset($meta['webhook_secret'], $meta['secret'], $meta['signature']);

        return Inertia::render('admin/billing/show', [
            'payment' => [
                'id' => $payment->id,
                'user' => [
                    'id' => $payment->user?->id,
                    'email' => $payment->user?->email,
                    'name' => $payment->user?->name,
                ],
                'event_id' => $payment->event_id,
                'provider' => $payment->provider,
                'kind' => $payment->kind,
                'sku' => $payment->sku,
                'status' => $payment->status,
                'amount_paise' => $payment->amount_paise,
                'currency' => $payment->currency,
                'razorpay_order_id' => $payment->razorpay_order_id,
                'razorpay_payment_id' => $payment->razorpay_payment_id,
                'stripe_session_id' => $payment->stripe_session_id ?? null,
                'meta' => $meta,
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'created_at' => $payment->created_at?->toIso8601String(),
            ],
        ]);
    }

    public function note(Request $request, BillingPayment $payment, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'note' => ['required', 'string', 'max:500'],
        ]);
        $meta = is_array($payment->meta) ? $payment->meta : [];
        $meta['admin_notes'] = array_values([
            ...((array) ($meta['admin_notes'] ?? [])),
            [
                'at' => now()->toIso8601String(),
                'by' => $request->user()->email,
                'note' => $data['note'],
            ],
        ]);
        $payment->forceFill(['meta' => $meta])->save();
        $audit->log($request->user(), 'payment.note', $payment, ['note' => $data['note']], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Note saved.']);
    }

    /**
     * Abandoned checkouts older than 24h → expired so they show as cancelled tries.
     */
    private function expireStaleAttempts(): void
    {
        BillingPayment::query()
            ->where('status', 'created')
            ->where('created_at', '<', now()->subDay())
            ->orderBy('id')
            ->limit(200)
            ->get()
            ->each(function (BillingPayment $payment): void {
                $payment->markAttempt('expired', [
                    'fail_reason' => 'Checkout abandoned (auto-expired after 24h)',
                ]);
            });
    }
}
