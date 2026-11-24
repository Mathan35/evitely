<?php

namespace App\Support;

use App\Models\Wedding;
use App\Models\WeddingEvent;
use Illuminate\Support\Carbon;

class InvitationCopy
{
    /**
     * @return array<string, mixed>
     */
    public static function forGallery(string $slug): array
    {
        return match ($slug) {
            'wedding' => [
                'kind' => 'wedding',
                'blessing' => 'Together with their families',
                'request_line' => "request the pleasure of your company\nat their wedding celebration",
                'headline' => null,
                'headline_sub' => null,
                'bride' => 'Emma',
                'groom' => 'Alexander',
                'hosts' => 'Emma & Alexander',
                'kicker' => 'Together with their families',
                'date_label' => 'Saturday, June 20, 2026',
                'when' => 'Saturday, June 20, 2026',
                'ceremony_time' => 'at 4:00 PM',
                'reception_time' => 'Reception to follow',
                'where' => 'The Glasshouse Pavilion, Vancouver',
                'venue_name' => 'The Glasshouse Pavilion',
                'venue_address' => "742 Evergreen Terrace\nVancouver, BC, Canada",
                'map_url' => MapLinkFactory::url(null, null, 'The Glasshouse Pavilion, 742 Evergreen Terrace, Vancouver, BC, Canada'),
                'rsvp_line' => 'RSVP by May 1st, 2026',
                'dress_code' => null,
                'hashtag' => null,
                'gift_note' => null,
                'compliments' => null,
                'hosted_by' => null,
                'contact' => 'rsvp@emmaandalex.com',
            ],
            'housewarming' => [
                'kind' => 'housewarming',
                'blessing' => null,
                'request_line' => "The boxes are finally unpacked, and the keys are officially ours! Join us for a special evening of drinks, dinner, and good company to celebrate our new beginning.\nHelp us fill our new home with warmth, love, and laughter!",
                'message' => 'We are stepping into our new home and want to share this beautiful beginning with you.',
                'headline' => 'Home Sweet Home! 🏡',
                'headline_sub' => '✨ Date & Time ✨',
                'event_name' => 'Housewarming Celebration',
                'hosts' => 'Home Sweet Home',
                'kicker' => 'Home Sweet Home!',
                'date_label' => 'Saturday, November 28',
                'when' => 'Saturday, November 28 · 16:00',
                'ceremony_time' => 'Starting at 16:00',
                'reception_time' => null,
                'puja_time' => null,
                'meal_time' => null,
                'where' => null,
                'venue_name' => null,
                'venue_address' => null,
                'map_url' => null,
                'rsvp_line' => 'RSVP by November 18 via text message',
                'dress_code' => 'Dress Code: Comfortable & Smart Casual',
                'hashtag' => null,
                'gift_note' => '🥂 The Details 🥂',
                'hosted_by' => null,
                'contact' => null,
                'compliments' => "We can't wait to show you around!",
            ],
            'birthday' => [
                'kind' => 'birthday',
                'blessing' => null,
                'headline' => "You're Invited! 🎉",
                'headline_sub' => null,
                'request_line' => "Please join us to celebrate David's Birthday.",
                'hosts' => 'David',
                'kicker' => "You're Invited!",
                'date_label' => 'Saturday, 15 November',
                'when' => 'Saturday, 15 November · 19:00',
                'ceremony_time' => '19:00 (7:00 PM)',
                'reception_time' => null,
                'where' => 'Central Park Café, Main Street',
                'venue_name' => 'Central Park Café',
                'venue_address' => 'Main Street',
                'map_url' => MapLinkFactory::url(null, null, 'Central Park Café, Main Street'),
                'rsvp_line' => 'RSVP: By 10 November',
                'dress_code' => null,
                'hashtag' => null,
                'gift_note' => null,
                'hosted_by' => null,
                'contact' => null,
                'compliments' => 'Hope to see you there!',
            ],
            'baby-shower' => [
                'kind' => 'baby-shower',
                'blessing' => null,
                'headline' => 'A New Adventure Begins!',
                'headline_sub' => null,
                'request_line' => "Let's shower Chloe & Jordan.",
                'hosts' => 'Chloe & Jordan',
                'kicker' => 'A New Adventure Begins!',
                'date_label' => 'Sat, Dec 12, 2026',
                'when' => 'Saturday, December 12, 2026 · 1:00 PM',
                'ceremony_time' => '1:00 – 4:00 PM',
                'reception_time' => null,
                'where' => 'The Glasshouse Cafe, 12 Brick Lane, London, UK',
                'venue_name' => 'The Glasshouse Cafe',
                'venue_address' => '12 Brick Lane, London',
                'map_url' => MapLinkFactory::url(null, null, 'The Glasshouse Cafe, 12 Brick Lane, London, UK'),
                'rsvp_line' => null,
                'dress_code' => null,
                'hashtag' => null,
                'gift_note' => null,
                'hosted_by' => null,
                'contact' => null,
                'compliments' => null,
            ],
            'party' => [
                'kind' => 'party',
                'blessing' => null,
                'headline' => "You're Invited! 🎉",
                'headline_sub' => '✨ Date & Time ✨',
                'request_line' => "Join us for a night of incredible music, great drinks, and amazing company at our annual Celebration of Friends.\nLet's make some unforgettable memories together!",
                'hosts' => 'Celebration of Friends',
                'kicker' => "You're Invited!",
                'date_label' => 'Saturday, November 14',
                'when' => 'Saturday, November 14 · 19:00',
                'ceremony_time' => 'Starting at 19:00',
                'reception_time' => null,
                'where' => null,
                'venue_name' => null,
                'venue_address' => null,
                'map_url' => null,
                'rsvp_line' => 'RSVP by November 7 via email',
                'dress_code' => 'Dress Code: Festive & Elegant',
                'hashtag' => null,
                'gift_note' => '🍸 The Details 🍸',
                'hosted_by' => null,
                'contact' => null,
                'compliments' => "Can't wait to party with you!",
            ],
            'graduation' => [
                'kind' => 'graduation',
                'blessing' => null,
                'headline' => 'The Caps Are Off! 🎓',
                'headline_sub' => '✨ Date & Time ✨',
                'request_line' => "The hard work has paid off, and it is finally time to celebrate! Join us for a special evening of dinner, drinks, and dancing to honour the Graduate Class of 2026.\nLet's toast to new beginnings and bright futures!",
                'hosts' => 'Graduate Class of 2026',
                'kicker' => 'The Caps Are Off!',
                'date_label' => 'Saturday, November 21',
                'when' => 'Saturday, November 21 · 18:30',
                'ceremony_time' => 'Starting at 18:30',
                'reception_time' => null,
                'where' => null,
                'venue_name' => null,
                'venue_address' => null,
                'map_url' => null,
                'rsvp_line' => 'RSVP by November 12 via the event portal',
                'dress_code' => 'Dress Code: Formal Attire',
                'hashtag' => null,
                'gift_note' => '🥂 The Details 🥂',
                'hosted_by' => null,
                'contact' => null,
                'compliments' => 'Cheers to the graduates!',
            ],
            'bridal-shower' => [
                'kind' => 'bridal-shower',
                'blessing' => null,
                'headline' => 'From Miss to Mrs! 🥂',
                'headline_sub' => '✨ Date & Time ✨',
                'request_line' => "The countdown to the big day is officially on! Join us for cocktails, laughter, and celebration to honour the beautiful Bride-to-Be.\nLet's shower her with love before she walks down the aisle!",
                'hosts' => 'Bride-to-Be',
                'kicker' => 'From Miss to Mrs!',
                'date_label' => 'Saturday, November 28',
                'when' => 'Saturday, November 28 · 17:00',
                'ceremony_time' => 'Starting at 17:00',
                'reception_time' => null,
                'where' => null,
                'venue_name' => null,
                'venue_address' => null,
                'map_url' => null,
                'rsvp_line' => 'RSVP by November 18 via the wedding website',
                'dress_code' => 'Dress Code: Pastel Palette / Cocktail Attire',
                'hashtag' => null,
                'gift_note' => '💍 The Details 💍',
                'hosted_by' => null,
                'contact' => null,
                'compliments' => 'Cheers to love, laughter, and happily ever after!',
            ],
            'corporate' => [
                'kind' => 'corporate',
                'blessing' => null,
                'headline' => 'Connect, Collaborate, Celebrate! 🚀',
                'headline_sub' => null,
                'request_line' => "Work hard, network harder! Drop by for refreshing drinks, gourmet appetizers, and great conversations at our Year-End Company Mixer.\nLet's unwind and celebrate the incredible efforts of our global teams.",
                'hosts' => 'Year-End Company Mixer',
                'kicker' => 'Connect, Collaborate, Celebrate!',
                'date_label' => '📅 Saturday, November 28',
                'when' => 'Saturday, November 28 · 17:30',
                'ceremony_time' => '⏰ From 17:30 onwards',
                'reception_time' => null,
                'where' => null,
                'venue_name' => null,
                'venue_address' => null,
                'map_url' => null,
                'rsvp_line' => 'Kindly RSVP by November 18 for guest list and security check-in.',
                'dress_code' => null,
                'hashtag' => null,
                'gift_note' => null,
                'hosted_by' => null,
                'contact' => null,
                'compliments' => 'See you there!',
            ],
            'custom' => [
                'kind' => 'custom',
                'blessing' => null,
                'headline' => "You're Invited!",
                'headline_sub' => null,
                'request_line' => "Come as you are. Share a table, a toast, and an evening that belongs to everyone in the room.\nMorgan hosts The Gathering — an open night for friends, collaborators, and anyone who wants a seat.",
                'hosts' => 'The Gathering',
                'kicker' => 'You are invited',
                'date_label' => '📅 Saturday, 14 November 2026',
                'when' => 'Saturday, 14 November 2026 · Evening',
                'ceremony_time' => '⏰ Evening',
                'reception_time' => null,
                'where' => 'Shore Lights, Malibu',
                'venue_name' => 'Shore Lights',
                'venue_address' => 'Malibu',
                'map_url' => MapLinkFactory::url(null, null, 'Shore Lights, Malibu'),
                'rsvp_line' => 'Kindly RSVP by November 7 so we can save your place.',
                'dress_code' => 'Dress Code: Come as you are',
                'hashtag' => null,
                'gift_note' => '✨ The Details ✨',
                'hosted_by' => 'Morgan',
                'contact' => null,
                'compliments' => "We can't wait to see you.",
            ],
            default => [],
        };
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromWedding(Wedding $wedding): array
    {
        $wedding->loadMissing(['hosts', 'setting', 'events', 'eventType']);
        $rawSlug = $wedding->eventType?->slug ?? 'wedding';
        $occasion = DesignGallery::occasion($rawSlug);
        $slug = is_array($occasion) ? (string) ($occasion['slug'] ?? 'wedding') : 'wedding';
        $isHousewarming = $slug === 'housewarming';
        $defaults = self::forGallery($slug);
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $date = $wedding->starts_on;
        $venueName = filled($wedding->venue_name) ? $wedding->venue_name : null;
        $venueAddress = filled($wedding->venue_address)
            ? $wedding->venue_address
            : collect([$wedding->city, $wedding->state, $wedding->country])->filter()->implode(', ');
        $mapQuery = collect([$venueName, $wedding->venue_address, $wedding->city, $wedding->state, $wedding->country])->filter()->implode(', ');
        $ceremony = self::eventNamed($wedding, ['ceremony', 'muhurtham', 'vows']);
        $reception = self::eventNamed($wedding, ['reception', 'dinner', 'celebration']);
        $puja = self::eventNamed($wedding, ['puja', 'griha', 'blessing']);
        $meal = self::eventNamed($wedding, ['lunch', 'dinner', 'meal', 'tour']);
        $dress = self::detail($details, 'dress_code')
            ?? $wedding->events->firstWhere('dress_code', '!=', null)?->dress_code;
        $bride = $wedding->displayBride() ?: null;
        $groom = $wedding->displayGroom() ?: null;
        $hashtag = self::detail($details, 'hashtag');

        if ($slug === 'wedding' && $hashtag === null && filled($bride) && filled($groom)) {
            $hashtag = '#'.preg_replace('/[^A-Za-z0-9]+/', '', $groom.'And'.$bride);
        }

        return [
            'kind' => $defaults['kind'] ?? ($isHousewarming ? 'housewarming' : 'wedding'),
            'hosts' => $wedding->displayTitle(),
            'bride' => $bride,
            'groom' => $groom,
            'kicker' => $wedding->headline ?: ($defaults['kicker'] ?? null),
            'request_line' => self::detail(
                $details,
                'request_line',
                $defaults['request_line'] ?? null,
            ),
            'blessing' => self::detail($details, 'blessing', $defaults['blessing'] ?? null),
            'headline' => self::detail($details, 'headline', $defaults['headline'] ?? null),
            'headline_sub' => self::detail($details, 'headline_sub', $defaults['headline_sub'] ?? null),
            'message' => self::detail(
                $details,
                'message',
                $defaults['message'] ?? null,
            ),
            'event_name' => self::detail(
                $details,
                'event_name',
                $defaults['event_name'] ?? null,
            ),
            // American date matches gallery sample so InvitationCardFace stays on a single date line.
            'date_label' => $date?->format('l, F j, Y'),
            'when' => $date?->format('F j, Y'),
            'ceremony_time' => self::detail($details, 'ceremony_time')
                ?? self::atTime($ceremony?->start_time ?? $wedding->starts_at)
                ?? ($defaults['ceremony_time'] ?? null),
            'reception_time' => self::detail($details, 'reception_time')
                ?? self::labeledTime('Reception', $reception?->start_time)
                ?? ($isHousewarming ? null : ($defaults['reception_time'] ?? null)),
            'puja_time' => self::detail($details, 'puja_time')
                ?? self::labeledTime('Puja', $puja?->start_time ?? ($isHousewarming ? $wedding->starts_at : null)),
            'meal_time' => self::detail($details, 'meal_time')
                ?? self::labeledTime('Lunch', $meal?->start_time, $isHousewarming ? 'onwards' : null),
            'venue_name' => $venueName,
            'venue_address' => $venueAddress !== '' ? $venueAddress : null,
            'where' => collect([$venueName, $wedding->city])->filter()->implode(', ') ?: null,
            'map_url' => MapLinkFactory::url(
                $wedding->latitude !== null ? (string) $wedding->latitude : null,
                $wedding->longitude !== null ? (string) $wedding->longitude : null,
                $mapQuery !== '' ? $mapQuery : null,
            ),
            'rsvp_line' => self::detail(
                $details,
                'rsvp_line',
                $defaults['rsvp_line'] ?? 'Kindly RSVP',
            ),
            'dress_code' => $dress,
            'hashtag' => $hashtag,
            'gift_note' => self::detail(
                $details,
                'gift_note',
                $defaults['gift_note'] ?? null,
            ),
            'compliments' => self::detail(
                $details,
                'compliments',
                $defaults['compliments'] ?? null,
            ),
            'hosted_by' => self::detail(
                $details,
                'hosted_by',
                $defaults['hosted_by'] ?? ($isHousewarming ? ($wedding->displayTitle().' & Family') : null),
            ),
            'contact' => self::detail($details, 'contact') ?? self::detail($details, 'rsvp_phone'),
        ];
    }

    /**
     * @param  array<string, mixed>  $details
     */
    private static function detail(array $details, string $key, ?string $fallback = null): ?string
    {
        $value = $details[$key] ?? null;

        return filled($value) ? (string) $value : $fallback;
    }

    /**
     * @param  array<int, string>  $needles
     */
    private static function eventNamed(Wedding $wedding, array $needles): ?WeddingEvent
    {
        return $wedding->events->first(function (WeddingEvent $event) use ($needles): bool {
            $haystack = strtolower(trim($event->title.' '.$event->event_type));

            foreach ($needles as $needle) {
                if (str_contains($haystack, $needle)) {
                    return true;
                }
            }

            return false;
        });
    }

    private static function labeledTime(string $label, ?string $time, ?string $suffix = null): ?string
    {
        $formatted = self::clock($time);

        if ($formatted === null) {
            return null;
        }

        $line = $label.' · '.$formatted;

        return $suffix ? $line.' '.$suffix : $line;
    }

    /** Gallery / card face ceremony line, e.g. "at 4:00 PM". */
    private static function atTime(?string $time): ?string
    {
        $formatted = self::clock($time);

        return $formatted !== null ? 'at '.$formatted : null;
    }

    private static function clock(?string $time): ?string
    {
        $time = trim((string) $time);

        if ($time === '') {
            return null;
        }

        foreach (['H:i:s', 'H:i'] as $format) {
            try {
                return Carbon::createFromFormat($format, $time)->format('g:i A');
            } catch (\Throwable) {
                continue;
            }
        }

        return $time;
    }
}
