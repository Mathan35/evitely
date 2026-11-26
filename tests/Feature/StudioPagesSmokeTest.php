<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudioPagesSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_core_studio_pages_load_for_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertOk();
        $this->actingAs($user)->get(route('guests.index'))->assertOk();
        $this->actingAs($user)->get(route('analytics'))->assertOk();
        $this->actingAs($user)->get(route('profile.edit'))->assertOk();
        $this->actingAs($user)->get(route('billing.edit'))->assertOk();
        $this->actingAs($user)->get(route('notifications.index'))->assertOk();
        $this->actingAs($user)->get(route('notifications.feed'))->assertOk();
    }

    public function test_guest_is_redirected_from_studio_pages(): void
    {
        $this->get(route('dashboard'))->assertRedirect();
        $this->get(route('notifications.index'))->assertRedirect();
        $this->get(route('guests.index'))->assertRedirect();
    }
}
