<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wedding;
use App\Services\InvitationPasscode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InvitationPasscodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_enabled_passcode_gates_the_public_invite_until_unlocked(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'slug' => 'passcode-gated',
        ]);

        $wedding->setting()->updateOrCreate([], [
            'details' => [
                'site_passcode_enabled' => '1',
                'site_passcode_hash' => Hash::make('forever2027'),
            ],
        ]);

        $this->get(route('weddings.public', $wedding->slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('public/passcode'));

        $this->post(route('weddings.unlock', $wedding->slug), [
            'passcode' => 'wrong-code',
            'return_to' => '/invite/passcode-gated',
        ])->assertRedirect()->assertSessionHasErrors('passcode');

        $this->post(route('weddings.unlock', $wedding->slug), [
            'passcode' => 'forever2027',
            'return_to' => '/invite/passcode-gated',
        ])->assertRedirect('/invite/passcode-gated');

        $this->get(route('weddings.public', $wedding->slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('public/wedding'));
    }

    public function test_changing_the_passcode_hash_invalidates_a_prior_session_unlock(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'slug' => 'passcode-rotate',
        ]);

        $wedding->setting()->updateOrCreate([], [
            'details' => [
                'site_passcode_enabled' => '1',
                'site_passcode_hash' => Hash::make('first-code'),
            ],
        ]);

        $passcode = app(InvitationPasscode::class);
        $this->assertTrue($passcode->check($wedding->fresh(), 'first-code'));
        $passcode->unlock($wedding->fresh());
        $this->assertTrue($passcode->isUnlocked($wedding->fresh()));

        $wedding->setting()->update([
            'details' => [
                'site_passcode_enabled' => '1',
                'site_passcode_hash' => Hash::make('second-code'),
            ],
        ]);

        $this->assertFalse($passcode->isUnlocked($wedding->fresh()));
    }
}
