<?php

namespace Tests\Feature;

use App\Enums\RsvpStatus;
use App\Enums\WeddingStatus;
use App\Models\GuestPhoto;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingSetting;
use App\Notifications\RsvpThankYou;
use App\Support\DesignGallery;
use App\Support\EventCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HostOpsBatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_rsvp_deadline_blocks_late_replies(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);
        WeddingSetting::query()->updateOrCreate(
            ['event_id' => $wedding->id],
            ['details' => ['rsvp_deadline' => now()->subDay()->toDateString(), 'rsvp_soft_close' => '1']],
        );

        $this->from(route('weddings.public', $wedding->slug))
            ->post(route('weddings.rsvp', $wedding->slug), [
                'guest_name' => 'Late Guest',
                'email' => 'late@example.com',
                'status' => RsvpStatus::Attending->value,
                'guest_count' => 1,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('status');
    }

    public function test_thank_you_email_sent_when_enabled(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);
        WeddingSetting::query()->updateOrCreate(
            ['event_id' => $wedding->id],
            ['details' => ['rsvp_thank_you_enabled' => '1']],
        );

        $this->post(route('weddings.rsvp', $wedding->slug), [
            'guest_name' => 'Priya',
            'email' => 'priya@example.com',
            'status' => RsvpStatus::Attending->value,
            'guest_count' => 2,
        ])->assertRedirect();

        Notification::assertSentOnDemand(RsvpThankYou::class);
    }

    public function test_guest_photo_upload_and_moderation(): void
    {
        Storage::fake('public');
        Notification::fake();

        $user = User::factory()->create();
        $wedding = Wedding::factory()->create([
            'user_id' => $user->id,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);
        WeddingSetting::query()->updateOrCreate(
            ['event_id' => $wedding->id],
            ['details' => ['photo_wall_enabled' => '1']],
        );

        $file = UploadedFile::fake()->image('moment.jpg', 800, 800);

        $this->post(route('weddings.guest-photos.store', $wedding->slug), [
            'name' => 'Arun',
            'caption' => 'Dance floor',
            'photo' => $file,
        ])->assertRedirect();

        $photo = GuestPhoto::query()->where('event_id', $wedding->id)->firstOrFail();
        $this->assertSame('pending', $photo->status->value);

        $this->actingAs($user)
            ->post(route('weddings.guest-photos.approve', [$wedding, $photo]))
            ->assertRedirect();

        $this->assertSame('approved', $photo->fresh()->status->value);
    }

    public function test_budget_details_can_be_saved(): void
    {
        $user = User::factory()->create();
        $wedding = Wedding::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->put(route('weddings.update', $wedding), [
                'details' => [
                    'budget_enabled' => '1',
                    'budget_currency' => 'INR',
                    'budget_total' => '1500000',
                    'budget_json' => json_encode([
                        [
                            'id' => 'venue',
                            'label' => 'Venue & hospitality',
                            'category' => 'Venue',
                            'planned' => 375000,
                            'actual' => 400000,
                            'paid' => 100000,
                            'vendor' => 'Grand Lawn',
                            'due_date' => '2026-12-01',
                            'notes' => '40% deposit',
                            'suggested_pct' => 25,
                        ],
                    ], JSON_THROW_ON_ERROR),
                ],
            ])
            ->assertRedirect();

        $details = $wedding->fresh('setting')->setting?->details ?? [];
        $this->assertSame('1', $details['budget_enabled'] ?? null);
        $this->assertSame('1500000', $details['budget_total'] ?? null);
        $this->assertStringContainsString('Venue', (string) ($details['budget_json'] ?? ''));
        $this->assertStringContainsString('Grand Lawn', (string) ($details['budget_json'] ?? ''));
    }

    public function test_gallery_aliases_cover_core_event_types(): void
    {
        $gallery = collect(DesignGallery::index());
        $covered = 0;
        $total = 0;

        foreach (EventCatalog::definitions() as $type) {
            $total++;
            $match = $gallery->first(function (array $row) use ($type): bool {
                return $row['slug'] === $type['slug']
                    || $row['event_type'] === $type['slug']
                    || in_array($type['slug'], $row['aliases'] ?? [], true);
            });
            if ($match !== null) {
                $covered++;
            }
        }

        $this->assertGreaterThanOrEqual((int) floor($total * 0.85), $covered);
    }
}
