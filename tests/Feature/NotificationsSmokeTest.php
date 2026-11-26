<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\User;
use App\Services\Notifications\AppNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationsSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifications_index_uses_items_prop_and_renders(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('notifications.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('notifications/index')
                ->has('items')
                ->has('unread')
                ->missing('notifications.0')
            );
    }

    public function test_feed_clear_and_read_all_endpoints(): void
    {
        $user = User::factory()->create();
        $svc = app(AppNotificationService::class);

        $svc->push(
            $user,
            AppNotification::TYPE_RSVP,
            'smoke-rsvp',
            'New RSVP',
            'Guest replied',
            ['href' => '/guests'],
        );

        $this->actingAs($user)
            ->getJson(route('notifications.feed'))
            ->assertOk()
            ->assertJsonPath('unread', 1)
            ->assertJsonCount(1, 'recent');

        $this->actingAs($user)
            ->postJson(route('notifications.read-all'))
            ->assertOk()
            ->assertJsonPath('unread', 0);

        $svc->push(
            $user,
            AppNotification::TYPE_CELEBRATE,
            'smoke-celebrate',
            'Celebrate',
            'Someone celebrated',
        );

        $this->actingAs($user)
            ->postJson(route('notifications.clear'))
            ->assertOk()
            ->assertJsonPath('unread', 0)
            ->assertJsonPath('recent', []);

        $this->actingAs($user)
            ->get(route('notifications.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('notifications/index')
                ->where('items.0.cleared', true)
            );
    }

    public function test_shared_notifications_snapshot_shape(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('notifications.unread')
                ->has('notifications.recent')
            );
    }
}
