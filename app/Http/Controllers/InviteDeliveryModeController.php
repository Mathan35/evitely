<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use App\Services\Billing\BillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class InviteDeliveryModeController extends Controller
{
    public function update(Request $request, Wedding $wedding, BillingService $billing): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $mode = $request->validate([
            'mode' => ['required', 'in:manual,automated'],
        ])['mode'];

        if ($mode === 'automated') {
            $billing->assertCanUseAutomated($request->user(), $wedding);
        }

        $setting = $wedding->setting()->firstOrCreate([]);
        $details = is_array($setting->details) ? $setting->details : [];
        $details['invite_delivery_mode'] = $mode;
        $setting->details = $details;
        $setting->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $mode === 'automated'
                ? 'Automated Twilio delivery selected.'
                : 'Free phone delivery selected.',
        ]);

        return back();
    }
}
