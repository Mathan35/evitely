<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TranslateContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_host_can_auto_translate_invitation_copy(): void
    {
        config(['services.translation.driver' => 'fake']);

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'language' => 'en',
            'secondary_language' => 'ta',
        ]);

        $this->actingAs($user)
            ->postJson(route('weddings.translate-content', $wedding), [
                'from' => 'en',
                'to' => 'ta',
                'fields' => [
                    'headline' => 'Hello',
                    'story' => 'Hello',
                    'hero_message' => 'Hello',
                ],
            ])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('fields.headline', '[ta]Hello')
            ->assertJsonPath('fields.story', '[ta]Hello')
            ->assertJsonPath('fields.hero_message', '[ta]Hello');
    }
}
