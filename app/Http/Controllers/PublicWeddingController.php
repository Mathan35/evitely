<?php

namespace App\Http\Controllers;

use App\Data\WeddingPageData;
use App\Http\Requests\Guestbook\StoreGuestbookRequest;
use App\Http\Requests\Rsvps\StoreRsvpRequest;
use App\Models\Wedding;
use App\Models\WeddingEvent;
use App\Models\WeddingGuest;
use App\Models\WeddingSlugRedirect;
use App\Services\GuestInvitationService;
use App\Services\ImageUploadService;
use App\Services\InvitationPasscode;
use App\Services\RsvpService;
use App\Services\WeddingAnalyticsService;
use App\Services\WeddingThemeService;
use App\Support\CalendarLinkFactory;
use App\Support\InviteHost;
use App\Support\WeddingGalleryPresentation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PublicWeddingController extends Controller
{
    public function show(string $slug, WeddingPageData $pages, WeddingAnalyticsService $analytics, InvitationPasscode $passcodes): Response|RedirectResponse
    {
        $wedding = $this->resolve($slug);

        if ($wedding instanceof RedirectResponse || $wedding instanceof Response) {
            return $wedding;
        }

        if ($gate = $this->passcodeGate($wedding, $passcodes, $this->invitePath($wedding, 'public'))) {
            return $gate;
        }

        $analytics->recordView(request(), $wedding);

        if ($wedding->invitation_mode === 'card') {
            return Inertia::render('public/card', [
                'wedding' => $pages->public($wedding, null, request()->query('lang')),
            ]);
        }

        $template = WeddingGalleryPresentation::linkTemplate($wedding);

        return Inertia::render('public/wedding', [
            'wedding' => $pages->public($wedding, null, request()->query('lang')),
            'preview' => false,
            'gallerySlug' => $template['slug'],
            'galleryDesign' => $template['design'],
            'selectedUserCard' => WeddingGalleryPresentation::selectedUserCard($wedding),
        ]);
    }

    public function card(string $slug, WeddingPageData $pages, InvitationPasscode $passcodes): Response|RedirectResponse
    {
        $wedding = $this->resolve($slug);

        if ($wedding instanceof RedirectResponse || $wedding instanceof Response) {
            return $wedding;
        }

        abort_unless($wedding->card()->exists(), 404);

        if ($gate = $this->passcodeGate($wedding, $passcodes, $this->invitePath($wedding, 'card'))) {
            return $gate;
        }

        return Inertia::render('public/card', [
            'wedding' => $pages->public($wedding, null, request()->query('lang')),
        ]);
    }

    public function guest(string $slug, string $token, WeddingPageData $pages, WeddingAnalyticsService $analytics, GuestInvitationService $invitations, InvitationPasscode $passcodes): Response|RedirectResponse
    {
        $wedding = $this->resolve($slug);

        if ($wedding instanceof RedirectResponse || $wedding instanceof Response) {
            return $wedding;
        }

        $guest = WeddingGuest::query()
            ->where('event_id', $wedding->id)
            ->where('guest_token', $token)
            ->whereNull('revoked_at')
            ->first();

        abort_if($guest === null, 404);

        if ($gate = $this->passcodeGate(
            $wedding,
            $passcodes,
            $this->invitePath($wedding, 'guest', ['token' => $token]),
        )) {
            return $gate;
        }

        $invitations->markViewed($guest);
        $analytics->recordView(request(), $wedding, $guest);

        $template = WeddingGalleryPresentation::linkTemplate($wedding);

        return Inertia::render('public/wedding', [
            'wedding' => $pages->public($wedding, $guest, request()->query('lang')),
            'preview' => false,
            'gallerySlug' => $template['slug'],
            'galleryDesign' => $template['design'],
            'selectedUserCard' => WeddingGalleryPresentation::selectedUserCard($wedding),
        ]);
    }

    public function unlock(Request $request, string $slug, InvitationPasscode $passcodes): RedirectResponse
    {
        $wedding = $this->resolve($slug);

        if ($wedding instanceof RedirectResponse) {
            return $wedding;
        }

        if ($wedding instanceof Response) {
            abort(404);
        }

        if (! $passcodes->enabled($wedding)) {
            return redirect($this->safeReturnTo($request, $wedding));
        }

        $data = $request->validate([
            'passcode' => ['required', 'string', 'min:4', 'max:32'],
            'return_to' => ['nullable', 'string', 'max:500'],
        ]);

        if (! $passcodes->check($wedding, $data['passcode'])) {
            throw ValidationException::withMessages([
                'passcode' => 'That passcode does not open this invitation.',
            ]);
        }

        $passcodes->unlock($wedding);

        return redirect($this->safeReturnTo($request, $wedding, $data['return_to'] ?? null));
    }

    public function rsvp(StoreRsvpRequest $request, string $slug, RsvpService $rsvps, InvitationPasscode $passcodes): RedirectResponse
    {
        $wedding = $this->published($slug);
        $this->assertPasscodeUnlocked($wedding, $passcodes);
        $rsvps->store($wedding, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your reply has been saved.']);

        return back();
    }

    public function guestRsvp(StoreRsvpRequest $request, string $slug, string $token, RsvpService $rsvps, InvitationPasscode $passcodes): RedirectResponse
    {
        $wedding = $this->published($slug);
        $this->assertPasscodeUnlocked($wedding, $passcodes);
        $guest = WeddingGuest::query()
            ->where('event_id', $wedding->id)
            ->where('guest_token', $token)
            ->whereNull('revoked_at')
            ->first();

        abort_if($guest === null, 404);
        $rsvps->store($wedding, $request->validated(), $guest);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your reply has been saved.']);

        return back();
    }

    public function guestbook(StoreGuestbookRequest $request, string $slug, ImageUploadService $images, InvitationPasscode $passcodes): RedirectResponse
    {
        $wedding = $this->published($slug);
        $this->assertPasscodeUnlocked($wedding, $passcodes);
        $path = $request->file('photo')
            ? $images->store($request->file('photo'), 'weddings/'.$wedding->id.'/guestbook')
            : null;

        $entry = $wedding->guestbookEntries()->create([
            'name' => $request->validated('name'),
            'message' => $request->validated('message'),
            'photo_path' => $path,
            'status' => 'pending',
        ]);

        $wedding->loadMissing('user');
        if ($wedding->user) {
            $wedding->user->notify(new \App\Notifications\WishReceived($entry));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Thank you. Your note will appear after the couple approves it.']);

        return back();
    }

    public function share(Request $request, string $slug, WeddingAnalyticsService $analytics, InvitationPasscode $passcodes): RedirectResponse
    {
        $wedding = $this->published($slug);
        $this->assertPasscodeUnlocked($wedding, $passcodes);
        $channel = $request->validate([
            'channel' => ['required', 'in:whatsapp,telegram,facebook,email,copy,instagram,sms'],
        ])['channel'];

        $analytics->record($wedding, 'share', null, null, $channel);

        return back();
    }

    public function calendar(string $slug): HttpResponse
    {
        $wedding = $this->published($slug);
        $event = $wedding->events()->where('is_public', true)->orderBy('sort_order')->first()
            ?? $wedding->events()->orderBy('sort_order')->first();

        abort_if($event === null, 404);

        return $this->ics($wedding, $event);
    }

    public function eventCalendar(string $slug, WeddingEvent $event): HttpResponse
    {
        $wedding = $this->published($slug);
        abort_unless($event->event_id === $wedding->id, 404);

        return $this->ics($wedding, $event);
    }

    private function ics(Wedding $wedding, WeddingEvent $event): HttpResponse
    {
        return response(CalendarLinkFactory::ics($wedding, $event), 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="'.$wedding->slug.'.ics"',
        ]);
    }

    private function resolve(string $slug): Wedding|RedirectResponse|Response
    {
        $wedding = Wedding::query()->where('slug', $slug)->first();

        if ($wedding instanceof Wedding) {
            if ($wedding->isGuestAccessible()) {
                return $wedding;
            }

            // Owners can open draft / paused invite URLs while logged in (preview from the studio).
            if (request()->user() && Gate::allows('view', $wedding)) {
                return $wedding;
            }

            // Guests hitting a stopped-live invite get a branded notice, not a broken 404.
            if ($wedding->isLivePaused()) {
                return $this->pausedResponse($wedding);
            }

            abort(404);
        }

        $redirect = WeddingSlugRedirect::query()->with('wedding')->where('slug', $slug)->first();

        if ($redirect?->wedding && $redirect->wedding->isGuestAccessible()) {
            $token = request()->route('token');

            if (is_string($token) && $token !== '') {
                return redirect()->to(
                    InviteHost::guestUrl($redirect->wedding->slug, $token),
                    301,
                );
            }

            return redirect()->to(InviteHost::publicUrl($redirect->wedding->slug), 301);
        }

        if ($redirect?->wedding?->isLivePaused()) {
            return $this->pausedResponse($redirect->wedding);
        }

        abort(404);
    }

    private function pausedResponse(Wedding $wedding): Response
    {
        $wedding->loadMissing(['hosts', 'setting']);

        $hosts = collect([
            $wedding->displayGroom(),
            $wedding->displayBride(),
        ])->filter()->values()->all();

        if ($hosts === []) {
            $hosts = $wedding->hosts->pluck('name')->filter()->values()->all();
        }

        $theme = app(WeddingThemeService::class)->resolve((string) ($wedding->theme ?: 'classic'));
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $siteBg = trim((string) ($details['site_bg'] ?? ''));

        $dateLabel = null;
        if ($wedding->starts_on) {
            $dateLabel = $wedding->starts_on->timezone($wedding->timezone ?: config('app.timezone'))
                ->format('l, F j, Y');
        }

        return Inertia::render('public/paused', [
            'slug' => $wedding->slug,
            'title' => $wedding->displayTitle(),
            'hosts' => $hosts,
            'dateLabel' => $dateLabel,
            'city' => $wedding->city,
            'venueName' => $wedding->venue_name,
            'theme' => [
                'paper' => $siteBg !== '' ? $siteBg : ($theme['backgroundColor'] ?? '#1a1612'),
                'ink' => $theme['textColor'] ?? '#f4efe6',
                'seal' => $theme['primaryColor'] ?? '#c4a574',
                'accent' => $theme['secondaryColor'] ?? '#8a7355',
            ],
        ]);
    }

    private function published(string $slug): Wedding
    {
        $wedding = Wedding::query()->where('slug', $slug)->first();
        abort_unless($wedding?->isGuestAccessible(), 404);

        return $wedding;
    }

    private function passcodeGate(Wedding $wedding, InvitationPasscode $passcodes, string $returnTo): ?Response
    {
        if (! $passcodes->enabled($wedding)) {
            return null;
        }

        // Live invite URLs always require the door code — including for the host —
        // so “View site” matches what guests see. Studio editor preview stays ungated.
        if ($passcodes->isUnlocked($wedding)) {
            return null;
        }

        $wedding->loadMissing(['hosts', 'setting']);
        $hosts = collect([
            $wedding->displayGroom(),
            $wedding->displayBride(),
        ])->filter()->values()->all();

        if ($hosts === []) {
            $hosts = $wedding->hosts->pluck('name')->filter()->values()->all();
        }

        $initials = collect($hosts)
            ->map(fn (string $name): string => mb_strtoupper(mb_substr(trim($name), 0, 1)))
            ->filter()
            ->take(2)
            ->implode(' & ');

        $theme = app(WeddingThemeService::class)->resolve((string) ($wedding->theme ?: 'classic'));
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $introStyle = trim((string) ($details['intro_style'] ?? 'gatefold'));
        $siteBg = trim((string) ($details['site_bg'] ?? ''));

        return Inertia::render('public/passcode', [
            'slug' => $wedding->slug,
            'returnTo' => $returnTo,
            'hosts' => $hosts,
            'initials' => $initials !== '' ? $initials : '·',
            'title' => $wedding->displayTitle(),
            'introStyle' => $introStyle !== '' ? $introStyle : 'gatefold',
            'theme' => [
                'paper' => $siteBg !== '' ? $siteBg : ($theme['backgroundColor'] ?? '#f6efe8'),
                'ink' => $theme['textColor'] ?? '#5c4538',
                'seal' => $theme['primaryColor'] ?? '#a67068',
                'accent' => $theme['secondaryColor'] ?? '#c4a484',
            ],
            'unlockUrl' => $this->inviteUrl($wedding, 'unlock'),
        ]);
    }

    private function safeReturnTo(Request $request, Wedding $wedding, ?string $returnTo = null): string
    {
        $candidate = $returnTo ?: (string) $request->input('return_to', '');
        $candidate = trim($candidate);
        $onSubdomain = InviteHost::labelFromHost($request->getHost()) === $wedding->slug;

        if ($candidate !== '') {
            if (str_starts_with($candidate, '/invite/'.$wedding->slug)) {
                return $candidate;
            }
            if ($onSubdomain && str_starts_with($candidate, '/') && ! str_starts_with($candidate, '//')) {
                return $candidate;
            }
        }

        return $this->invitePath($wedding, 'public');
    }

    /** Absolute invite URL for the current host style (path or subdomain). */
    private function inviteUrl(Wedding $wedding, string $action, array $params = []): string
    {
        $params = ['slug' => $wedding->slug] + $params;
        $onSubdomain = InviteHost::labelFromHost(request()->getHost()) === $wedding->slug;
        $name = $onSubdomain ? 'weddings.subdomain.'.$action : 'weddings.'.$action;

        if ($onSubdomain && Route::has($name)) {
            return route($name, $params);
        }

        return route('weddings.'.$action, $params);
    }

    /** Relative invite path for return_to (host-aware). */
    private function invitePath(Wedding $wedding, string $action, array $params = []): string
    {
        if (InviteHost::labelFromHost(request()->getHost()) === $wedding->slug) {
            return match ($action) {
                'public' => '/',
                'card' => '/card',
                'guest' => '/g/'.($params['token'] ?? ''),
                default => '/'.$action,
            };
        }

        return route('weddings.'.$action, ['slug' => $wedding->slug] + $params, false);
    }

    private function assertPasscodeUnlocked(Wedding $wedding, InvitationPasscode $passcodes): void
    {
        if (! $passcodes->enabled($wedding)) {
            return;
        }

        abort_unless($passcodes->isUnlocked($wedding), 403);
    }
}
