<?php

namespace Tests\Feature;

use App\Enums\WeddingStatus;
use App\Models\AnalyticsEvent;
use App\Models\User;
use App\Models\Wedding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LiveAnalyticsExclusionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_views_are_counted_on_live_pages(): void
    {
        $wedding = Wedding::factory()->published()->create([
            'status' => WeddingStatus::Published,
        ]);

        $this->get(route('weddings.public', $wedding->slug))->assertOk();

        $this->assertTrue(
            AnalyticsEvent::query()
                ->where('event_id', $wedding->id)
                ->whereIn('type', ['view', 'unique_view'])
                ->exists()
        );
    }

    public function test_platform_admin_views_are_not_counted(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $admin = User::factory()->create(['email' => 'owner@example.com']);
        $wedding = Wedding::factory()->published()->create([
            'status' => WeddingStatus::Published,
        ]);

        $this->actingAs($admin)
            ->get(route('weddings.public', $wedding->slug))
            ->assertOk();

        $this->assertSame(
            0,
            AnalyticsEvent::query()->where('event_id', $wedding->id)->count()
        );
    }

    public function test_event_host_views_are_not_counted(): void
    {
        $host = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $host->id,
            'status' => WeddingStatus::Published,
        ]);

        $this->actingAs($host)
            ->get(route('weddings.public', $wedding->slug))
            ->assertOk();

        $this->assertSame(
            0,
            AnalyticsEvent::query()->where('event_id', $wedding->id)->count()
        );
    }

    public function test_platform_admin_live_share_is_not_counted(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $admin = User::factory()->create(['email' => 'owner@example.com']);
        $wedding = Wedding::factory()->published()->create([
            'status' => WeddingStatus::Published,
        ]);

        $this->actingAs($admin)
            ->post(route('weddings.share', $wedding->slug), ['channel' => 'copy'])
            ->assertRedirect();

        $this->assertSame(
            0,
            AnalyticsEvent::query()->where('event_id', $wedding->id)->where('type', 'share')->count()
        );
    }
}
