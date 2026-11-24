<?php

namespace App\Http\Controllers;

use App\Models\GiftClaim;
use App\Models\Wedding;
use App\Services\InvitationPasscode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GiftClaimController extends Controller
{
    public function store(Request $request, string $slug, InvitationPasscode $passcodes): RedirectResponse
    {
        $wedding = Wedding::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        if ($passcodes->enabled($wedding) && ! $passcodes->isUnlocked($wedding)) {
            abort(403);
        }

        $data = $request->validate([
            'gift_item_id' => ['required', 'string', 'max:64'],
            'gift_label' => ['nullable', 'string', 'max:160'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:160'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $wedding->loadMissing('setting');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        if (($details['gifts_claims_enabled'] ?? '0') !== '1') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gift claims are not enabled for this invitation.']);

            return back();
        }

        GiftClaim::query()->create([
            'event_id' => $wedding->id,
            'gift_item_id' => $data['gift_item_id'],
            'gift_label' => $data['gift_label'] ?? null,
            'name' => Str::limit($data['name'], 120, ''),
            'email' => $data['email'] ?? null,
            'note' => $data['note'] ?? null,
            'status' => 'claimed',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Thank you — the hosts will see your gift note.']);

        return back();
    }

    public function release(Wedding $wedding, GiftClaim $claim): RedirectResponse
    {
        abort_unless($claim->event_id === $wedding->id, 404);
        Gate::authorize('update', $wedding);

        $claim->forceFill(['status' => 'released'])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Claim released.']);

        return back();
    }
}
