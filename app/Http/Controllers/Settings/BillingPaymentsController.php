<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\BillingPayment;
use App\Services\Billing\BillingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingPaymentsController extends Controller
{
    public function index(Request $request, BillingService $billing): Response
    {
        abort_unless($billing->isBillingAdmin($request->user()), 403);

        $payments = BillingPayment::query()
            ->with(['user:id,name,email'])
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (BillingPayment $row): array => [
                'id' => $row->id,
                'user' => [
                    'id' => $row->user?->id,
                    'name' => $row->user?->name,
                    'email' => $row->user?->email,
                ],
                'kind' => $row->kind,
                'sku' => $row->sku,
                'amount_label' => '₹'.number_format($row->amount_paise / 100, 0, '.', ','),
                'status' => $row->status,
                'order_id' => $row->razorpay_order_id,
                'payment_id' => $row->razorpay_payment_id,
                'paid_at' => $row->paid_at?->toIso8601String(),
                'created_at' => $row->created_at?->toIso8601String(),
            ]);

        return Inertia::render('settings/billing-payments', [
            'payments' => $payments,
            'webhook_url' => url('/razorpay/webhook'),
            'checklist' => $billing->launchChecklist(),
        ]);
    }
}
