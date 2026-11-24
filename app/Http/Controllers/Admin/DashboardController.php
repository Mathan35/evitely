<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BillingPayment;
use App\Models\User;
use App\Models\Wedding;
use App\Services\Admin\AdminEventInsightService;
use App\Services\Admin\PlatformAnalyticsService;
use App\Services\PlatformReadinessService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(
        Request $request,
        PlatformReadinessService $platform,
        PlatformAnalyticsService $analytics,
        AdminEventInsightService $insights,
    ): Response {
        $filters = [
            'preset' => (string) $request->query('preset', '7d'),
            'from' => $request->query('from'),
            'to' => $request->query('to'),
            'invitation_mode' => (string) $request->query('invitation_mode', ''),
            'billing' => (string) $request->query('billing', ''),
            'plan' => (string) $request->query('plan', ''),
        ];

        $dash = $analytics->dashboard([
            'preset' => $filters['preset'],
            'from' => is_string($filters['from']) ? $filters['from'] : null,
            'to' => is_string($filters['to']) ? $filters['to'] : null,
            'invitation_mode' => $filters['invitation_mode'],
            'billing' => $filters['billing'],
            'plan' => $filters['plan'],
        ]);

        $range = $dash['range'];
        $start = Carbon::parse($range['from'])->startOfDay();
        $end = Carbon::parse($range['to'])->endOfDay();

        $eventsQuery = Wedding::query()
            ->with(['user:id,name,email', 'card:id,event_id,status'])
            ->withCount(['guests', 'rsvps'])
            ->when($filters['invitation_mode'] !== '' && in_array($filters['invitation_mode'], ['site', 'card', 'both', 'link'], true),
                fn ($q) => $q->where('invitation_mode', $filters['invitation_mode']))
            ->when($filters['billing'] !== '', fn ($q) => $q->where('site_billing_status', $filters['billing']))
            ->when($filters['plan'] !== '' && in_array($filters['plan'], ['free', 'pro'], true),
                fn ($q) => $q->whereHas('user', fn ($u) => $u->where('plan', $filters['plan'])))
            ->whereBetween('created_at', [$start, $end])
            ->latest('id')
            ->limit(12)
            ->get();

        $eventAnalytics = $insights->analyticsForEvents($eventsQuery->pluck('id')->all());

        return Inertia::render('admin/dashboard', [
            'platform' => $platform->summary(),
            'analytics' => $dash,
            'filters' => $dash['filters'],
            'webhook_urls' => [
                'razorpay' => url('/razorpay/webhook'),
                'stripe' => url('/stripe/webhook'),
            ],
            'commands' => [
                'queue' => 'php artisan queue:work',
                'schedule' => '* * * * * php artisan schedule:run',
                'status' => 'php artisan platform:status',
            ],
            'recent' => [
                'users' => User::query()
                    ->when($filters['plan'] !== '' && in_array($filters['plan'], ['free', 'pro'], true),
                        fn ($q) => $q->where('plan', $filters['plan']))
                    ->whereBetween('created_at', [$start, $end])
                    ->latest('id')
                    ->limit(10)
                    ->get(['id', 'name', 'email', 'plan', 'message_credits', 'created_at'])
                    ->map(fn (User $u): array => [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'plan' => $u->plan,
                        'message_credits' => (int) $u->message_credits,
                        'created_at' => $u->created_at?->toIso8601String(),
                    ]),
                'events' => $eventsQuery->map(function (Wedding $w) use ($eventAnalytics): array {
                    $stats = $eventAnalytics[$w->id] ?? ['views' => 0, 'unique_views' => 0, 'guest_views' => 0];

                    return [
                        'id' => $w->id,
                        'title' => $w->displayTitle(),
                        'status' => $w->status?->value ?? (string) $w->status,
                        'site_billing_status' => $w->site_billing_status,
                        'invitation_mode' => $w->invitation_mode,
                        'owner' => $w->user
                            ? trim(($w->user->name ?: 'User').' ('.$w->user->email.')')
                            : null,
                        'guests_count' => (int) $w->guests_count,
                        'rsvps_count' => (int) $w->rsvps_count,
                        'views' => ($stats['views'] ?? 0) + ($stats['guest_views'] ?? 0),
                        'unique_views' => $stats['unique_views'] ?? 0,
                        'card_status' => $w->card?->status,
                        'created_at' => $w->created_at?->toIso8601String(),
                    ];
                })->values()->all(),
                'payments' => BillingPayment::query()
                    ->with(['user:id,email'])
                    ->whereBetween('created_at', [$start, $end])
                    ->latest('id')
                    ->limit(10)
                    ->get()
                    ->map(fn (BillingPayment $p): array => [
                        'id' => $p->id,
                        'sku' => $p->sku,
                        'status' => $p->status,
                        'provider' => $p->provider,
                        'amount_label' => $this->money($p->amount_paise, $p->currency),
                        'amount_paise' => $p->amount_paise,
                        'owner' => $p->user?->email,
                        'paid_at' => $p->paid_at?->toIso8601String(),
                    ]),
            ],
        ]);
    }

    private function money(int $paise, ?string $currency): string
    {
        $cur = strtoupper((string) ($currency ?: 'INR'));
        $symbol = $cur === 'USD' ? '$' : '₹';

        return $symbol.number_format($paise / 100, $cur === 'USD' ? 2 : 0);
    }
}
