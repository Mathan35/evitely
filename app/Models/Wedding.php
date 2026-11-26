<?php

namespace App\Models;

use App\Enums\WeddingStatus;
use Database\Factories\WeddingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $slug
 * @property string $title
 * @property string|null $description
 * @property string $invitation_mode
 * @property int|null $event_type_id
 * @property Carbon|null $starts_on
 * @property string|null $starts_at
 * @property string $timezone
 * @property string|null $venue_name
 * @property string|null $venue_address
 * @property string|null $city
 * @property string|null $state
 * @property string|null $country
 * @property string|null $latitude
 * @property string|null $longitude
 * @property string|null $story
 * @property string|null $headline
 * @property string|null $host_message
 * @property string|null $cover_image
 * @property string $theme
 * @property string $style
 * @property string|null $cultural_template
 * @property string $language
 * @property string|null $secondary_language
 * @property string|null $music_url
 * @property bool $music_enabled
 * @property WeddingStatus $status
 * @property Carbon|null $published_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'slug', 'title', 'description', 'invitation_mode', 'event_type_id',
    'starts_on', 'starts_at', 'timezone', 'venue_name', 'venue_address', 'city', 'state',
    'country', 'latitude', 'longitude', 'story', 'headline', 'host_message', 'cover_image',
    'theme', 'style', 'cultural_template', 'language', 'secondary_language', 'music_url',
    'music_enabled', 'status', 'published_at',
    'site_billing_status', 'site_trial_started_at', 'site_trial_ends_at',
    'site_pack_sku', 'site_pack_days', 'site_pack_paid_at', 'site_pack_starts_at', 'site_pack_ends_at',
    'site_custom_starts_on', 'site_custom_ends_on', 'site_credits_granted',
    'scheduled_publish_at', 'scheduled_publish_status', 'scheduled_publish_attempts',
    'growth_share_count', 'first_shared_at', 'live_paused_at',
])]
class Wedding extends Model
{
    /** @use HasFactory<WeddingFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'events';

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'music_enabled' => 'boolean',
            'status' => WeddingStatus::class,
            'published_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'site_trial_started_at' => 'datetime',
            'site_trial_ends_at' => 'datetime',
            'site_pack_paid_at' => 'datetime',
            'site_pack_starts_at' => 'datetime',
            'site_pack_ends_at' => 'datetime',
            'site_custom_starts_on' => 'date',
            'site_custom_ends_on' => 'date',
            'site_pack_days' => 'integer',
            'site_credits_granted' => 'integer',
            'scheduled_publish_at' => 'datetime',
            'scheduled_publish_attempts' => 'integer',
            'growth_share_count' => 'integer',
            'first_shared_at' => 'datetime',
            'live_paused_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function setting(): HasOne
    {
        return $this->hasOne(WeddingSetting::class, 'event_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(WeddingEvent::class, 'event_id')->orderBy('sort_order');
    }

    public function schedules(): HasMany
    {
        return $this->events();
    }

    public function groups(): HasMany
    {
        return $this->hasMany(GuestGroup::class, 'event_id');
    }

    public function guests(): HasMany
    {
        return $this->hasMany(WeddingGuest::class, 'event_id');
    }

    public function scheduledAutoShares(): HasMany
    {
        return $this->hasMany(ScheduledAutoShare::class, 'event_id');
    }

    public function pendingAutoShare(): HasOne
    {
        return $this->hasOne(ScheduledAutoShare::class, 'event_id')
            ->where('status', 'pending')
            ->where('enabled', true)
            ->latestOfMany();
    }

    public function rsvps(): HasMany
    {
        return $this->hasMany(WeddingRsvp::class, 'event_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(WeddingPhoto::class, 'event_id')->orderBy('sort_order');
    }

    public function travelDetails(): HasMany
    {
        return $this->hasMany(TravelDetail::class, 'event_id')->orderBy('sort_order');
    }

    public function accommodations(): HasMany
    {
        return $this->hasMany(Accommodation::class, 'event_id')->orderBy('sort_order');
    }

    public function guestbookEntries(): HasMany
    {
        return $this->hasMany(GuestbookEntry::class, 'event_id')->latest();
    }

    public function translations(): HasMany
    {
        return $this->hasMany(WeddingTranslation::class, 'event_id');
    }

    public function analytics(): HasMany
    {
        return $this->hasMany(AnalyticsEvent::class, 'event_id');
    }

    public function slugRedirects(): HasMany
    {
        return $this->hasMany(WeddingSlugRedirect::class, 'event_id');
    }

    public function hosts(): HasMany
    {
        return $this->hasMany(EventHost::class, 'event_id')->orderBy('sort_order');
    }

    public function collaborators(): HasMany
    {
        return $this->hasMany(EventCollaborator::class, 'event_id');
    }

    public function tables(): HasMany
    {
        return $this->hasMany(EventTable::class, 'event_id')->orderBy('sort_order');
    }

    public function giftClaims(): HasMany
    {
        return $this->hasMany(GiftClaim::class, 'event_id')->latest();
    }

    public function guestPhotos(): HasMany
    {
        return $this->hasMany(GuestPhoto::class, 'event_id')->latest();
    }

    public function card(): HasOne
    {
        return $this->hasOne(EventCard::class, 'event_id');
    }

    public function isOwnedBy(User $user): bool
    {
        return $user->id === $this->user_id;
    }

    /**
     * Visible in My Events — published, legacy rows, or explicitly saved drafts.
     * Gallery customize drafts (editor_saved=0) stay out until Save.
     */
    public function isListedInMyEvents(): bool
    {
        if ($this->status === WeddingStatus::Published) {
            return true;
        }

        $this->loadMissing('setting');
        $details = is_array($this->setting?->details) ? $this->setting->details : [];
        $flag = $details['editor_saved'] ?? null;
        if ($flag === null) {
            return true;
        }

        return $flag === true || $flag === 1 || $flag === '1';
    }

