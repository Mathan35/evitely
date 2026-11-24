<?php

namespace App\Http\Controllers;

use App\Enums\RsvpStatus;
use App\Enums\WeddingStatus;
use App\Models\AnalyticsEvent;
use App\Models\Wedding;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        Gate::authorize('viewAny', Wedding::class);

        $user = request()->user();
        abort_if($user === null, 403);

        $weddings = Wedding::query()->accessibleBy($user)->with('eventType')->withCount(['guests', 'rsvps', 'analytics as views_count' => function ($query): void {
            $query->where('type', 'view');
        }])->latest()->get();

        $upcoming = $weddings
            ->filter(fn (Wedding $wedding): bool => $wedding->starts_on !== null && $wedding->starts_on->isFuture())
            ->sortBy(fn (Wedding $wedding) => $wedding->starts_on)
            ->first();

        return Inertia::render('dashboard', [
            'stats' => [
                'weddings' => $weddings->count(),
                'published' => $weddings->where('status', WeddingStatus::Published)->count(),
                'drafts' => $weddings->where('status', WeddingStatus::Draft)->count(),
                'guests' => (int) $weddings->sum('guests_count'),
                'responses' => (int) $weddings->sum('rsvps_count'),
                'views' => (int) $weddings->sum('views_count'),
                'card_downloads' => AnalyticsEvent::query()->whereIn('event_id', $weddings->pluck('id'))->where('type', 'card_download')->count(),
                'attending' => Wedding::query()->accessibleBy($user)->with('rsvps')->get()->flatMap->rsvps->where('status', RsvpStatus::Attending)->count(),
            ],
            'cta' => 'Create Invitation',
            'upcoming' => $upcoming ? [
                'id' => $upcoming->id,
                'names' => $upcoming->displayTitle(),
                'date' => $upcoming->starts_on?->format('j F Y'),
                'city' => $upcoming->city,
            ] : null,
            'recent' => $weddings->take(6)->map(fn (Wedding $wedding): array => [
                'id' => $wedding->id,
                'names' => $wedding->displayTitle(),
                'type' => $wedding->eventType?->name,
                'date' => $wedding->starts_on?->format('j M Y'),
                'city' => $wedding->city,
                'status' => $wedding->status->value,
                'guests' => $wedding->guests_count,
                'responses' => $wedding->rsvps_count,
            ])->values(),
        ]);
    }
}
