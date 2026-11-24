<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingTranslation;
use App\Services\InvitationTranslationSync;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class AllLocalesTranslationTest extends TestCase
{
    use RefreshDatabase;

    public function test_wrong_script_secondary_copy_is_detected_and_force_rebuilt(): void
    {
        config(['services.translation.driver' => 'fake']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'language' => 'en',
            'secondary_language' => 'es',
            'headline' => 'Together forever',
            'story' => 'Our love story',
            'host_message' => 'Join us',
        ]);

        WeddingTranslation::query()->create([
            'event_id' => $wedding->id,
            'locale' => 'es',
            'content' => [
                'headline' => 'कैप्स बंद हैं!',
                'story' => 'कड़ी मेहनत सफल हो गई है',
                'hero_message' => 'हिन्दी पाठ',
            ],
        ]);

        $sync = app(InvitationTranslationSync::class);
        $this->assertTrue($sync->contentMismatchesLocale('es', [
            'headline' => 'कैप्स बंद हैं!',
        ]));

        $result = $sync->sync($wedding->fresh(['setting', 'hosts', 'translations']));
        $this->assertTrue($result['synced']);
        $this->assertTrue($result['forced']);

        $row = WeddingTranslation::query()
            ->where('event_id', $wedding->id)
            ->where('locale', 'es')
            ->first();

        $this->assertNotNull($row);
        $this->assertSame('[es]Together forever', $row->content['headline'] ?? null);
        $this->assertSame('[es]Our love story', $row->content['story'] ?? null);
        $this->assertFalse($sync->contentMismatchesLocale('es', $row->content));
    }

    public function test_every_preference_locale_can_be_synced_as_secondary(): void
    {
        config(['services.translation.driver' => 'fake']);

        $user = User::factory()->create();
        $locales = array_keys(config('wedding.locales'));
        $this->assertNotEmpty($locales);

        foreach ($locales as $locale) {
            if ($locale === 'en') {
                continue;
            }

            $wedding = Wedding::factory()->published()->create([
                'user_id' => $user->id,
                'language' => 'en',
                'secondary_language' => $locale,
                'headline' => 'Hello celebration',
                'story' => 'Story body',
                'host_message' => 'Host note',
            ]);
            $wedding->setting()->updateOrCreate([], [
                'details' => [
                    'hero_message' => 'Hero line',
                    'gallery_title' => 'Gallery title',
                ],
            ]);

            $result = app(InvitationTranslationSync::class)->sync(
                $wedding->fresh(['setting', 'hosts', 'translations']),
                force: true,
            );

            $this->assertTrue($result['synced'], "Expected sync for {$locale}");
            $this->assertSame($locale, $result['locale']);

            $row = WeddingTranslation::query()
                ->where('event_id', $wedding->id)
                ->where('locale', $locale)
                ->first();

            $this->assertNotNull($row, "Missing translation row for {$locale}");
            $this->assertSame("[{$locale}]Hello celebration", $row->content['headline'] ?? null);
            $this->assertSame("[{$locale}]Hero line", $row->content['hero_message'] ?? null);

            $this->get(route('weddings.public', ['slug' => $wedding->slug, 'lang' => $locale]))
                ->assertOk()
                ->assertInertia(fn (AssertableInertia $page) => $page
                    ->where('wedding.locale', $locale)
                    ->where('wedding.headline', "[{$locale}]Hello celebration")
                    ->where('wedding.details.hero_message', "[{$locale}]Hero line")
                    ->where('wedding.primary.headline', 'Hello celebration')
                );
        }
    }

    public function test_changing_secondary_language_force_rebuilds_copy(): void
    {
        config(['services.translation.driver' => 'fake']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'language' => 'en',
            'secondary_language' => 'hi',
            'headline' => 'Together forever',
            'story' => 'Our love story',
        ]);

        WeddingTranslation::query()->create([
            'event_id' => $wedding->id,
            'locale' => 'hi',
            'content' => [
                'headline' => 'पुराना हिन्दी',
                'story' => 'पुरानी कहानी',
            ],
        ]);

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'bride_name' => 'Asha',
                'groom_name' => 'Rohan',
                'wedding_date' => '2027-06-20',
                'wedding_time' => '16:30',
                'timezone' => 'Asia/Kolkata',
                'language' => 'en',
                'secondary_language' => 'es',
                'translation_locale' => 'es',
                'translation' => [
                    'headline' => 'पुराना हिन्दी',
                    'story' => 'पुरानी कहानी',
                ],
                'theme' => 'classic',
                'style' => 'indian',
                'sections' => ['hero' => true, 'story' => true, 'rsvp' => true],
            ])
            ->assertRedirect();

        $es = WeddingTranslation::query()
            ->where('event_id', $wedding->id)
            ->where('locale', 'es')
            ->first();

        $this->assertNotNull($es);
        $this->assertSame('[es]Together forever', $es->content['headline'] ?? null);
        $this->assertStringNotContainsString('हिन्दी', (string) ($es->content['headline'] ?? ''));
    }
}