    public function isAccessibleBy(User $user): bool
    {
        if ($this->isOwnedBy($user)) {
            return true;
        }

        return $this->collaborators()
            ->whereNotNull('accepted_at')
            ->where(function ($query) use ($user): void {
                $query->where('user_id', $user->id)
                    ->orWhereRaw('lower(email) = ?', [strtolower($user->email)]);
            })
            ->exists();
    }

    public function isEditableBy(User $user): bool
    {
        if ($this->isOwnedBy($user)) {
            return true;
        }

        return $this->collaborators()
            ->whereNotNull('accepted_at')
            ->where('role', 'editor')
            ->where(function ($query) use ($user): void {
                $query->where('user_id', $user->id)
                    ->orWhereRaw('lower(email) = ?', [strtolower($user->email)]);
            })
            ->exists();
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<Wedding>  $query
     * @return \Illuminate\Database\Eloquent\Builder<Wedding>
     */
    public function scopeAccessibleBy($query, User $user)
    {
        return $query->where(function ($inner) use ($user): void {
            $inner->where('user_id', $user->id)
                ->orWhereIn('id', function ($sub) use ($user): void {
                    $sub->select('event_id')
                        ->from('event_collaborators')
                        ->whereNotNull('accepted_at')
                        ->where(function ($match) use ($user): void {
                            $match->where('user_id', $user->id)
                                ->orWhereRaw('lower(email) = ?', [strtolower($user->email)]);
                        });
                });
        });
    }

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(EventType::class, 'event_type_id');
    }

    public function displayTitle(): string
    {
        if (filled($this->title)) {
            return $this->title;
        }

        return $this->hosts->pluck('name')->filter()->implode(' & ') ?: 'Celebration';
    }

    public function displayBride(): string
    {
        return $this->hosts->firstWhere('role', 'bride')?->name
            ?? $this->hosts->first()?->name
            ?? '';
    }

    public function displayGroom(): string
    {
        // Never invent a co-host from the second host row — cleared partner
        // names must stay blank on intro / site for every event type.
        return $this->hosts->firstWhere('role', 'groom')?->name ?? '';
    }

    public function isPublic(): bool
    {
        return $this->status === WeddingStatus::Published;
    }

    /** Host marked the live invite as stopped — guests cannot open it until Go live. */
    public function isLivePaused(): bool
    {
        return $this->isPublic() && $this->live_paused_at !== null;
    }

    /**
     * Guest-facing access: published, not paused, and site billing still active.
     */
    public function isGuestAccessible(): bool
    {
        if (! $this->isPublic() || $this->isLivePaused()) {
            return false;
        }

        if (($this->invitation_mode ?? 'link') === 'card') {
            return true;
        }

        $status = (string) ($this->site_billing_status ?: 'draft_ready');

        if ($status === 'expired' || $status === 'awaiting_go_live') {
            return false;
        }

        if ($status === 'trial' && $this->site_trial_ends_at && $this->site_trial_ends_at->isPast()) {
            return false;
        }

        if ($status === 'paid' && $this->site_pack_ends_at && $this->site_pack_ends_at->isPast()) {
            return false;
        }

        return true;
    }
}
