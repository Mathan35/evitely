<?php

namespace App\Http\Controllers;

use App\Data\WeddingPageData;
use App\Http\Requests\Weddings\StoreWeddingRequest;
use App\Http\Requests\Weddings\UpdateWeddingRequest;
use App\Models\Wedding;
use App\Services\Billing\BillingService;
use App\Services\WeddingPublishingService;
use App\Services\WeddingService;
use App\Support\DesignGallery;
use App\Support\EventCatalog;
use App\Support\WeddingGalleryPresentation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WeddingController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', Wedding::class);

        $weddings = Wedding::query()
            ->accessibleBy(request()->user())
            ->with(['eventType', 'setting'])
            ->withCount(['guests', 'rsvps'])
            ->latest()
            ->get()
            ->filter(fn (Wedding $wedding): bool => $wedding->isListedInMyEvents())
            ->values()
            ->map(fn (Wedding $wedding): array => [
                'id' => $wedding->id,
                'slug' => $wedding->slug,
                'title' => $wedding->displayTitle(),
                'bride_name' => $wedding->displayBride(),
                'groom_name' => $wedding->displayGroom(),
                'wedding_date' => $wedding->starts_on?->format('Y-m-d'),
                'city' => $wedding->city,
                'status' => $wedding->status->value,
                'live_paused' => $wedding->isLivePaused(),
                'theme' => $wedding->theme,
                'event_type' => $wedding->eventType?->name,
                'invitation_mode' => $wedding->invitation_mode,
                'guests_count' => $wedding->guests_count,
                'rsvps_count' => $wedding->rsvps_count,
            ]);

        $gallery = collect(DesignGallery::occasions());

        $eventTypes = collect(EventCatalog::definitions())
            ->map(function (array $type) use ($gallery): array {
                $occasion = $gallery->first(function (array $row) use ($type): bool {
                    return $row['slug'] === $type['slug']
                        || $row['event_type'] === $type['slug']
                        || in_array($type['slug'], $row['aliases'] ?? [], true);
                });

                return [
                    ...$type,
                    'available' => $occasion !== null,
                    'designs_href' => $occasion ? '/designs/'.$occasion['slug'] : null,
                    'designs_label' => $occasion['name'] ?? null,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('weddings/index', [
            'weddings' => $weddings,
            'eventTypes' => $eventTypes,
        ]);
    }

    public function create(Request $request, WeddingService $weddings): Response|RedirectResponse
    {
        Gate::authorize('create', Wedding::class);

        // Gallery "Customize" lands here with template query params — jump straight into the editor.
        if ($request->filled('gallery_template') || $request->filled('card_template')) {
            return $this->startFromGallery($request, $weddings);
        }

        // No gallery handoff params — reopen the studio type picker.
        return redirect()->to('/events?create=1');
    }

    private function startFromGallery(Request $request, WeddingService $weddings): RedirectResponse
    {
        $user = $request->user();
        abort_if($user === null, 403);

        $billing = app(BillingService::class);
        $eventType = $request->string('event_type')->toString() ?: 'wedding';
        $galleryTemplate = $request->string('gallery_template')->toString();
        $cardTemplate = $request->string('card_template')->toString();
        $mode = $request->string('invitation_mode')->toString();
        if ($mode === '') {
            $mode = $cardTemplate !== '' && $galleryTemplate === '' ? 'card' : 'link';
        }

        // Cards are free forever — only guest websites consume the free-trial event slot.
        if (! $billing->canCreateEvent($user, $mode)) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'Your free trial includes one guest website — open it from My Events, or upgrade to create another. Invitation cards stay free.',
            ]);
            session()->flash('trial_event_limit', true);

            return redirect()->to('/events?create=1');
        }

        // Free-trial first site: switching templates replaces the unsaved draft, not block.
        if ($billing->eventLimit($user) !== null && $mode !== 'card') {
            $billing->discardUnlistedDrafts($user);
        }
        $theme = $request->string('theme')->toString() ?: 'classic';
        $lookupId = $galleryTemplate !== '' ? $galleryTemplate : $cardTemplate;
        $found = $lookupId !== '' ? DesignGallery::find($lookupId) : null;
        $design = $found['design'] ?? null;
        $sample = is_array($design['sample'] ?? null) ? $design['sample'] : [];
        $hostsLabel = trim((string) ($sample['hosts'] ?? ''));
        $brideName = 'Sophia';
        $groomName = 'Daniel';
        if ($hostsLabel !== '') {
            if (str_contains($hostsLabel, '&')) {
                [$left, $right] = array_map('trim', explode('&', $hostsLabel, 2));
                $groomName = $left !== '' ? $left : $groomName;
                $brideName = $right !== '' ? $right : $brideName;
            } else {
                $brideName = $hostsLabel;
                $groomName = $hostsLabel;
            }
        }
        $headline = trim((string) ($sample['kicker'] ?? $sample['headline'] ?? '')) ?: 'Together with their families';
        $story = trim((string) ($sample['message'] ?? $sample['headline_sub'] ?? $sample['request_line'] ?? '')) ?: null;
        $hostMessage = trim((string) ($sample['request_line'] ?? $sample['compliments'] ?? '')) ?: null;
        $where = trim((string) ($sample['where'] ?? $sample['venue_name'] ?? ''));
        $venueAddress = trim((string) ($sample['venue_address'] ?? '')) ?: null;
        $venueName = null;
        $city = null;
        if ($where !== '') {
            if (str_contains($where, ',')) {
                [$venueName, $city] = array_map('trim', explode(',', $where, 2));
            } else {
                $venueName = $where;
            }
        }
        if (trim((string) ($sample['venue_name'] ?? '')) !== '') {
            $venueName = trim((string) $sample['venue_name']);
        }
        $label = is_array($design) && isset($design['name'])
            ? (string) $design['name']
            : Str::of($lookupId)->afterLast('-')->replace('-', ' ')->title()->toString();
        $typeName = EventCatalog::type($eventType)['name'] ?? Str::title(str_replace('-', ' ', $eventType));

        $wedding = $weddings->create($user->id, [
            'event_type' => $eventType,
            'invitation_mode' => $mode,
            'theme' => $theme,
            'title' => trim(($label !== '' ? $label.' · ' : '').$typeName),
            'bride_name' => $brideName,
            'groom_name' => $groomName,
            'headline' => $headline,
            'story' => $story,
            'host_message' => $hostMessage,
            'venue_name' => $venueName,
            'venue_address' => $venueAddress,
            'city' => $city,
            'details' => array_filter([
                'gallery_template' => $galleryTemplate !== '' ? $galleryTemplate : null,
                'card_template' => $cardTemplate !== '' ? $cardTemplate : ($found['invitation_card']['id'] ?? null),
                'editor_saved' => '0',
                // Free-plan defaults — paid packs unlock the full style catalogs.
                'intro_style' => 'gatefold',
                'hero_style' => 'cinema',
                'header_style' => 'opal',
                'gallery_style' => 'mosaic',
                'timer_style' => 'meetcute',
                'site_bg_id' => '',
                'site_bg' => '',
                'site_surface' => '',
                'request_line' => trim((string) ($sample['request_line'] ?? '')) ?: null,
                'message' => trim((string) ($sample['message'] ?? $sample['request_line'] ?? '')) ?: null,
                'rsvp_line' => trim((string) ($sample['rsvp_line'] ?? '')) ?: null,
                'dress_code' => trim((string) ($sample['dress_code'] ?? '')) ?: null,
                'event_name' => trim((string) ($sample['event_name'] ?? '')) ?: null,
                'blessing' => trim((string) ($sample['blessing'] ?? '')) ?: null,
                'ceremony_time' => trim((string) ($sample['ceremony_time'] ?? '')) ?: null,
                'reception_time' => trim((string) ($sample['reception_time'] ?? '')) ?: null,
                'hashtag' => trim((string) ($sample['hashtag'] ?? '')) ?: null,
                'gift_note' => trim((string) ($sample['gift_note'] ?? '')) ?: null,
                'compliments' => trim((string) ($sample['compliments'] ?? '')) ?: null,
                'hosted_by' => trim((string) ($sample['hosted_by'] ?? '')) ?: null,
                'contact' => trim((string) ($sample['contact'] ?? '')) ?: null,
            ], static fn ($value): bool => $value !== null && $value !== ''),
            'card_template' => $cardTemplate !== '' ? $cardTemplate : null,
            'card_format' => $request->string('card_format')->toString() ?: 'portrait',
            'generate_card' => in_array($mode, ['card', 'both'], true),
            'hosts' => [
                ['name' => $brideName, 'role' => 'bride'],
                ['name' => $groomName, 'role' => 'groom'],
            ],
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Template ready — customize your invitation.',
        ]);

        $isFreePlan = ! $billing->isPro($user);

        if ($wedding->invitation_mode === 'card') {
            return to_route('weddings.card.edit', $wedding);
        }

        if ($isFreePlan) {
            session()->flash('trial_welcome', true);
        }

        return to_route('weddings.edit', $wedding);
    }

    public function store(StoreWeddingRequest $request, WeddingService $weddings): RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        $wedding = $weddings->create($user->id, $request->validated());

        if ($request->boolean('publish')) {
            app(WeddingPublishingService::class)->publish($wedding);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Invitation created.',
        ]);

        if (in_array($wedding->invitation_mode, ['card', 'both'], true)) {
            return to_route('weddings.card.edit', $wedding);
        }

        return to_route('weddings.edit', $wedding);
    }

    public function show(Wedding $wedding, WeddingPageData $pages): Response
    {
        Gate::authorize('view', $wedding);

        return Inertia::render('weddings/show', [
            'wedding' => $pages->owner($wedding),
        ]);
    }

    public function edit(Request $request, Wedding $wedding, WeddingPageData $pages): Response|RedirectResponse
    {
        Gate::authorize('update', $wedding);

        // Card-only invitations edit in the card studio, not the website editor.
        if ($wedding->invitation_mode === 'card') {
            return to_route('weddings.card.edit', $wedding);
        }

        $wedding->loadMissing('setting');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $galleryTemplate = trim((string) ($details['gallery_template'] ?? ''));
        $found = $galleryTemplate !== '' ? DesignGallery::find($galleryTemplate) : null;
        $design = is_array($found['design'] ?? null) ? $found['design'] : null;
        $isLink = ($design['kind'] ?? null) === 'link';
        $slug = $isLink ? ($found['slug'] ?? null) : null;

        $user = $request->user();
        $userCards = [];
        $libraryImages = [];

        if ($user !== null) {
            $owned = Wedding::query()
                ->where('user_id', $user->id)
                ->with(['card', 'photos'])
                ->latest('id')
                ->limit(40)
                ->get();

            foreach ($owned as $ownedWedding) {
                $sameEventType = $wedding->event_type_id !== null
                    && $ownedWedding->event_type_id === $wedding->event_type_id;
                $isCurrent = $ownedWedding->id === $wedding->id;

                // Only surface media/cards from the same event type (plus this event).
                if (! $sameEventType && ! $isCurrent) {
                    continue;
                }

                if ($ownedWedding->card) {
                    $userCards[] = [
                        'event_id' => $ownedWedding->id,
                        'title' => $ownedWedding->title ?: $ownedWedding->displayTitle(),
                        'status' => $ownedWedding->card->status,
                        'format' => $ownedWedding->card->format,
                        'width' => $ownedWedding->card->width,
                        'height' => $ownedWedding->card->height,
                        'document' => $ownedWedding->card->document,
                        'preview_path' => $ownedWedding->card->preview_path
                            ? Storage::disk('public')->url($ownedWedding->card->preview_path)
                            : null,
                        'edit_url' => route('weddings.card.edit', $ownedWedding),
                        'is_current' => $isCurrent,
                        'event_type_id' => $ownedWedding->event_type_id,
                    ];
                }

                if ($ownedWedding->cover_image) {
                    $libraryImages[] = [
                        'id' => 'cover-'.$ownedWedding->id,
                        'label' => ($ownedWedding->title ?: 'Event').' cover',
                        'src' => Storage::disk('public')->url($ownedWedding->cover_image),
                        'event_id' => $ownedWedding->id,
                    ];
                }

                foreach ($ownedWedding->photos as $photo) {
                    $libraryImages[] = [
                        'id' => 'photo-'.$photo->id,
                        'label' => $photo->caption ?: (($ownedWedding->title ?: 'Event').' photo'),
                        'src' => $photo->url(),
                        'event_id' => $ownedWedding->id,
                    ];
                }
            }
        }

        $occasionMeta = DesignGallery::occasion((string) ($slug ?: $wedding->eventType?->slug ?: 'wedding'));
        $previewSlug = is_array($occasionMeta) ? (string) ($occasionMeta['slug'] ?? 'wedding') : 'wedding';
        $heroBust = $previewSlug === 'wedding' ? '?v=11' : '?v=1';
        $heroLibrary = [];
        $previewDir = public_path('images/gallery/previews/'.$previewSlug);
        if (is_dir($previewDir)) {
            foreach (glob($previewDir.DIRECTORY_SEPARATOR.'*-hero-desktop.jpg') ?: [] as $heroFile) {
                $heroStyle = basename((string) $heroFile, '-hero-desktop.jpg');
                if ($heroStyle === '' || str_contains($heroStyle, '/')) {
                    continue;
                }
                $heroLibrary[] = [
                    'id' => 'hero-'.$heroStyle,
                    'label' => ucwords(str_replace('-', ' ', $heroStyle)),
                    'src' => '/images/gallery/previews/'.$previewSlug.'/'.$heroStyle.'-hero-desktop.jpg'.$heroBust,
                    'event_id' => null,
                ];
            }
        }
        if ($heroLibrary === [] && $previewSlug === 'wedding') {
            foreach ([
                'glasshouse', 'eucalyptus', 'black-tie', 'tropical', 'vintage-botanical',
                'estate', 'monochrome', 'golden-hour', 'foliage', 'fairytale',
            ] as $heroStyle) {
                $heroLibrary[] = [
                    'id' => 'hero-'.$heroStyle,
                    'label' => ucwords(str_replace('-', ' ', $heroStyle)),
                    'src' => '/images/gallery/previews/wedding/'.$heroStyle.'-hero-desktop.jpg?v=11',
                    'event_id' => null,
                ];
            }
        }

        // Resolve the attached card the same way live/preview does, so a related
        // event's saved document is always available even if type filters omit it.
        $selectedUserCard = WeddingGalleryPresentation::selectedUserCard($wedding);

        if ($selectedUserCard !== null) {
            $selectedId = (string) $selectedUserCard['event_id'];
            $alreadyListed = false;
            foreach ($userCards as $cardRow) {
                if ((string) $cardRow['event_id'] === $selectedId) {
                    $alreadyListed = true;
                    break;
                }
            }

            if (! $alreadyListed) {
                array_unshift($userCards, array_merge($selectedUserCard, [
                    'event_type_id' => Wedding::query()->whereKey($selectedUserCard['event_id'])->value('event_type_id'),
                ]));
            } else {
                // Prefer the freshly resolved document over a stale list row.
                foreach ($userCards as $index => $cardRow) {
                    if ((string) $cardRow['event_id'] === $selectedId) {
                        $userCards[$index] = array_merge($cardRow, [
                            'document' => $selectedUserCard['document'],
                            'width' => $selectedUserCard['width'],
                            'height' => $selectedUserCard['height'],
                            'format' => $selectedUserCard['format'],
                            'status' => $selectedUserCard['status'],
                            'preview_path' => $selectedUserCard['preview_path'],
                        ]);
                        break;
                    }
                }
            }
        }

        return Inertia::render('weddings/edit', [
            'wedding' => $pages->owner($wedding),
            'gallerySlug' => $previewSlug,
            'galleryDesign' => $isLink ? $design : null,
            'invitationCard' => null,
            'galleryCards' => [],
            'userCards' => $userCards,
            'selectedUserCard' => $selectedUserCard,
            'libraryImages' => array_merge($heroLibrary, $libraryImages),
            'createCardUrl' => url('/designs/'.$previewSlug.'?tab=cards'),
        ]);
    }

    public function update(
        UpdateWeddingRequest $request,
        Wedding $wedding,
        WeddingService $weddings,
        \App\Services\Billing\BillingService $billing,
        \App\Services\Billing\SiteBillingService $siteBilling,
    ): RedirectResponse {
        $siteBilling->assertCanEditSite($wedding);

        $data = $request->validated();
        $details = is_array($data['details'] ?? null) ? $data['details'] : [];
        if (($details['invite_delivery_mode'] ?? null) === 'automated') {
            $billing->assertCanUseAutomated($request->user(), $wedding);
        }

        $weddings->update($wedding, $data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Saved.',
        ]);

        return back();
    }

    public function destroy(Wedding $wedding, WeddingService $weddings): RedirectResponse
    {
        Gate::authorize('delete', $wedding);
        $weddings->delete($wedding);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Wedding archived.',
        ]);

        return to_route('weddings.index');
    }
}
