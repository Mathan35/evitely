<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingTranslation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class LocaleSwitchTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_site_applies_secondary_translation_to_gallery_details(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => 'published',
            'language' => 'en',
            'secondary_language' => 'ta',
            'headline' => 'English headline',
            'story' => 'English story',
            'host_message' => 'English host',
        ]);
        $wedding->setting()->updateOrCreate([], [
            'details' => [
                'gallery_template' => 'wedding-link-glasshouse',
                'hero_message' => 'English hero',
                'story_body' => 'English story body',
                'kicker' => 'English kicker',
            ],
        ]);
        WeddingTranslation::query()->create([
            'event_id' => $wedding->id,
            'locale' => 'ta',
            'content' => [
                'headline' => 'Tamil headline',
                'story' => 'Tamil story',
                'hero_message' => 'Tamil hero',
                'bride_display_name' => 'Priya',
                'groom_display_name' => 'Arun',
            ],
        ]);

        $this->get(route('weddings.public', ['slug' => $wedding->slug, 'lang' => 'ta']))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('wedding.locale', 'ta')
                ->where('wedding.headline', 'Tamil headline')
                ->where('wedding.story', 'Tamil story')
                ->where('wedding.bride_name', 'Priya')
                ->where('wedding.groom_name', 'Arun')
                ->where('wedding.details.hero_message', 'Tamil hero')
                ->where('wedding.details.story_body', 'Tamil story')
                ->where('wedding.details.kicker', 'Tamil headline')
                ->where('wedding.primary.headline', 'English headline')
                ->where('wedding.primary.story', 'English story')
                ->where('wedding.primary.details.hero_message', 'English hero')
                ->has('wedding.translations', 1)
                ->where('wedding.translations.0.locale', 'ta')
                ->where('wedding.translations.0.content.headline', 'Tamil headline')
            );
    }
}
