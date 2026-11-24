<?php

namespace App\Http\Controllers;

use App\Http\Requests\Weddings\UpdateCardRequest;
use App\Models\Wedding;
use App\Services\WeddingAnalyticsService;
use App\Support\CardLibrary;
use App\Support\DesignGallery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EventCardController extends Controller
{
    public function edit(Wedding $wedding): Response
    {
        Gate::authorize('update', $wedding);
        $wedding->load(['card', 'setting', 'hosts', 'events', 'eventType']);

        if (! $wedding->card) {
            $this->materializeCard($wedding);
            $wedding->load('card');
        } else {
            // Keep editor canvas aligned with the design preview popup (art aspect + safe well).
            $this->syncCardGeometry($wedding);
            $wedding->load('card');
        }

        $wedding->loadMissing('setting');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $editorSaved = ($details['editor_saved'] ?? null) === true
            || ($details['editor_saved'] ?? null) === 1
            || ($details['editor_saved'] ?? null) === '1'
            || $wedding->status->value === 'published';

        $occasionSlug = $wedding->eventType?->slug;
        $occasion = $occasionSlug ? DesignGallery::occasion($occasionSlug) : null;
        $gallerySlug = is_array($occasion) ? (string) ($occasion['slug'] ?? 'wedding') : 'wedding';
        $templates = CardLibrary::templatesForOccasion($gallerySlug);

        return Inertia::render('events/card', [
            'eventId' => $wedding->id,
            'title' => $wedding->displayTitle(),
            'slug' => $wedding->slug,
            'weddingStatus' => $wedding->status->value,
            'musicUrl' => $wedding->music_enabled ? $wedding->music_url : null,
            'inviteUrl' => route('weddings.public', ['slug' => $wedding->slug]),
            'cardUrl' => route('weddings.card', ['slug' => $wedding->slug]),
            'galleryHref' => route('designs.event', ['event' => $gallerySlug]),
            'eventsHref' => route('weddings.index'),
            'occasionSlug' => $gallerySlug,
            'editorSaved' => $editorSaved,
            'card' => $wedding->card ? [
                'format' => $wedding->card->format,
                'width' => $wedding->card->width,
                'height' => $wedding->card->height,
                'status' => $wedding->card->status,
                'document' => $wedding->card->document,
            ] : null,
            'presets' => array_values(CardLibrary::presets()),
            'templates' => $templates,
            'cardArts' => array_values(array_map(
                static fn (array $row): array => [
                    'id' => (string) ($row['id'] ?? ''),
                    'label' => (string) ($row['name'] ?? 'Card art'),
                    'src' => (string) ($row['image'] ?? ''),
                ],
                array_filter($templates, static fn (array $row): bool => filled($row['image'] ?? null)),
            )),
        ]);
    }

    public function update(UpdateCardRequest $request, Wedding $wedding): RedirectResponse
    {
        $data = $request->validated();
        $wedding->loadMissing('eventType');
        $format = $data['format'] ?? 'invite';
        $templateId = CardLibrary::templateIdFor($wedding);
        $template = CardLibrary::resolve($templateId, $wedding->eventType?->slug);
        $preset = CardLibrary::canvasForTemplate($template, $format);
        $width = $format === 'custom' ? (int) $data['width'] : $preset['width'];
        $height = $format === 'custom' ? (int) $data['height'] : $preset['height'];

        $document = is_array($data['document'] ?? null) ? $data['document'] : [];
        // Always stamp layout_version so a later edit() sync cannot rematerialize over edits.
        $document['layout_version'] = max(
            (int) ($document['layout_version'] ?? 0),
            CardLibrary::LAYOUT_VERSION,
        );
        if (! isset($document['occasion']) || ! is_string($document['occasion']) || $document['occasion'] === '') {
            $document['occasion'] = (string) ($wedding->eventType?->slug ?: 'wedding');
        }

        $wedding->card()->updateOrCreate([], [
            'format' => $preset['format'],
            'width' => $width,
            'height' => $height,
            'document' => $document,
            'status' => $wedding->card?->status ?? 'draft',
        ]);

        $wedding->loadMissing('setting');
        if ($wedding->setting) {
            $details = is_array($wedding->setting->details) ? $wedding->setting->details : [];
            $details['editor_saved'] = '1';
            $wedding->setting->details = $details;
            $wedding->setting->save();
        }

        return back();
    }

    public function generate(Request $request, Wedding $wedding, WeddingAnalyticsService $analytics): RedirectResponse
    {
        Gate::authorize('update', $wedding);
        $wedding->load(['hosts', 'setting', 'events', 'eventType', 'card']);

        $requested = $request->validate([
            'format' => ['nullable', 'string', 'max:40'],
        ])['format'] ?? null;

        $templateId = CardLibrary::templateIdFor($wedding);
        $template = CardLibrary::resolve($templateId, $wedding->eventType?->slug);
        $presets = CardLibrary::presets();
        $format = is_string($requested) && isset($presets[$requested])
            ? $requested
            : (is_string($template['format'] ?? null) ? $template['format'] : ($wedding->card?->format ?? 'invite'));
        $preset = CardLibrary::canvasForTemplate($template, $format);
        $document = CardLibrary::document(
            $wedding,
            $templateId,
            $wedding->invitation_mode !== 'card',
            $format,
        );

        $wedding->card()->updateOrCreate([], [
            'format' => $preset['format'],
            'width' => $preset['width'],
            'height' => $preset['height'],
            'status' => 'generated',
            'document' => $document,
        ]);
        $analytics->record($wedding, 'card_generated');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Card generated.']);

        return back();
    }

    public function export(Request $request, Wedding $wedding, WeddingAnalyticsService $analytics): RedirectResponse
    {
        Gate::authorize('update', $wedding);
        $kind = $request->validate([
            'kind' => ['required', 'in:png,jpg,pdf,share'],
        ])['kind'];

        $analytics->record($wedding, $kind === 'share' ? 'card_share' : 'card_download', null, null, $kind);

        if ($wedding->card && $kind === 'share') {
            $wedding->card->status = 'shared';
            $wedding->card->save();
        }

        return back();
    }

    private function materializeCard(Wedding $wedding): void
    {
        $wedding->loadMissing('eventType');
        $templateId = CardLibrary::templateIdFor($wedding);
        $template = CardLibrary::resolve($templateId, $wedding->eventType?->slug);
        $format = is_string($template['format'] ?? null) ? $template['format'] : 'invite';
        $preset = CardLibrary::canvasForTemplate($template, $format);
        $document = CardLibrary::document($wedding, $templateId, $wedding->invitation_mode !== 'card');

        $wedding->card()->create([
            'format' => $preset['format'],
            'width' => $preset['width'],
            'height' => $preset['height'],
            'status' => 'generated',
            'document' => $document,
        ]);
    }

    /**
     * When the saved card canvas no longer matches the design preview frame
     * (art aspect / safe-well), rebuild width/height/document so the editor
     * shows the same alignment as the gallery preview popup.
     *
     * Never rematerialize after the host has saved edits — that wiped user copy
     * on every save→back→edit cycle when layout_version was stripped.
     */
    private function syncCardGeometry(Wedding $wedding): void
    {
        if (! $wedding->card) {
            return;
        }

        $wedding->loadMissing(['eventType', 'setting', 'hosts', 'events']);

        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $editorSaved = ($details['editor_saved'] ?? null) === true
            || ($details['editor_saved'] ?? null) === 1
            || ($details['editor_saved'] ?? null) === '1'
            || $wedding->status->value === 'published';

        if ($editorSaved) {
            return;
        }

        $templateId = CardLibrary::templateIdFor($wedding);
        $template = CardLibrary::resolve($templateId, $wedding->eventType?->slug);
        $format = is_string($wedding->card->format) && $wedding->card->format !== ''
            ? $wedding->card->format
            : (is_string($template['format'] ?? null) ? $template['format'] : 'invite');
        $preset = CardLibrary::canvasForTemplate($template, $format);

        $widthMatches = (int) $wedding->card->width === (int) $preset['width'];
        $heightMatches = (int) $wedding->card->height === (int) $preset['height'];
        $layoutVersion = (int) (($wedding->card->document['layout_version'] ?? 0));
        // Rematerialize when canvas size drifts OR copy tree/sizing is outdated vs InvitationCardFace.
        if ($widthMatches && $heightMatches && $layoutVersion >= CardLibrary::LAYOUT_VERSION) {
            return;
        }

        $document = CardLibrary::document(
            $wedding,
            $templateId,
            $wedding->invitation_mode !== 'card',
            $format,
        );

        $wedding->card->forceFill([
            'format' => $preset['format'],
            'width' => $preset['width'],
            'height' => $preset['height'],
            'document' => $document,
            'status' => 'generated',
        ])->save();
    }
}
