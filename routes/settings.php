<?php

use App\Http\Controllers\Settings\BillingController;
use App\Http\Controllers\Settings\BillingPaymentsController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('settings', fn (): RedirectResponse => redirect('/settings/profile'));

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('settings/billing', [BillingController::class, 'edit'])->name('billing.edit');
    Route::get('settings/billing/payments', [BillingPaymentsController::class, 'index'])->name('billing.payments');
    Route::get('settings/ops', function (): RedirectResponse {
        $user = auth()->user();
        abort_unless(
            $user !== null && app(\App\Services\PlatformReadinessService::class)->isAdmin($user),
            404,
        );

        return redirect()->route('admin.dashboard');
    })->name('ops.index');
    Route::post('settings/billing/razorpay/season', [BillingController::class, 'razorpaySeasonOrder'])->name('billing.razorpay.season');
    Route::post('settings/billing/razorpay/pack', [BillingController::class, 'razorpayPackOrder'])->name('billing.razorpay.pack');
    Route::post('settings/billing/razorpay/verify', [BillingController::class, 'razorpayVerify'])->name('billing.razorpay.verify');
    Route::get('settings/billing/razorpay/status', [BillingController::class, 'razorpayOrderStatus'])->name('billing.razorpay.status');
    Route::post('settings/billing/checkout/season', [BillingController::class, 'checkoutSeason'])->name('billing.checkout.season');
    Route::post('settings/billing/checkout/pro', [BillingController::class, 'checkoutPro'])->name('billing.checkout.pro');
    Route::post('settings/billing/checkout/pack', [BillingController::class, 'checkoutPack'])->name('billing.checkout.pack');
    Route::post('settings/billing/portal', [BillingController::class, 'portal'])->name('billing.portal');
    Route::get('settings/billing/success', [BillingController::class, 'success'])->name('billing.success');
    Route::post('settings/billing/local/activate', [BillingController::class, 'activateLocal'])->name('billing.local.activate');
    Route::post('settings/billing/local/pack', [BillingController::class, 'buyPackLocal'])->name('billing.local.pack');
    Route::post('settings/billing/local/downgrade', [BillingController::class, 'downgradeLocal'])->name('billing.local.downgrade');
});

Route::middleware(['auth'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
