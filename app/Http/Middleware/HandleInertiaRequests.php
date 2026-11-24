<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\Billing\BillingService;
use App\Services\Growth\GrowthService;
use App\Services\HostAlertsService;
use App\Services\PlatformReadinessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;
use Laravel\Fortify\Features;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $shared = parent::share($request);
        $billing = null;

        if ($user) {
            $service = app(BillingService::class);
            $billing = [
                'plan' => $service->effectivePlan($user),
                'is_pro' => $service->isPro($user),
                'message_credits' => $service->messageCredits($user),
                'event_limit' => $service->eventLimit($user),
                'events_count' => $service->listedEventCount($user),
                'can_create_event' => $service->canCreateEvent($user),
                'upgrade_url' => route('billing.edit'),
            ];
        }

        return [
            ...$shared,
            'name' => config('app.name'),
            'auth' => [
                'user' => $user
                    ? [
                        ...$user->toArray(),
                        'plan' => $billing['plan'],
                        'message_credits' => $billing['message_credits'],
                        'is_pro' => $billing['is_pro'],
                    ]
                    : null,
            ],
            'galleryFavoriteIds' => $user
                ? $this->galleryFavoriteIdsFor($user)
                : [],
            'hostAlerts' => $user
                ? app(HostAlertsService::class)->forUser($user)
                : ['total' => 0, 'rsvps' => 0, 'wishes' => 0, 'photos' => 0, 'items' => []],
            'billing' => $billing,
            'flash' => array_merge(
                (array) ($shared['flash'] ?? []),
                [
                    'trial_welcome' => (bool) $request->session()->get('trial_welcome', false),
                    'trial_event_limit' => (bool) $request->session()->get('trial_event_limit', false),
                    'toast' => $request->session()->get('toast'),
                    'publish_growth' => $request->session()->get('publish_growth'),
                ],
            ),
            'growth' => app(GrowthService::class)->publicProps($user),
            'is_platform_admin' => $user
                ? app(PlatformReadinessService::class)->isAdmin($user)
                : false,
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return list<string>
     */
    private function galleryFavoriteIdsFor(User $user): array
    {
        try {
            if (! Schema::hasTable('gallery_favorites')) {
                return [];
            }

            return $user->galleryFavorites()->pluck('design_id')->values()->all();
        } catch (\Throwable) {
            return [];
        }
    }
}
