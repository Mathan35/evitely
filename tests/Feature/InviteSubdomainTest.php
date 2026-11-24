<?php

namespace Tests\Feature;

use App\Enums\WeddingStatus;
use App\Models\User;
use App\Models\Wedding;
use App\Support\InviteHost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InviteSubdomainTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.url' => 'http://evitely.test',
            'wedding.invite_root_domain' => 'evitely.test',
            'wedding.invite_subdomains_enabled' => true,
        ]);
    }

    public function test_subdomain_serves_published_invite(): void
    {
        $wedding = $this->publishedWedding('emma-and-alex');

        $this->get('http://emma-and-alex.evitely.test/')
            ->assertOk();
    }

    public function test_path_invite_still_works_alongside_subdomain(): void
    {
        $wedding = $this->publishedWedding('emma-and-alex');

        $this->get('http://evitely.test/invite/emma-and-alex')
            ->assertOk();
    }

    public function test_reserved_subdomain_is_not_an_invite(): void
    {
        $this->publishedWedding('www');

        $this->get('http://www.evitely.test/')
            ->assertNotFound();
    }

    public function test_reserved_labels_cannot_be_claimed_as_slug(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('weddings.store'), [
                'bride_name' => 'Asha',
                'groom_name' => 'Rohan',
                'slug' => 'www',
                'occasion' => 'wedding',
                'invitation_mode' => 'both',
            ])
            ->assertRedirect();

        $wedding = Wedding::query()->where('user_id', $user->id)->latest('id')->first();
        $this->assertNotNull($wedding);
        $this->assertNotSame('www', $wedding->slug);
        $this->assertFalse(InviteHost::isReserved($wedding->slug));
    }

    public function test_share_url_prefers_subdomain_when_enabled(): void
    {
        $wedding = $this->publishedWedding('priya-arun');

        $this->assertSame(
            'http://priya-arun.evitely.test',
            rtrim(InviteHost::publicUrl('priya-arun'), '/'),
        );

        $this->actingAs($wedding->user)
            ->get(route('weddings.edit', $wedding))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('wedding.subdomains_enabled', true)
                ->where('wedding.slug', 'priya-arun')
                ->where('wedding.subdomain_host', 'priya-arun.evitely.test'));
    }

    private function publishedWedding(string $slug): Wedding
    {
        $user = User::factory()->create();

        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'slug' => $slug,
            'status' => WeddingStatus::Published,
        ]);

        return $wedding->fresh(['user', 'setting', 'eventType']) ?? $wedding;
    }
}
