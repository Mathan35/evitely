<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use App\Services\RsvpReminderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class RsvpReminderController extends Controller
{
    public function store(Wedding $wedding, RsvpReminderService $reminders): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $result = $reminders->sendForWedding($wedding->load(['setting', 'guests']), force: true);

        $parts = [];
        if ($result['sent'] > 0) {
            $parts[] = "Sent {$result['sent']} reminder".($result['sent'] === 1 ? '' : 's');
        }
        if ($result['skipped'] > 0) {
            $parts[] = "{$result['skipped']} skipped (no email)";
        }
        if ($result['cooldown'] > 0) {
            $parts[] = "{$result['cooldown']} already reminded recently";
        }
        if ($result['failed'] > 0) {
            $parts[] = "{$result['failed']} failed";
        }
        if ($parts === []) {
            $parts[] = 'No pending guests to remind';
        }

        Inertia::flash('toast', [
            'type' => $result['failed'] > 0 ? 'error' : 'success',
            'message' => implode(' · ', $parts).'.',
        ]);

        return back()->with('success', implode(' · ', $parts).'.');
    }
}
