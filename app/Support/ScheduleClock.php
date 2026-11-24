<?php

namespace App\Support;

use Carbon\Carbon;

/** Display clock ("4:00 PM") ↔ storage ("16:00") for itinerary sync. */
class ScheduleClock
{
    public static function toStorage(?string $display): ?string
    {
        $display = trim((string) $display);
        if ($display === '') {
            return null;
        }

        try {
            return Carbon::parse($display)->format('H:i');
        } catch (\Throwable) {
            if (preg_match('/^(\d{1,2}):(\d{2})$/', $display, $match)) {
                $hour = (int) $match[1];
                $minute = (int) $match[2];
                if ($hour >= 0 && $hour <= 23 && $minute >= 0 && $minute <= 59) {
                    return sprintf('%02d:%02d', $hour, $minute);
                }
            }

            return null;
        }
    }

    public static function toDisplay(?string $storage): string
    {
        $storage = trim((string) $storage);
        if ($storage === '') {
            return '';
        }

        try {
            // Accept H:i or H:i:s from DB time columns.
            return Carbon::createFromFormat(strlen($storage) > 5 ? 'H:i:s' : 'H:i', $storage)
                ->format('g:i A');
        } catch (\Throwable) {
            try {
                return Carbon::parse($storage)->format('g:i A');
            } catch (\Throwable) {
                return $storage;
            }
        }
    }
}
