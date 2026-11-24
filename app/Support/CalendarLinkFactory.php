<?php

namespace App\Support;

use App\Models\Wedding;
use App\Models\WeddingEvent;
use Carbon\CarbonImmutable;

class CalendarLinkFactory
{
    public static function google(Wedding $wedding, WeddingEvent $event): string
    {
        [$start, $end] = self::range($wedding, $event);

        $params = [
            'action' => 'TEMPLATE',
            'text' => $event->title.' — '.$wedding->displayTitle(),
            'dates' => $start->utc()->format('Ymd\THis\Z').'/'.$end->utc()->format('Ymd\THis\Z'),
            'details' => trim((string) $event->description),
            'location' => self::location($event, $wedding),
        ];

        return 'https://calendar.google.com/calendar/render?'.http_build_query($params);
    }

    public static function ics(Wedding $wedding, WeddingEvent $event): string
    {
        [$start, $end] = self::range($wedding, $event);
        $uid = 'event-'.$event->id.'@evitely';
        $summary = self::escape($event->title.' — '.$wedding->displayTitle());
        $location = self::escape(self::location($event, $wedding));
        $description = self::escape((string) $event->description);

        return implode("\r\n", [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Evitely//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:'.$uid,
            'DTSTAMP:'.now()->utc()->format('Ymd\THis\Z'),
            'DTSTART:'.$start->utc()->format('Ymd\THis\Z'),
            'DTEND:'.$end->utc()->format('Ymd\THis\Z'),
            'SUMMARY:'.$summary,
            'LOCATION:'.$location,
            'DESCRIPTION:'.$description,
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ]);
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private static function range(Wedding $wedding, WeddingEvent $event): array
    {
        $timezone = $event->timezone ?: $wedding->timezone ?: 'UTC';
        $date = ($event->event_date ?? $wedding->starts_on)?->format('Y-m-d') ?? now()->format('Y-m-d');
        $startTime = self::clock($event->start_time) ?? self::clock($wedding->wedding_time) ?? '10:00';
        $endTime = self::clock($event->end_time) ?? CarbonImmutable::parse($date.' '.$startTime, $timezone)->addHour()->format('H:i');

        $start = CarbonImmutable::parse($date.' '.$startTime, $timezone);
        $end = CarbonImmutable::parse($date.' '.$endTime, $timezone);

        if ($end->lessThanOrEqualTo($start)) {
            $end = $start->addHour();
        }

        return [$start, $end];
    }

    private static function clock(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        return substr($value, 0, 5);
    }

    private static function location(WeddingEvent $event, Wedding $wedding): string
    {
        return collect([
            $event->venue_name ?: $wedding->venue_name,
            $event->venue_address ?: $wedding->venue_address,
            $event->city ?: $wedding->city,
            $event->country ?: $wedding->country,
        ])->filter()->implode(', ');
    }

    private static function escape(string $value): string
    {
        return str_replace(["\r", "\n", ',', ';'], ['', '\n', '\,', '\;'], $value);
    }
}
