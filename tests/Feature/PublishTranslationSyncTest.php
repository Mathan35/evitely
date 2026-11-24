<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingTranslation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class PublishTranslationSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_publish_auto_fills_missing_secondary_translation(): void
    {
        config(['services.translation.driver' => 'fake']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => 'draft',
            'language' => 'en',
            'secondary_language' => 'ta',
            'headline' => 'Together forever',
            'story' => 'Our love story',
            'host_message' => 'Join us',
        ]);
        $wedding->setting()->updateOrCreate([], [
            'details' => [
                'hero_message' => 'Welcome friends',
                'gallery_title' => 'Our moments',
            ],
        ]);
        $wedding->hosts()->where('role', 'bride')->update(['name' => 'Priya']);
        $wedding->hosts()->where('role', 'groom')->update(['name' => 'Arun']);

        $this->actingAs($user)
            ->post(route('weddings.publish', $wedding))
            ->assertRedirect();

        $wedding->refresh();
        $this->assertSame('published', $wedding->status->value);

        $row = WeddingTranslation::query()
            ->where('event_id', $wedding->id)
            ->where('locale', 'ta')
            ->first();

        $this->assertNotNull($row);
        $this->assertSame('[ta]Together forever', $row->content['headline'] ?? null);
        $this->assertSame('[ta]Our love story', $row->content['story'] ?? null);
        $this->assertSame('[ta]Welcome friends', $row->content['hero_message'] ?? null);
        $this->assertSame('[ta]Our moments', $row->content['gallery_title'] ?? null);

        $this->get(route('weddings.public', ['slug' => $wedding->slug, 'lang' => 'ta']))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('wedding.locale', 'ta')
                ->where('wedding.headline', '[ta]Together forever')
                ->where('wedding.story', '[ta]Our love story')
                ->where('wedding.details.hero_message', '[ta]Welcome friends')
                ->where('wedding.details.gallery_title', '[ta]Our moments')
            );
    }

    public function test_publish_does_not_overwrite_existing_secondary_copy(): void
    {
        config(['services.translation.driver' => 'fake']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => 'draft',
            'language' => 'en',
            'secondary_language' => 'ta',
            'headline' => 'English headline',
            'story' => 'English story',
        ]);

        WeddingTranslation::query()->create([
            'event_id' => $wedding->id,
            'locale' => 'ta',
            'content' => [
                'headline' => 'Hand-tuned Tamil headline',
            ],
        ]);

        $this->actingAs($user)
            ->post(route('weddings.publish', $wedding))
            ->assertRedirect();

        $row = WeddingTranslation::query()
            ->where('event_id', $wedding->id)
            ->where('locale', 'ta')
            ->first();

        $this->assertSame('Hand-tuned Tamil headline', $row->content['headline'] ?? null);
        $this->assertSame('[ta]English story', $row->content['story'] ?? null);
    }
}
