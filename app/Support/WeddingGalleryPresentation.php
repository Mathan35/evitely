<?php

namespace App\Support;

use App\Models\EventCard;
use App\Models\Wedding;
use Illuminate\Support\Facades\Storage;

class WeddingGalleryPresentation
{
    /**
     * Resolve the selected gallery link template for a wedding website.
     *
     * @return array{slug: string|null, design: array<string, mixed>|null}
     */
    public static function linkTemplate(Wedding $wedding): array
    {
        $wedding->loadMissing('setting');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $galleryTemplate = trim((string) ($details['gallery_template'] ?? ''));

        if ($galleryTemplate === '' || $wedding->invitation_mode === 'card') {
            return ['slug' => null, 'design' => null];
        }

        $found = DesignGallery::find($galleryTemplate);
        $design = is_array($found['design'] ?? null) ? $found['design'] : null;

        if (($design['kind'] ?? null) !== 'link') {
            return ['slug' => null, 'design' => null];
        }

        return [
            'slug' => is_string($found['slug'] ?? null) ? $found['slug'] : null,
            'design' => $design,
        ];
    }

    /**
     * Resolve the optional user-created invitation card attached to the website.
     *
     * @return array<string, mixed>|null
     */
    public static function selectedUserCard(Wedding $wedding): ?array
    {
        $wedding->loadMissing(['setting', 'card']);
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];

        if (($details['card_template'] ?? null) === 'none') {
            return null;
        }

        $selectedEventId = trim((string) ($details['user_card_event_id'] ?? ''));

        // Prefer an explicitly linked card; otherwise show this event's own card in preview/site.
        if ($selectedEventId === '') {
            if ($wedding->card instanceof EventCard) {
                return self::cardPayload($wedding, $wedding->id);
            }

            return null;
        }

        $cardWedding = Wedding::query()
            ->with('card')
            ->whereKey($selectedEventId)
            ->where('user_id', $wedding->user_id)
            ->first();

        if ($cardWedding?->card instanceof EventCard) {
            return self::cardPayload($cardWedding, $wedding->id);
        }

        if ($wedding->card instanceof EventCard) {
            return self::cardPayload($wedding, $wedding->id);
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    public static function cardPayload(Wedding $cardWedding, ?int $currentWeddingId = null): array
    {
        $card = $cardWedding->card;

        return [
            'event_id' => $cardWedding->id,
            'title' => $cardWedding->title ?: $cardWedding->displayTitle(),
            'status' => $card?->status,
            'format' => $card?->format,
            'width' => $card?->width,
            'height' => $card?->height,
            'document' => $card?->document,
            'preview_path' => $card?->preview_path
                ? Storage::disk('public')->url($card->preview_path)
                : null,
            'edit_url' => route('weddings.card.edit', $cardWedding),
            'is_current' => $currentWeddingId !== null && $cardWedding->id === $currentWeddingId,
        ];
    }
}
