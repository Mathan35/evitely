<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Support\InviteHost;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StudioDirectoryController extends Controller
{
    public function guests(): Response
    {
        Gate::authorize('viewAny', Wedding::class);
        $user = request()->user();
        abort_if($user === null, 403);

        $events = Wedding::query()->accessibleBy($user)
            ->with('hosts')
            ->latest()
            ->get()
            ->map(fn (Wedding $wedding): array => [
                'id' => $wedding->id,
                'title' => $wedding->displayTitle(),
            ])
            ->values();

        $guests = WeddingGuest::query()
            ->whereHas('wedding', fn ($query) => $query->accessibleBy($user))
            ->with(['wedding:id,title,slug', 'group:id,name'])
            ->latest()
            ->get()
            ->map(fn (WeddingGuest $guest): array => [
                'id' => $guest->id,
                'name' => $guest->fullName(),
                'first_name' => $guest->first_name,
                'last_name' => $guest->last_name,
                'email' => $guest->email,
                'phone' => $guest->phone,
                'country_code' => $guest->country_code,
                'number_of_guests' => (int) $guest->number_of_guests,
                'notes' => $guest->notes,
                'group' => $guest->group?->name,
                'rsvp_status' => $guest->rsvp_status->value,
                'invitation_status' => $guest->invitation_status->value,
                'invitation_sent_at' => $guest->invitation_sent_at?->toIso8601String(),
                'invitation_send_count' => (int) $guest->invitation_send_count,
                'guest_url' => $guest->wedding && $guest->guest_token
                    ? InviteHost::guestUrl($guest->wedding->slug, (string) $guest->guest_token)
                    : null,
                'event' => $guest->wedding?->displayTitle(),
                'event_id' => $guest->event_id,
            ]);

        return Inertia::render('studio/guests', [
            'guests' => $guests,
            'events' => $events,
        ]);
    }

    public function analytics(): Response
    {
        Gate::authorize('viewAny', Wedding::class);
        $user = request()->user();
        abort_if($user === null, 403);

        $weddings = Wedding::query()->accessibleBy($user)->with('hosts')->get();
        $allIds = $weddings->pluck('id');
        $eventId = request()->integer('event') ?: null;
        $range = (int) (request()->input('range') ?: 14);
        if (! in_array($range, [7, 14, 30], true)) {
            $range = 14;
        }

        $ids = $allIds;
        if ($eventId && $allIds->contains($eventId)) {
            $ids = collect([$eventId]);
        } else {
            $eventId = null;
        }

        $counts = AnalyticsEvent::query()
            ->whereIn('event_id', $ids)
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $views = (int) ($counts['view'] ?? 0);
        $uniqueViews = (int) ($counts['unique_view'] ?? 0);
        $shares = (int) ($counts['share'] ?? 0) + (int) ($counts['card_share'] ?? 0);
        $qrScans = (int) ($counts['qr_scan'] ?? 0);
        $rsvps = (int) ($counts['rsvp'] ?? 0);
        $cardDownloads = (int) ($counts['card_download'] ?? 0);
        $cardShares = (int) ($counts['card_share'] ?? 0);
        $cardsGenerated = (int) ($counts['card_generated'] ?? 0);
        $guestViews = (int) ($counts['guest_view'] ?? 0);
        $funnelViews = $views + $guestViews;

        $start = now()->subDays($range - 1)->startOfDay();
        $dailyRows = AnalyticsEvent::query()
            ->whereIn('event_id', $ids)
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as day, type, count(*) as total')
            ->groupBy('day', 'type')
            ->get()
            ->groupBy('day');

        $series = collect(range($range - 1, 0))->map(function (int $offset) use ($dailyRows): array {
            $day = now()->subDays($offset)->startOfDay();
            $key = $day->toDateString();
            $bucket = $dailyRows->get($key, collect());
            $byType = $bucket->pluck('total', 'type');

            return [
                'date' => $key,
                'label' => $day->format('j M'),
                'views' => (int) ($byType['view'] ?? 0) + (int) ($byType['guest_view'] ?? 0),
                'rsvps' => (int) ($byType['rsvp'] ?? 0),
                'shares' => (int) ($byType['share'] ?? 0) + (int) ($byType['card_share'] ?? 0),
                'downloads' => (int) ($byType['card_download'] ?? 0),
            ];
        })->values();

        $perEventRows = AnalyticsEvent::query()
            ->whereIn('event_id', $allIds)
            ->selectRaw('event_id, type, count(*) as total')
            ->groupBy('event_id', 'type')
            ->get()
            ->groupBy('event_id');

        $byEvent = $weddings->map(function (Wedding $wedding) use ($perEventRows): array {
            $bucket = $perEventRows->get($wedding->id, collect());
            $byType = $bucket->pluck('total', 'type');
            $eventViews = (int) ($byType['view'] ?? 0) + (int) ($byType['guest_view'] ?? 0);
            $eventRsvps = (int) ($byType['rsvp'] ?? 0);
            $eventShares = (int) ($byType['share'] ?? 0) + (int) ($byType['card_share'] ?? 0);

            return [
                'id' => $wedding->id,
                'title' => $wedding->displayTitle(),
                'status' => $wedding->status->value,
                'views' => $eventViews,
                'rsvps' => $eventRsvps,
                'shares' => $eventShares,
                'downloads' => (int) ($byType['card_download'] ?? 0),
                'conversion' => $eventViews > 0 ? round(($eventRsvps / $eventViews) * 100, 1) : 0.0,
                'share_rate' => $eventViews > 0 ? round(($eventShares / $eventViews) * 100, 1) : 0.0,
            ];
        })->sortByDesc('views')->values();

        $channelRows = AnalyticsEvent::query()
            ->whereIn('event_id', $ids)
            ->whereIn('type', ['share', 'card_share'])
            ->whereNotNull('channel')
            ->selectRaw('channel, count(*) as total')
            ->groupBy('channel')
            ->orderByDesc('total')
            ->limit(8)
            ->get();
        $channelTotal = max(1, (int) $channelRows->sum('total'));
        $channels = $channelRows->map(fn ($row): array => [
            'channel' => (string) $row->channel,
            'total' => (int) $row->total,
            'pct' => round(((int) $row->total / $channelTotal) * 100, 1),
        ])->values();

        $conversion = $funnelViews > 0 ? round(($rsvps / $funnelViews) * 100, 1) : 0.0;
        $shareRate = $funnelViews > 0 ? round(($shares / $funnelViews) * 100, 1) : 0.0;

        return Inertia::render('studio/analytics', [
            'stats' => [
                'views' => $views,
                'unique_views' => $uniqueViews,
                'guest_views' => $guestViews,
                'shares' => $shares,
                'qr_scans' => $qrScans,
                'rsvps' => $rsvps,
                'card_downloads' => $cardDownloads,
                'card_shares' => $cardShares,
                'cards_generated' => $cardsGenerated,
                'conversion' => $conversion,
                'share_rate' => $shareRate,
            ],
            'funnel' => [
                'views' => $funnelViews,
                'unique' => $uniqueViews,
                'rsvps' => $rsvps,
                'shares' => $shares,
                'view_to_rsvp' => $conversion,
                'view_to_share' => $shareRate,
            ],
            'series' => $series,
            'by_event' => $byEvent,
            'channels' => $channels,
            'events' => $weddings->map(fn (Wedding $wedding): array => [
                'id' => $wedding->id,
                'title' => $wedding->displayTitle(),
                'status' => $wedding->status instanceof \BackedEnum
                    ? $wedding->status->value
                    : (string) $wedding->status,
            ])->values(),
            'selected_event' => $eventId,
            'range' => $range,
            'range_label' => "Last {$range} days",
            'generated_at' => Carbon::now()->toIso8601String(),
        ]);
    }
}
