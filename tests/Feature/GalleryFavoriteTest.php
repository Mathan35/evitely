<?php

namespace Tests\Feature;

use App\Models\GalleryFavorite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GalleryFavoriteTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_when_saving_a_favorite(): void
    {
        $this->post('/favorites', ['design_id' => 'wedding-link-glasshouse'])
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_save_and_remove_favorites(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/designs/wedding')
            ->post('/favorites', ['design_id' => 'wedding-link-glasshouse'])
            ->assertRedirect('/designs/wedding');

        $this->assertDatabaseHas('gallery_favorites', [
            'user_id' => $user->id,
            'design_id' => 'wedding-link-glasshouse',
        ]);

        $this->actingAs($user)
            ->from('/designs/wedding')
            ->delete('/favorites', ['design_id' => 'wedding-link-glasshouse'])
            ->assertRedirect('/designs/wedding');

        $this->assertDatabaseMissing('gallery_favorites', [
            'user_id' => $user->id,
            'design_id' => 'wedding-link-glasshouse',
        ]);
    }

    public function test_favorites_are_scoped_to_the_signed_in_user(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        GalleryFavorite::query()->create([
            'user_id' => $owner->id,
            'design_id' => 'party-link-neon-glow',
        ]);

        $this->actingAs($other)
            ->get('/designs')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('galleryFavoriteIds', []));

        $this->actingAs($owner)
            ->get('/designs')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('galleryFavoriteIds', ['party-link-neon-glow']));
    }
}
