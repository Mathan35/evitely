<?php

namespace App\Services;

use App\Enums\InvitationDeliveryStatus;
use App\Enums\WeddingStatus;
use App\Models\EventType;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingSlugRedirect;
use App\Services\Billing\BillingService;
use App\Support\CardLibrary;
use App\Support\EventCatalog;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WeddingService
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(int $userId, array $attributes): Wedding
    {
        $user = User::query()->findOrFail($userId);
        $billing = app(BillingService::class);
        $mode = is_string($attributes['invitation_mode'] ?? null)
            ? (string) $attributes['invitation_mode']
            : null;
        $billing->assertCanCreateEvent($user, $mode);
        // Free-trial first site: switching templates replaces the unsaved draft.
        // Cards never consume the site slot, so do not discard drafts when creating a card.
        if ($billing->eventLimit($user) !== null && $mode !== 'card') {
            $billing->discardUnlistedDrafts($user);
        }

        return $this->persistNew($userId, $attributes);
    }

    /**
     * Admin / ops path: create an event without free-plan quota checks.
     * Regular self-serve create() is unchanged.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function createWithoutQuota(int $userId, array $attributes): Wedding
    {
        User::query()->findOrFail($userId);

        return $this->persistNew($userId, $attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function persistNew(int $userId, array $attributes): Wedding
    {
        return DB::transaction(function () use ($userId, $attributes): Wedding {
            $wedding = new Wedding;
            $wedding->user_id = $userId;
            $wedding->status = WeddingStatus::Draft;
            $this->fill($wedding, $attributes, true);
            $wedding->save();

            $details = is_array($attributes['details'] ?? null) ? $attributes['details'] : [];
            $wedding->setting()->create([
                'sections' => $this->sections($attributes),
                'seo' => $this->seo($attributes),
                'details' => $this->withReminderDefaults($details),
            ]);

            $this->syncNested($wedding, $attributes);
            $this->syncHosts($wedding, $attributes);
            $this->applyTemplate($wedding, $attributes);
            $this->ensureCard($wedding, $attributes);

            $wedding = $wedding->refresh(['setting', 'events', 'accommodations', 'travelDetails']);
            $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
            if (array_key_exists('schedule_json', $details)) {
                $decoded = json_decode((string) $details['schedule_json'], true);
                if (is_array($decoded)) {
                    app(ScheduleSync::class)->syncItinerary($wedding, $decoded);
                }
            } else {
                app(ScheduleSync::class)->importFromDetailsIfEmpty($wedding);
            }

            if (array_key_exists('travel_stays_json', $details) || array_key_exists('travel_stays_notes', $details)) {
                $staysRaw = $details['travel_stays_json'] ?? '[]';
                $staysDecoded = is_string($staysRaw) ? json_decode($staysRaw, true) : [];
                app(TravelStaysSync::class)->syncFromDetails(
                    $wedding,
                    is_array($staysDecoded) ? $staysDecoded : [],
                    isset($details['travel_stays_notes']) ? (string) $details['travel_stays_notes'] : null,
                );
            } else {
                app(TravelStaysSync::class)->importFromDetailsIfEmpty($wedding);
            }

            $fresh = $wedding->refresh();
            app(\App\Services\Billing\SiteBillingService::class)->ensureDraftReady($fresh);

            return $fresh->refresh();
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Wedding $wedding, array $attributes): Wedding
    {
        return DB::transaction(function () use ($wedding, $attributes): Wedding {
            $previousSecondary = trim((string) ($wedding->secondary_language ?: ''));

            $this->fill($wedding, $attributes, false);
            $wedding->save();

            $setting = $wedding->setting()->firstOrCreate([], [
                'sections' => $this->defaultSections(),
            ]);

            if (array_key_exists('sections', $attributes)) {
                $setting->sections = $this->sections($attributes);
            }

            if (array_key_exists('seo_title', $attributes) || array_key_exists('seo_description', $attributes)) {
                $setting->seo = $this->seo($attributes, $setting->seo ?? []);
            }

            $setting->save();

            $secondary = trim((string) ($wedding->secondary_language ?: ''));
            $secondaryChanged = array_key_exists('secondary_language', $attributes)
                && $previousSecondary !== $secondary;

            // Only persist secondary copy when it targets the active secondary locale.
            // Prevents saving Hindi (or any prior) draft under a newly chosen language.
            if (
                isset($attributes['translation_locale'], $attributes['translation'])
                && is_array($attributes['translation'])
                && is_string($attributes['translation_locale'])
                && $secondary !== ''
                && $attributes['translation_locale'] === $secondary
                && ! $secondaryChanged
            ) {
                $payload = collect($attributes['translation'])
                    ->map(fn ($value): string => is_string($value) ? trim($value) : '')
                    ->filter(fn (string $value): bool => $value !== '')
                    ->all();

                if ($payload !== []) {
                    $wedding->translations()->updateOrCreate(
                        ['locale' => $secondary],
                        ['content' => $attributes['translation']],
                    );
                }
            }

            if (isset($attributes['hosts']) || isset($attributes['bride_name']) || isset($attributes['host_name'])) {
                $this->syncHosts($wedding, $attributes);
            }

            if (isset($attributes['details']) && is_array($attributes['details'])) {
                $existing = is_array($setting->details) ? $setting->details : [];
                $normalized = app(InvitationPasscode::class)->normalizeDetails($attributes['details'], $existing);
                $setting->details = array_merge($existing, $normalized);
                $setting->save();

                // Location itinerary → event_schedules (single source of truth for calendar + site).
                if (array_key_exists('schedule_json', $normalized)) {
                    $decoded = json_decode((string) $normalized['schedule_json'], true);
                    if (is_array($decoded)) {
                        app(ScheduleSync::class)->syncItinerary($wedding->fresh(['setting', 'events']), $decoded);
                    }
                }

                // Core Extras travel/stays → accommodations + travel_details.
                if (array_key_exists('travel_stays_json', $normalized) || array_key_exists('travel_stays_notes', $normalized)) {
                    $fresh = $wedding->fresh(['setting', 'accommodations', 'travelDetails']);
                    $detailsNow = is_array($fresh?->setting?->details) ? $fresh->setting->details : [];
                    $staysRaw = $detailsNow['travel_stays_json'] ?? '[]';
                    $staysDecoded = is_string($staysRaw) ? json_decode($staysRaw, true) : [];
                    app(TravelStaysSync::class)->syncFromDetails(
                        $fresh,
                        is_array($staysDecoded) ? $staysDecoded : [],
                        isset($detailsNow['travel_stays_notes']) ? (string) $detailsNow['travel_stays_notes'] : null,
                    );
                }
            }

            $wedding = $wedding->refresh(['setting', 'events', 'accommodations', 'travelDetails']);
            app(ScheduleSync::class)->importFromDetailsIfEmpty($wedding);
            app(TravelStaysSync::class)->importFromDetailsIfEmpty($wedding);

            $sync = app(InvitationTranslationSync::class);
            if ($secondaryChanged && $secondary !== '') {
                // Rebuild secondary copy for the new language so stale script cannot linger.
                $sync->sync($wedding, force: true);
            } elseif ($wedding->status === WeddingStatus::Published) {
                // Fill gaps / auto-repair wrong-script rows without clobbering good edits.
                $sync->sync($wedding);
            }

            return $wedding->refresh();
        });
    }

    public function delete(Wedding $wedding): void
    {
        $wedding->delete();
    }

    public function duplicate(Wedding $wedding): Wedding
    {
        $owner = User::query()->findOrFail($wedding->user_id);
        app(BillingService::class)->assertCanCreateEvent($owner, $wedding->invitation_mode);

        return DB::transaction(function () use ($wedding): Wedding {
            $copy = $wedding->replicate([
                'slug',
                'status',
                'published_at',
            ]);
            $copy->user_id = $wedding->user_id;
            $copy->slug = $this->uniqueSlug(($wedding->title ?: 'celebration').' copy');
            $copy->status = WeddingStatus::Draft;
            $copy->published_at = null;
            $copy->save();

            $setting = $wedding->setting;
            $copy->setting()->create([
                'sections' => $setting?->sections ?? $this->defaultSections(),
                'seo' => $setting?->seo,
                'details' => $setting?->details,
            ]);

            foreach ($wedding->hosts as $host) {
                $copy->hosts()->create($host->only(['name', 'role', 'photo', 'description', 'sort_order']));
            }

            if ($wedding->card) {
                $copy->card()->create($wedding->card->only(['format', 'width', 'height', 'status', 'document']));
            }

            foreach ($wedding->events as $event) {
                $copy->events()->create($event->only($event->getFillable()));
            }

            foreach ($wedding->photos as $photo) {
                $copy->photos()->create($photo->only(['path', 'caption', 'sort_order', 'is_cover']));
            }

            foreach ($wedding->travelDetails as $detail) {
                $copy->travelDetails()->create($detail->only(['kind', 'title', 'description', 'sort_order']));
            }

            foreach ($wedding->accommodations as $stay) {
                $copy->accommodations()->create($stay->only([
                    'hotel_name', 'address', 'phone', 'website', 'booking_url', 'price_info', 'description', 'sort_order',
                ]));
            }

            foreach ($wedding->translations as $translation) {
                $copy->translations()->create($translation->only(['locale', 'content']));
            }

            foreach ($wedding->groups as $group) {
                $copy->groups()->create($group->only(['name', 'description']));
            }

            return $copy->refresh();
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function fill(Wedding $wedding, array $attributes, bool $creating): void
    {
        $wedding->fill(Arr::only($attributes, [
            'title', 'description', 'invitation_mode', 'event_type_id',
            'starts_on', 'starts_at', 'timezone', 'venue_name', 'venue_address', 'city',
            'state', 'country', 'latitude', 'longitude', 'story', 'headline', 'host_message',
            'theme', 'style', 'cultural_template', 'language', 'secondary_language', 'music_url',
            'music_enabled',
        ]));

        if (isset($attributes['wedding_date']) && ! isset($attributes['starts_on'])) {
            $wedding->starts_on = $attributes['wedding_date'];
        }

        if (isset($attributes['wedding_time']) && ! isset($attributes['starts_at'])) {
            $wedding->starts_at = $attributes['wedding_time'];
        }

        if ($creating && blank($wedding->title)) {
            $wedding->title = trim(($attributes['bride_name'] ?? '').' & '.($attributes['groom_name'] ?? ''), ' &');
        }

        if ($creating && blank($wedding->invitation_mode)) {
            $wedding->invitation_mode = $attributes['invitation_mode'] ?? 'both';
        }

        if (blank($wedding->event_type_id)) {
            $slug = $attributes['event_type'] ?? 'wedding';
            $wedding->event_type_id = EventType::query()->where('slug', $slug)->value('id');
        }

        if ($creating || (isset($attributes['slug']) && $attributes['slug'] !== $wedding->slug)) {
            $requested = isset($attributes['slug']) && is_string($attributes['slug']) && $attributes['slug'] !== ''
                ? $attributes['slug']
                : ($wedding->title ?: 'celebration');
            $slug = $this->uniqueSlug($requested, $wedding->id);

            if (! $creating && $wedding->exists && $wedding->slug !== $slug) {
                WeddingSlugRedirect::query()->updateOrCreate(
                    ['slug' => $wedding->slug],
                    ['event_id' => $wedding->id],
                );
            }

            $wedding->slug = $slug;
        }

        if (! $wedding->timezone) {
            $wedding->timezone = 'Asia/Kolkata';
        }

        if (! $wedding->theme) {
            $slug = $attributes['event_type'] ?? 'wedding';
            $wedding->theme = $this->themeFor($slug);
        }

        if (! $wedding->style) {
            $wedding->style = 'indian';
        }

        if (! $wedding->language) {
            $wedding->language = 'en';
        }

        if (! $wedding->invitation_mode) {
            $wedding->invitation_mode = 'both';
        }
    }

    public function uniqueSlug(string $source, ?int $ignoreWeddingId = null): string
    {
        $base = Str::slug($source);
        $base = $base !== '' ? $base : 'celebration';
        $slug = $base;
        $suffix = 2;

        while ($this->slugTaken($slug, $ignoreWeddingId)) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function syncHosts(Wedding $wedding, array $attributes): void
    {
        $hosts = $attributes['hosts'] ?? null;

        if (! is_array($hosts)) {
            $hosts = [];
            $occasion = strtolower((string) ($wedding->eventType?->slug ?? $attributes['event_type'] ?? $attributes['occasion'] ?? ''));
            // These events reuse bride_display_name for non-host labels (baby name,
            // event title). Never promote those into the host row used by the intro.
            $displayIsNotHost = in_array($occasion, [
                'baby-shower', 'baby-naming', 'naming-ceremony', 'baby',
                'corporate', 'corporate-event', 'business-event', 'conference',
                'seminar', 'workshop', 'product-launch',
            ], true);

            if (filled($attributes['bride_name'] ?? null)) {
                $brideHost = $displayIsNotHost
                    ? $attributes['bride_name']
                    : ($attributes['bride_display_name'] ?? $attributes['bride_name']);
                $hosts[] = ['name' => $brideHost, 'role' => 'bride'];
            }

            if (filled($attributes['groom_name'] ?? null)) {
                $groomHost = $displayIsNotHost
                    ? $attributes['groom_name']
                    : ($attributes['groom_display_name'] ?? $attributes['groom_name']);
                $hosts[] = ['name' => $groomHost, 'role' => 'groom'];
            }

            if (filled($attributes['host_name'] ?? null)) {
                $hosts[] = ['name' => $attributes['host_name'], 'role' => $attributes['host_role'] ?? 'host'];
            }
        }

        $namesTouched = is_array($attributes['hosts'] ?? null)
            || array_key_exists('bride_name', $attributes)
            || array_key_exists('groom_name', $attributes)
            || array_key_exists('host_name', $attributes);

        if ($hosts === []) {
            if ($namesTouched) {
                $wedding->hosts()->delete();
            }

            return;
        }

        $wedding->hosts()->delete();

        foreach (array_values($hosts) as $index => $host) {
            if (! is_array($host) || blank($host['name'] ?? null)) {
                continue;
            }

            $wedding->hosts()->create([
                'name' => $host['name'],
                'role' => $host['role'] ?? 'host',
                'photo' => $host['photo'] ?? null,
                'description' => $host['description'] ?? null,
                'sort_order' => $index + 1,
            ]);
        }
    }

    private function slugTaken(string $slug, ?int $ignoreWeddingId): bool
    {
        if (\App\Support\InviteHost::isReserved($slug)) {
            return true;
        }

        $weddingTaken = Wedding::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreWeddingId, fn ($query) => $query->where('id', '!=', $ignoreWeddingId))
            ->exists();

        if ($weddingTaken) {
            return true;
        }

        return WeddingSlugRedirect::query()
            ->where('slug', $slug)
            ->when($ignoreWeddingId, fn ($query) => $query->where('event_id', '!=', $ignoreWeddingId))
            ->exists();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function syncNested(Wedding $wedding, array $attributes): void
    {
        foreach ($attributes['events'] ?? [] as $index => $event) {
            if (! is_array($event) || blank($event['title'] ?? null)) {
                continue;
            }

            $wedding->events()->create([
                ...Arr::only($event, [
                    'title', 'event_type', 'description', 'event_date', 'start_time', 'end_time',
                    'timezone', 'venue_name', 'venue_address', 'city', 'state', 'country',
                    'dress_code', 'is_public',
                ]),
                'sort_order' => $event['sort_order'] ?? $index + 1,
                'timezone' => $event['timezone'] ?? $wedding->timezone,
                'event_type' => $event['event_type'] ?? 'custom',
                'is_public' => $event['is_public'] ?? true,
            ]);
        }

        foreach ($attributes['travel'] ?? [] as $index => $item) {
            if (! is_array($item) || blank($item['title'] ?? null)) {
                continue;
            }

            $wedding->travelDetails()->create([
                'kind' => $item['kind'] ?? 'directions',
                'title' => $item['title'],
                'description' => $item['description'] ?? null,
                'sort_order' => $index + 1,
            ]);
        }

        foreach ($attributes['accommodations'] ?? [] as $index => $item) {
            if (! is_array($item) || blank($item['hotel_name'] ?? null)) {
                continue;
            }

            $wedding->accommodations()->create([
                ...Arr::only($item, ['hotel_name', 'address', 'phone', 'website', 'booking_url', 'price_info', 'description']),
                'sort_order' => $index + 1,
            ]);
        }

        foreach ($attributes['guests'] ?? [] as $guest) {
            if (! is_array($guest) || blank($guest['first_name'] ?? null)) {
                continue;
            }

            $wedding->guests()->create([
                'first_name' => $guest['first_name'],
                'last_name' => $guest['last_name'] ?? null,
                'email' => $guest['email'] ?? null,
                'phone' => $guest['phone'] ?? null,
                'country_code' => $guest['country_code'] ?? null,
                'relationship' => $guest['relationship'] ?? null,
                'number_of_guests' => $guest['number_of_guests'] ?? 1,
                'notes' => $guest['notes'] ?? null,
                'invitation_status' => InvitationDeliveryStatus::Pending,
                'guest_token' => bin2hex(random_bytes(16)),
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, bool>
     */
    private function sections(array $attributes): array
    {
        $sections = isset($attributes['event_type'])
            ? EventCatalog::sectionsFor((string) $attributes['event_type'])
            : $this->defaultSections();

        // Guarantee every catalog key exists (including Core 8 extras defaulting off).
        foreach (config('wedding.sections') as $key) {
            if (! array_key_exists($key, $sections)) {
                $sections[$key] = false;
            }
        }

        if (! isset($attributes['sections']) || ! is_array($attributes['sections'])) {
            return $sections;
        }

        foreach ($sections as $key => $enabled) {
            if (array_key_exists($key, $attributes['sections'])) {
                $sections[$key] = (bool) $attributes['sections'][$key];
            }
        }

        return $sections;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @param  array<string, mixed>  $existing
     * @return array<string, mixed>
     */
    private function seo(array $attributes, array $existing = []): array
    {
        return [
            'title' => $attributes['seo_title'] ?? ($existing['title'] ?? null),
            'description' => $attributes['seo_description'] ?? ($existing['description'] ?? null),
        ];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function applyTemplate(Wedding $wedding, array $attributes): void
    {
        $id = $attributes['template'] ?? null;

        if (! is_string($id) || $id === '') {
            return;
        }

        $template = collect(EventCatalog::templates())->firstWhere('id', $id);

        if (! is_array($template)) {
            return;
        }

        if ($wedding->language === 'en' && filled($template['locale'])) {
            $wedding->secondary_language = $template['locale'];
            $wedding->save();
        }

        $setting = $wedding->setting;

        if ($setting) {
            $setting->details = array_merge($setting->details ?? [], ['template' => $id]);
            $setting->save();
        }

        if ($wedding->events()->exists() || blank($template['schedule'])) {
            return;
        }

        foreach (array_values(array_filter(explode(',', (string) $template['schedule']))) as $index => $type) {
            $wedding->events()->create([
                'title' => ucfirst(str_replace('-', ' ', $type)),
                'event_type' => $type,
                'sort_order' => $index + 1,
                'timezone' => $wedding->timezone,
                'is_public' => true,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function ensureCard(Wedding $wedding, array $attributes): void
    {
        if (! in_array($wedding->invitation_mode, ['card', 'both'], true)) {
            return;
        }

        $format = is_string($attributes['card_format'] ?? null) ? $attributes['card_format'] : 'portrait';
        $preset = CardLibrary::preset($format);
        $generated = (bool) ($attributes['generate_card'] ?? false);

        $wedding->card()->create([
            'format' => $preset['format'],
            'width' => $preset['width'],
            'height' => $preset['height'],
            'status' => $generated ? 'generated' : 'draft',
            'document' => CardLibrary::document(
                $wedding,
                is_string($attributes['card_template'] ?? null) ? $attributes['card_template'] : null,
                $wedding->invitation_mode !== 'card',
            ),
        ]);

        if ($generated) {
            app(WeddingAnalyticsService::class)->record($wedding, 'card_generated');
        }
    }

    private function themeFor(string $slug): string
    {
        $wanted = EventCatalog::configuration($slug)['theme_categories'] ?? ['general'];
        $specific = array_values(array_diff($wanted, ['general']));

        foreach (config('wedding.themes') as $key => $theme) {
            $categories = $theme['categories'] ?? [];

            if ($specific !== [] && array_intersect($specific, $categories)) {
                return $key;
            }
        }

        return 'classic';
    }

    /**
     * @return array<string, bool>
     */
    public function defaultSections(): array
    {
        return array_fill_keys(config('wedding.sections'), true);
    }

    /**
     * @param  array<string, mixed>  $details
     * @return array<string, mixed>
     */
    private function withReminderDefaults(array $details): array
    {
        if (! array_key_exists('rsvp_reminders_enabled', $details)
            && config('platform.rsvp_reminders_default_enabled', true)) {
            $details['rsvp_reminders_enabled'] = '1';
        }

        if (! array_key_exists('rsvp_reminder_days_before', $details)) {
            $details['rsvp_reminder_days_before'] = (string) max(
                1,
                (int) config('platform.rsvp_reminder_days_before', 7),
            );
        }

        if (! array_key_exists('rsvp_reminder_cooldown_days', $details)) {
            $details['rsvp_reminder_cooldown_days'] = '3';
        }

        if (! array_key_exists('rsvp_reminder_max', $details)) {
            $details['rsvp_reminder_max'] = '2';
        }

        return $details;
    }
}
