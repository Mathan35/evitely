<?php

namespace App\Support;

class MapLinkFactory
{
    public static function url(?string $latitude, ?string $longitude, ?string $query): ?string
    {
        if ($latitude !== null && $latitude !== '' && $longitude !== null && $longitude !== '') {
            return 'https://www.google.com/maps/search/?api=1&query='.rawurlencode($latitude.','.$longitude);
        }

        $query = trim((string) $query);

        if ($query === '') {
            return null;
        }

        return 'https://www.google.com/maps/search/?api=1&query='.rawurlencode($query);
    }
}
