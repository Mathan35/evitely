<?php

namespace Tests\Feature;

use App\Models\SupportMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSupportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_support_inbox_and_message(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $admin = User::factory()->create(['email' => 'owner@example.com']);

        $message = SupportMessage::query()->create([
            'name' => 'Alex Host',
            'email' => 'alex@example.com',
            'topic' => 'bug',
            'message' => 'Publish stays disabled after save.',
            'status' => 'new',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.support.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/support/index')
                ->has('messages.data', 1)
                ->where('counts.new', 1));

        $this->actingAs($admin)
            ->get(route('admin.support.show', $message))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/support/show')
                ->where('message.id', $message->id)
                ->where('message.status', 'read'));

        $this->assertSame('read', $message->fresh()->status);
    }

    public function test_admin_can_resolve_support_message(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $admin = User::factory()->create(['email' => 'owner@example.com']);

        $message = SupportMessage::query()->create([
            'name' => 'Alex Host',
            'email' => 'alex@example.com',
            'topic' => 'help',
            'message' => 'How do I share on WhatsApp?',
            'status' => 'new',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.support.update', $message), ['status' => 'resolved'])
            ->assertRedirect();

        $message->refresh();
        $this->assertSame('resolved', $message->status);
        $this->assertNotNull($message->resolved_at);
    }

    public function test_mark_new_is_not_undone_by_show_auto_read(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $admin = User::factory()->create(['email' => 'owner@example.com']);

        $message = SupportMessage::query()->create([
            'name' => 'Alex Host',
            'email' => 'alex@example.com',
            'topic' => 'feedback',
            'message' => 'Love the gallery, more themes please.',
            'status' => 'read',
        ]);

        $this->actingAs($admin)
            ->from(route('admin.support.show', $message))
            ->post(route('admin.support.update', $message), ['status' => 'new'])
            ->assertRedirect();

        $this->actingAs($admin)
            ->get(route('admin.support.show', $message))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('message.status', 'new'));

        $this->assertSame('new', $message->fresh()->status);
    }

    public function test_non_admin_cannot_open_support_inbox(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $user = User::factory()->create(['email' => 'guest@example.com']);

        $this->actingAs($user)
            ->get(route('admin.support.index'))
            ->assertNotFound();
    }
}
