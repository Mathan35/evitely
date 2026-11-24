<?php

namespace App\Services;

use App\Models\Accommodation;
use App\Models\TravelDetail;
use App\Models\Wedding;
use Illuminate\Support\Facades\DB;

/**
 * Single source of truth: accommodations + travel_details.
 *
 * Gallery Core Extras (travel_stays_json / travel_stays_notes) writes here on save.
 * JSON keys are kept as a derived mirror for the editor and older readers.
 * explore_json stays JSON-only (no relational twin).
 */
class TravelStaysSync
{
    public const NOTES_KIND = 'directions';

    public const NOTES_TITLE = 'Travel notes';

    /**
     * @param  list<array{id?: string, name?: string, detail?: string, code?: string, url?: string}>  $stays
     */
    public function syncFromDetails(Wedding $wedding, array $stays, ?string $notes = null): void
    {
        $normalized = collect($stays)
            ->map(function ($item): ?array {
                if (! is_array($item)) {
                    return null;
                }
                $name = trim((string) ($item['name'] ?? ''));
                if ($name === '') {
                    return null;
                }

                return [
                    'id' => trim((string) ($item['id'] ?? '')),
                    'name' => mb_substr($name, 0, 160),
                    'detail' => trim((string) ($item['detail'] ?? '')),
                    'code' => trim((string) ($item['code'] ?? '')),
                    'url' => trim((string) ($item['url'] ?? '')),
                ];
            })
            ->filter()
            ->values();

        $notesText = trim((string) $notes);

        DB::transaction(function () use ($wedding, $normalized, $notesText): void {
            $existing = $wedding->accommodations()->orderBy('sort_order')->orderBy('id')->get();

            foreach ($normalized as $index => $item) {
                $payload = [
                    'hotel_name' => $item['name'],
                    'description' => $item['detail'] !== '' ? $item['detail'] : null,
                    'price_info' => $item['code'] !== '' ? $item['code'] : null,
                    'booking_url' => $item['url'] !== '' ? $item['url'] : null,
                    'sort_order' => $index + 1,
                ];

                /** @var Accommodation|null $row */
                $row = $existing->get($index);
                if ($row instanceof Accommodation) {
                    $row->fill($payload);
                    $row->save();
                } else {
                    $wedding->accommodations()->create($payload);
                }
            }

            foreach ($existing->slice($normalized->count()) as $extra) {
                $extra->delete();
            }

            $this->syncNotesRow($wedding, $notesText);

            $this->mirrorDetails($wedding, $normalized->map(fn (array $item): array => [
                'id' => $item['id'] !== '' ? $item['id'] : 'stay-'.($item['name']),
                'name' => $item['name'],
                'detail' => $item['detail'],
                'code' => $item['code'],
                'url' => $item['url'],
            ])->all(), $notesText);
        });
    }

    /**
     * If relational stays are empty but details JSON has stays/notes, import once.
     */
    public function importFromDetailsIfEmpty(Wedding $wedding): void
    {
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $notes = trim((string) ($details['travel_stays_notes'] ?? ''));
        $raw = $details['travel_stays_json'] ?? null;
        $decoded = is_string($raw) && trim($raw) !== '' ? json_decode($raw, true) : null;
        $hasJsonStays = is_array($decoded) && $decoded !== [];

        if (! $wedding->accommodations()->exists() && $hasJsonStays) {
            $this->syncFromDetails($wedding, $decoded, $notes !== '' ? $notes : null);

            return;
        }

        if ($notes !== '' && ! $this->notesRow($wedding)) {
            $this->syncNotesRow($wedding, $notes);
            $this->mirrorDetails(
                $wedding,
                $this->projectStays($wedding->fresh(['accommodations'])),
                $notes,
            );
        }
    }

    /**
     * Re-project relational rows into details after GuideController mutations.
     */
    public function remirror(Wedding $wedding): void
    {
        $wedding = $wedding->fresh(['accommodations', 'travelDetails', 'setting']);
        $notes = $this->projectNotes($wedding);
        $this->mirrorDetails($wedding, $this->projectStays($wedding), $notes);
    }

    /**
     * @return list<array{id: string, name: string, detail: string, code: string, url: string}>
     */
    public function projectStays(Wedding $wedding): array
    {
        return $wedding->accommodations
            ->sortBy('sort_order')
            ->values()
            ->map(fn (Accommodation $stay): array => [
                'id' => 'stay-'.$stay->id,
                'name' => (string) $stay->hotel_name,
                'detail' => trim((string) ($stay->description ?: $stay->address ?: '')),
                'code' => trim((string) ($stay->price_info ?: '')),
                'url' => trim((string) ($stay->booking_url ?: $stay->website ?: '')),
            ])
            ->filter(fn (array $item): bool => $item['name'] !== '')
            ->values()
            ->all();
    }

    public function projectNotes(Wedding $wedding): string
    {
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $fromDetails = trim((string) ($details['travel_stays_notes'] ?? ''));
        if ($fromDetails !== '') {
            return $fromDetails;
        }

        $row = $this->notesRow($wedding);

        return $row ? trim((string) ($row->description ?: '')) : '';
    }

    private function syncNotesRow(Wedding $wedding, string $notesText): void
    {
        $row = $this->notesRow($wedding);

        if ($notesText === '') {
            $row?->delete();

            return;
        }

        $payload = [
            'kind' => self::NOTES_KIND,
            'title' => self::NOTES_TITLE,
            'description' => $notesText,
            'sort_order' => 0,
        ];

        if ($row instanceof TravelDetail) {
            $row->fill($payload);
            $row->save();

            return;
        }

        $wedding->travelDetails()->create($payload);
    }

    private function notesRow(Wedding $wedding): ?TravelDetail
    {
        return $wedding->travelDetails()
            ->where('kind', self::NOTES_KIND)
            ->where('title', self::NOTES_TITLE)
            ->first();
    }

    /**
     * @param  list<array{id: string, name: string, detail: string, code: string, url: string}>  $stays
     */
    private function mirrorDetails(Wedding $wedding, array $stays, string $notes): void
    {
        $setting = $wedding->setting;
        if ($setting === null) {
            return;
        }

        $details = is_array($setting->details) ? $setting->details : [];
        $details['travel_stays_json'] = json_encode(array_values($stays), JSON_UNESCAPED_UNICODE);
        $details['travel_stays_notes'] = $notes;
        $setting->details = $details;
        $setting->save();
    }
}
