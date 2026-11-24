<?php

namespace Database\Factories;

use App\Models\Wedding;
use App\Models\WeddingGuest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WeddingGuest>
 */
class WeddingGuestFactory extends Factory
{
    protected $model = WeddingGuest::class;

    public function definition(): array
    {
        return [
            'event_id' => Wedding::factory(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->safeEmail(),
            'number_of_guests' => 1,
            'invitation_status' => 'pending',
            'rsvp_status' => 'pending',
            'guest_token' => bin2hex(random_bytes(16)),
        ];
    }
}
