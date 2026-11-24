<?php

namespace App\Services;

use App\Models\Wedding;
use App\Models\WeddingEvent;
use App\Support\ScheduleClock;
use Illuminate\Support\Facades\DB;

/**
 * Single source of truth: event_schedules (WeddingEvent).
 *
 * Gallery Location itinerary (time + title) writes here on save.
 * schedule_json is kept as a derived mirror for older readers.
 */
class ScheduleSync
{
    /**
     * @param  list<array{time?: string, title?: string}>  $items
     */
    public function syncItinerary(Wedding $wedding, array $items): void
    {
        $normalized = collect($items)
            ->map(function ($item): ?array {
                if (! is_array($item)) {
                    return null;
                }
                $title = trim((string) ($item['title'] ?? ''));
                if ($title === '') {
                    return null;
                }

                return [
                    'title' => mb_substr($title, 0, 120),
                    'start_time' => ScheduleClock::toStorage($item['time'] ?? null),
                    'time' => trim((string) ($item['time'] ?? '')),
                ];
            })
            ->filter()
            ->values();

        DB::transaction(function () use ($wedding, $normalized): void {
            $existing = $wedding->events()->orderBy('sort_order')->orderBy('id')->get();

            foreach ($normalized as $index => $item) {
                $payload = [
                    'title' => $item['title'],
                    'event_type' => 'moment',
                    'event_date' => $wedding->starts_on,
                    'start_time' => $item['start_time'],
                    'timezone' => $wedding->timezone ?: 'Asia/Kolkata',
                    'venue_name' => $wedding->venue_name,
                    'venue_address' => $wedding->venue_address,
                    'city' => $wedding->city,
                    'state' => $wedding->state,
                    'country' => $wedding->country,
                    'sort_order' => $index + 1,
                    'is_public' => true,
                ];

                /** @var WeddingEvent|null $row */
                $row = $existing->get($index);
                if ($row instanceof WeddingEvent) {
                    $row->fill($payload);
                    $row->save();
                } else {
                    $wedding->events()->create($payload);
                }
            }

            foreach ($existing->slice($normalized->count()) as $extra) {
                $extra->delete();
            }

            $this->mirrorScheduleJson($wedding, $normalized->map(fn (array $item): array => [
                'time' => $item['time'] !== '' ? $item['time'] : ScheduleClock::toDisplay($item['start_time']),
                'title' => $item['title'],
            ])->all());
        });
    }

    /**
     * If relational rows are empty but schedule_json has moments, import once.
     */
    public function importFromDetailsIfEmpty(Wedding $wedding): void
    {
        if ($wedding->events()->exists()) {
            return;
        }

        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $raw = $details['schedule_json'] ?? null;
        if (! is_string($raw) || trim($raw) === '') {
            return;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded) || $decoded === []) {
            return;
        }

        $this->syncItinerary($wedding, $decoded);
    }

    /**
     * Seed relational itinerary from a theme/default schedule list.
     *
     * @param  list<array{time?: string, title?: string}>  $items
     */
    public function seedIfEmpty(Wedding $wedding, array $items): void
    {
        if ($wedding->events()->exists() || $items === []) {
            return;
        }

        $this->syncItinerary($wedding, $items);
    }

    /**
     * @return list<array{time: string, title: string}>
     */
    public function projectItinerary(Wedding $wedding): array
    {
        return $wedding->events
            ->where('is_public', true)
            ->sortBy('sort_order')
            ->values()
            ->map(fn (WeddingEvent $event): array => [
                'time' => ScheduleClock::toDisplay($event->start_time),
                'title' => (string) $event->title,
            ])
            ->filter(fn (array $item): bool => $item['title'] !== '')
            ->values()
            ->all();
    }

    /**
     * @param  list<array{time: string, title: string}>  $items
     */
    private function mirrorScheduleJson(Wedding $wedding, array $items): void
    {
        $setting = $wedding->setting;
        if ($setting === null) {
            return;
        }

        $details = is_array($setting->details) ? $setting->details : [];
        $details['schedule_json'] = json_encode(array_values($items), JSON_UNESCAPED_UNICODE);
        $setting->details = $details;
        $setting->save();
    }
}
