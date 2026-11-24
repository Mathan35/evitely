<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventCollaborator;
use App\Models\WeddingGuest;
use App\Services\Admin\AdminAuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GuestController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));

        $guests = WeddingGuest::query()
            ->with(['wedding:id,title,slug'])
            ->when($q !== '', function ($query) use ($q): void {
                $query->where(function ($inner) use ($q): void {
                    $inner->where('email', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%")
                        ->orWhere('first_name', 'like', "%{$q}%")
                        ->orWhere('last_name', 'like', "%{$q}%")
                        ->orWhere('guest_token', 'like', "%{$q}%");
                });
            })
            ->latest('id')
            ->paginate(40)
            ->withQueryString()
            ->through(fn (WeddingGuest $g): array => [
                'id' => $g->id,
                'name' => trim($g->first_name.' '.$g->last_name),
                'email' => $g->email,
                'phone' => $g->phone,
                'rsvp_status' => $g->rsvp_status?->value ?? (string) $g->rsvp_status,
                'event_id' => $g->event_id,
                'event_title' => $g->wedding?->displayTitle(),
                'has_delivery_error' => $g->hasChannelFailure(),
                'token' => $g->guest_token,
                'revoked' => filled($g->revoked_at),
            ]);

        return Inertia::render('admin/guests/index', [
            'guests' => $guests,
            'filters' => ['q' => $q],
            'collaborators' => EventCollaborator::query()
                ->with(['wedding:id,title'])
                ->latest('id')
                ->limit(30)
                ->get()
                ->map(fn (EventCollaborator $c): array => [
                    'id' => $c->id,
                    'email' => $c->email,
                    'role' => $c->role,
                    'accepted' => filled($c->accepted_at),
                    'event_id' => $c->event_id,
                    'event_title' => $c->wedding?->displayTitle(),
                ]),
        ]);
    }

    public function updateRsvp(Request $request, WeddingGuest $guest, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'rsvp_status' => ['required', Rule::in(['attending', 'not_attending', 'maybe', 'pending'])],
            'number_of_guests' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $guest->forceFill([
            'rsvp_status' => $data['rsvp_status'],
            'number_of_guests' => $data['number_of_guests'] ?? $guest->number_of_guests,
        ])->save();

        $audit->log($request->user(), 'guest.update_rsvp', $guest, $data, $request);

        return back();
    }

    public function revoke(Request $request, WeddingGuest $guest, AdminAuditLogger $audit): RedirectResponse
    {
        $guest->forceFill([
            'revoked_at' => now(),
            'guest_token' => Str::random(40),
        ])->save();
        $audit->log($request->user(), 'guest.revoke_token', $guest, [], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Guest token revoked.']);
    }

    public function updateCollaborator(Request $request, EventCollaborator $collaborator, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(['editor', 'viewer'])],
            'revoke' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('revoke')) {
            $audit->log($request->user(), 'collaborator.revoke', $collaborator, [], $request);
            $collaborator->delete();

            return back();
        }

        $collaborator->forceFill(['role' => $data['role']])->save();
        $audit->log($request->user(), 'collaborator.update', $collaborator, $data, $request);

        return back();
    }
}
