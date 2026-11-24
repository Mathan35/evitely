<?php

namespace App\Support;

class EventCatalog
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public static function profiles(): array
    {
        $off = array_fill_keys(config('wedding.sections'), false);

        $wedding = array_replace($off, array_fill_keys([
            'hero', 'couple', 'countdown', 'story', 'events', 'gallery', 'venue', 'map',
            'travel', 'accommodation', 'guests', 'rsvp', 'guestbook', 'footer',
        ], true));

        $birthday = array_replace($off, array_fill_keys([
            'hero', 'message', 'venue', 'map', 'gallery', 'guests', 'rsvp', 'footer',
        ], true));

        $baby = array_replace($off, array_fill_keys([
            'hero', 'message', 'registry', 'venue', 'gallery', 'guests', 'rsvp', 'footer',
        ], true));

        $house = array_replace($off, array_fill_keys([
            'hero', 'message', 'venue', 'map', 'guests', 'rsvp', 'footer',
        ], true));

        $corporate = array_replace($off, array_fill_keys([
            'hero', 'message', 'events', 'agenda', 'speakers', 'venue', 'map', 'contact', 'guests', 'rsvp', 'footer',
        ], true));

        $simple = array_replace($off, array_fill_keys([
            'hero', 'message', 'venue', 'map', 'gallery', 'guests', 'rsvp', 'footer',
        ], true));

        $save = array_replace($off, array_fill_keys([
            'hero', 'message', 'venue', 'footer',
        ], true));

        return [
            'wedding' => self::profile($wedding, ['hosts', 'story', 'schedule', 'venue'], ['attend', 'schedule', 'party_size', 'meal', 'note'], ['bride', 'groom'], true, ['wedding', 'general'], 'Join us to celebrate {{title}}.', true),
            'save-the-date' => self::profile($save, ['hosts', 'date', 'venue'], ['attend'], ['bride', 'groom'], false, ['wedding', 'general'], 'Save the date for {{title}}.', false),
            'birthday' => self::profile($birthday, ['celebrant', 'age', 'message', 'date', 'venue'], ['attend', 'party_size'], ['celebrant'], false, ['birthday', 'general'], "You're invited to {{title}}.", true),
            'baby' => self::profile($baby, ['parents', 'baby', 'date', 'venue', 'registry'], ['attend', 'party_size', 'message'], ['parent'], false, ['baby', 'general'], "You're invited to {{title}}.", true),
            'housewarming' => self::profile($house, ['family', 'home', 'date', 'venue'], ['attend', 'party_size'], ['host'], false, ['housewarming', 'general'], "You're invited to {{title}}.", true),
            'anniversary' => self::profile($birthday, ['hosts', 'message', 'date', 'venue'], ['attend', 'party_size'], ['host'], false, ['anniversary', 'general'], "You're invited to celebrate {{title}}.", true),
            'corporate' => self::profile($corporate, ['company', 'title', 'agenda', 'speakers', 'venue'], ['attend', 'company', 'job_title', 'dietary'], ['company', 'organizer'], true, ['corporate', 'general'], "You're invited to {{title}}.", false),
            'graduation' => self::profile($simple, ['celebrant', 'date', 'venue'], ['attend', 'party_size'], ['celebrant', 'institution'], false, ['graduation', 'general'], "You're invited to {{title}}.", true),
            'religious' => self::profile($simple, ['hosts', 'message', 'date', 'venue'], ['attend', 'party_size'], ['host'], false, ['religious', 'general'], "You're invited to {{title}}.", true),
            'social' => self::profile($simple, ['hosts', 'message', 'date', 'venue'], ['attend', 'party_size'], ['host'], false, ['party', 'general'], "You're invited to {{title}}.", true),
            'memorial' => self::profile(array_replace($off, array_fill_keys(['hero', 'message', 'venue', 'map', 'footer'], true)), ['hosts', 'message', 'date', 'venue'], [], ['host'], false, ['general'], 'Join us in remembering {{title}}.', false),
            'custom' => self::profile($simple, ['title', 'date', 'venue'], ['attend', 'party_size'], ['host'], false, ['general'], "You're invited to {{title}}.", true),
        ];
    }

    /**
     * @return array<int, array{name: string, slug: string, category: string, profile: string, icon: string}>
     */
    public static function definitions(): array
    {
        $rows = [
            ['Wedding', 'wedding', 'wedding', 'wedding', 'ring'],
            ['Engagement', 'engagement', 'wedding', 'wedding', 'ring'],
            ['Reception', 'reception', 'wedding', 'wedding', 'ring'],
            ['Save the Date', 'save-the-date', 'wedding', 'save-the-date', 'ring'],
            ['Mehendi', 'mehendi', 'wedding', 'wedding', 'ring'],
            ['Haldi', 'haldi', 'wedding', 'wedding', 'ring'],
            ['Sangeet', 'sangeet', 'wedding', 'wedding', 'ring'],
            ['Bridal Shower', 'bridal-shower', 'wedding', 'social', 'ring'],
            ['Bachelor Party', 'bachelor-party', 'wedding', 'social', 'ring'],
            ['Bachelorette Party', 'bachelorette-party', 'wedding', 'social', 'ring'],
            ['Birthday', 'birthday', 'family', 'birthday', 'cake'],
            ['Anniversary', 'anniversary', 'family', 'anniversary', 'bouquet'],
            ['Baby Shower', 'baby-shower', 'family', 'baby', 'baby'],
            ['Baby Naming', 'baby-naming', 'family', 'baby', 'baby'],
            ['Naming Ceremony', 'naming-ceremony', 'family', 'baby', 'baby'],
            ['Housewarming', 'housewarming', 'family', 'housewarming', 'home'],
            ['Retirement', 'retirement', 'family', 'social', 'party'],
            ['Family Reunion', 'family-reunion', 'family', 'social', 'party'],
            ['Baptism', 'baptism', 'religious', 'religious', 'pray'],
            ['Christening', 'christening', 'religious', 'religious', 'pray'],
            ['Communion', 'communion', 'religious', 'religious', 'pray'],
            ['Confirmation', 'confirmation', 'religious', 'religious', 'pray'],
            ['Religious Ceremony', 'religious-ceremony', 'religious', 'religious', 'pray'],
            ['Prayer Event', 'prayer-event', 'religious', 'religious', 'pray'],
            ['Temple Ceremony', 'temple-ceremony', 'religious', 'religious', 'pray'],
            ['Church Event', 'church-event', 'religious', 'religious', 'pray'],
            ['Mosque Event', 'mosque-event', 'religious', 'religious', 'pray'],
            ['Festival Celebration', 'festival-celebration', 'religious', 'religious', 'pray'],
            ['Cultural Festival', 'cultural-festival', 'cultural', 'religious', 'culture'],
            ['Traditional Ceremony', 'traditional-ceremony', 'cultural', 'religious', 'culture'],
            ['Community Celebration', 'community-celebration', 'cultural', 'social', 'culture'],
            ['Regional Celebration', 'regional-celebration', 'cultural', 'social', 'culture'],
            ['Corporate Event', 'corporate-event', 'professional', 'corporate', 'briefcase'],
            ['Business Event', 'business-event', 'professional', 'corporate', 'briefcase'],
            ['Conference', 'conference', 'professional', 'corporate', 'briefcase'],
            ['Seminar', 'seminar', 'professional', 'corporate', 'briefcase'],
            ['Workshop', 'workshop', 'professional', 'corporate', 'briefcase'],
            ['Product Launch', 'product-launch', 'professional', 'corporate', 'briefcase'],
            ['Office Party', 'office-party', 'professional', 'corporate', 'briefcase'],
            ['Networking Event', 'networking-event', 'professional', 'corporate', 'briefcase'],
            ['Team Celebration', 'team-celebration', 'professional', 'corporate', 'briefcase'],
            ['Graduation', 'graduation', 'education', 'graduation', 'cap'],
            ['School Event', 'school-event', 'education', 'graduation', 'cap'],
            ['College Event', 'college-event', 'education', 'graduation', 'cap'],
            ['Alumni Reunion', 'alumni-reunion', 'education', 'graduation', 'cap'],
            ['Party', 'party', 'social', 'social', 'party'],
            ['Reunion', 'reunion', 'social', 'social', 'party'],
            ['Dinner', 'dinner', 'social', 'social', 'party'],
            ['Get-together', 'get-together', 'social', 'social', 'party'],
            ['Farewell', 'farewell', 'social', 'social', 'party'],
            ['Welcome Party', 'welcome-party', 'social', 'social', 'party'],
            ['Memorial', 'memorial', 'other', 'memorial', 'spark'],
            ['Custom Event', 'custom', 'other', 'custom', 'spark'],
        ];

        return array_map(fn (array $row): array => [
            'name' => $row[0],
            'slug' => $row[1],
            'category' => $row[2],
            'profile' => $row[3],
            'icon' => $row[4],
        ], $rows);
    }

    /**
     * @return array<int, array<string, string>>
     */
    public static function templates(): array
    {
        $rows = [
            ['tamil-wedding', 'Tamil wedding', 'wedding', 'ta', 'mehendi,haldi,wedding,reception'],
            ['tamil-engagement', 'Tamil engagement', 'engagement', 'ta', 'engagement'],
            ['seemantham', 'Seemantham', 'baby-shower', 'ta', ''],
            ['ear-piercing', 'Ear piercing ceremony', 'naming-ceremony', 'ta', ''],
            ['tamil-housewarming', 'Tamil housewarming', 'housewarming', 'ta', ''],
            ['tamil-naming', 'Tamil naming ceremony', 'naming-ceremony', 'ta', ''],
            ['tamil-birthday', 'Tamil birthday', 'birthday', 'ta', ''],
            ['telugu-wedding', 'Telugu wedding', 'wedding', 'te', 'mehendi,wedding,reception'],
            ['telugu-engagement', 'Telugu engagement', 'engagement', 'te', 'engagement'],
            ['telugu-seemantham', 'Telugu seemantham', 'baby-shower', 'te', ''],
            ['telugu-naming', 'Telugu naming ceremony', 'naming-ceremony', 'te', ''],
            ['telugu-housewarming', 'Telugu housewarming', 'housewarming', 'te', ''],
            ['kerala-wedding', 'Kerala wedding', 'wedding', 'ml', 'wedding,reception'],
            ['malayalam-engagement', 'Malayalam engagement', 'engagement', 'ml', 'engagement'],
            ['malayalam-naming', 'Malayalam naming ceremony', 'naming-ceremony', 'ml', ''],
            ['malayalam-housewarming', 'Malayalam housewarming', 'housewarming', 'ml', ''],
            ['kannada-wedding', 'Kannada wedding', 'wedding', 'kn', 'wedding,reception'],
            ['kannada-engagement', 'Kannada engagement', 'engagement', 'kn', 'engagement'],
            ['kannada-naming', 'Kannada naming ceremony', 'naming-ceremony', 'kn', ''],
            ['kannada-housewarming', 'Kannada housewarming', 'housewarming', 'kn', ''],
            ['hindi-wedding', 'Hindi wedding', 'wedding', 'hi', 'haldi,mehendi,sangeet,wedding,reception'],
            ['roka', 'Roka', 'engagement', 'hi', 'roka'],
            ['hindi-engagement', 'North Indian engagement', 'engagement', 'hi', 'engagement'],
            ['hindi-housewarming', 'Griha pravesh', 'housewarming', 'hi', ''],
            ['anand-karaj', 'Anand Karaj', 'wedding', 'pa', 'mehendi,sangeet,wedding,reception'],
            ['punjabi-engagement', 'Punjabi engagement', 'engagement', 'pa', 'engagement'],
            ['bengali-wedding', 'Bengali wedding', 'wedding', 'bn', 'wedding,reception'],
            ['bengali-engagement', 'Bengali engagement', 'engagement', 'bn', 'engagement'],
            ['bengali-naming', 'Bengali naming ceremony', 'naming-ceremony', 'bn', ''],
            ['gujarati-wedding', 'Gujarati wedding', 'wedding', 'gu', 'garba,wedding,reception'],
            ['garba', 'Garba', 'cultural-festival', 'gu', 'garba'],
            ['gujarati-engagement', 'Gujarati engagement', 'engagement', 'gu', 'engagement'],
        ];

        return array_map(fn (array $row): array => [
            'id' => $row[0],
            'name' => $row[1],
            'event_type' => $row[2],
            'locale' => $row[3],
            'schedule' => $row[4],
        ], $rows);
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function type(string $slug): ?array
    {
        foreach (self::definitions() as $type) {
            if ($type['slug'] === $slug) {
                return $type;
            }
        }

        return null;
    }

    /**
     * @return array<string, bool>
     */
    public static function sectionsFor(string $slug): array
    {
        $type = self::type($slug) ?? self::type('custom');
        $profile = self::profiles()[$type['profile'] ?? 'custom'] ?? self::profiles()['custom'];

        return $profile['sections'];
    }

    /**
     * @param  array<string, bool>  $sections
     * @param  array<int, string>  $fields
     * @param  array<int, string>  $rsvp
     * @param  array<int, string>  $roles
     * @param  array<int, string>  $themes
     * @return array<string, mixed>
     */
    private static function profile(array $sections, array $fields, array $rsvp, array $roles, bool $schedule, array $themes, string $share, bool $guestbook): array
    {
        return [
            'sections' => $sections,
            'fields' => $fields,
            'rsvp_fields' => $rsvp,
            'host_roles' => $roles,
            'schedule' => $schedule,
            'theme_categories' => $themes,
            'share' => $share,
            'guestbook' => $guestbook,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function configuration(string $slug): array
    {
        $type = self::type($slug) ?? self::type('custom');
        $profile = self::profiles()[$type['profile'] ?? 'custom'];
        unset($profile['sections']);

        return $profile;
    }
}
