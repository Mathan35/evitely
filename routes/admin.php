<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\CatalogController;
use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\GuestController;
use App\Http\Controllers\Admin\IntegrationController;
use App\Http\Controllers\Admin\ModerationController;
use App\Http\Controllers\Admin\PackGrantController;
use App\Http\Controllers\Admin\QueueController;
use App\Http\Controllers\Admin\SupportController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function (): void {
    Route::get('login', [AuthController::class, 'create'])->middleware('throttle:30,1')->name('login');
    Route::post('login', [AuthController::class, 'store'])->middleware('throttle:5,1')->name('login.store');
    Route::post('logout', [AuthController::class, 'destroy'])->middleware('auth')->name('logout');
});

Route::middleware(['auth', 'platform.admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function (): void {
        Route::get('/', DashboardController::class)->name('dashboard');

        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::post('users/{user}', [UserController::class, 'update'])->middleware('throttle:30,1')->name('users.update');
        Route::post('users/{user}/verify', [UserController::class, 'verify'])->middleware('throttle:30,1')->name('users.verify');
        Route::post('users/{user}/disable', [UserController::class, 'disable'])->middleware('throttle:30,1')->name('users.disable');
        Route::post('users/{user}/enable', [UserController::class, 'enable'])->middleware('throttle:30,1')->name('users.enable');
        Route::post('users/{user}/send-reset', [UserController::class, 'sendReset'])->middleware('throttle:10,1')->name('users.send-reset');

        Route::get('events', [EventController::class, 'index'])->name('events.index');
        Route::get('events/{event}', [EventController::class, 'show'])->withTrashed()->name('events.show');
        Route::post('events/{event}/publish', [EventController::class, 'publish'])->middleware('throttle:30,1')->name('events.publish');
        Route::post('events/{event}/unpublish', [EventController::class, 'unpublish'])->middleware('throttle:30,1')->name('events.unpublish');
        Route::post('events/{event}/billing', [EventController::class, 'billing'])->middleware('throttle:30,1')->name('events.billing');
        Route::post('events/{event}/restore', [EventController::class, 'restore'])->middleware('throttle:30,1')->withTrashed()->name('events.restore');

        Route::get('guests', [GuestController::class, 'index'])->name('guests.index');
        Route::post('guests/{guest}/rsvp', [GuestController::class, 'updateRsvp'])->middleware('throttle:60,1')->name('guests.rsvp');
        Route::post('guests/{guest}/revoke', [GuestController::class, 'revoke'])->middleware('throttle:30,1')->name('guests.revoke');
        Route::post('collaborators/{collaborator}', [GuestController::class, 'updateCollaborator'])->middleware('throttle:30,1')->name('collaborators.update');

        Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
        Route::get('payments/{payment}', [BillingController::class, 'show'])->name('payments.show');
        Route::post('payments/{payment}/note', [BillingController::class, 'note'])->middleware('throttle:30,1')->name('payments.note');
        Route::post('payments/{payment}/activate-credits', [BillingController::class, 'activateCredits'])
            ->middleware('throttle:30,1')
            ->name('payments.activate-credits');

        Route::get('grants', [PackGrantController::class, 'index'])->name('grants.index');
        Route::post('grants', [PackGrantController::class, 'store'])->middleware('throttle:20,1')->name('grants.store');
        Route::get('grants/users/{user}/events', [PackGrantController::class, 'userEvents'])
            ->middleware('throttle:60,1')
            ->name('grants.user-events');

        Route::get('coupons', [CouponController::class, 'index'])->name('coupons.index');
        Route::post('coupons', [CouponController::class, 'store'])->middleware('throttle:20,1')->name('coupons.store');
        Route::post('coupons/{coupon}', [CouponController::class, 'update'])->middleware('throttle:30,1')->name('coupons.update');
        Route::post('coupons/{coupon}/notify', [CouponController::class, 'notify'])->middleware('throttle:5,1')->name('coupons.notify');

        Route::get('moderation', [ModerationController::class, 'index'])->name('moderation.index');
        Route::post('moderation/guestbook/{entry}', [ModerationController::class, 'guestbook'])->middleware('throttle:60,1')->name('moderation.guestbook');
        Route::delete('moderation/guestbook/{entry}', [ModerationController::class, 'destroyGuestbook'])->middleware('throttle:30,1')->name('moderation.guestbook.destroy');
        Route::post('moderation/photos/{photo}', [ModerationController::class, 'photo'])->middleware('throttle:60,1')->name('moderation.photos');
        Route::delete('moderation/photos/{photo}', [ModerationController::class, 'destroyPhoto'])->middleware('throttle:30,1')->name('moderation.photos.destroy');
        Route::post('moderation/gifts/{claim}', [ModerationController::class, 'gift'])->middleware('throttle:60,1')->name('moderation.gifts');

        Route::get('support', [SupportController::class, 'index'])->name('support.index');
        Route::get('support/{support}', [SupportController::class, 'show'])->name('support.show');
        Route::post('support/{support}', [SupportController::class, 'update'])->middleware('throttle:60,1')->name('support.update');
        Route::delete('support/{support}', [SupportController::class, 'destroy'])->middleware('throttle:30,1')->name('support.destroy');

        Route::get('integrations', [IntegrationController::class, 'index'])->name('integrations.index');
        Route::post('integrations', [IntegrationController::class, 'update'])->middleware('throttle:20,1')->name('integrations.update');
        Route::post('integrations/test-mail', [IntegrationController::class, 'testMail'])->middleware('throttle:5,1')->name('integrations.test-mail');
        Route::post('integrations/test-translate', [IntegrationController::class, 'testTranslate'])->middleware('throttle:10,1')->name('integrations.test-translate');
        Route::post('integrations/test-storage', [IntegrationController::class, 'testStorage'])->middleware('throttle:10,1')->name('integrations.test-storage');

        Route::get('queues', [QueueController::class, 'index'])->name('queues.index');
        Route::post('queues/failed/{id}/retry', [QueueController::class, 'retry'])->middleware('throttle:30,1')->name('queues.retry');
        Route::delete('queues/failed/{id}', [QueueController::class, 'forget'])->middleware('throttle:30,1')->name('queues.forget');
        Route::post('queues/retry-all', [QueueController::class, 'retryAll'])->middleware('throttle:5,1')->name('queues.retry-all');
        Route::post('queues/run-digest', [QueueController::class, 'runDigest'])->middleware('throttle:3,1')->name('queues.run-digest');
        Route::post('queues/run-reminders', [QueueController::class, 'runReminders'])->middleware('throttle:3,1')->name('queues.run-reminders');

        Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('analytics/export', [AnalyticsController::class, 'export'])->name('analytics.export');

        Route::get('catalog', [CatalogController::class, 'index'])->name('catalog.index');
        Route::post('catalog/event-types/{eventType}', [CatalogController::class, 'updateEventType'])->middleware('throttle:30,1')->name('catalog.event-types.update');

        Route::get('audit', [AuditLogController::class, 'index'])->name('audit.index');

        Route::get('exports/users', [ExportController::class, 'users'])->name('exports.users');
        Route::get('exports/events', [ExportController::class, 'events'])->name('exports.events');
        Route::get('exports/payments', [ExportController::class, 'payments'])->name('exports.payments');
        Route::get('exports/guests', [ExportController::class, 'guests'])->name('exports.guests');
    });
