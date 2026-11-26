<?php

use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DesignGalleryController;
use App\Http\Controllers\EventCardController;
use App\Http\Controllers\GalleryFavoriteController;
use App\Http\Controllers\CollaboratorController;
use App\Http\Controllers\EventTableController;
use App\Http\Controllers\GiftClaimController;
use App\Http\Controllers\GuestbookModerationController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\GuestCsvController;
use App\Http\Controllers\GuestPhotoController;
use App\Http\Controllers\GuestPhotoModerationController;
use App\Http\Controllers\GuestGroupController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\RsvpReminderController;
use App\Http\Controllers\TranslateContentController;
use App\Http\Controllers\PublicWeddingController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SeoPageController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\StudioDirectoryController;
use App\Support\MarketingSeo;
use App\Http\Controllers\WeddingController;
use App\Http\Controllers\WeddingDuplicateController;
use App\Http\Controllers\WeddingEventController;
use App\Http\Controllers\WeddingGuideController;
use App\Http\Controllers\WeddingMusicController;
use App\Http\Controllers\WeddingPhotoController;
use App\Http\Controllers\WeddingPreviewController;
use App\Http\Controllers\WeddingPublicationController;
use App\Http\Middleware\RejectReservedInviteSubdomain;
use App\Support\DesignGallery;
use App\Support\HomeMarketing;
use App\Support\InviteHost;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/robots.txt', RobotsController::class)->name('robots');

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'themes' => array_values(config('wedding.themes')),
        'home' => HomeMarketing::payload(),
        'seo' => MarketingSeo::home(),
    ]);
})->name('home');

Route::get('designs', function () {
    return Inertia::render('marketing/designs', [
        'occasions' => DesignGallery::index(),
        'canRegister' => Features::enabled(Features::registration()),
        'seo' => MarketingSeo::designs(),
    ]);
})->name('designs');

Route::get('designs/weddings', function () {
    return Inertia::render('marketing/wedding-formats', [
        'canRegister' => Features::enabled(Features::registration()),
        'seo' => MarketingSeo::weddingFormats(),
    ]);
})->name('designs.weddings');

Route::get('designs/{event}', [DesignGalleryController::class, 'show'])
    ->where('event', '[A-Za-z0-9-]+')
    ->name('designs.event');

foreach (array_keys(SeoPageController::pages()) as $page) {
    Route::get($page, [SeoPageController::class, 'show'])
        ->defaults('page', $page)
        ->name('seo.'.$page);
}

Route::get('privacy', [LegalController::class, 'privacy'])->name('legal.privacy');
Route::get('terms', [LegalController::class, 'terms'])->name('legal.terms');
Route::get('cookies', [LegalController::class, 'cookies'])->name('legal.cookies');

