<?php

namespace App\Services\Admin;

use App\Models\AnalyticsEvent;
use App\Models\BillingPayment;
use App\Models\GuestbookEntry;
use App\Models\GuestPhoto;
use App\Models\Wedding;
use App\Services\WeddingAnalyticsService;
use App\Support\InviteHost;
use Illuminate\Support\Facades\Storage;

class AdminEventInsightService
{
    public function __construct(private WeddingAnalyticsService $analytics) {}

    /**
     * @param  list<int>  $eventIds
     * @return array<int, array{views: int, unique_views: int, guest_views: int, qr_scans: int, shares: int, card_downloads: int, card_shares: int, cards_generated: int}>
     */
    public function analyticsForEvents(array $eventIds): array
    {
        if ($eventIds === []) {
            return [];
        }

        $rows = AnalyticsEvent::query()
            ->whereIn('event_id', $eventIds)
            ->selectRaw('event_id, type, count(*) as total')
            ->groupByRaw('event_id, type')
            ->get();

        $out = [];
        foreach ($eventIds as $id) {
            $out[$id] = $this->emptyAnalytics();
        }

        foreach ($rows as $row) {
            $id = (int) $row->event_id;
            $type = (string) $row->type;
            $total = (int) $row->total;
            if (! isset($out[$id])) {
                $out[$id] = $this->emptyAnalytics();
            }
            match ($type) {
                'view' => $out[$id]['views'] = $total,
                'unique_view' => $out[$id]['unique_views'] = $total,
                'guest_view' => $out[$id]['guest_views'] = $total,
                'qr_scan' => $out[$id]['qr_scans'] = $total,
                'share' => $out[$id]['shares'] += $total,
                'card_share' => $out[$id]['card_shares'] = $total,
                'card_download' => $out[$id]['card_downloads'] = $total,
                'card_generated' => $out[$id]['cards_generated'] = $total,
                default => null,
            };
            if ($type === 'card_share') {
                $out[$id]['shares'] += $total;
            }
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(Wedding $event): array
    {
        $event->load([
            'user:id,name,email,plan,message_credits',
            'eventType:id,name,slug',
            'card',
            'setting',
        ]);
        $event->loadCount([
            'guests',
            'rsvps',
            'photos',
            'guestbookEntries',
            'guestPhotos',
            'giftClaims',
            'collaborators',
            'tables',
            'translations',
        ]);

        $analytics = $this->analytics->summary($event);
        $guestStats = $event->guests()
            ->selectRaw("
                count(*) as total,
                sum(case when rsvp_status = 'attending' then 1 else 0 end) as attending,
                sum(case when rsvp_status = 'not_attending' then 1 else 0 end) as declined,
                sum(case when rsvp_status = 'maybe' then 1 else 0 end) as maybe,
                sum(case when rsvp_status = 'pending' then 1 else 0 end) as pending,
                sum(case when email_last_error is not null or whatsapp_last_error is not null or sms_last_error is not null or invitation_last_error is not null then 1 else 0 end) as delivery_errors,
                sum(case when revoked_at is not null then 1 else 0 end) as revoked
            ")
            ->first();

        $guestbook = GuestbookEntry::query()
            ->where('event_id', $event->id)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $guestPhotos = GuestPhoto::query()
            ->where('event_id', $event->id)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $traffic = $this->dailyTraffic((int) $event->id, 14);
        $card = $event->card;
        $document = is_array($card?->document) ? $card->document : [];
        $previewUrl = null;
        if (filled($card?->preview_path)) {
            $previewUrl = Storage::disk('public')->url((string) $card->preview_path);
        }

        $payments = BillingPayment::query()
            ->where('event_id', $event->id)
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (BillingPayment $p): array => [
                'id' => $p->id,
                'sku' => $p->sku,
                'kind' => $p->kind,
                'status' => $p->status,
                'provider' => $p->provider,
                'amount_paise' => $p->amount_paise,
                'currency' => $p->currency,
                'paid_at' => $p->paid_at?->toIso8601String(),
            ])
            ->all();

        $recentGuests = $event->guests()->latest('id')->limit(25)->get()
            ->map(fn ($g): array => [
                'id' => $g->id,
                'name' => $g->fullName(),
                'email' => $g->email,
                'phone' => $g->phone,
                'rsvp_status' => $g->rsvp_status?->value ?? (string) $g->rsvp_status,
                'invitation_status' => $g->invitation_status?->value ?? (string) $g->invitation_status,
                'delivery_error' => $g->hasChannelFailure(),
                'revoked' => filled($g->revoked_at),
            ])
            ->all();

        $details = is_array($event->setting?->details) ? $event->setting->details : [];

        return [
            'id' => $event->id,
            'title' => $event->displayTitle(),
            'slug' => $event->slug,
            'status' => $event->status?->value ?? (string) $event->status,
            'invitation_mode' => $event->invitation_mode,
            'theme' => $event->theme,
            'style' => $event->style,
            'language' => $event->language,
            'secondary_language' => $event->secondary_language,
            'starts_on' => $event->starts_on?->toDateString(),
            'starts_at' => $event->starts_at,
            'timezone' => $event->timezone,
            'venue_name' => $event->venue_name,
            'venue_address' => $event->venue_address,
            'city' => $event->city,
            'state' => $event->state,
            'country' => $event->country,
            'site_billing_status' => $event->site_billing_status,
            'site_pack_sku' => $event->site_pack_sku,
            'site_pack_days' => $event->site_pack_days,
            'site_pack_ends_at' => $event->site_pack_ends_at?->toIso8601String(),
            'site_trial_ends_at' => $event->site_trial_ends_at?->toIso8601String(),
            'published_at' => $event->published_at?->toIso8601String(),
            'created_at' => $event->created_at?->toIso8601String(),
            'updated_at' => $event->updated_at?->toIso8601String(),
            'deleted' => $event->trashed(),
            'deleted_at' => $event->deleted_at?->toIso8601String(),
            'public_url' => InviteHost::publicUrl($event->slug),
            'preview_url' => url('/events/'.$event->id.'/preview'),
            'studio_url' => url('/events/'.$event->id),
            'card_editor_url' => url('/events/'.$event->id.'/card'),
            'owner' => [
                'id' => $event->user?->id,
                'name' => $event->user?->name,
                'email' => $event->user?->email,
                'plan' => $event->user?->plan,
                'message_credits' => (int) ($event->user?->message_credits ?? 0),
            ],
            'event_type' => $event->eventType?->name,
            'event_type_slug' => $event->eventType?->slug,
            'counts' => [
                'guests' => (int) $event->guests_count,
                'rsvps' => (int) $event->rsvps_count,
                'photos' => (int) $event->photos_count,
                'guestbook' => (int) $event->guestbook_entries_count,
                'guest_photos' => (int) $event->guest_photos_count,
                'gift_claims' => (int) $event->gift_claims_count,
                'collaborators' => (int) $event->collaborators_count,
                'tables' => (int) $event->tables_count,
                'translations' => (int) $event->translations_count,
            ],
            'guest_stats' => [
                'total' => (int) ($guestStats?->total ?? 0),
                'attending' => (int) ($guestStats?->attending ?? 0),
                'declined' => (int) ($guestStats?->declined ?? 0),
                'maybe' => (int) ($guestStats?->maybe ?? 0),
                'pending' => (int) ($guestStats?->pending ?? 0),
                'delivery_errors' => (int) ($guestStats?->delivery_errors ?? 0),
                'revoked' => (int) ($guestStats?->revoked ?? 0),
            ],
            'moderation' => [
                'guestbook' => [
                    'pending' => (int) ($guestbook['pending'] ?? 0),
                    'approved' => (int) ($guestbook['approved'] ?? 0),
                    'hidden' => (int) ($guestbook['hidden'] ?? 0),
                ],
                'guest_photos' => [
                    'pending' => (int) ($guestPhotos['pending'] ?? 0),
                    'approved' => (int) ($guestPhotos['approved'] ?? 0),
                    'hidden' => (int) ($guestPhotos['hidden'] ?? 0),
                ],
            ],
            'analytics' => $analytics,
            'traffic_14d' => $traffic,
            'card' => [
                'exists' => $card !== null,
                'status' => $card?->status,
                'format' => $card?->format,
                'width' => $card?->width,
                'height' => $card?->height,
                'preview_url' => $previewUrl,
                'template_id' => $document['template_id'] ?? $document['template'] ?? $document['id'] ?? null,
                'page_count' => is_array($document['pages'] ?? null) ? count($document['pages']) : null,
                'updated_at' => $card?->updated_at?->toIso8601String(),
            ],
            'settings' => [
                'sections_count' => is_array($event->setting?->sections) ? count($event->setting->sections) : 0,
                'rsvp_reminders_enabled' => (string) ($details['rsvp_reminders_enabled'] ?? '') === '1',
                'invite_delivery_mode' => $details['invite_delivery_mode'] ?? null,
                'remove_branding' => (string) ($details['remove_branding'] ?? '') === '1',
            ],
            'hosts' => $event->hosts()->orderBy('sort_order')->get(['id', 'name', 'role'])
                ->map(fn ($h): array => ['id' => $h->id, 'name' => $h->name, 'role' => $h->role])
                ->all(),
            'schedules' => $event->events()->orderBy('sort_order')->limit(30)->get(['id', 'title', 'event_date', 'start_time', 'venue_name'])
                ->map(fn ($s): array => [
                    'id' => $s->id,
                    'title' => $s->title,
                    'event_date' => $s->event_date?->toDateString() ?? (string) $s->event_date,
                    'start_time' => $s->start_time,
                    'venue_name' => $s->venue_name,
                ])
                ->all(),
            'locales' => $event->translations()->pluck('locale')->values()->all(),
            'collaborators' => $event->collaborators()->latest('id')->limit(20)->get(['id', 'email', 'role', 'accepted_at'])
                ->map(fn ($c): array => [
                    'id' => $c->id,
                    'email' => $c->email,
                    'role' => $c->role,
                    'accepted' => filled($c->accepted_at),
                ])
                ->all(),
            'payments' => $payments,
            'recent_guests' => $recentGuests,
        ];
    }

    /**
     * @return list<array{date: string, views: int, unique_views: int, guest_views: int}>
     */
    private function dailyTraffic(int $eventId, int $days): array
    {
        $end = now()->endOfDay();
        $start = now()->subDays($days - 1)->startOfDay();
        $rows = AnalyticsEvent::query()
            ->where('event_id', $eventId)
            ->whereBetween('created_at', [$start, $end])
            ->whereIn('type', ['view', 'unique_view', 'guest_view'])
            ->selectRaw('date(created_at) as day, type, count(*) as total')
            ->groupByRaw('date(created_at), type')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[(string) $row->day][(string) $row->type] = (int) $row->total;
        }

        $out = [];
        $cursor = $start->copy()->startOfDay();
        $last = $end->copy()->startOfDay();
        while ($cursor->lte($last)) {
            $date = $cursor->toDateString();
            $out[] = [
                'date' => $date,
                'views' => (int) ($map[$date]['view'] ?? 0),
                'unique_views' => (int) ($map[$date]['unique_view'] ?? 0),
                'guest_views' => (int) ($map[$date]['guest_view'] ?? 0),
            ];
            $cursor = $cursor->addDay();
        }

        return $out;
    }

    /**
     * @return array{views: int, unique_views: int, guest_views: int, qr_scans: int, shares: int, card_downloads: int, card_shares: int, cards_generated: int}
     */
    private function emptyAnalytics(): array
    {
        return [
            'views' => 0,
            'unique_views' => 0,
            'guest_views' => 0,
            'qr_scans' => 0,
            'shares' => 0,
            'card_downloads' => 0,
            'card_shares' => 0,
            'cards_generated' => 0,
        ];
    }
}
