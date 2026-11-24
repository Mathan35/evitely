<?php

namespace App\Services\Admin;

use App\Enums\WeddingStatus;
use App\Models\AnalyticsEvent;
use App\Models\BillingPayment;
use App\Models\GuestbookEntry;
use App\Models\GuestPhoto;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Models\WeddingRsvp;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PlatformAnalyticsService
{
    /**
     * @return array{from: string, to: string, days: int}
     */
    public function resolveRange(?string $from, ?string $to, string $preset = '30d'): array
    {
        $end = filled($to) ? Carbon::parse($to)->endOfDay() : now()->endOfDay();
        if (filled($from)) {
            $start = Carbon::parse($from)->startOfDay();
        } else {
            $days = match ($preset) {
                '7d' => 7,
                '90d' => 90,
                default => 30,
            };
            $start = $end->copy()->subDays($days - 1)->startOfDay();
        }

        return [
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
            'days' => max(1, (int) $start->diffInDays($end) + 1),
        ];
    }

    /**
     * @param  array{preset?: string, from?: ?string, to?: ?string, invitation_mode?: string, billing?: string, plan?: string}  $filters
     * @return array<string, mixed>
     */
    public function dashboard(array $filters = []): array
    {
        $preset = (string) ($filters['preset'] ?? '7d');
        $from = isset($filters['from']) && is_string($filters['from']) && $filters['from'] !== '' ? $filters['from'] : null;
        $to = isset($filters['to']) && is_string($filters['to']) && $filters['to'] !== '' ? $filters['to'] : null;
        $mode = trim((string) ($filters['invitation_mode'] ?? ''));
        $billing = trim((string) ($filters['billing'] ?? ''));
        $plan = trim((string) ($filters['plan'] ?? ''));

        $range = $this->resolveRange($from, $to, $preset);
        $f = $range['from'];
        $t = $range['to'];
        $scope = [
            'invitation_mode' => in_array($mode, ['site', 'card', 'both', 'link'], true) ? $mode : '',
            'billing' => $billing,
            'plan' => in_array($plan, ['free', 'pro'], true) ? $plan : '',
        ];

        return [
            'range' => $range,
            'filters' => [
                'preset' => $preset,
                'from' => $from,
                'to' => $to,
                'invitation_mode' => $scope['invitation_mode'],
                'billing' => $scope['billing'],
                'plan' => $scope['plan'],
            ],
            'kpis' => $this->kpis($f, $t, $scope),
            'totals' => $this->platformTotals($scope),
            'series' => [
                'growth' => $this->dailyGrowth($f, $t, $scope),
                'traffic' => $this->dailyTraffic($f, $t, $scope),
                'revenue' => $this->dailyRevenue($f, $t),
                'shares' => $this->dailyShares($f, $t, $scope),
            ],
            'funnel' => $this->engagementFunnel($scope),
            'sku_mix' => $this->skuMix($f, $t),
            'billing_health' => $this->billingHealth(),
            'delivery_health' => $this->deliveryHealth($scope),
            'top_events' => $this->topEvents($f, $t, $scope),
            'revenue_by_provider' => $this->revenueByProvider($f, $t),
            'plan_mix' => $this->planMix(),
            'mode_mix' => $this->modeMix($scope),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function full(?string $from, ?string $to, string $preset = '30d'): array
    {
        return $this->dashboard([
            'preset' => $preset,
            'from' => $from,
            'to' => $to,
        ]);
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return array<string, int|float>
     */
    public function kpis(string $from, string $to, array $scope = []): array
    {
        $start = Carbon::parse($from)->startOfDay();
        $end = Carbon::parse($to)->endOfDay();

        $analytics = $this->analyticsQuery($scope)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $paidRevenue = (int) BillingPayment::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$start, $end])
            ->sum('amount_paise');

        $users = User::query()->whereBetween('created_at', [$start, $end]);
        if (($scope['plan'] ?? '') !== '') {
            $users->where('plan', $scope['plan']);
        }

        $events = $this->weddingQuery($scope)->whereBetween('created_at', [$start, $end]);
        $published = $this->weddingQuery($scope)
            ->where('status', WeddingStatus::Published)
            ->whereBetween('published_at', [$start, $end]);

        $rsvps = WeddingRsvp::query()->whereBetween('created_at', [$start, $end]);
        if ($this->hasEventScope($scope)) {
            $rsvps->whereIn('event_id', $this->scopedEventIds($scope));
        }

        return [
            'new_users' => $users->count(),
            'events_created' => $events->count(),
            'events_published' => $published->count(),
            'views' => (int) ($analytics['view'] ?? 0) + (int) ($analytics['guest_view'] ?? 0),
            'unique_views' => (int) ($analytics['unique_view'] ?? 0),
            'guest_views' => (int) ($analytics['guest_view'] ?? 0),
            'rsvps' => $rsvps->count(),
            'qr_scans' => (int) ($analytics['qr_scan'] ?? 0),
            'shares' => (int) ($analytics['share'] ?? 0) + (int) ($analytics['card_share'] ?? 0),
            'card_downloads' => (int) ($analytics['card_download'] ?? 0),
            'revenue_paise' => $paidRevenue,
            'failed_payments' => BillingPayment::query()
                ->whereIn('status', ['failed', 'cancelled'])
                ->whereBetween('created_at', [$start, $end])
                ->count(),
            'pending_guestbook' => GuestbookEntry::query()->where('status', 'pending')->count(),
            'pending_guest_photos' => GuestPhoto::query()->where('status', 'pending')->count(),
        ];
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return array<string, int>
     */
    public function platformTotals(array $scope = []): array
    {
        $events = $this->weddingQuery($scope);

        return [
            'users' => User::query()->when(($scope['plan'] ?? '') !== '', fn ($q) => $q->where('plan', $scope['plan']))->count(),
            'events' => (clone $events)->count(),
            'published_events' => (clone $events)->where('status', WeddingStatus::Published)->count(),
            'pro_users' => User::query()->where('plan', 'pro')->count(),
            'free_users' => User::query()->where('plan', 'free')->count(),
            'cards' => DB::table('event_cards')
                ->when($this->hasEventScope($scope), fn ($q) => $q->whereIn('event_id', $this->scopedEventIds($scope)))
                ->count(),
        ];
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return list<array{date: string, signups: int, events_created: int, events_published: int}>
     */
    public function dailyGrowth(string $from, string $to, array $scope = []): array
    {
        $dates = $this->dateKeys($from, $to);
        $users = User::query();
        if (($scope['plan'] ?? '') !== '') {
            $users->where('plan', $scope['plan']);
        }
        $signups = $this->dailyCount($users, 'created_at', $from, $to);
        $created = $this->dailyCount($this->weddingQuery($scope), 'created_at', $from, $to);
        $published = $this->dailyCount(
            $this->weddingQuery($scope)->where('status', WeddingStatus::Published)->whereNotNull('published_at'),
            'published_at',
            $from,
            $to,
        );

        return array_map(fn (string $date): array => [
            'date' => $date,
            'signups' => (int) ($signups[$date] ?? 0),
            'events_created' => (int) ($created[$date] ?? 0),
            'events_published' => (int) ($published[$date] ?? 0),
        ], $dates);
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return list<array{date: string, views: int, unique_views: int, guest_views: int}>
     */
    public function dailyTraffic(string $from, string $to, array $scope = []): array
    {
        $dates = $this->dateKeys($from, $to);
        $rows = $this->analyticsQuery($scope)
            ->whereBetween('created_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->whereIn('type', ['view', 'unique_view', 'guest_view'])
            ->selectRaw('date(created_at) as day, type, count(*) as total')
            ->groupByRaw('date(created_at), type')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[(string) $row->day][(string) $row->type] = (int) $row->total;
        }

        return array_map(fn (string $date): array => [
            'date' => $date,
            'views' => (int) ($map[$date]['view'] ?? 0),
            'unique_views' => (int) ($map[$date]['unique_view'] ?? 0),
            'guest_views' => (int) ($map[$date]['guest_view'] ?? 0),
        ], $dates);
    }

    /**
     * @return list<array{date: string, revenue_paise: int, razorpay: int, stripe: int}>
     */
    public function dailyRevenue(string $from, string $to): array
    {
        $dates = $this->dateKeys($from, $to);
        $rows = BillingPayment::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->selectRaw('date(paid_at) as day, provider, sum(amount_paise) as total')
            ->groupByRaw('date(paid_at), provider')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $day = (string) $row->day;
            $provider = strtolower((string) $row->provider);
            $map[$day][$provider] = (int) $row->total;
            $map[$day]['all'] = ($map[$day]['all'] ?? 0) + (int) $row->total;
        }

        return array_map(fn (string $date): array => [
            'date' => $date,
            'revenue_paise' => (int) ($map[$date]['all'] ?? 0),
            'razorpay' => (int) ($map[$date]['razorpay'] ?? 0),
            'stripe' => (int) ($map[$date]['stripe'] ?? 0),
        ], $dates);
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return list<array{date: string, shares: int, qr_scans: int}>
     */
    public function dailyShares(string $from, string $to, array $scope = []): array
    {
        $dates = $this->dateKeys($from, $to);
        $rows = $this->analyticsQuery($scope)
            ->whereBetween('created_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->whereIn('type', ['share', 'qr_scan'])
            ->selectRaw('date(created_at) as day, type, count(*) as total')
            ->groupByRaw('date(created_at), type')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[(string) $row->day][(string) $row->type] = (int) $row->total;
        }

        return array_map(fn (string $date): array => [
            'date' => $date,
            'shares' => (int) ($map[$date]['share'] ?? 0),
            'qr_scans' => (int) ($map[$date]['qr_scan'] ?? 0),
        ], $dates);
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return array{invited: int, viewed: int, responded: int, attending: int}
     */
    public function engagementFunnel(array $scope = []): array
    {
        $guests = WeddingGuest::query();
        $rsvps = WeddingRsvp::query();
        if ($this->hasEventScope($scope)) {
            $ids = $this->scopedEventIds($scope);
            $guests->whereIn('event_id', $ids);
            $rsvps->whereIn('event_id', $ids);
        }

        return [
            'invited' => (clone $guests)->count(),
            'viewed' => (clone $guests)
                ->where(function ($q): void {
                    $q->where('invitation_status', 'viewed')
                        ->orWhereNotNull('invitation_sent_at');
                })
                ->count(),
            'responded' => $rsvps->count(),
            'attending' => (clone $guests)->where('rsvp_status', 'attending')->count(),
        ];
    }

    /**
     * @return list<array{sku: string, count: int, revenue_paise: int}>
     */
    public function skuMix(string $from, string $to): array
    {
        return BillingPayment::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->selectRaw('sku, count(*) as count, sum(amount_paise) as revenue_paise')
            ->groupBy('sku')
            ->orderByDesc('revenue_paise')
            ->get()
            ->map(fn ($row): array => [
                'sku' => (string) $row->sku,
                'count' => (int) $row->count,
                'revenue_paise' => (int) $row->revenue_paise,
            ])
            ->all();
    }

    /**
     * @return list<array{status: string, count: int}>
     */
    public function billingHealth(): array
    {
        return DB::table((new Wedding)->getTable())
            ->selectRaw("coalesce(site_billing_status, 'none') as billing_status, count(*) as aggregate_count")
            ->groupByRaw("coalesce(site_billing_status, 'none')")
            ->orderByDesc('aggregate_count')
            ->get()
            ->map(fn ($row): array => [
                'status' => (string) $row->billing_status,
                'count' => (int) $row->aggregate_count,
            ])
            ->all();
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return array{sends: int, failures: int}
     */
    public function deliveryHealth(array $scope = []): array
    {
        $query = WeddingGuest::query();
        if ($this->hasEventScope($scope)) {
            $query->whereIn('event_id', $this->scopedEventIds($scope));
        }

        $row = $query
            ->selectRaw('
                coalesce(sum(email_send_count),0) + coalesce(sum(whatsapp_send_count),0) + coalesce(sum(sms_send_count),0) as sends,
                coalesce(sum(case when email_last_error is not null then 1 else 0 end),0)
                  + coalesce(sum(case when whatsapp_last_error is not null then 1 else 0 end),0)
                  + coalesce(sum(case when sms_last_error is not null then 1 else 0 end),0) as failures
            ')
            ->first();

        return [
            'sends' => (int) ($row?->sends ?? 0),
            'failures' => (int) ($row?->failures ?? 0),
        ];
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return list<array{id: int, title: string, views: int, rsvps: int, revenue_paise: int}>
     */
    public function topEvents(string $from, string $to, array $scope = []): array
    {
        $start = Carbon::parse($from)->startOfDay();
        $end = Carbon::parse($to)->endOfDay();

        $views = $this->analyticsQuery($scope)
            ->whereBetween('created_at', [$start, $end])
            ->whereIn('type', ['view', 'guest_view', 'unique_view'])
            ->selectRaw('event_id, count(*) as total')
            ->groupBy('event_id')
            ->pluck('total', 'event_id');

        $rsvpsQuery = WeddingRsvp::query()->whereBetween('created_at', [$start, $end]);
        if ($this->hasEventScope($scope)) {
            $rsvpsQuery->whereIn('event_id', $this->scopedEventIds($scope));
        }
        $rsvps = $rsvpsQuery
            ->selectRaw('event_id, count(*) as total')
            ->groupBy('event_id')
            ->pluck('total', 'event_id');

        $revenue = BillingPayment::query()
            ->where('status', 'paid')
            ->whereNotNull('event_id')
            ->whereBetween('paid_at', [$start, $end])
            ->selectRaw('event_id, sum(amount_paise) as total')
            ->groupBy('event_id')
            ->pluck('total', 'event_id');

        $ids = collect([$views->keys(), $rsvps->keys(), $revenue->keys()])->flatten()->unique()->take(40);
        $weddings = $this->weddingQuery($scope)->whereIn('id', $ids)->get()->keyBy('id');

        return $ids
            ->map(function ($id) use ($weddings, $views, $rsvps, $revenue): ?array {
                $wedding = $weddings->get($id);
                if ($wedding === null) {
                    return null;
                }

                return [
                    'id' => (int) $id,
                    'title' => $wedding->displayTitle(),
                    'views' => (int) ($views[$id] ?? 0),
                    'rsvps' => (int) ($rsvps[$id] ?? 0),
                    'revenue_paise' => (int) ($revenue[$id] ?? 0),
                ];
            })
            ->filter()
            ->sortByDesc(fn (array $row) => $row['views'] + ($row['rsvps'] * 5) + ($row['revenue_paise'] / 100))
            ->take(15)
            ->values()
            ->all();
    }

    /**
     * @return list<array{provider: string, revenue_paise: int, count: int}>
     */
    public function revenueByProvider(string $from, string $to): array
    {
        return BillingPayment::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->selectRaw('provider, count(*) as count, sum(amount_paise) as revenue_paise')
            ->groupBy('provider')
            ->get()
            ->map(fn ($row): array => [
                'provider' => (string) $row->provider,
                'count' => (int) $row->count,
                'revenue_paise' => (int) $row->revenue_paise,
            ])
            ->all();
    }

    /**
     * @return list<string>
     */
    private function dateKeys(string $from, string $to): array
    {
        $dates = [];
        $cursor = Carbon::parse($from)->startOfDay();
        $end = Carbon::parse($to)->startOfDay();
        while ($cursor->lte($end)) {
            $dates[] = $cursor->toDateString();
            $cursor = $cursor->addDay();
        }

        return $dates;
    }

    /**
     * @return list<array{label: string, count: int}>
     */
    public function planMix(): array
    {
        return User::query()
            ->selectRaw("coalesce(plan, 'free') as label, count(*) as count")
            ->groupByRaw("coalesce(plan, 'free')")
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row): array => [
                'label' => (string) $row->label,
                'count' => (int) $row->count,
            ])
            ->all();
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return list<array{label: string, count: int}>
     */
    public function modeMix(array $scope = []): array
    {
        $query = DB::table((new Wedding)->getTable());
        if (($scope['invitation_mode'] ?? '') !== '') {
            $query->where('invitation_mode', $scope['invitation_mode']);
        }
        if (($scope['billing'] ?? '') !== '') {
            $query->where('site_billing_status', $scope['billing']);
        }
        if (($scope['plan'] ?? '') !== '') {
            $query->whereIn('user_id', User::query()->where('plan', $scope['plan'])->select('id'));
        }

        return $query
            ->selectRaw("coalesce(invitation_mode, 'unknown') as label, count(*) as count")
            ->groupByRaw("coalesce(invitation_mode, 'unknown')")
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row): array => [
                'label' => (string) $row->label,
                'count' => (int) $row->count,
            ])
            ->all();
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Wedding>
     */
    private function weddingQuery(array $scope = [])
    {
        $query = Wedding::query();
        if (($scope['invitation_mode'] ?? '') !== '') {
            $query->where('invitation_mode', $scope['invitation_mode']);
        }
        if (($scope['billing'] ?? '') !== '') {
            $query->where('site_billing_status', $scope['billing']);
        }
        if (($scope['plan'] ?? '') !== '') {
            $query->whereHas('user', fn ($u) => $u->where('plan', $scope['plan']));
        }

        return $query;
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     */
    private function hasEventScope(array $scope): bool
    {
        return ($scope['invitation_mode'] ?? '') !== ''
            || ($scope['billing'] ?? '') !== ''
            || ($scope['plan'] ?? '') !== '';
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return list<int>
     */
    private function scopedEventIds(array $scope): array
    {
        return $this->weddingQuery($scope)->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    /**
     * @param  array{invitation_mode?: string, billing?: string, plan?: string}  $scope
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\AnalyticsEvent>
     */
    private function analyticsQuery(array $scope = [])
    {
        $query = AnalyticsEvent::query();
        if ($this->hasEventScope($scope)) {
            $query->whereIn('event_id', $this->scopedEventIds($scope));
        }

        return $query;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return array<string, int>
     */
    private function dailyCount($query, string $column, string $from, string $to): array
    {
        return $query
            ->whereBetween($column, [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->selectRaw("date({$column}) as day, count(*) as total")
            ->groupByRaw("date({$column})")
            ->pluck('total', 'day')
            ->map(fn ($v) => (int) $v)
            ->all();
    }
}

