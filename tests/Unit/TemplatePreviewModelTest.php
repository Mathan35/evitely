<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class TemplatePreviewModelTest extends TestCase
{
    public function test_guest_json_round_trip_keeps_added_guest(): void
    {
        $guests = [
            ['id' => 'g1', 'name' => 'Amira Shah', 'party' => '2 guests', 'status' => 'Attending'],
            ['id' => 'g-new', 'name' => 'Priya Nair', 'party' => '1 guest', 'status' => 'Attending'],
        ];

        $encoded = json_encode($guests);
        $decoded = json_decode((string) $encoded, true);

        $this->assertIsArray($decoded);
        $this->assertCount(2, $decoded);
        $this->assertSame('Priya Nair', $decoded[1]['name']);
    }

    public function test_venue_json_keeps_maps_and_image_fields(): void
    {
        $ceremony = [
            'title' => 'Ceremony',
            'name' => 'Glass Pavilion',
            'time' => '4:00 PM',
            'address' => '742 Evergreen Terrace, Vancouver',
            'image' => '/images/gallery/previews/glasshouse/venue-ceremony.jpg?v=3',
            'map_image' => '/images/gallery/previews/glasshouse/map-ceremony.jpg?v=3',
            'maps_url' => 'https://www.google.com/maps/search/?api=1&query=Glass+Pavilion',
        ];

        $decoded = json_decode((string) json_encode($ceremony), true);

        $this->assertSame('Glass Pavilion', $decoded['name']);
        $this->assertStringContainsString('maps', $decoded['maps_url']);
        $this->assertNotEmpty($decoded['image']);
    }
}
