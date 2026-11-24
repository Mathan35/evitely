<?php

namespace Database\Factories;

use App\Enums\WeddingStatus;
use App\Models\EventType;
use App\Models\User;
use App\Models\Wedding;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Wedding>
 */
class WeddingFactory extends Factory
{
    protected $model = Wedding::class;

    public function definition(): array
    {
        $bride = fake()->firstName();
        $groom = fake()->firstName();

        return [
            'user_id' => User::factory(),
            'slug' => fake()->unique()->slug(2),
            'title' => $bride.' & '.$groom,
            'invitation_mode' => 'both',
            'event_type_id' => EventType::query()->where('slug', 'wedding')->value('id'),
            'starts_on' => '2027-06-20',
            'starts_at' => '16:30',
            'timezone' => 'Asia/Kolkata',
            'venue_name' => 'The Glass House',
            'city' => 'Chennai',
            'country' => 'India',
            'theme' => 'classic',
            'style' => 'indian',
            'language' => 'en',
            'status' => WeddingStatus::Draft,
            'music_enabled' => false,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Wedding $wedding): void {
            $wedding->setting()->firstOrCreate([], [
                'sections' => array_fill_keys(config('wedding.sections'), true),
            ]);
            $wedding->hosts()->createMany([
                ['name' => strtok($wedding->title, '&') ?: 'Host', 'role' => 'bride', 'sort_order' => 1],
                ['name' => trim(explode('&', $wedding->title)[1] ?? 'Guest'), 'role' => 'groom', 'sort_order' => 2],
            ]);
        });
    }

    public function published(): static
    {
        return $this->state(fn (): array => [
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);
    }
}
