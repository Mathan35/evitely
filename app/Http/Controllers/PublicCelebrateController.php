<?php

namespace App\Http\Controllers;

use App\Enums\WeddingStatus;
use App\Models\AppNotification;
use App\Models\Wedding;
use App\Services\Notifications\AppNotificationService;
use App\Services\WeddingAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class PublicCelebrateController extends Controller
{
    public function __invoke(
        Request $request,
        string $slug,
        AppNotificationService $notifications,
        WeddingAnalyticsService $analytics,
    ): JsonResponse {
        $wedding = Wedding::query()
            ->with('user')
            ->where('slug', $slug)
            ->where('status', WeddingStatus::Published)
            ->firstOrFail();

        $host = $wedding->user;
        if (! $host) {
            return response()->json(['ok' => true]);
        }

        $fingerprint = $this->fingerprint($request);
        $rateKey = 'celebrate:'.$wedding->id.':'.$fingerprint;
        if (RateLimiter::tooManyAttempts($rateKey, 30)) {
            return response()->json(['ok' => true, 'throttled' => true]);
        }
        RateLimiter::hit($rateKey, 60);

        $actor = trim((string) $request->input('name', ''));
        if ($actor === '') {
            $actor = 'A guest';
        }
        $actor = Str::limit($actor, 40);

        $groupKey = 'celebrate:'.$wedding->id.':'.$fingerprint;
        $notifications->push(
            $host,
            AppNotification::TYPE_CELEBRATE,
            $groupKey,
            $actor.' celebrated',
            'Confetti on '.$wedding->displayTitle(),
            [
                'href' => route('weddings.show', $wedding),
                'actor_name' => $actor,
                'event_id' => $wedding->id,
                'event_title' => $wedding->displayTitle(),
            ],
            increment: true,
        );

        $analytics->record($wedding, 'celebrate', null, null, 'fab');

        return response()->json(['ok' => true]);
    }

    private function fingerprint(Request $request): string
    {
        $session = $request->session()->getId() ?: '';
        $ip = (string) $request->ip();
        $ua = substr((string) $request->userAgent(), 0, 80);

        return hash('sha256', $session.'|'.$ip.'|'.$ua);
    }
}
