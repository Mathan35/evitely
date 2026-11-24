<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wedding;
use App\Services\Admin\AdminAuditLogger;
use App\Services\Admin\AdminEventInsightService;
use App\Services\Billing\SiteBillingService;
use App\Services\WeddingPublishingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request, AdminEventInsightService $insights): Response
    {
        $q = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('status', ''));
        $billing = trim((string) $request->query('billing', ''));
        $sort = trim((string) $request->query('sort', 'latest'));

        $paginator = Wedding::query()
            ->withTrashed()
            ->with(['user:id,name,email', 'eventType:id,name,slug', 'card:id,event_id,status,format'])
            ->withCount(['guests', 'rsvps', 'guestbookEntries', 'guestPhotos'])
            ->when($q !== '', function ($query) use ($q): void {
                $query->where(function ($inner) use ($q): void {
                    $inner->where('title', 'like', "%{$q}%")
                        ->orWhere('slug', 'like', "%{$q}%")
                        ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$q}%"));
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($billing !== '', fn ($query) => $query->where('site_billing_status', $billing))
            ->when($sort === 'starts', fn ($query) => $query->orderByDesc('starts_on'))
            ->when($sort !== 'starts', fn ($query) => $query->latest('id'))
            ->paginate(30)
            ->withQueryString();

        $analytics = $insights->analyticsForEvents($paginator->getCollection()->pluck('id')->all());

        $paginator->setCollection(
            $paginator->getCollection()->map(function (Wedding $w) use ($analytics): array {
                $stats = $analytics[$w->id] ?? [
                    'views' => 0,
                    'unique_views' => 0,
                    'guest_views' => 0,
                    'qr_scans' => 0,
                    'shares' => 0,
                    'card_downloads' => 0,
                    'card_shares' => 0,
                    'cards_generated' => 0,
                ];

                return [
                    'id' => $w->id,
                    'title' => $w->displayTitle(),
                    'slug' => $w->slug,
                    'status' => $w->status?->value ?? (string) $w->status,
                    'invitation_mode' => $w->invitation_mode,
                    'site_billing_status' => $w->site_billing_status,
                    'owner' => $w->user
                        ? trim(($w->user->name ?: 'User').' ('.$w->user->email.')')
                        : null,
                    'owner_name' => $w->user?->name,
                    'owner_email' => $w->user?->email,
                    'owner_id' => $w->user?->id,
                    'event_type' => $w->eventType?->name,
                    'guests_count' => (int) $w->guests_count,
                    'rsvps_count' => (int) $w->rsvps_count,
                    'guestbook_count' => (int) $w->guestbook_entries_count,
                    'guest_photos_count' => (int) $w->guest_photos_count,
                    'views' => $stats['views'] + $stats['guest_views'],
                    'unique_views' => $stats['unique_views'],
                    'qr_scans' => $stats['qr_scans'],
                    'shares' => $stats['shares'],
                    'card_status' => $w->card?->status,
                    'card_format' => $w->card?->format,
                    'has_card' => $w->card !== null,
                    'starts_on' => $w->starts_on?->toDateString(),
                    'published_at' => $w->published_at?->toIso8601String(),
                    'deleted' => $w->trashed(),
                ];
            }),
        );

        return Inertia::render('admin/events/index', [
            'events' => $paginator,
            'filters' => compact('q', 'status', 'billing', 'sort'),
        ]);
    }

    public function show(Wedding $event, AdminEventInsightService $insights): Response
    {
        return Inertia::render('admin/events/show', [
            'event' => $insights->detail($event),
            'pack_actions' => ['clear', 'trial', 'expired', 'site_15', 'site_30', 'site_50', 'site_100'],
        ]);
    }

    public function publish(Request $request, Wedding $event, WeddingPublishingService $publishing, AdminAuditLogger $audit): RedirectResponse
    {
        $publishing->publish($event);
        $audit->log($request->user(), 'event.publish', $event, [], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Event published.']);
    }

    public function unpublish(Request $request, Wedding $event, WeddingPublishingService $publishing, AdminAuditLogger $audit): RedirectResponse
    {
        $publishing->unpublish($event);
        $audit->log($request->user(), 'event.unpublish', $event, [], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Event unpublished.']);
    }

    public function billing(Request $request, Wedding $event, SiteBillingService $siteBilling, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['clear', 'trial', 'expired', 'site_15', 'site_30', 'site_50', 'site_100'])],
        ]);
        $action = $data['action'];
        $user = $event->user;
        abort_if($user === null, 422);

        match ($action) {
            'clear' => $event->forceFill([
                'site_billing_status' => 'draft_ready',
                'site_pack_sku' => null,
                'site_pack_days' => null,
                'site_pack_paid_at' => null,
                'site_pack_starts_at' => null,
                'site_pack_ends_at' => null,
                'site_trial_started_at' => null,
                'site_trial_ends_at' => null,
                'scheduled_publish_at' => null,
                'scheduled_publish_status' => 'none',
            ])->save(),
            'trial' => $event->forceFill([
                'site_billing_status' => 'trial',
                'site_trial_started_at' => now(),
                'site_trial_ends_at' => now()->addDays((int) config('billing.trial_days', 30)),
            ])->save(),
            'expired' => $event->forceFill(['site_billing_status' => 'expired'])->save(),
            default => $siteBilling->fulfillFixedPackPayment(
                $event,
                $user,
                $action,
                (int) (config("billing.site_packs.{$action}.included_credits") ?? 0),
                ['go_live_mode' => 'now'],
            ),
        };

        $audit->log($request->user(), 'event.billing_override', $event, ['action' => $action], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Site billing updated.']);
    }

    public function restore(Request $request, Wedding $event, AdminAuditLogger $audit): RedirectResponse
    {
        $event->restore();
        $audit->log($request->user(), 'event.restore', $event, [], $request);

        return redirect()->route('admin.events.show', $event)
            ->with('toast', ['type' => 'success', 'message' => 'Event restored.']);
    }
}
