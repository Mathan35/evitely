<?php

namespace Database\Factories;

use App\Models\Wedding;
use App\Models\WeddingEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WeddingEvent>
 */
class WeddingEventFactory extends Factory
{
    protected $model = WeddingEvent::class;

    public function definition(): array
    {
        return [
            'event_id' => Wedding::factory(),
            'title' => 'Wedding Ceremony',
            'event_type' => 'wedding',
            'event_date' => '2027-06-20',
            'start_time' => '16:30',
            'timezone' => 'Asia/Kolkata',
            'venue_name' => 'The Glass House',
            'city' => 'Chennai',
            'sort_order' => 1,
            'is_public' => true,
        ];
    }
}
