<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GiftClaim;
use App\Models\GuestbookEntry;
use App\Models\GuestPhoto;
use App\Services\Admin\AdminAuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ModerationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = trim((string) $request->query('status', 'pending'));

        return Inertia::render('admin/moderation/index', [
            'filters' => ['status' => $status],
            'guestbook' => GuestbookEntry::query()
                ->with(['wedding:id,title,slug'])
                ->when($status !== 'all', fn ($q) => $q->where('status', $status))
                ->latest('id')
                ->limit(50)
                ->get()
                ->map(fn (GuestbookEntry $e): array => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'message' => $e->message,
                    'status' => $e->status?->value ?? (string) $e->status,
                    'event_id' => $e->event_id,
                    'event_title' => $e->wedding?->displayTitle(),
                    'photo_url' => $e->photo_path ? Storage::disk('public')->url($e->photo_path) : null,
                    'created_at' => $e->created_at?->toIso8601String(),
                ]),
            'photos' => GuestPhoto::query()
                ->with(['wedding:id,title,slug'])
                ->when($status !== 'all', fn ($q) => $q->where('status', $status))
                ->latest('id')
                ->limit(50)
                ->get()
                ->map(fn (GuestPhoto $p): array => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'caption' => $p->caption,
                    'status' => $p->status?->value ?? (string) $p->status,
                    'event_id' => $p->event_id,
                    'event_title' => $p->wedding?->displayTitle(),
                    'photo_url' => $p->photo_path ? Storage::disk('public')->url($p->photo_path) : null,
                    'created_at' => $p->created_at?->toIso8601String(),
                ]),
            'gifts' => GiftClaim::query()
                ->with(['wedding:id,title'])
                ->latest('id')
                ->limit(40)
                ->get()
                ->map(fn (GiftClaim $g): array => [
                    'id' => $g->id,
                    'name' => $g->name,
                    'gift_label' => $g->gift_label,
                    'status' => $g->status,
                    'event_id' => $g->event_id,
                    'event_title' => $g->wedding?->displayTitle(),
                ]),
        ]);
    }

    public function guestbook(Request $request, GuestbookEntry $entry, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['approved', 'hidden', 'pending'])]]);
        $entry->forceFill(['status' => $data['status']])->save();
        $audit->log($request->user(), 'guestbook.moderate', $entry, $data, $request);

        return back();
    }

    public function photo(Request $request, GuestPhoto $photo, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['approved', 'hidden', 'pending'])]]);
        $photo->forceFill(['status' => $data['status']])->save();
        $audit->log($request->user(), 'guest_photo.moderate', $photo, $data, $request);

        return back();
    }

    public function gift(Request $request, GiftClaim $claim, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', 'string', 'max:40']]);
        $claim->forceFill(['status' => $data['status']])->save();
        $audit->log($request->user(), 'gift_claim.update', $claim, $data, $request);

        return back();
    }

    public function destroyGuestbook(Request $request, GuestbookEntry $entry, AdminAuditLogger $audit): RedirectResponse
    {
        $audit->log($request->user(), 'guestbook.delete', $entry, [], $request);
        $entry->delete();

        return back();
    }

    public function destroyPhoto(Request $request, GuestPhoto $photo, AdminAuditLogger $audit): RedirectResponse
    {
        $audit->log($request->user(), 'guest_photo.delete', $photo, [], $request);
        $photo->delete();

        return back();
    }
}
