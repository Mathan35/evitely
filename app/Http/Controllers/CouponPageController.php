<?php

namespace App\Http\Controllers;

use App\Services\Growth\CouponCampaignService;
use App\Services\Growth\CouponService;
use App\Support\MarketingSeo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponPageController extends Controller
{
    public function index(Request $request, CouponCampaignService $campaigns, CouponService $coupons): Response
    {
        $user = $request->user();

        return Inertia::render('coupons/index', [
            'appName' => config('app.name', 'Invidora'),
            'authRequired' => $user === null,
            'campaigns' => $campaigns->publicCampaigns($user),
            'my_coupons' => $user ? $coupons->availableForUser($user) : [],
            'seo' => MarketingSeo::legal('Coupons & offers', '/coupons'),
        ]);
    }

    public function claim(Request $request, CouponCampaignService $campaigns): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40'],
        ]);

        $coupon = $campaigns->claimByCode($request->user(), $data['code']);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Coupon '.$coupon->code.' saved — use it on event billing.',
        ]);
    }
}
