<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\NotifyCouponCampaignJob;
use App\Models\CouponCampaign;
use App\Services\Admin\AdminAuditLogger;
use App\Services\Growth\CouponCampaignService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(CouponCampaignService $campaigns): Response
    {
        return Inertia::render('admin/coupons/index', [
            'campaigns' => array_values($campaigns->adminList(80)),
        ]);
    }

    public function store(Request $request, CouponCampaignService $campaigns, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $this->validatedCouponPayload($request, creating: true);

        $campaign = $campaigns->create([
            'code' => $data['code'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'discount_type' => $data['discount_type'],
            'percent_off' => $data['percent_off'] ?? null,
            'amount_off_minor' => $data['amount_off_minor'] ?? null,
            'starts_at' => $data['starts_at'],
            'ends_at' => $data['ends_at'],
            'max_claims' => $data['max_claims'],
            'is_active' => $data['is_active'],
            'notify' => $data['notify'],
        ], $request->user());

        $audit->log($request->user(), 'coupons.create', null, [
            'campaign_id' => $campaign->id,
            'code' => $campaign->code,
            'max_claims' => $campaign->max_claims,
            'ends_at' => $campaign->ends_at?->toIso8601String(),
            'notify' => $data['notify'],
        ], $request);

        return back()->with('toast', [
            'type' => 'success',
            'message' => $data['notify']
                ? 'Coupon created — notifying active hosts first, then unused accounts.'
                : 'Coupon created with claim limit'.($campaign->ends_at ? ' and expiry.' : '.'),
        ]);
    }

    public function update(Request $request, CouponCampaign $coupon, CouponCampaignService $campaigns, AdminAuditLogger $audit): RedirectResponse
    {
        // Simple activate/deactivate from list buttons.
        if ($request->has('is_active') && ! $request->has('title') && ! $request->has('max_claims')) {
            $data = $request->validate([
                'is_active' => ['required', 'boolean'],
            ]);
            $campaigns->toggleActive($coupon, (bool) $data['is_active']);
            $audit->log($request->user(), 'coupons.toggle', null, [
                'campaign_id' => $coupon->id,
                'is_active' => (bool) $data['is_active'],
            ], $request);

            return back()->with('toast', [
                'type' => 'success',
                'message' => $data['is_active'] ? 'Coupon activated.' : 'Coupon deactivated.',
            ]);
        }

        $data = $this->validatedCouponPayload($request, creating: false);

        $campaigns->updateCampaign($coupon, [
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'starts_at' => $data['starts_at'],
            'ends_at' => $data['ends_at'],
            'max_claims' => $data['max_claims'],
            'is_active' => $data['is_active'],
            'sync_expiry_to_issued' => true,
        ]);

        $audit->log($request->user(), 'coupons.update', null, [
            'campaign_id' => $coupon->id,
            'max_claims' => $data['max_claims'],
            'ends_at' => $data['ends_at']?->toIso8601String(),
        ], $request);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Coupon counts and expiry updated.',
        ]);
    }

    public function notify(Request $request, CouponCampaign $coupon, AdminAuditLogger $audit): RedirectResponse
    {
        NotifyCouponCampaignJob::dispatchSync($coupon->id);
        $audit->log($request->user(), 'coupons.notify', null, [
            'campaign_id' => $coupon->id,
        ], $request);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Notification run finished (active hosts first).',
        ]);
    }

    /**
     * @return array{
     *   code?: string|null,
     *   title: string,
     *   description?: string|null,
     *   discount_type: string,
     *   percent_off?: int|null,
     *   amount_off_minor?: int|null,
     *   starts_at: Carbon,
     *   ends_at: ?Carbon,
     *   max_claims: int,
     *   is_active: bool,
     *   notify: bool
     * }
     */
    private function validatedCouponPayload(Request $request, bool $creating): array
    {
        $rules = [
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'starts_at' => ['nullable', 'string'],
            'ends_at' => ['nullable', 'string'],
            'no_expiry' => ['nullable', 'boolean'],
            'max_claims' => ['required', 'integer', 'min:1', 'max:100000'],
            'is_active' => ['nullable', 'boolean'],
        ];

        if ($creating) {
            $rules = array_merge($rules, [
                'code' => ['nullable', 'string', 'max:40'],
                'discount_type' => ['required', Rule::in(['percent', 'amount'])],
                'percent_off' => ['nullable', 'integer', 'min:1', 'max:90'],
                'amount_rupees' => ['nullable', 'numeric', 'min:1'],
                'notify' => ['nullable', 'boolean'],
            ]);
        }

        $data = $request->validate($rules);

        $startsAt = $this->parseDateTime($data['starts_at'] ?? null) ?? now();
        $noExpiry = (bool) ($data['no_expiry'] ?? false);
        $endsAt = $noExpiry ? null : $this->parseDateTime($data['ends_at'] ?? null);

        if (! $noExpiry && $endsAt === null) {
            throw ValidationException::withMessages([
                'ends_at' => 'Set an expiry date, or tick “No expiry”.',
            ]);
        }

        if ($endsAt !== null && $endsAt->lte($startsAt)) {
            throw ValidationException::withMessages([
                'ends_at' => 'Expiry must be after the start time.',
            ]);
        }

        if ($endsAt !== null && $endsAt->lte(now())) {
            throw ValidationException::withMessages([
                'ends_at' => 'Expiry must be in the future.',
            ]);
        }

        $payload = [
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'max_claims' => (int) $data['max_claims'],
            'is_active' => (bool) ($data['is_active'] ?? true),
            'notify' => (bool) ($data['notify'] ?? true),
        ];

        if ($creating) {
            $type = $data['discount_type'];
            if ($type === 'percent' && empty($data['percent_off'])) {
                throw ValidationException::withMessages(['percent_off' => 'Enter a discount percent.']);
            }
            if ($type === 'amount' && empty($data['amount_rupees'])) {
                throw ValidationException::withMessages(['amount_rupees' => 'Enter a discount amount in rupees.']);
            }

            $payload['code'] = $data['code'] ?? null;
            $payload['discount_type'] = $type;
            $payload['percent_off'] = isset($data['percent_off']) ? (int) $data['percent_off'] : null;
            $payload['amount_off_minor'] = isset($data['amount_rupees'])
                ? (int) round(((float) $data['amount_rupees']) * 100)
                : null;
        } else {
            $payload['discount_type'] = 'percent';
        }

        return $payload;
    }

    private function parseDateTime(mixed $value): ?Carbon
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            // datetime-local: 2026-11-27T18:30
            return Carbon::parse(str_replace('T', ' ', $value), config('app.timezone'));
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'ends_at' => 'Enter a valid date and time.',
            ]);
        }
    }
}
