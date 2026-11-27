<?php

namespace App\Services\Premium;

use App\Models\Wedding;
use App\Services\WeddingThemeService;
use Illuminate\Support\Carbon;

/**
 * Celebration-ended / thank-you experience when a published site pack has expired
 * (or host enabled post-event thank-you mode).
 */
class PostEventExperienceService
{
    public function __construct(private WeddingThemeService $themes) {}

    public function shouldShowEnded(Wedding $wedding): bool
    {
        if (($wedding->invitation_mode ?? 'link') === 'card') {
            return false;
        }

        if (! $wedding->isPublic() || $wedding->isLivePaused()) {
            return false;
        }

        if ($wedding->isGuestAccessible()) {
            // Optional host-forced thank-you / album mode while still "live".
            return $this->thankYouModeEnabled($wedding) && $this->celebrationDatePassed($wedding);
        }

        $status = (string) ($wedding->site_billing_status ?: '');

        return in_array($status, ['expired', 'trial', 'paid'], true)
            && $this->billingWindowEnded($wedding);
    }

    public function thankYouModeEnabled(Wedding $wedding): bool
    {
        $wedding->loadMissing('setting');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];

        return in_array(
            strtolower(trim((string) ($details['post_event_thank_you'] ?? ''))),
            ['1', 'true', 'yes', 'on'],
            true,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(Wedding $wedding): array
    {
        $wedding->loadMissing(['hosts', 'setting']);
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $theme = $this->themes->resolve((string) ($wedding->theme ?: 'classic'));
        $siteBg = trim((string) ($details['site_bg'] ?? ''));
        $message = trim((string) ($details['post_event_message'] ?? ''));
        if ($message === '') {
            $message = 'Thank you for celebrating with us. The live invitation window has closed — keep the photos and memories.';
        }

        $hosts = collect([
            $wedding->displayGroom(),
            $wedding->displayBride(),
        ])->filter()->values()->all();
        if ($hosts === []) {
            $hosts = $wedding->hosts->pluck('name')->filter()->values()->all();
        }

        $photos = $wedding->guestPhotos()
            ->where('status', \App\Enums\GuestbookStatus::Approved)
            ->latest('id')
            ->limit(24)
            ->get()
            ->map(fn ($photo): array => [
                'id' => $photo->id,
                'url' => $photo->photoUrl(),
                'caption' => $photo->caption,
            ])
            ->filter(fn (array $row): bool => filled($row['url']))
            ->values()
            ->all();

        return [
            'slug' => $wedding->slug,
            'title' => $wedding->displayTitle(),
            'hosts' => $hosts,
            'message' => $message,
            'date_label' => $wedding->starts_on
                ? $wedding->starts_on->timezone($wedding->timezone ?: config('app.timezone'))->format('l, F j, Y')
                : null,
            'city' => $wedding->city,
            'venue_name' => $wedding->venue_name,
            'photos' => $photos,
            'photo_album_open' => (bool) ($details['post_event_photos'] ?? true),
            'theme' => [
                'paper' => $siteBg !== '' ? $siteBg : ($theme['backgroundColor'] ?? '#1a1612'),
                'ink' => $theme['textColor'] ?? '#f4efe6',
                'seal' => $theme['primaryColor'] ?? '#c4a574',
                'accent' => $theme['secondaryColor'] ?? '#8a7355',
            ],
        ];
    }

    private function celebrationDatePassed(Wedding $wedding): bool
    {
        if (! $wedding->starts_on) {
            return false;
        }

        $tz = $wedding->timezone ?: config('app.timezone');
        $end = Carbon::parse($wedding->starts_on->toDateString(), $tz)->endOfDay()->addDay();

        return now($tz)->greaterThan($end);
    }

    private function billingWindowEnded(Wedding $wedding): bool
    {
        $status = (string) ($wedding->site_billing_status ?: '');

        if ($status === 'expired') {
            return true;
        }

        if ($status === 'trial' && $wedding->site_trial_ends_at && $wedding->site_trial_ends_at->isPast()) {
            return true;
        }

        if ($status === 'paid' && $wedding->site_pack_ends_at && $wedding->site_pack_ends_at->isPast()) {
            return true;
        }

        return false;
    }
}
