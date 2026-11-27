<?php

namespace App\Console\Commands;

use App\Models\EventCard;
use App\Models\EventType;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingEvent;
use App\Services\Billing\SiteBillingService;
use App\Services\WeddingPublishingService;
use App\Services\WeddingService;
use App\Support\CardLibrary;
use App\Support\InviteHost;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PrepareReelDemoCommand extends Command
{
    protected $signature = 'reel:prepare-demo
        {--email=demo@invidora.com : Demo login email}
        {--password=InvidoraDemo2026! : Demo login password}
        {--slug=elena-marcus : Public invite slug}';

    protected $description = 'Seed a polished global-audience wedding demo (card + live site + RSVP + share) for Instagram Reels.';

    public function handle(
        WeddingService $weddings,
        SiteBillingService $siteBilling,
        WeddingPublishingService $publishing,
    ): int {
        $email = strtolower(trim((string) $this->option('email')));
        $password = (string) $this->option('password');
        $slug = strtolower(trim((string) $this->option('slug')));

        $user = User::query()->where('email', $email)->first();
        if ($user === null) {
            $user = User::factory()->create([
                'name' => 'Invidora Demo Studio',
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'plan' => 'pro',
                'message_credits' => 100,
                'plan_ends_at' => now()->addYear(),
                'disabled_at' => null,
            ]);
            $this->info("Created user {$email}");
        } else {
            $user->forceFill([
                'name' => 'Invidora Demo Studio',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'plan' => 'pro',
                'message_credits' => 100,
                'plan_ends_at' => now()->addYear(),
                'disabled_at' => null,
            ])->save();
            $this->info("Updated user {$email}");
        }

        $weddingTypeId = EventType::query()->where('slug', 'wedding')->value('id');

        $payload = [
            'slug' => $slug,
            'title' => 'Elena & Marcus',
            'headline' => 'Together with our families',
            'host_message' => 'We would be honoured to celebrate with you — wherever in the world you join us from.',
            'story' => 'From a rainy afternoon in London to sunsets over the Aegean, our story has always been about finding home in each other. We can’t wait to welcome friends and family from every corner of the world.',
            'invitation_mode' => 'both',
            'event_type_id' => $weddingTypeId,
            'starts_on' => '2026-09-19',
            'starts_at' => '17:00',
            'timezone' => 'Europe/Athens',
            'venue_name' => 'Canaves Oia Epitome',
            'venue_address' => 'Oia, Santorini 847 02',
            'city' => 'Santorini',
            'state' => 'South Aegean',
            'country' => 'Greece',
            'theme' => 'classic',
            'style' => 'modern',
            'cultural_template' => null,
            'language' => 'en',
            'music_enabled' => false,
            'bride_name' => 'Elena Rossi',
            'groom_name' => 'Marcus Chen',
            'generate_card' => true,
            'card_format' => 'portrait',
            'details' => [
                'dress_code' => 'Cocktail / elegant summer evening',
                'rsvp_deadline' => '2026-08-15',
                'travel_note' => 'Guests flying in: nearest airport is JTR (Santorini). Ferry connections from Athens also available.',
            ],
        ];

        $wedding = Wedding::withTrashed()->where('slug', $slug)->first();
        if ($wedding !== null && $wedding->trashed()) {
            $wedding->restore();
        }

        if ($wedding === null) {
            $wedding = $weddings->createWithoutQuota($user->id, $payload);
            $this->info("Created wedding #{$wedding->id}");
        } else {
            $wedding->forceFill([
                'user_id' => $user->id,
                'title' => $payload['title'],
                'headline' => $payload['headline'],
                'host_message' => $payload['host_message'],
                'story' => $payload['story'],
                'invitation_mode' => 'both',
                'event_type_id' => $weddingTypeId,
                'starts_on' => $payload['starts_on'],
                'starts_at' => $payload['starts_at'],
                'timezone' => $payload['timezone'],
                'venue_name' => $payload['venue_name'],
                'venue_address' => $payload['venue_address'],
                'city' => $payload['city'],
                'state' => $payload['state'],
                'country' => $payload['country'],
                'theme' => $payload['theme'],
                'style' => $payload['style'],
                'cultural_template' => $payload['cultural_template'],
                'language' => 'en',
            ])->save();

            $wedding->hosts()->delete();
            $wedding->hosts()->createMany([
                ['name' => 'Elena Rossi', 'role' => 'bride', 'sort_order' => 1],
                ['name' => 'Marcus Chen', 'role' => 'groom', 'sort_order' => 2],
            ]);

            $wedding->setting()->updateOrCreate([], [
                'sections' => $weddings->defaultSections(),
                'details' => $payload['details'],
            ]);

            $this->info("Updated wedding #{$wedding->id}");
        }

        if ($wedding->events()->count() === 0) {
            WeddingEvent::query()->create([
                'event_id' => $wedding->id,
                'title' => 'Welcome drinks',
                'event_type' => 'welcome',
                'description' => 'Sunset cocktails overlooking the caldera — come as you are.',
                'event_date' => '2026-09-18',
                'start_time' => '18:30',
                'timezone' => 'Europe/Athens',
                'venue_name' => 'Canaves Oia Terrace',
                'city' => 'Santorini',
                'country' => 'Greece',
                'sort_order' => 1,
                'is_public' => true,
            ]);
            WeddingEvent::query()->create([
                'event_id' => $wedding->id,
                'title' => 'Wedding ceremony',
                'event_type' => 'ceremony',
                'description' => 'An intimate ceremony with vows, music, and the Aegean behind us.',
                'event_date' => '2026-09-19',
                'start_time' => '17:00',
                'timezone' => 'Europe/Athens',
                'venue_name' => 'Canaves Oia Epitome',
                'city' => 'Santorini',
                'country' => 'Greece',
                'sort_order' => 2,
                'is_public' => true,
            ]);
            WeddingEvent::query()->create([
                'event_id' => $wedding->id,
                'title' => 'Dinner & celebration',
                'event_type' => 'reception',
                'description' => 'Dinner under the stars, then dancing until late.',
                'event_date' => '2026-09-19',
                'start_time' => '20:00',
                'timezone' => 'Europe/Athens',
                'venue_name' => 'Canaves Oia Epitome',
                'city' => 'Santorini',
                'country' => 'Greece',
                'sort_order' => 3,
                'is_public' => true,
            ]);
            $this->info('Added schedule events');
        }

        if ($wedding->card === null) {
            $preset = CardLibrary::preset('portrait');
            EventCard::query()->create([
                'event_id' => $wedding->id,
                'format' => $preset['format'],
                'width' => $preset['width'],
                'height' => $preset['height'],
                'status' => 'generated',
                'document' => CardLibrary::document($wedding->fresh(), null, true),
            ]);
            $this->info('Created invitation card');
        } else {
            $wedding->card->forceFill([
                'status' => 'generated',
                'document' => CardLibrary::document($wedding->fresh(), null, true),
            ])->save();
            $this->info('Refreshed invitation card');
        }

        if ($wedding->guests()->count() < 3) {
            $samples = [
                ['first_name' => 'Sofia', 'last_name' => 'Bianchi', 'email' => 'sofia.guest@example.com', 'phone' => '390123456789', 'country_code' => '+39'],
                ['first_name' => 'James', 'last_name' => 'Okoro', 'email' => 'james.guest@example.com', 'phone' => '447700900123', 'country_code' => '+44'],
                ['first_name' => 'Aya', 'last_name' => 'Nakamura', 'email' => 'aya.guest@example.com', 'phone' => '819012345678', 'country_code' => '+81'],
            ];
            foreach ($samples as $g) {
                $wedding->guests()->create([
                    'first_name' => $g['first_name'],
                    'last_name' => $g['last_name'],
                    'email' => $g['email'],
                    'phone' => $g['phone'],
                    'country_code' => $g['country_code'],
                    'guest_token' => Str::random(40),
                    'number_of_guests' => 1,
                ]);
            }
            $this->info('Added international demo guests');
        }

        $siteBilling->activatePaidWindow($wedding->fresh(), now(), now()->addDays(60));
        $wedding = $publishing->publish($wedding->fresh(), skipBillingHook: true);

        $guest = $wedding->guests()->first();
        $notes = [
            'env' => app()->environment(),
            'email' => $email,
            'password' => $password,
            'wedding_id' => $wedding->id,
            'slug' => $wedding->slug,
            'status' => $wedding->status?->value ?? (string) $wedding->status,
            'couple' => 'Elena Rossi & Marcus Chen',
            'location' => 'Santorini, Greece',
            'studio' => url('/events/'.$wedding->id),
            'card_editor' => url('/events/'.$wedding->id.'/card'),
            'preview' => url('/events/'.$wedding->id.'/preview?from=edit'),
            'public_site' => InviteHost::publicUrl($wedding->slug),
            'guest_rsvp' => $guest
                ? InviteHost::guestUrl($wedding->slug, (string) $guest->guest_token)
                : null,
            'login' => url('/login'),
        ];

        $path = storage_path('app/reel-demo-account.json');
        file_put_contents($path, json_encode($notes, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");

        $docs = base_path('documents/reel-demo-account.json');
        if (is_dir(dirname($docs))) {
            file_put_contents($docs, json_encode($notes, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");
        }

        $this->newLine();
        $this->info('=== GLOBAL REEL DEMO READY ===');
        foreach ($notes as $key => $value) {
            $this->line(str_pad($key, 14).': '.(string) $value);
        }
        $this->line('Saved: '.$path);

        return self::SUCCESS;
    }
}
