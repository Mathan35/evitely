<?php

namespace App\Data;

use App\Enums\GuestbookStatus;
use App\Enums\InvitationDeliveryStatus;
use App\Enums\RsvpStatus;
use App\Models\Wedding;
use App\Models\WeddingEvent;
use App\Models\WeddingGuest;
use App\Services\TwilioMessagingService;
use App\Services\WeddingAnalyticsService;
use App\Services\WeddingThemeService;
use App\Support\CalendarLinkFactory;
use App\Support\EventCatalog;
use App\Support\MapLinkFactory;
use App\Support\ShareMessageFactory;
use Illuminate\Support\Facades\Storage;

class WeddingPageData
{
    public function __construct(
        private WeddingThemeService $themes,
        private WeddingAnalyticsService $analytics,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function public(Wedding $wedding, ?WeddingGuest $guest = null, ?string $locale = null): array
    {
        return $this->payload($wedding, false, $guest, $locale);
    }

    /**
     * @return array<string, mixed>
     */
    public function owner(Wedding $wedding): array
    {
        return $this->payload($wedding, true);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Wedding $wedding, bool $owner, ?WeddingGuest $guest = null, ?string $locale = null): array
    {
        $wedding->load([
            'setting',
            'events',
            'photos',
            'travelDetails',
            'accommodations',
            'translations',
            'guestbookEntries',
            'hosts',
            'card',
            'eventType',
        ]);

        if ($owner) {
            $wedding->load([
                'groups',
                'guests.group',
                'guests.table',
                'rsvps.eventReplies',
                'tables.guests',
                'collaborators',
                'giftClaims',
                'guestPhotos',
            ]);
        } else {
            $wedding->load([
                'giftClaims' => fn ($query) => $query->where('status', 'claimed'),
                'guestPhotos' => fn ($query) => $query->where('status', 'approved'),
            ]);
        }

        $locale = $this->locale($wedding, $locale);
        $primaryLanguage = (string) ($wedding->language ?: 'en');
        $translation = $wedding->translations->firstWhere('locale', $locale)?->content ?? [];
        if (! is_array($translation)) {
            $translation = [];
        }
        $rawDetails = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $passcode = app(\App\Services\InvitationPasscode::class);
        $shareUrl = $guest
            ? \App\Support\InviteHost::guestUrl($wedding->slug, (string) $guest->guest_token)
            : \App\Support\InviteHost::publicUrl($wedding->slug);

        if (request()->query('src') === 'qr') {
            $shareUrl .= (str_contains($shareUrl, '?') ? '&' : '?').'src=qr';
        }

        $message = ShareMessageFactory::text($wedding, $shareUrl);
        $typeSlug = $wedding->eventType?->slug ?? 'wedding';
        $sectionDefaults = EventCatalog::sectionsFor($typeSlug);
        $savedSections = is_array($wedding->setting?->sections) ? $wedding->setting->sections : [];
        $sections = array_replace($sectionDefaults, array_intersect_key($savedSections, $sectionDefaults));
        $seo = $wedding->setting?->seo ?? [];

        $names = [
            'bride' => $translation['bride_display_name'] ?? $wedding->displayBride(),
            'groom' => $translation['groom_display_name'] ?? $wedding->displayGroom(),
        ];
        $type = $wedding->eventType;
        $profile = $type ? EventCatalog::configuration($type->slug) : [];
        $title = $translation['title'] ?? $wedding->displayTitle();

        $description = $seo['description']
            ?? trim($title.($wedding->city ? ' · '.$wedding->city : ''));

        return [
            'id' => $wedding->id,
            'slug' => $wedding->slug,
            'occasion' => $type?->slug ?? 'wedding',
            'event_type' => $type?->slug ?? 'wedding',
            'event_type_name' => $type?->name ?? 'Wedding',
            'invitation_mode' => $wedding->invitation_mode,
            'title' => $title,
            'description' => $wedding->description,
            'status' => $wedding->status->value,
            'bride_name' => $names['bride'],
            'groom_name' => $names['groom'],
            // Display overrides stay empty unless the owner set a distinct line —
            // pre-filling them with host names blocked Name & date edits in the preview.
            'bride_display_name' => null,
            'groom_display_name' => null,
            'display' => $names,
            'hosts' => $wedding->hosts->map(fn ($host): array => [
                'id' => $host->id,
                'name' => $host->name,
                'role' => $host->role,
                'description' => $host->description,
            ])->all(),
            'wedding_date' => $wedding->starts_on?->format('Y-m-d'),
            'starts_on' => $wedding->starts_on?->format('Y-m-d'),
            'wedding_time' => $this->clock($wedding->starts_at),
            'starts_at' => $this->clock($wedding->starts_at),
            'timezone' => $wedding->timezone,
            'venue_name' => $wedding->venue_name,
            'venue_address' => $wedding->venue_address,
            'city' => $wedding->city,
            'state' => $wedding->state,
            'country' => $wedding->country,
            'latitude' => $wedding->latitude,
            'longitude' => $wedding->longitude,
            'map_url' => MapLinkFactory::url(
                $wedding->latitude !== null ? (string) $wedding->latitude : null,
                $wedding->longitude !== null ? (string) $wedding->longitude : null,
                collect([$wedding->venue_name, $wedding->venue_address, $wedding->city, $wedding->state, $wedding->country])->filter()->implode(', '),
            ),
            'story' => $translation['story'] ?? $wedding->story,
            'headline' => $translation['headline'] ?? $wedding->headline,
            'host_message' => $translation['host_message'] ?? $wedding->host_message,
            'cover_url' => $wedding->cover_image ? Storage::disk('public')->url($wedding->cover_image) : null,
            'theme' => $this->themes->resolve($wedding->theme),
            'theme_key' => $wedding->theme,
            'style' => $wedding->style,
            'cultural_template' => $wedding->cultural_template,
            'language' => $wedding->language,
            'secondary_language' => $wedding->secondary_language,
            'locale' => $locale,
            'music_url' => $wedding->music_enabled ? $wedding->music_url : null,
            'music_enabled' => $wedding->music_enabled,
            'sections' => $sections,
            'rsvp_fields' => $profile['rsvp_fields'] ?? ['attend', 'party_size', 'meal', 'note'],
            'details' => $passcode->redactDetails(
                $this->detailsForLocale(
                    $rawDetails,
                    $translation,
                    $locale,
                    $primaryLanguage,
                ),
            ),
            // Baseline + all translations so the live language switch can swap
            // copy client-side without a full page reload.
            'primary' => [
                'bride_name' => $wedding->displayBride(),
                'groom_name' => $wedding->displayGroom(),
                'headline' => $wedding->headline,
                'story' => $wedding->story,
                'host_message' => $wedding->host_message,
                'title' => $wedding->displayTitle(),
                'details' => $passcode->redactDetails($rawDetails),
            ],
            'translations' => $wedding->translations->map(fn ($row): array => [
                'locale' => $row->locale,
                'content' => is_array($row->content) ? $row->content : [],
            ])->values()->all(),
            'card' => $wedding->card ? [
                'format' => $wedding->card->format,
                'width' => $wedding->card->width,
                'height' => $wedding->card->height,
                'status' => $wedding->card->status,
                'document' => $wedding->card->document,
            ] : null,
            'events' => ($owner ? $wedding->events : $wedding->events->where('is_public', true))->values()->map(fn (WeddingEvent $event): array => $this->event($wedding, $event))->all(),
            'photos' => $wedding->photos->map(fn ($photo): array => [
                'id' => $photo->id,
                'url' => $photo->url(),
                'caption' => $photo->caption,
                'is_cover' => $photo->is_cover,
                'sort_order' => $photo->sort_order,
            ])->all(),
            'travel' => $wedding->travelDetails->map(fn ($item): array => [
                'id' => $item->id,
                'kind' => $item->kind,
                'title' => $item->title,
                'description' => $item->description,
            ])->all(),
            'accommodations' => $wedding->accommodations->map(fn ($item): array => [
                'id' => $item->id,
                'hotel_name' => $item->hotel_name,
                'address' => $item->address,
                'phone' => $item->phone,
                'website' => $item->website,
                'booking_url' => $item->booking_url,
                'price_info' => $item->price_info,
                'description' => $item->description,
            ])->all(),
            'guestbook' => $wedding->guestbookEntries
                ->where('status', GuestbookStatus::Approved)
                ->values()
                ->map(fn ($entry): array => [
                    'id' => $entry->id,
                    'name' => $entry->name,
                    'message' => $entry->message,
                    'photo_url' => $entry->photoUrl(),
                ])->all(),
            'gift_claim_counts' => $wedding->relationLoaded('giftClaims')
                ? $wedding->giftClaims
                    ->where('status', 'claimed')
                    ->groupBy('gift_item_id')
                    ->map(fn ($rows) => $rows->count())
                    ->all()
                : [],
            'guest_photos' => $wedding->relationLoaded('guestPhotos')
                ? $wedding->guestPhotos
                    ->when(! $owner, fn ($rows) => $rows->where('status', \App\Enums\GuestbookStatus::Approved))
                    ->values()
                    ->map(fn ($photo): array => [
                        'id' => $photo->id,
                        'name' => $photo->name,
                        'caption' => $photo->caption,
                        'status' => $photo->status->value,
                        'photo_url' => $photo->photoUrl(),
                        'created_at' => $photo->created_at?->toIso8601String(),
                    ])->all()
                : [],
            'rsvp_window' => app(\App\Services\RsvpService::class)->deadlineState($wedding),
            'qr_url' => \App\Support\InviteHost::publicUrl($wedding->slug).'?src=qr',
            'share_url' => $shareUrl,
            'share_message' => $message,
            'share_links' => ShareMessageFactory::links($message, $shareUrl),
            'share_templates' => ShareMessageFactory::editorState($wedding),
            'share_kit' => $owner
                ? app(\App\Services\Premium\ShareKitService::class)->forWedding($wedding, $guest)
                : null,
            'itinerary_presets' => $owner
                ? collect(\App\Support\IndianWeddingItinerary::presets())->map(fn (array $p): array => [
                    'id' => $p['id'],
                    'name' => $p['name'],
                    'description' => $p['description'],
                    'moments' => count($p['moments']),
                ])->values()->all()
                : [],
            'growth' => app(\App\Services\Growth\GrowthService::class)->shareState($wedding),
            'create_cta_url' => (function () use ($wedding): string {
                $code = $wedding->user
                    ? app(\App\Services\Growth\GrowthService::class)->ensureReferralCode($wedding->user)
                    : '';

                return $code !== '' ? url('/register?ref='.$code) : url('/register');
            })(),
            'path_url' => route('weddings.public', ['slug' => $wedding->slug]),
            'subdomain_url' => \App\Support\InviteHost::enabled()
                ? \App\Support\InviteHost::publicUrl($wedding->slug)
                : null,
            'subdomain_host' => \App\Support\InviteHost::enabled()
                ? \App\Support\InviteHost::previewHost($wedding->slug)
                : null,
            'subdomains_enabled' => \App\Support\InviteHost::enabled(),
            'invite_root_domain' => \App\Support\InviteHost::rootDomain(),
            'calendar_url' => route('weddings.calendar', ['slug' => $wedding->slug]),
            'google_calendar_url' => ($primary = $wedding->events->firstWhere('is_public', true) ?? $wedding->events->first())
                ? CalendarLinkFactory::google($wedding, $primary)
                : null,
            'seo' => [
                'title' => $seo['title'] ?? $title,
                'description' => $description,
                'canonical' => \App\Support\InviteHost::publicUrl($wedding->slug),
                'image' => $wedding->cover_image ? Storage::disk('public')->url($wedding->cover_image) : null,
            ],
            'guest' => $guest ? [
                'name' => $guest->fullName(),
                'email' => $guest->email,
                'token' => $guest->guest_token,
                'number_of_guests' => $guest->number_of_guests,
            ] : null,
            'options' => [
                'locales' => config('wedding.locales'),
                'meals' => config('wedding.meal_preferences'),
                'themes' => $owner ? array_values(config('wedding.themes')) : [],
                'styles' => $owner ? config('wedding.styles') : [],
                'cultures' => $owner ? config('wedding.cultures') : [],
                'event_suggestions' => $owner ? config('wedding.event_suggestions') : [],
                'occasions' => $owner ? config('wedding.occasions') : [],
                'timezones' => $owner ? [
                    'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London',
                    'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'UTC',
                ] : [],
            ],
            'owner' => $owner ? $this->ownerExtras($wedding) : null,
            'site_billing' => app(\App\Services\Billing\SiteBillingService::class)->state($wedding)->toArray(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function event(Wedding $wedding, WeddingEvent $event): array
    {
        $query = collect([
            $event->venue_name ?: $wedding->venue_name,
            $event->venue_address ?: $wedding->venue_address,
            $event->city ?: $wedding->city,
            $event->state ?: $wedding->state,
            $event->country ?: $wedding->country,
        ])->filter()->implode(', ');

        return [
            'id' => $event->id,
            'title' => $event->title,
            'event_type' => $event->event_type,
            'description' => $event->description,
            'event_date' => $event->event_date?->format('Y-m-d'),
            'start_time' => $this->clock($event->start_time),
            'end_time' => $this->clock($event->end_time),
            'timezone' => $event->timezone,
            'venue_name' => $event->venue_name,
            'venue_address' => $event->venue_address,
            'city' => $event->city,
            'dress_code' => $event->dress_code,
            'cover_url' => $event->cover_image ? Storage::disk('public')->url($event->cover_image) : null,
            'sort_order' => $event->sort_order,
            'is_public' => $event->is_public,
            'map_url' => MapLinkFactory::url(
                $event->latitude !== null ? (string) $event->latitude : null,
                $event->longitude !== null ? (string) $event->longitude : null,
                $query,
            ),
            'google_calendar_url' => CalendarLinkFactory::google($wedding, $event),
            'ics_url' => route('weddings.event-calendar', ['slug' => $wedding->slug, 'event' => $event->id]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function ownerExtras(Wedding $wedding): array
    {
        $rsvps = $wedding->rsvps;

        return [
            'groups' => $wedding->groups->map(fn ($group): array => [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
            ])->all(),
            'guests' => $wedding->guests->map(fn (WeddingGuest $guest): array => [
                'id' => $guest->id,
                'guest_group_id' => $guest->guest_group_id,
                'table_id' => $guest->table_id,
                'table' => $guest->table?->name,
                'group' => $guest->group?->name,
                'first_name' => $guest->first_name,
                'last_name' => $guest->last_name,
                'name' => $guest->fullName(),
                'email' => $guest->email,
                'phone' => $guest->phone,
                'country_code' => $guest->country_code,
                'relationship' => $guest->relationship,
                'number_of_guests' => $guest->number_of_guests,
                'notes' => $guest->notes,
                'invitation_status' => $guest->invitation_status->value,
                'invitation_sent_at' => $guest->invitation_sent_at?->toIso8601String(),
                'invitation_send_count' => (int) $guest->invitation_send_count,
                'invitation_last_error' => $guest->invitation_last_error,
                'invitation_last_channel' => $guest->invitation_last_channel,
                'email_sent_at' => $guest->email_sent_at?->toIso8601String(),
                'email_send_count' => (int) $guest->email_send_count,
                'email_last_error' => $guest->email_last_error,
                'whatsapp_sent_at' => $guest->whatsapp_sent_at?->toIso8601String(),
                'whatsapp_send_count' => (int) $guest->whatsapp_send_count,
                'whatsapp_last_error' => $guest->whatsapp_last_error,
                'sms_sent_at' => $guest->sms_sent_at?->toIso8601String(),
                'sms_send_count' => (int) $guest->sms_send_count,
                'sms_last_error' => $guest->sms_last_error,
                'reminder_sent_at' => $guest->reminder_sent_at?->toIso8601String(),
                'reminder_send_count' => (int) $guest->reminder_send_count,
                'reminder_last_error' => $guest->reminder_last_error,
                'rsvp_status' => $guest->rsvp_status->value,
                'guest_url' => \App\Support\InviteHost::guestUrl($wedding->slug, (string) $guest->guest_token),
            ])->all(),
            'rsvps' => $rsvps
                ->sortByDesc(fn ($rsvp) => $rsvp->created_at?->getTimestamp() ?? $rsvp->id)
                ->values()
                ->map(fn ($rsvp): array => [
                    'id' => $rsvp->id,
                    'guest_name' => $rsvp->guest_name,
                    'email' => $rsvp->email,
                    'status' => $rsvp->status->value,
                    'guest_count' => $rsvp->guest_count,
                    'meal_preference' => $rsvp->meal_preference,
                    'dietary_restrictions' => $rsvp->dietary_restrictions,
                    'message' => $rsvp->message,
                    'created_at' => $rsvp->created_at?->toIso8601String(),
                    'events' => $rsvp->eventReplies->map(fn ($reply): array => [
                        'event_id' => $reply->event_schedule_id,
                        'attending' => $reply->attending,
                    ])->all(),
                ])
                ->all(),
            'counts' => [
                'invited' => $wedding->guests->count(),
                'viewed' => $wedding->guests->whereIn('invitation_status', [
                    InvitationDeliveryStatus::Viewed,
                    InvitationDeliveryStatus::Responded,
                ])->count(),
                'responded' => $rsvps->count(),
                'attending' => $rsvps->where('status', RsvpStatus::Attending)->count(),
                'not_attending' => $rsvps->where('status', RsvpStatus::NotAttending)->count(),
                'maybe' => $rsvps->where('status', RsvpStatus::Maybe)->count(),
                'pending' => $wedding->guests->where('rsvp_status', RsvpStatus::Pending)->count(),
                'remindable' => $wedding->guests
                    ->where('rsvp_status', RsvpStatus::Pending)
                    ->filter(fn (WeddingGuest $guest): bool => trim((string) $guest->email) !== '')
                    ->count(),
                'attending_guests' => (int) $rsvps->where('status', RsvpStatus::Attending)->sum('guest_count'),
            ],
            'analytics' => $this->analytics->summary($wedding),
            'guestbook_queue' => $wedding->guestbookEntries->map(fn ($entry): array => [
                'id' => $entry->id,
                'name' => $entry->name,
                'message' => $entry->message,
                'status' => $entry->status->value,
                'photo_url' => $entry->photoUrl(),
                'created_at' => $entry->created_at?->toIso8601String(),
            ])->all(),
            'guest_photo_queue' => $wedding->guestPhotos->map(fn ($photo): array => [
                'id' => $photo->id,
                'name' => $photo->name,
                'caption' => $photo->caption,
                'status' => $photo->status->value,
                'photo_url' => $photo->photoUrl(),
                'created_at' => $photo->created_at?->toIso8601String(),
            ])->all(),
            'translations' => $wedding->translations->map(fn ($row): array => [
                'locale' => $row->locale,
                'content' => $row->content,
            ])->values()->all(),
            'music_url' => $wedding->music_url,
            'tables' => $wedding->tables->map(fn ($table): array => [
                'id' => $table->id,
                'name' => $table->name,
                'capacity' => (int) $table->capacity,
                'sort_order' => (int) $table->sort_order,
                'seated' => (int) $table->guests->sum(fn ($guest) => max(1, (int) $guest->number_of_guests)),
            ])->values()->all(),
            'collaborators' => $wedding->collaborators->map(fn ($row): array => [
                'id' => $row->id,
                'email' => $row->email,
                'role' => $row->role,
                'accepted_at' => $row->accepted_at?->toIso8601String(),
                'is_accepted' => $row->accepted_at !== null,
            ])->values()->all(),
            'messaging' => $this->messagingOptions($wedding),
            'gift_claims' => $wedding->giftClaims->map(fn ($claim): array => [
                'id' => $claim->id,
                'gift_item_id' => $claim->gift_item_id,
                'gift_label' => $claim->gift_label,
                'name' => $claim->name,
                'email' => $claim->email,
                'note' => $claim->note,
                'status' => $claim->status,
                'created_at' => $claim->created_at?->toIso8601String(),
            ])->values()->all(),
            'is_owner' => auth()->id() === $wedding->user_id,
        ];
    }

    /**
     * Host invite delivery options: free phone share vs automated Twilio.
     *
     * @return array{
     *     delivery_mode: string,
     *     twilio: array{configured: bool, email: bool, sms: bool, whatsapp: bool},
     *     billing?: array<string, mixed>
     * }
     */
    private function messagingOptions(Wedding $wedding): array
    {
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $mode = strtolower(trim((string) ($details['invite_delivery_mode'] ?? 'manual')));
        if (! in_array($mode, ['manual', 'automated'], true)) {
            $mode = 'manual';
        }

        $billing = app(\App\Services\Billing\BillingService::class);
        $siteBilling = app(\App\Services\Billing\SiteBillingService::class);
        $owner = $wedding->user;
        $siteState = $siteBilling->state($wedding);
        $canAutomated = $siteState->canAutomate;
        if ($mode === 'automated' && ! $canAutomated) {
            $mode = 'manual';
        }

        $twilioStatus = app(TwilioMessagingService::class)->status();
        $payload = [
            'delivery_mode' => $mode,
            'twilio' => $twilioStatus,
        ];

        if ($owner) {
            $capacity = $billing->guestCapacity($owner, $wedding);
            $payload['billing'] = [
                'plan' => $billing->effectivePlan($owner),
                'is_pro' => $siteState->hasPaidPack || $billing->isPro($owner),
                'site' => $siteState->toArray(),
                'automated_messaging' => $canAutomated,
                'message_credits' => $billing->messageCredits($owner),
                'guest_limit' => $capacity['limit'],
                'guest_used' => $capacity['used'],
                'guest_remaining' => $capacity['remaining'],
                'at_guest_limit' => $capacity['at_limit'],
                'upgrade_url' => route('weddings.billing', $wedding),
            ];
        }

        return $payload;
    }

    private function locale(Wedding $wedding, ?string $requested): string
    {
        $allowed = array_filter([$wedding->language, $wedding->secondary_language, 'en']);

        if ($requested && in_array($requested, $allowed, true) && array_key_exists($requested, config('wedding.locales'))) {
            return $requested;
        }

        return $wedding->language ?: 'en';
    }

    /**
     * Overlay translated gallery copy onto saved details when guests view a secondary locale.
     *
     * @param  array<string, mixed>  $details
     * @param  array<string, mixed>  $translation
     * @return array<string, mixed>
     */
    private function detailsForLocale(array $details, array $translation, string $locale, string $primaryLanguage): array
    {
        if ($translation === [] || $locale === $primaryLanguage) {
            return $details;
        }

        $overlays = [
            'hero_message' => $translation['hero_message'] ?? $translation['host_message'] ?? null,
            'story_body' => $translation['story_body'] ?? $translation['story'] ?? null,
            'story_heading' => $translation['story_heading'] ?? null,
            'story_eyebrow' => $translation['story_eyebrow'] ?? null,
            'kicker' => $translation['kicker'] ?? $translation['headline'] ?? null,
            'event_line' => $translation['event_line'] ?? null,
            'gallery_eyebrow' => $translation['gallery_eyebrow'] ?? null,
            'gallery_title' => $translation['gallery_title'] ?? null,
            'gallery_intro' => $translation['gallery_intro'] ?? null,
            'guests_intro' => $translation['guests_intro'] ?? null,
            'attire_title' => $translation['attire_title'] ?? null,
            'attire_body' => $translation['attire_body'] ?? null,
            'gifts_intro' => $translation['gifts_intro'] ?? null,
            'travel_stays_notes' => $translation['travel_stays_notes'] ?? null,
            'livestream_label' => $translation['livestream_label'] ?? null,
            'livestream_note' => $translation['livestream_note'] ?? null,
            'wishes_intro' => $translation['wishes_intro'] ?? null,
            'ceremony_name' => $translation['ceremony_name'] ?? null,
            'reception_name' => $translation['reception_name'] ?? null,
            'ceremony_address' => $translation['ceremony_address'] ?? null,
            'reception_address' => $translation['reception_address'] ?? null,
            'dress_code' => $translation['dress_code'] ?? null,
            'gift_note' => $translation['gift_note'] ?? null,
            'rsvp_line' => $translation['rsvp_line'] ?? null,
            'schedule_json' => $translation['schedule_json'] ?? null,
            'faq_json' => $translation['faq_json'] ?? null,
            'gifts_json' => $translation['gifts_json'] ?? null,
            'travel_stays_json' => $translation['travel_stays_json'] ?? null,
            'explore_json' => $translation['explore_json'] ?? null,
            'lineup_json' => $translation['lineup_json'] ?? null,
        ];

        foreach ($overlays as $key => $value) {
            if (! is_string($value)) {
                continue;
            }
            $trimmed = trim($value);
            if ($trimmed === '') {
                continue;
            }
            $details[$key] = $trimmed;
        }

        return $details;
    }

    private function clock(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        return substr($value, 0, 5);
    }
}
