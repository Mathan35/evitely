<?php

namespace App\Services;

use App\Models\AnalyticsEvent;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WeddingAnalyticsService
{
    public function __construct(private PlatformReadinessService $platform) {}

    public function recordView(Request $request, Wedding $wedding, ?WeddingGuest $guest = null): void
    {
        if ($this->shouldIgnoreLiveTraffic($wedding, $request->user())) {
            return;
        }

        $cookieName = 'wv_'.$wedding->id;
        $visitor = $request->cookie($cookieName);

        if (! is_string($visitor) || strlen($visitor) < 16) {
            $visitor = Str::random(40);
            cookie()->queue(cookie($cookieName, $visitor, 60 * 24 * 180, httpOnly: true, sameSite: 'lax'));
            $this->record($wedding, 'unique_view', $guest, $this->hash($visitor, $request));
        }

        $this->record($wedding, $guest ? 'guest_view' : 'view', $guest, $this->hash($visitor, $request));

        if ($request->query('src') === 'qr') {
            $scanCookie = 'qr_'.$wedding->id;

            if ($request->cookie($scanCookie) === null) {
                cookie()->queue(cookie($scanCookie, '1', 60 * 24 * 180, httpOnly: true, sameSite: 'lax'));
                $this->record($wedding, 'qr_scan', $guest, $this->hash($visitor, $request), 'qr');
            }
        }
    }

    /**
     * Guest-facing live-page actions (share, celebrate, etc.).
     * Skips platform admins and the event host so studio testing doesn't inflate stats.
     */
    public function recordLiveAction(
        Wedding $wedding,
        string $type,
        ?WeddingGuest $guest = null,
        ?string $hash = null,
        ?string $channel = null,
        ?User $actor = null,
    ): void {
        if ($this->shouldIgnoreLiveTraffic($wedding, $actor ?? request()->user())) {
            return;
        }

        $this->record($wedding, $type, $guest, $hash, $channel);
    }

    public function record(Wedding $wedding, string $type, ?WeddingGuest $guest = null, ?string $hash = null, ?string $channel = null): void
    {
        AnalyticsEvent::query()->create([
            'event_id' => $wedding->id,
            'event_guest_id' => $guest?->id,
            'type' => $type,
            'channel' => $channel,
            'visitor_hash' => $hash,
            'created_at' => now(),
        ]);
    }

    /**
     * Platform owners and the event host should not inflate live guest metrics.
     */
    public function shouldIgnoreLiveTraffic(Wedding $wedding, ?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        if ($this->platform->isAdmin($user)) {
            return true;
        }

        return (int) $wedding->user_id === (int) $user->id;
    }

    /**
     * @return array{views: int, unique_views: int, guest_views: int, rsvps: int, shares: int, qr_scans: int}
     */
    public function summary(Wedding $wedding): array
    {
        $counts = $wedding->analytics()
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        return [
            'views' => (int) ($counts['view'] ?? 0),
            'unique_views' => (int) ($counts['unique_view'] ?? 0),
            'guest_views' => (int) ($counts['guest_view'] ?? 0),
            'qr_scans' => (int) ($counts['qr_scan'] ?? 0),
            'rsvps' => (int) ($counts['rsvp'] ?? 0),
            'shares' => (int) ($counts['share'] ?? 0) + (int) ($counts['card_share'] ?? 0),
            'card_downloads' => (int) ($counts['card_download'] ?? 0),
            'card_shares' => (int) ($counts['card_share'] ?? 0),
            'cards_generated' => (int) ($counts['card_generated'] ?? 0),
        ];
    }

    private function hash(string $visitor, Request $request): string
    {
        return hash('sha256', $visitor.'|'.(string) $request->userAgent());
    }
}
