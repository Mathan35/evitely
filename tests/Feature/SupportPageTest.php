<?php

namespace Tests\Feature;

use App\Models\SupportMessage;
use App\Notifications\SupportMessageReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SupportPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_support_page_renders(): void
    {
        $this->get(route('support'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('support')
                ->has('topics')
                ->has('faqs')
                ->has('prefill'));
    }

    public function test_support_form_stores_message_and_notifies_admins(): void
    {
        Notification::fake();
        config(['platform.admin_emails' => ['owner@example.com']]);

        $this->post(route('support.store'), [
            'name' => 'Alex Host',
            'email' => 'alex@example.com',
            'topic' => 'bug',
            'message' => 'The publish button stays disabled after saving.',
            'page_url' => '/events/1/edit',
            'company' => '',
        ])
            ->assertRedirect(route('support'))
            ->assertSessionHas('support_sent', true);

        $this->assertDatabaseHas('support_messages', [
            'email' => 'alex@example.com',
            'topic' => 'bug',
            'name' => 'Alex Host',
            'status' => 'new',
        ]);

        Notification::assertSentOnDemand(SupportMessageReceived::class);
    }

    public function test_support_honeypot_skips_storage(): void
    {
        Notification::fake();
        config(['platform.admin_emails' => ['owner@example.com']]);

        $this->post(route('support.store'), [
            'name' => 'Bot',
            'email' => 'bot@example.com',
            'topic' => 'help',
            'message' => 'This should be ignored because honeypot is filled.',
            'company' => 'Acme Spam Co',
        ])->assertRedirect(route('support'));

        $this->assertSame(0, SupportMessage::query()->count());
        Notification::assertNothingSent();
    }

    public function test_support_form_validates_required_fields(): void
    {
        $this->from(route('support'))
            ->post(route('support.store'), [])
            ->assertRedirect(route('support'))
            ->assertSessionHasErrors(['name', 'email', 'topic', 'message']);
    }
}
