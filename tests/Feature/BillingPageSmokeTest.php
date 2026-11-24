<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingPageSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_billing_page_loads(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('billing.edit'))
            ->assertOk();
    }

    public function test_event_billing_page_loads_for_site(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'invitation_mode' => 'link',
            'site_billing_status' => 'draft_ready',
        ]);

        $this->actingAs($user)
            ->get(route('weddings.billing', $wedding))
            ->assertOk();
    }
}
