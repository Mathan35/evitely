<?php

namespace App\Support;

/**
 * One-tap multi-day Indian wedding ceremony packs for the schedule editor.
 *
 * @phpstan-type Moment array{title: string, time: string, offset_days: int, event_type: string}
 */
class IndianWeddingItinerary
{
    /**
     * @return array<string, array{id: string, name: string, description: string, moments: list<Moment>}>
     */
    public static function presets(): array
    {
        return [
            'classic_north' => [
                'id' => 'classic_north',
                'name' => 'Classic North Indian',
                'description' => 'Mehendi → Haldi → Sangeet → Ceremony → Reception across five days.',
                'moments' => [
                    ['title' => 'Mehendi', 'time' => '4:00 PM', 'offset_days' => -3, 'event_type' => 'mehendi'],
                    ['title' => 'Haldi', 'time' => '10:00 AM', 'offset_days' => -2, 'event_type' => 'haldi'],
                    ['title' => 'Sangeet', 'time' => '7:00 PM', 'offset_days' => -1, 'event_type' => 'sangeet'],
                    ['title' => 'Wedding ceremony', 'time' => '11:00 AM', 'offset_days' => 0, 'event_type' => 'ceremony'],
                    ['title' => 'Reception', 'time' => '7:30 PM', 'offset_days' => 0, 'event_type' => 'reception'],
                ],
            ],
            'classic_south' => [
                'id' => 'classic_south',
                'name' => 'Classic South Indian',
                'description' => 'Engagement evening → Muhurtham → Reception dinner.',
                'moments' => [
                    ['title' => 'Nischayathartham', 'time' => '6:00 PM', 'offset_days' => -1, 'event_type' => 'engagement'],
                    ['title' => 'Muhurtham', 'time' => '9:30 AM', 'offset_days' => 0, 'event_type' => 'ceremony'],
                    ['title' => 'Reception', 'time' => '6:30 PM', 'offset_days' => 0, 'event_type' => 'reception'],
                ],
            ],
            'destination' => [
                'id' => 'destination',
                'name' => 'Destination weekend',
                'description' => 'Welcome dinner → Ceremony → Brunch send-off.',
                'moments' => [
                    ['title' => 'Welcome dinner', 'time' => '7:00 PM', 'offset_days' => -1, 'event_type' => 'welcome'],
                    ['title' => 'Wedding ceremony', 'time' => '4:00 PM', 'offset_days' => 0, 'event_type' => 'ceremony'],
                    ['title' => 'Farewell brunch', 'time' => '11:00 AM', 'offset_days' => 1, 'event_type' => 'brunch'],
                ],
            ],
            'intimate' => [
                'id' => 'intimate',
                'name' => 'Intimate one-day',
                'description' => 'Haldi morning → Ceremony → Reception — all on the wedding day.',
                'moments' => [
                    ['title' => 'Haldi', 'time' => '9:00 AM', 'offset_days' => 0, 'event_type' => 'haldi'],
                    ['title' => 'Wedding ceremony', 'time' => '12:00 PM', 'offset_days' => 0, 'event_type' => 'ceremony'],
                    ['title' => 'Reception', 'time' => '7:00 PM', 'offset_days' => 0, 'event_type' => 'reception'],
                ],
            ],
        ];
    }

    /**
     * @return list<array{title: string, time: string, event_date: string|null, event_type: string, sort_order: int}>
     */
    public static function expand(string $presetId, ?\Carbon\CarbonInterface $weddingDate): array
    {
        $preset = self::presets()[$presetId] ?? null;
        if ($preset === null) {
            return [];
        }

        $base = $weddingDate
            ? \Illuminate\Support\Carbon::parse($weddingDate)->startOfDay()
            : now()->startOfDay()->addMonths(2);
        $rows = [];

        foreach ($preset['moments'] as $index => $moment) {
            $date = $base->copy()->addDays((int) $moment['offset_days']);
            $rows[] = [
                'title' => $moment['title'],
                'time' => $moment['time'],
                'event_date' => $date->toDateString(),
                'event_type' => $moment['event_type'],
                'sort_order' => $index + 1,
            ];
        }

        return $rows;
    }
}