Route::get('support', [SupportController::class, 'show'])->name('support');
Route::post('support', [SupportController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('support.store');

Route::middleware('guest')->group(function (): void {
    Route::get('auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])
        ->whereIn('provider', ['google', 'facebook'])
        ->name('social.redirect');
    Route::match(['get', 'post'], 'auth/{provider}/callback', [SocialAuthController::class, 'callback'])
        ->whereIn('provider', ['google', 'facebook'])
        ->name('social.callback');
});

$inviteRoutes = function (callable $name): void {
    Route::get('/', [PublicWeddingController::class, 'show'])->name($name('public'));
    Route::get('card', [PublicWeddingController::class, 'card'])->name($name('card'));
    Route::get('g/{token}', [PublicWeddingController::class, 'guest'])
        ->where('token', '[A-Za-z0-9]+')
        ->name($name('guest'));
    Route::post('unlock', [PublicWeddingController::class, 'unlock'])
        ->middleware('throttle:20,1')
        ->name($name('unlock'));
    Route::post('rsvp', [PublicWeddingController::class, 'rsvp'])
        ->middleware('throttle:10,1')
        ->name($name('rsvp'));
    Route::post('g/{token}/rsvp', [PublicWeddingController::class, 'guestRsvp'])
        ->where('token', '[A-Za-z0-9]+')
        ->middleware('throttle:10,1')
        ->name($name('guest.rsvp'));
    Route::post('guestbook', [PublicWeddingController::class, 'guestbook'])
        ->middleware('throttle:5,1')
        ->name($name('guestbook'));
    Route::post('gift-claims', [GiftClaimController::class, 'store'])
        ->middleware('throttle:8,1')
        ->name($name('gift-claims.store'));
    Route::post('guest-photos', [GuestPhotoController::class, 'store'])
        ->middleware('throttle:8,1')
        ->name($name('guest-photos.store'));
    Route::post('share', [PublicWeddingController::class, 'share'])
        ->middleware('throttle:30,1')
        ->name($name('share'));
    Route::post('celebrate', \App\Http\Controllers\PublicCelebrateController::class)
        ->middleware('throttle:60,1')
        ->name($name('celebrate'));
    Route::get('calendar.ics', [PublicWeddingController::class, 'calendar'])->name($name('calendar'));
    Route::get('events/{event}/calendar.ics', [PublicWeddingController::class, 'eventCalendar'])->name($name('event-calendar'));
};

// Path invites: /invite/{slug}
Route::prefix('invite/{slug}')
    ->where(['slug' => '[a-z0-9]+(?:-[a-z0-9]+)*'])
    ->group(function () use ($inviteRoutes): void {
        $inviteRoutes(fn (string $action): string => 'weddings.'.$action);
    });

// Custom subdomain invites: https://{slug}.{root}/
$inviteRoot = InviteHost::rootDomain();
if (InviteHost::enabled() && is_string($inviteRoot) && $inviteRoot !== '') {
    Route::domain('{slug}.'.$inviteRoot)
        ->middleware(RejectReservedInviteSubdomain::class)
        ->where(['slug' => '[a-z0-9]+(?:-[a-z0-9]+)*'])
        ->group(function () use ($inviteRoutes): void {
            $inviteRoutes(fn (string $action): string => 'weddings.subdomain.'.$action);
        });
}

Route::get('i/{slug}', function (string $slug) {
    return redirect()->to(InviteHost::publicUrl($slug), 301);
})->name('weddings.legacy');

Route::middleware(['auth'])->group(function () {
    Route::post('favorites', [GalleryFavoriteController::class, 'store'])->name('favorites.store');
    Route::delete('favorites', [GalleryFavoriteController::class, 'destroy'])->name('favorites.destroy');

    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('guests', [StudioDirectoryController::class, 'guests'])->name('guests.index');
    Route::get('analytics', [StudioDirectoryController::class, 'analytics'])->name('analytics');

    Route::get('notifications', [\App\Http\Controllers\AppNotificationController::class, 'index'])->name('notifications.index');
    Route::get('notifications/feed', [\App\Http\Controllers\AppNotificationController::class, 'feed'])
        ->middleware('throttle:120,1')
        ->name('notifications.feed');
    Route::post('notifications/read-all', [\App\Http\Controllers\AppNotificationController::class, 'markAllRead'])
        ->middleware('throttle:30,1')
        ->name('notifications.read-all');
    Route::post('notifications/clear', [\App\Http\Controllers\AppNotificationController::class, 'clear'])
        ->middleware('throttle:30,1')
        ->name('notifications.clear');
    Route::post('notifications/{notification}/read', [\App\Http\Controllers\AppNotificationController::class, 'markRead'])
        ->middleware('throttle:60,1')
        ->name('notifications.read');

    Route::get('events/{wedding}/preview', [WeddingPreviewController::class, 'show'])->name('weddings.preview');
    Route::post('events/{wedding}/publish', [WeddingPublicationController::class, 'store'])->name('weddings.publish');
    Route::delete('events/{wedding}/publish', [WeddingPublicationController::class, 'destroy'])->name('weddings.unpublish');
    Route::post('events/{wedding}/growth/share', [\App\Http\Controllers\EventGrowthController::class, 'recordShare'])
        ->middleware('throttle:60,1')
        ->name('weddings.growth.share');
    Route::get('events/{wedding}/billing', [\App\Http\Controllers\EventBillingController::class, 'show'])->name('weddings.billing');
    Route::post('events/{wedding}/billing/quote', [\App\Http\Controllers\EventBillingController::class, 'quote'])->name('weddings.billing.quote');
    Route::post('events/{wedding}/billing/schedule', [\App\Http\Controllers\EventBillingController::class, 'schedule'])->name('weddings.billing.schedule');
    Route::post('events/{wedding}/billing/checkout/site-pack', [\App\Http\Controllers\EventBillingController::class, 'checkoutSitePack'])->name('weddings.billing.checkout.site-pack');
    Route::post('events/{wedding}/billing/checkout/site-custom', [\App\Http\Controllers\EventBillingController::class, 'checkoutSiteCustom'])->name('weddings.billing.checkout.site-custom');
    Route::post('events/{wedding}/billing/checkout/credits', [\App\Http\Controllers\EventBillingController::class, 'checkoutCredits'])->name('weddings.billing.checkout.credits');
    Route::post('events/{wedding}/duplicate', [WeddingDuplicateController::class, 'store'])->name('weddings.duplicate');

    Route::get('events/{wedding}/card', [EventCardController::class, 'edit'])->name('weddings.card.edit');
    Route::put('events/{wedding}/card', [EventCardController::class, 'update'])->name('weddings.card.update');
    Route::post('events/{wedding}/card/generate', [EventCardController::class, 'generate'])->name('weddings.card.generate');
    Route::post('events/{wedding}/card/export', [EventCardController::class, 'export'])->name('weddings.card.export');

    Route::post('events/{wedding}/events', [WeddingEventController::class, 'store'])->name('weddings.events.store');
    Route::put('events/{wedding}/events/{event}', [WeddingEventController::class, 'update'])->name('weddings.events.update');
    Route::delete('events/{wedding}/events/{event}', [WeddingEventController::class, 'destroy'])->name('weddings.events.destroy');

    Route::post('events/{wedding}/photos', [WeddingPhotoController::class, 'store'])->name('weddings.photos.store');
    Route::post('events/{wedding}/photos/order', [WeddingPhotoController::class, 'reorder'])->name('weddings.photos.order');
    Route::put('events/{wedding}/photos/{photo}', [WeddingPhotoController::class, 'update'])->name('weddings.photos.update');
    Route::post('events/{wedding}/photos/{photo}/cover', [WeddingPhotoController::class, 'cover'])->name('weddings.photos.cover');
    Route::delete('events/{wedding}/photos/{photo}', [WeddingPhotoController::class, 'destroy'])->name('weddings.photos.destroy');

    Route::post('events/{wedding}/music', [WeddingMusicController::class, 'store'])->name('weddings.music.store');

    Route::post('events/{wedding}/groups', [GuestGroupController::class, 'store'])->name('weddings.groups.store');
    Route::delete('events/{wedding}/groups/{group}', [GuestGroupController::class, 'destroy'])->name('weddings.groups.destroy');

    Route::post('events/{wedding}/guests/bulk', [GuestController::class, 'bulk'])->name('weddings.guests.bulk');
    Route::put('events/{wedding}/invite-delivery-mode', [\App\Http\Controllers\InviteDeliveryModeController::class, 'update'])
        ->name('weddings.invite-delivery-mode');
    Route::get('events/{wedding}/guests/export', [GuestCsvController::class, 'exportGuests'])->name('weddings.guests.export');
    Route::get('events/{wedding}/guests/import-sample', [GuestCsvController::class, 'sample'])->name('weddings.guests.import-sample');
    Route::get('events/{wedding}/rsvps/export', [GuestCsvController::class, 'exportRsvps'])->name('weddings.rsvps.export');
    Route::get('events/{wedding}/rsvps/catering-export', [GuestCsvController::class, 'exportCatering'])->name('weddings.rsvps.catering-export');
    Route::post('events/{wedding}/guests/import', [GuestCsvController::class, 'import'])->name('weddings.guests.import');
    Route::post('events/{wedding}/guests', [GuestController::class, 'store'])->name('weddings.guests.store');
    Route::put('events/{wedding}/guests/{guest}', [GuestController::class, 'update'])->name('weddings.guests.update');
    Route::delete('events/{wedding}/guests/{guest}', [GuestController::class, 'destroy'])->name('weddings.guests.destroy');
    Route::post('events/{wedding}/rsvp-reminders', [RsvpReminderController::class, 'store'])->name('weddings.rsvp-reminders.store');
    Route::post('events/{wedding}/translate-content', [TranslateContentController::class, 'store'])->name('weddings.translate-content');

    Route::post('events/{wedding}/travel', [WeddingGuideController::class, 'storeTravel'])->name('weddings.travel.store');
    Route::delete('events/{wedding}/travel/{travel}', [WeddingGuideController::class, 'destroyTravel'])->name('weddings.travel.destroy');
    Route::post('events/{wedding}/accommodations', [WeddingGuideController::class, 'storeStay'])->name('weddings.accommodations.store');
    Route::delete('events/{wedding}/accommodations/{accommodation}', [WeddingGuideController::class, 'destroyStay'])->name('weddings.accommodations.destroy');

    Route::post('events/{wedding}/guestbook/bulk', [GuestbookModerationController::class, 'bulk'])->name('weddings.guestbook.bulk');
    Route::post('events/{wedding}/guestbook/{entry}/approve', [GuestbookModerationController::class, 'approve'])->name('weddings.guestbook.approve');
    Route::post('events/{wedding}/guestbook/{entry}/hide', [GuestbookModerationController::class, 'hide'])->name('weddings.guestbook.hide');
    Route::delete('events/{wedding}/guestbook/{entry}', [GuestbookModerationController::class, 'destroy'])->name('weddings.guestbook.destroy');

    Route::post('events/{wedding}/collaborators', [CollaboratorController::class, 'store'])->name('weddings.collaborators.store');
    Route::delete('events/{wedding}/collaborators/{collaborator}', [CollaboratorController::class, 'destroy'])->name('weddings.collaborators.destroy');
    Route::get('collaborators/accept/{token}', [CollaboratorController::class, 'accept'])->name('collaborators.accept');

    Route::post('events/{wedding}/tables', [EventTableController::class, 'store'])->name('weddings.tables.store');
    Route::put('events/{wedding}/tables/{table}', [EventTableController::class, 'update'])->name('weddings.tables.update');
    Route::delete('events/{wedding}/tables/{table}', [EventTableController::class, 'destroy'])->name('weddings.tables.destroy');
    Route::post('events/{wedding}/tables/assign', [EventTableController::class, 'assign'])->name('weddings.tables.assign');
    Route::post('events/{wedding}/tables/auto-assign', [EventTableController::class, 'autoAssign'])->name('weddings.tables.auto-assign');
    Route::post('events/{wedding}/gift-claims/{claim}/release', [GiftClaimController::class, 'release'])->name('weddings.gift-claims.release');

    Route::post('events/{wedding}/guest-photos/bulk', [GuestPhotoModerationController::class, 'bulk'])->name('weddings.guest-photos.bulk');
    Route::post('events/{wedding}/guest-photos/{photo}/approve', [GuestPhotoModerationController::class, 'approve'])->name('weddings.guest-photos.approve');
    Route::post('events/{wedding}/guest-photos/{photo}/hide', [GuestPhotoModerationController::class, 'hide'])->name('weddings.guest-photos.hide');
    Route::delete('events/{wedding}/guest-photos/{photo}', [GuestPhotoModerationController::class, 'destroy'])->name('weddings.guest-photos.destroy');

    Route::resource('events', WeddingController::class)->names('weddings')->parameters(['events' => 'wedding']);
});

Route::get('weddings/{path?}', function (?string $path = null) {
    return redirect('/events'.($path ? '/'.$path : ''), 301);
})->where('path', '.*');

Route::post('stripe/webhook', [\App\Http\Controllers\StripeWebhookController::class, 'handleWebhook'])
    ->name('cashier.webhook');

Route::post('razorpay/webhook', \App\Http\Controllers\RazorpayWebhookController::class)
    ->name('razorpay.webhook');

require __DIR__.'/settings.php';
