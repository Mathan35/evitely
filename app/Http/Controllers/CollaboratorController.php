<?php

namespace App\Http\Controllers;

use App\Models\EventCollaborator;
use App\Models\User;
use App\Models\Wedding;
use App\Notifications\CollaboratorInvite;
use App\Services\Billing\BillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CollaboratorController extends Controller
{
    public function store(Request $request, Wedding $wedding, BillingService $billing): RedirectResponse
    {
        Gate::authorize('delete', $wedding); // owner-only invite

        $data = $request->validate([
            'email' => ['required', 'email', 'max:160'],
            'role' => ['required', 'in:editor,viewer'],
        ]);

        $email = Str::lower(trim($data['email']));
        if ($email === Str::lower($request->user()->email)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'You already own this invitation.']);

            return back();
        }

        $alreadyInvited = EventCollaborator::query()
            ->where('event_id', $wedding->id)
            ->where('email', $email)
            ->exists();
        if (! $alreadyInvited) {
            $billing->assertCanInviteCoHost($request->user(), $wedding);
        }

        $user = User::query()->whereRaw('lower(email) = ?', [$email])->first();
        $token = bin2hex(random_bytes(24));

        $collaborator = EventCollaborator::query()->updateOrCreate(
            ['event_id' => $wedding->id, 'email' => $email],
            [
                'user_id' => $user?->id,
                'role' => $data['role'],
                'invited_by' => $request->user()->id,
                'invite_token' => $token,
                'accepted_at' => null,
            ],
        );

        Notification::route('mail', $email)->notify(new CollaboratorInvite($collaborator->load('wedding')));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Co-host invite sent to '.$email.'.']);

        return back();
    }

    public function destroy(Wedding $wedding, EventCollaborator $collaborator): RedirectResponse
    {
        abort_unless($collaborator->event_id === $wedding->id, 404);
        Gate::authorize('delete', $wedding);
        $collaborator->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Co-host removed.']);

        return back();
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        $collaborator = EventCollaborator::query()->where('invite_token', $token)->firstOrFail();

        if (! $request->user()) {
            return redirect()->route('login', ['redirect' => route('collaborators.accept', $token)]);
        }

        if (Str::lower($request->user()->email) !== Str::lower($collaborator->email)) {
            abort(403, 'Sign in with the invited email to accept.');
        }

        $collaborator->forceFill([
            'user_id' => $request->user()->id,
            'accepted_at' => now(),
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'You can now help manage this invitation.']);

        return redirect()->route('weddings.show', $collaborator->event_id);
    }
}
