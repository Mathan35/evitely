<?php

namespace App\Support;

class DesignGallery
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function nav(): array
    {
        return array_values(array_map(function (array $occasion): array {
            return [
                'slug' => $occasion['slug'],
                'name' => $occasion['name'],
                'href' => '/designs/'.$occasion['slug'],
            ];
        }, self::occasions()));
    }

    public static function index(): array
    {
        return array_values(array_map(function (array $occasion): array {
            $links = self::designsFor($occasion, 'link');
            $cards = self::designsFor($occasion, 'card');

            return [
                'slug' => $occasion['slug'],
                'name' => $occasion['name'],
                'href' => '/designs/'.$occasion['slug'],
                'event_type' => $occasion['event_type'],
                'aliases' => $occasion['aliases'] ?? [],
                'heading' => $occasion['heading'],
                'description' => $occasion['description'],
                'links' => array_slice($links, 0, 4),
                'cards' => array_slice($cards, 0, 4),
                'link_count' => count($links),
                'card_count' => count($cards),
            ];
        }, self::occasions()));
    }

    /**
     * @var array<string, array{slug: string, design: array<string, mixed>, invitation_card: array<string, mixed>|null}>|null
     */
    private static ?array $findIndex = null;

    /**
     * Resolve a gallery design by id and pair link templates with a matching card.
     *
     * @return array{slug: string, design: array<string, mixed>, invitation_card: array<string, mixed>|null}|null
     */
    public static function find(string $id): ?array
    {
        $needle = trim($id);

        if ($needle === '') {
            return null;
        }

        if (self::$findIndex === null) {
            self::$findIndex = self::buildFindIndex();
        }

        return self::$findIndex[$needle] ?? null;
    }

    /**
     * @return array<string, array{slug: string, design: array<string, mixed>, invitation_card: array<string, mixed>|null}>
     */
    private static function buildFindIndex(): array
    {
        $index = [];

        foreach (self::occasions() as $occasion) {
            $cards = self::designsFor($occasion, 'card');

            foreach (['link', 'card'] as $kind) {
                $designs = $kind === 'card' ? $cards : self::designsFor($occasion, $kind);

                foreach ($designs as $designIndex => $design) {
                    $id = (string) ($design['id'] ?? '');

                    if ($id === '' || isset($index[$id])) {
                        continue;
                    }

                    $invitationCard = null;

                    if ($kind === 'link' && $cards !== []) {
                        $styleKey = (string) ($design['style_key'] ?? '');

                        foreach ($cards as $card) {
                            if (($card['style_key'] ?? '') === $styleKey) {
                                $invitationCard = $card;
                                break;
                            }
                        }

                        $invitationCard ??= $cards[$designIndex % count($cards)] ?? $cards[0];
                    }

                    $index[$id] = [
                        'slug' => $occasion['slug'],
                        'design' => $design,
                        'invitation_card' => $invitationCard,
                    ];
                }
            }
        }

        return $index;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function forSlug(string $slug): ?array
    {
        $occasion = self::occasion($slug);

        if ($occasion === null) {
            return null;
        }

        $isBirthday = $occasion['slug'] === 'birthday';
        $copy = self::marketplaceCopy($occasion);

        return [
            'slug' => $occasion['slug'],
            'event_type' => $occasion['event_type'],
            'name' => $occasion['name'],
            'heading' => $isBirthday ? 'Birthday Digital Invitation Cards & Envelopes' : $copy['heading_links'],
            'heading_links' => $isBirthday ? 'Birthday Event Websites' : $copy['heading_links'],
            'heading_cards' => $isBirthday ? 'Birthday Digital Invitation Cards & Envelopes' : $copy['heading_cards'],
            'description' => $isBirthday
                ? 'Explore 20 signature digital cards and envelopes. Each design is complete with customized unboxing animations, metallic wax seals, patterned liners, and interactive reply forms.'
                : $copy['description_links'],
            'description_links' => $isBirthday
                ? 'Explore 20 signature event websites. Each design includes countdown, map, RSVP, playlist, and a guest wall guests can open on any phone.'
                : $copy['description_links'],
            'description_cards' => $isBirthday
                ? 'Explore 20 signature digital cards and envelopes. Each design is complete with customized unboxing animations, metallic wax seals, patterned liners, and interactive reply forms.'
                : $copy['description_cards'],
            'grid_title_links' => $copy['grid_title_links'],
            'grid_title_cards' => $copy['grid_title_cards'],
            'moods' => $copy['moods'],
            'default_tab' => $copy['default_tab'],
            'default_mood' => $copy['default_mood'],
            'search_placeholder' => $copy['search_placeholder'],
            'search_placeholder_links' => $copy['search_placeholder_links'] ?? $copy['search_placeholder'],
            'search_placeholder_cards' => $copy['search_placeholder_cards'] ?? $copy['search_placeholder'],
            'show_planning_cta' => $copy['show_planning_cta'],
            'tab_helper_links' => $copy['tab_helper_links'],
            'tab_helper_cards' => $copy['tab_helper_cards'],
            'brand_pill' => $copy['brand_pill'] ?? null,
            'breadcrumb' => $copy['breadcrumb'] ?? null,
            'hide_toolbar_meta' => $copy['hide_toolbar_meta'] ?? false,
            'hide_search' => $copy['hide_search'] ?? false,
            'layout' => $copy['layout'] ?? 'tabs',
            'links' => self::designsFor($occasion, 'link'),
            'cards' => self::designsFor($occasion, 'card'),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function occasion(string $slug): ?array
    {
        $normalized = strtolower(trim($slug));

        foreach (self::occasions() as $occasion) {
            if ($occasion['slug'] === $normalized || in_array($normalized, $occasion['aliases'], true)) {
                return $occasion;
            }
        }

        return null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function cardLibraryRows(): array
    {
        $rows = [];

        foreach (self::occasions() as $occasion) {
            foreach (self::designsFor($occasion, 'card') as $card) {
                $rows[] = [
                    'id' => $card['id'],
                    'name' => $card['name'],
                    'event_type' => $occasion['slug'],
                    'style' => $card['style_key'],
                    'language' => 'en',
                    'format' => $card['format'],
                    'premium' => false,
                    'background' => $card['palette']['paper'],
                    'ink' => $card['palette']['ink'],
                    'gold' => $card['palette']['gold'] ?? '#b48a4a',
                    'image' => $card['image_mobile'] ?? $card['image'] ?? null,
                    'image_width' => (int) ($card['image_width'] ?? 0) ?: null,
                    'image_height' => (int) ($card['image_height'] ?? 0) ?: null,
                ];
            }
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function occasions(): array
    {
        return [
            self::occasionRow(
                'wedding',
                'Wedding',
                'wedding',
                'wedding',
                'Wedding Invitation Designs',
                'Ceremony, reception, venue, and RSVP — twenty websites and twenty cards made for a wedding, not a generic party.',
                [
                    'weddings', 'engagement', 'reception', 'save-the-date', 'mehendi', 'haldi', 'sangeet',
                    'bachelor-party', 'bachelorette-party',
                ],
                'Daniel & Sophia',
                'Together with their Families',
                'Reception · 12 September 2026',
                'The Glasshouse, Hudson Valley',
                ['Countdown', 'Ceremony', 'Reception', 'Map', 'RSVP', 'Guest wall'],
                ['Ivory Vows', 'Moonlit Mandap', 'Garden Aisle', 'Gilded Haldi', 'Quiet Type', 'Portrait Weekend', 'Temple Bloom', 'After Dark Gala', 'Mehendi Ledger', 'Guest Atlas'],
                ['Wax Garden', 'Noir Foil', 'Peony Suite', 'Temple Maroon', 'Serif Save-the-Date', 'Story Veil', 'Landscape Lawn', 'Illustrated Mandap', 'Monogram Seal', 'QR Envelope'],
            ),
            self::occasionRow(
                'birthday',
                'Birthday',
                'birthday',
                'birthday',
                'Birthday Invitation Designs',
                'Celebrant, age, venue, playlist, and RSVP — twenty party sites and twenty cards that feel like the night, not a wedding page.',
                ['birthdays', 'anniversary', 'retirement', 'family-reunion'],
                'Leo',
                "You're Invited",
                'Birthday Party · 8 May 2026',
                'Coastal Terrace, Malibu',
                ['Countdown', 'Playlist', 'Photo wall', 'RSVP', 'Cake hour'],
                ['Confetti Hour', 'Neon Thirty', 'Garden Roast', 'Type-Only Toast', 'Photo Reel', 'Balloon Ledger', 'Afterparty Link', 'Kids Carnival', 'Gold Decade', 'Jukebox Page'],
                ['Balloon Square', 'Neon Story', 'Garden Portrait', 'Type Cake', 'Photo Polaroid', 'Confetti Landscape', 'Kids Collage', 'Foil Thirty', 'Playlist Card', 'Wax Candle'],
            ),
            self::occasionRow(
                'corporate',
                'Corporate Event',
                'corporate-event',
                'corporate',
                'Corporate Invitation Designs',
                'Company, agenda, speakers, and registration — twenty portals and twenty cards for summits, not celebrations.',
                [
                    'corporate-event', 'corporate-events', 'business-event', 'conference', 'seminar',
                    'workshop', 'product-launch', 'networking-event', 'team-offsite',
                ],
                'Northwind',
                "You're Invited",
                'Keynote · 19 March 2026',
                'Meridian Hall, Chicago',
                ['Agenda', 'Speakers', 'Registration', 'Venue', 'Badges'],
                ['Boardroom Quiet', 'Keynote Atlas', 'Agenda Grid', 'Speaker Wall', 'Midnight Gala', 'Product Launch', 'Workshop Ledger', 'Badge Portal', 'Skyline Deck', 'Foil Dinner'],
                ['Charcoal Landscape', 'Crest Portrait', 'Launch Story', 'Agenda Square', 'Foil Gala', 'Minimal Badge', 'Speaker Card', 'Navy Envelope', 'Type Summit', 'Map Invite'],
            ),
            self::occasionRow(
                'baby-shower',
                'Baby Shower',
                'baby-shower',
                'baby',
                'Baby Shower Invitation Designs',
                'Hosts, date, registry, and a memory wall — twenty shower sites and twenty cards guests will actually keep.',
                ['baby', 'babies', 'baby-showers', 'baby-naming', 'naming-ceremony'],
                'Maya',
                "You're Invited",
                'Brunch · 14 June 2026',
                'Magnolia House, Charleston',
                ['Brunch', 'Games', 'Registry', 'Memory wall', 'RSVP'],
                ['Powder Brunch', 'Sage Story', 'Registry Garden', 'Memory Wall', 'Tiny Type', 'Illustrated Stork', 'Floral Hour', 'Quilt Page', 'Moon Nursery', 'Host Note'],
                ['Blush Portrait', 'Sage Square', 'Stork Story', 'Quilt Landscape', 'Foil Booties', 'Type Birth', 'Floral Envelope', 'Registry Card', 'Cloud Seal', 'Photo Frame'],
            ),
            self::occasionRow(
                'party',
                'Party',
                'party',
                'social',
                'Party Invitation Designs',
                'Dress code, hour, playlist, and the door list — twenty after-dark pages and twenty cards with a little shine.',
                [
                    'parties', 'social', 'community-celebration', 'regional-celebration', 'festival-celebration',
                    'reunion', 'dinner', 'get-together', 'farewell', 'welcome-party', 'office-party', 'team-celebration',
                ],
                'Jordan',
                "You're Invited",
                'Cocktails · 21 November 2026',
                'Harbor Lights, San Diego',
                ['Dress code', 'Playlist', 'Door list', 'Map', 'Afterparty'],
                ['Emerald Hour', 'Black Tie Loft', 'Jukebox Night', 'Velvet Type', 'Photo Booth', 'Gold Afterparty', 'Illustrated Disco', 'Door List', 'Skyline Party', 'Wax Cocktail'],
                ['Emerald Portrait', 'Noir Square', 'Skyline Landscape', 'Story Sparkle', 'Disco Foil', 'Type Only', 'Photo Strip', 'Wax Stamp', 'Illustrated Mask', 'QR Door'],
            ),
            self::occasionRow(
                'graduation',
                'Graduation',
                'graduation',
                'graduation',
                'Graduation Invitation Designs',
                'Procession, lunch, portraits, and family seating — twenty ceremony sites and twenty cards for the hour of the cap.',
                ['graduations', 'school-event', 'college-event', 'alumni-reunion'],
                'Alex',
                "You're Invited",
                'Commencement · 6 June 2026',
                'Harbor Lights, Boston',
                ['Procession', 'Caps', 'Lunch', 'Portraits', 'RSVP'],
                ['Senate Quiet', 'Cap Toss', 'Family Ledger', 'Portrait Wall', 'Gold Degree', 'Campus Map', 'Type Diploma', 'Lunch RSVP', 'Illustrated Owl', 'After Class'],
                ['Navy Portrait', 'Maroon Square', 'Campus Landscape', 'Story Cap', 'Foil Diploma', 'Type Honor', 'Photo Mortar', 'Crest Seal', 'Illustrated Book', 'Lunch Card'],
            ),
            self::occasionRow(
                'bridal-shower',
                'Bridal',
                'bridal-shower',
                'social',
                'Bridal Invitation Designs',
                'Brunch, mehendi, registry, and well-wishes — twenty shower websites and twenty cards for the days before the wedding.',
                ['bridals', 'bridal', 'bridal-showers'],
                'Claire',
                "You're Invited",
                'Brunch · 12 September 2026',
                'Harbor Lights, Charleston',
                ['Brunch', 'Mehendi', 'Registry', 'Well-wishes'],
                ['Blush Brunch', 'Mehendi Atelier', 'Ivory Registry', 'Dusty Rose Wall', 'Henna Ledger', 'Type Trousseau', 'Garden Shower', 'Illustrated Veil', 'Foil Morning', 'Guest Notes'],
                ['Blush Portrait', 'Ivory Square', 'Mehendi Story', 'Lawn Landscape', 'Foil Veil', 'Type Bride', 'Photo Trousseau', 'Wax Rose', 'Illustrated Henna', 'Registry Card'],
            ),
            self::occasionRow(
                'housewarming',
                'Housewarming',
                'housewarming',
                'housewarming',
                'Housewarming Invitation Designs',
                'New address, tour hour, kitchen fund, and directions — twenty home pages and twenty cards that get guests to the door.',
                ['housewarmings', 'house-warming'],
                'Riley',
                'Our door is open',
                'Tour · 18 October 2026',
                'Willow Porch, Portland',
                ['Tour', 'Dinner', 'Map', 'Kitchen fund', 'Parking'],
                ['Willow Open House', 'Terracotta Tour', 'Kitchen Fund', 'Garden Keys', 'Type Address', 'Photo Hearth', 'Illustrated Porch', 'Map First', 'Sage Welcome', 'Long Table'],
                ['Terracotta Portrait', 'Sage Square', 'Street Landscape', 'Story Keys', 'Foil House', 'Type Address', 'Photo Door', 'Wax Key', 'Illustrated Plan', 'Fund Card'],
            ),
            self::occasionRow(
                'custom',
                'Custom Event',
                'custom',
                'custom',
                'Custom Invitation Designs',
                'Name the gathering yourself — forty websites and twenty cards that never assume a bride, a cake, or a boardroom.',
                [
                    'other', 'custom-event', 'office-party', 'team-celebration', 'reunion', 'dinner',
                    'get-together', 'farewell', 'welcome-party', 'memorial',
                    'baptism', 'christening', 'communion', 'confirmation', 'religious-ceremony',
                    'prayer-event', 'temple-ceremony', 'church-event', 'mosque-event',
                    'cultural-festival', 'traditional-ceremony',
                ],
                'Morgan',
                'You are invited',
                'Evening · 14 November 2026',
                'Shore Lights, Malibu',
                ['Countdown', 'Note', 'Map', 'RSVP', 'Wall'],
                ['Quiet Gathering', 'Ochre Ledger', 'Slate Atlas', 'Forest Note', 'Type Only', 'Photo Room', 'Illustrated Spark', 'Module Hub', 'Foil Custom', 'Guest Book'],
                ['Ochre Portrait', 'Slate Square', 'Forest Landscape', 'Story Spark', 'Foil Monogram', 'Type Custom', 'Photo Frame', 'Wax Initial', 'Illustrated Seal', 'QR Note'],
            ),
        ];
    }

    /**
     * @param  array<int, string>  $aliases
     * @param  array<int, string>  $modules
     * @param  array<int, string>  $linkNames
     * @param  array<int, string>  $cardNames
     * @return array<string, mixed>
     */
    private static function occasionRow(
        string $slug,
        string $name,
        string $eventType,
        string $profile,
        string $heading,
        string $description,
        array $aliases,
        string $hosts,
        string $kicker,
        string $when,
        string $where,
        array $modules,
        array $linkNames,
        array $cardNames,
    ): array {
        return [
            'slug' => $slug,
            'name' => $name,
            'event_type' => $eventType,
            'profile' => $profile,
            'heading' => $heading,
            'description' => $description,
            'aliases' => $aliases,
            'sample' => [
                'hosts' => $hosts,
                'kicker' => $kicker,
                'when' => $when,
                'where' => $where,
                'modules' => $modules,
            ],
            'link_names' => $linkNames,
            'card_names' => $cardNames,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function styles(): array
    {
        return [
            ['key' => 'elegant', 'label' => 'Elegant & minimal', 'layout' => 'serif-countdown', 'card_layout' => 'quiet-frame', 'format' => 'portrait', 'theme' => 'classic'],
            ['key' => 'luxury', 'label' => 'Luxury & premium', 'layout' => 'dark-luxe', 'card_layout' => 'foil-panel', 'format' => 'story', 'theme' => 'royal'],
            ['key' => 'modern', 'label' => 'Modern & contemporary', 'layout' => 'split-photo', 'card_layout' => 'edge-type', 'format' => 'square', 'theme' => 'modern'],
            ['key' => 'floral', 'label' => 'Floral & decorative', 'layout' => 'botanical-frame', 'card_layout' => 'bloom-border', 'format' => 'portrait', 'theme' => 'floral'],
            ['key' => 'traditional', 'label' => 'Traditional & cultural', 'layout' => 'ornament-ledger', 'card_layout' => 'mandala-seal', 'format' => 'portrait', 'theme' => 'traditional'],
            ['key' => 'playful', 'label' => 'Colorful & playful', 'layout' => 'color-block', 'card_layout' => 'confetti-tile', 'format' => 'square', 'theme' => 'bollywood'],
            ['key' => 'type', 'label' => 'Typography-focused', 'layout' => 'display-type', 'card_layout' => 'giant-serif', 'format' => 'landscape', 'theme' => 'minimal'],
            ['key' => 'photo', 'label' => 'Photo-focused', 'layout' => 'full-bleed', 'card_layout' => 'photo-mat', 'format' => 'story', 'theme' => 'modern'],
            ['key' => 'illustrated', 'label' => 'Illustrated & artistic', 'layout' => 'illustrated-mark', 'card_layout' => 'ink-drawing', 'format' => 'portrait', 'theme' => 'south-indian'],
            ['key' => 'interactive', 'label' => 'Creative & interactive', 'layout' => 'module-hub', 'card_layout' => 'qr-suite', 'format' => 'landscape', 'theme' => 'luxury'],
        ];
    }

    /**
     * @param  array<string, mixed>  $occasion
     * @return array<int, array<string, mixed>>
     */
    private static function designsFor(array $occasion, string $kind): array
    {
        if ($occasion['slug'] === 'birthday') {
            return self::birthdayDesigns($kind, $occasion);
        }

        if ($occasion['slug'] === 'baby-shower' && $kind === 'card') {
            return self::babyShowerCardDesigns($occasion);
        }

        if ($occasion['slug'] === 'party' && $kind === 'card') {
            return self::partyCardDesigns($occasion);
        }

        if ($occasion['slug'] === 'graduation' && $kind === 'card') {
            return self::graduationCardDesigns($occasion);
        }

        if ($occasion['slug'] === 'bridal-shower' && $kind === 'card') {
            return self::bridalShowerCardDesigns($occasion);
        }

        if ($occasion['slug'] === 'housewarming' && $kind === 'card') {
            return self::housewarmingCardDesigns($occasion);
        }

        if ($occasion['slug'] === 'corporate' && $kind === 'card') {
            return self::corporateCardDesigns($occasion);
        }

        if ($occasion['slug'] === 'custom' && $kind === 'card') {
            return self::customCardDesigns($occasion);
        }

        $marketplace = GalleryMarketplace::designs($occasion, $kind);

        if ($marketplace !== null) {
            return $marketplace;
        }

        $names = $kind === 'link' ? $occasion['link_names'] : $occasion['card_names'];
        $designs = [];

        foreach (self::styles() as $index => $style) {
            $palette = self::palette($occasion['slug'], $style['key'], $index);
            $id = $occasion['slug'].'-'.$kind.'-'.$style['key'];

            $designs[] = [
                'id' => $id,
                'name' => $names[$index],
                'kind' => $kind,
                'style_key' => $style['key'],
                'style' => $style['label'],
                'moods' => ['Top Rated', $style['label']],
                'kicker' => $style['label'],
                'layout' => $kind === 'link' ? $style['layout'] : $style['card_layout'],
                'format' => $kind === 'link' ? 'website' : $style['format'],
                'theme' => $style['theme'],
                'event_type' => $occasion['event_type'],
                'image' => null,
                'palette' => $palette,
                'sample' => $occasion['sample'],
            ];
        }

        return $designs;
    }

    /**
     * @param  array<string, mixed>  $occasion
     * @return array<int, array<string, mixed>>
     */
    private static function birthdayDesigns(string $kind, array $occasion): array
    {
        $suites = [
            ['neon-glow', 'Neon Glow Celebration Party', 'Interactive Wax Seal', ['Mood Dark Mode', 'Vibrant & Modern'], 'luxury', 'portrait', 'Interactive Wax Seal'],
            ['midnight-velvet', 'Classic Midnight Velvet Gala', 'Luxury & Glam', ['Luxury & Glam', 'Mood Dark Mode'], 'luxury', 'portrait', 'Top Rated'],
            ['boho-sunset', 'Boho Watercolor Sunset', 'Natural & Boho', ['Natural & Boho'], 'floral', 'portrait', null],
            ['y2k-disco', 'Y2K Retro Disco Glam', 'Y2K & Retro Arcade', ['Y2K & Retro Arcade', 'Vibrant & Modern'], 'playful', 'square', 'Preview'],
            ['english-garden', 'English Garden Watercolor', 'Natural & Boho', ['Natural & Boho'], 'floral', 'portrait', null],
            ['gold-leaf-40', 'Sophisticated Gold Leaf 40th', 'Luxury & Glam', ['Luxury & Glam'], 'luxury', 'portrait', null],
            ['comic', 'Vintage Comic Strips Party', 'Kids & Playful', ['Kids & Playful', 'Vibrant & Modern'], 'playful', 'square', null],
            ['safari', "Safari Explorers Kid's Bash", 'Kids & Playful', ['Kids & Playful'], 'illustrated', 'portrait', null],
            ['typographic', 'Monochrome Typographic Age', 'Elegant Typography', ['Elegant Typography'], 'type', 'portrait', null],
            ['balloon', 'Sweet Retro Balloon Fest', 'Kids & Playful', ['Kids & Playful', 'Y2K & Retro Arcade'], 'playful', 'square', null],
            ['galaxy', 'Out of This World Galaxy', 'Photo Collage', ['Mood Dark Mode', 'Photo Collage'], 'photo', 'story', null],
            ['campfire', 'Cozy Campfire Gathering', 'Natural & Boho', ['Natural & Boho'], 'illustrated', 'portrait', null],
            ['brunch', 'Chic Birthday Brunch', 'Elegant Typography', ['Natural & Boho', 'Elegant Typography'], 'elegant', 'portrait', null],
            ['carnival', 'Funfair Carnival Birthday', 'Kids & Playful', ['Kids & Playful', 'Vibrant & Modern'], 'playful', 'square', null],
            ['cyberpunk', 'Cyberpunk Future Night', 'Mood Dark Mode', ['Mood Dark Mode', 'Y2K & Retro Arcade'], 'modern', 'story', null],
            ['jubilee', 'Golden Jubilee Celebration', 'Luxury & Glam', ['Luxury & Glam'], 'luxury', 'portrait', null],
            ['pastel', 'Elegant Pastel Botanicals', 'Natural & Boho', ['Natural & Boho'], 'floral', 'portrait', null],
            ['sea', 'Under the Sea Adventure', 'Kids & Playful', ['Kids & Playful', 'Photo Collage'], 'illustrated', 'portrait', null],
            ['artsy', 'Artsy Hand-Drawn Party', 'Elegant Typography', ['Elegant Typography', 'Kids & Playful'], 'illustrated', 'portrait', null],
            ['ticket', 'Retro Ticket Invitation', 'Y2K & Retro Arcade', ['Y2K & Retro Arcade'], 'playful', 'landscape', null],
        ];

        $file = [
            'neon-glow' => 'neon-glow',
            'midnight-velvet' => 'midnight-velvet',
            'boho-sunset' => 'boho-sunset',
            'y2k-disco' => 'y2k-disco',
            'english-garden' => 'english-garden',
            'gold-leaf-40' => 'gold-leaf-40',
            'comic' => 'comic',
            'safari' => 'safari',
            'typographic' => 'typographic',
            'balloon' => 'balloon',
            'galaxy' => 'galaxy',
            'campfire' => 'campfire',
            'brunch' => 'brunch',
            'carnival' => 'carnival',
            'cyberpunk' => 'cyberpunk',
            'jubilee' => 'jubilee',
            'pastel' => 'pastel',
            'sea' => 'sea',
            'artsy' => 'artsy',
            'ticket' => 'ticket',
        ];

        $designs = [];

        foreach ($suites as $index => $row) {
            [$key, $name, $style, $moods, $themeKey, $format, $kicker] = $row;
            $palette = self::palette('birthday', $themeKey, $index % 10);
            $stem = $key === 'gold-leaf-40' && $kind === 'link' ? 'gold-leaf' : $file[$key];
            $cache = '?v=2';
            $image = $kind === 'card'
                ? "/images/gallery/birthday/blank/card-{$key}.jpg{$cache}"
                : "/images/gallery/birthday/birthday-link-{$stem}.jpg?v=1";

            $design = [
                'id' => 'birthday-'.$kind.'-'.$key,
                'name' => $name,
                'kind' => $kind,
                'style_key' => $key,
                'style' => $style,
                'moods' => array_values(array_unique(array_merge(['Top Rated'], $moods))),
                'kicker' => $kind === 'card' ? null : $kicker,
                'layout' => $kind === 'link' ? 'full-bleed' : 'quiet-frame',
                'format' => $kind === 'link' ? 'website' : 'portrait',
                'theme' => $themeKey === 'playful' ? 'bollywood' : ($themeKey === 'elegant' ? 'classic' : ($themeKey === 'type' ? 'minimal' : ($themeKey === 'illustrated' ? 'south-indian' : ($themeKey === 'photo' ? 'modern' : $themeKey)))),
                'event_type' => $occasion['event_type'],
                'image' => $image,
                'palette' => $palette,
                'sample' => $kind === 'card'
                    ? array_merge($occasion['sample'], InvitationCopy::forGallery('birthday'))
                    : $occasion['sample'],
            ];

            if ($kind === 'card') {
                $imagePath = public_path('images/gallery/birthday/blank/card-'.$key.'-mobile.jpg');
                $dimensions = getimagesize($imagePath);

                if ($dimensions === false) {
                    throw new \RuntimeException('Unable to read birthday card image dimensions: '.$imagePath);
                }

                $design['image'] = "/images/gallery/birthday/blank/card-{$key}.jpg{$cache}";
                $design['image_mobile'] = "/images/gallery/birthday/blank/card-{$key}-mobile.jpg{$cache}";
                $design['image_desktop'] = "/images/gallery/birthday/blank/card-{$key}-desktop.jpg{$cache}";
                $design['image_width'] = $dimensions[0];
                $design['image_height'] = $dimensions[1];
            }

            $designs[] = $design;
        }

        return $designs;
    }

    /**
     * Blank-center baby shower invitation cards (marketplace keeps the website links).
     *
     * @param  array<string, mixed>  $occasion
     * @return array<int, array<string, mixed>>
     */
    private static function babyShowerCardDesigns(array $occasion): array
    {
        $suites = [
            ['woodland', 'Sweet Baby Woodland', 'Woodland & Safari', ['Woodland & Safari'], 'illustrated'],
            ['cloudland', 'Pastel Cloudland Journey', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['olive', 'Botanical Olive Garland', 'Botanical Nursery', ['Botanical Nursery'], 'floral'],
            ['terracotta', 'Boho Terracotta Earth', 'Modern Earthy', ['Botanical Nursery'], 'floral'],
            ['safari', 'Safari Wild One Baby', 'Woodland & Safari', ['Woodland & Safari'], 'illustrated'],
            ['celestial', 'Celestial Teddy', 'Dreamy & Sky', ['Dreamy & Sky'], 'luxury'],
            ['minimal-teddy', 'Minimal Teddy Natural', 'Minimalist Modern', ['Minimalist Modern'], 'elegant'],
            ['balloon', 'Whimsical Hot Air Balloon', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['eucalyptus', 'Eucalyptus Bliss', 'Botanical Nursery', ['Botanical Nursery'], 'floral'],
            ['stars', 'Under the Stars Baby', 'Dreamy & Sky', ['Dreamy & Sky'], 'luxury'],
            ['jungle', 'Modern Jungle Safari', 'Woodland & Safari', ['Woodland & Safari'], 'illustrated'],
            ['retro-love', 'Retro Baby Love', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['picnic', 'Teddy bear Picnic', 'Natural', ['Woodland & Safari'], 'illustrated'],
            ['giraffe', 'Dreamy Baby Giraffe', 'Dreamy & Sky', ['Dreamy & Sky'], 'playful'],
            ['floral-bloom', 'Chic Floral Bloom', 'Botanical Nursery', ['Botanical Nursery'], 'floral'],
            ['geometric', 'Geometric Nursery Blue', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['ocean', 'Ocean Adventure Splash', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['forest', 'Forest Friends', 'Woodland & Safari', ['Woodland & Safari'], 'illustrated'],
            ['sage', 'Modern Minimalist Sage', 'Minimalist Modern', ['Minimalist Modern'], 'elegant'],
            ['watercolor', 'Whimsical Watercolor Balloon', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
        ];

        $designs = [];
        $cache = '?v=1';

        foreach ($suites as $index => $row) {
            [$key, $name, $style, $moods, $themeKey] = $row;
            $palette = self::palette('baby-shower', $themeKey, $index % 10);
            $imagePath = public_path('images/gallery/baby-shower/blank/card-'.$key.'-mobile.jpg');
            $dimensions = getimagesize($imagePath);

            if ($dimensions === false) {
                throw new \RuntimeException('Unable to read baby shower card image dimensions: '.$imagePath);
            }

            $designs[] = [
                'id' => 'baby-shower-card-'.$key,
                'name' => $name,
                'kind' => 'card',
                'style_key' => $key,
                'style' => $style,
                'moods' => array_values(array_unique(array_merge(['Top Rated'], $moods))),
                'kicker' => null,
                'layout' => 'quiet-frame',
                'format' => 'portrait',
                'theme' => $themeKey === 'playful' ? 'bollywood' : ($themeKey === 'elegant' ? 'classic' : ($themeKey === 'illustrated' ? 'south-indian' : ($themeKey === 'modern' ? 'modern' : $themeKey))),
                'event_type' => $occasion['event_type'],
                'image' => "/images/gallery/baby-shower/blank/card-{$key}.jpg{$cache}",
                'image_mobile' => "/images/gallery/baby-shower/blank/card-{$key}-mobile.jpg{$cache}",
                'image_desktop' => "/images/gallery/baby-shower/blank/card-{$key}-desktop.jpg{$cache}",
                'image_width' => $dimensions[0],
                'image_height' => $dimensions[1],
                'palette' => $palette,
                'sample' => array_merge($occasion['sample'], InvitationCopy::forGallery('baby-shower')),
            ];
        }

        return $designs;
    }

    /**
     * Blank-center party invitation cards (marketplace keeps the website links).
     *
     * @param  array<string, mixed>  $occasion
     * @return array<int, array<string, mixed>>
     */
    private static function partyCardDesigns(array $occasion): array
    {
        $suites = [
            ['confetti-hats', 'Confetti Party Hats', 'Kids & Playful', ['Kids & Playful', 'Vibrant & Modern'], 'playful'],
            ['ribbon-stars', 'Rainbow Ribbon Stars', 'Vibrant & Modern', ['Vibrant & Modern'], 'playful'],
            ['bunting-balloons', 'Bunting Balloon Bash', 'Kids & Playful', ['Kids & Playful'], 'playful'],
            ['sketch-dinner', 'Sketch Dinner Soiree', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['balloon-blush', 'Blush Balloon Glow', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['disco-sketch', 'Disco Night Sketch', 'Y2K & Retro Arcade', ['Y2K & Retro Arcade'], 'illustrated'],
            ['linen-feast', 'Linen Feast Table', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['garden-table', 'Garden Table Evening', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['classical-arch', 'Classical Lantern Arch', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['navy-icons', 'Navy Party Icons', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['gift-cake', 'Gift & Cake Celebration', 'Kids & Playful', ['Kids & Playful'], 'playful'],
            ['rose-gold', 'Rose Gold Champagne', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['watercolor-gifts', 'Watercolor Party Gifts', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['blossom-arch', 'Cherry Blossom Arch', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['lantern-drape', 'Lantern Drape Hall', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['peach-arch', 'Peach Glow Arch', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['pink-party', 'Pink Party Sweet', 'Kids & Playful', ['Kids & Playful'], 'playful'],
            ['cocktail-spread', 'Cocktail Grazing Spread', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['feast-lights', 'Feast Lights Banner', 'Natural & Boho', ['Natural & Boho'], 'illustrated'],
            ['confetti-flags', 'Confetti Corner Flags', 'Vibrant & Modern', ['Vibrant & Modern'], 'playful'],
        ];

        $designs = [];
        $cache = '?v=1';

        foreach ($suites as $index => $row) {
            [$key, $name, $style, $moods, $themeKey] = $row;
            $palette = self::palette('party', $themeKey, $index % 10);
            $imagePath = public_path('images/gallery/party/blank/card-'.$key.'-mobile.jpg');
            $dimensions = getimagesize($imagePath);

            if ($dimensions === false) {
                throw new \RuntimeException('Unable to read party card image dimensions: '.$imagePath);
            }

            $designs[] = [
                'id' => 'party-card-'.$key,
                'name' => $name,
                'kind' => 'card',
                'style_key' => $key,
                'style' => $style,
                'moods' => array_values(array_unique(array_merge(['Top Rated'], $moods))),
                'kicker' => null,
                'layout' => 'quiet-frame',
                'format' => 'portrait',
                'theme' => $themeKey === 'playful' ? 'bollywood' : ($themeKey === 'elegant' ? 'classic' : ($themeKey === 'illustrated' ? 'south-indian' : ($themeKey === 'modern' ? 'modern' : $themeKey))),
                'event_type' => $occasion['event_type'],
                'image' => "/images/gallery/party/blank/card-{$key}.jpg{$cache}",
                'image_mobile' => "/images/gallery/party/blank/card-{$key}-mobile.jpg{$cache}",
                'image_desktop' => "/images/gallery/party/blank/card-{$key}-desktop.jpg{$cache}",
                'image_width' => $dimensions[0],
                'image_height' => $dimensions[1],
                'palette' => $palette,
                'sample' => array_merge($occasion['sample'], InvitationCopy::forGallery('party')),
            ];
        }

        return $designs;
    }

    /**
     * Blank-center graduation invitation cards (marketplace keeps the website links).
     *
     * @param  array<string, mixed>  $occasion
     * @return array<int, array<string, mixed>>
     */
    private static function graduationCardDesigns(array $occasion): array
    {
        $suites = [
            ['kraft-scrap', 'Kraft Scrap Memory', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['classroom-fade', 'Classroom Fade Beige', 'Photo Collage', ['Photo Collage'], 'photo'],
            ['chalkboard-rows', 'Chalkboard Desk Rows', 'Photo Collage', ['Photo Collage'], 'photo'],
            ['autumn-books', 'Autumn Book Corners', 'Natural & Boho', ['Natural & Boho'], 'illustrated'],
            ['library-shelves', 'Golden Library Shelves', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['stationery-desk', 'Pastel Stationery Desk', 'Natural & Boho', ['Natural & Boho'], 'elegant'],
            ['backpack-autumn', 'Backpack Autumn Leaves', 'Kids & Playful', ['Kids & Playful'], 'illustrated'],
            ['school-bunting', 'School Bunting Supplies', 'Kids & Playful', ['Kids & Playful'], 'playful'],
            ['students-horizon', 'Students Horizon Toast', 'Photo Collage', ['Photo Collage'], 'illustrated'],
            ['cap-diploma', 'Cap & Diploma Confetti', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['scholarly-desk', 'Scholarly Desk Watercolor', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['doodle-dreams', 'Doodle Dreams Banner', 'Kids & Playful', ['Kids & Playful'], 'playful'],
            ['book-tree', 'Book Tree Scholars', 'Kids & Playful', ['Kids & Playful'], 'illustrated'],
            ['gold-florals', 'Gold Floral Cap', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['yellow-graduate', 'Yellow Graduate Bloom', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['gold-ribbon', 'Gold Ribbon Laurel', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['damask-cap', 'Damask Cap Florals', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['rose-books', 'Rose Books Cap', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['navy-filigree', 'Navy Filigree Diploma', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['chalk-classroom', 'Chalk Classroom Glow', 'Photo Collage', ['Photo Collage'], 'photo'],
        ];

        $designs = [];
        $cache = '?v=1';

        foreach ($suites as $index => $row) {
            [$key, $name, $style, $moods, $themeKey] = $row;
            $palette = self::palette('graduation', $themeKey, $index % 10);
            $imagePath = public_path('images/gallery/graduation/blank/card-'.$key.'-mobile.jpg');
            $dimensions = getimagesize($imagePath);

            if ($dimensions === false) {
                throw new \RuntimeException('Unable to read graduation card image dimensions: '.$imagePath);
            }

            $designs[] = [
                'id' => 'graduation-card-'.$key,
                'name' => $name,
                'kind' => 'card',
                'style_key' => $key,
                'style' => $style,
                'moods' => array_values(array_unique(array_merge(['Top Rated'], $moods))),
                'kicker' => null,
                'layout' => 'quiet-frame',
                'format' => 'portrait',
                'theme' => $themeKey === 'playful' ? 'bollywood' : ($themeKey === 'elegant' ? 'classic' : ($themeKey === 'illustrated' ? 'south-indian' : ($themeKey === 'modern' ? 'modern' : ($themeKey === 'photo' ? 'modern' : $themeKey)))),
                'event_type' => $occasion['event_type'],
                'image' => "/images/gallery/graduation/blank/card-{$key}.jpg{$cache}",
                'image_mobile' => "/images/gallery/graduation/blank/card-{$key}-mobile.jpg{$cache}",
                'image_desktop' => "/images/gallery/graduation/blank/card-{$key}-desktop.jpg{$cache}",
                'image_width' => $dimensions[0],
                'image_height' => $dimensions[1],
                'palette' => $palette,
                'sample' => array_merge($occasion['sample'], InvitationCopy::forGallery('graduation')),
            ];
        }

        return $designs;
    }

    /**
     * Blank-center bridal shower invitation cards (marketplace keeps the website links).
     *
     * @param  array<string, mixed>  $occasion
     * @return array<int, array<string, mixed>>
     */
    private static function bridalShowerCardDesigns(array $occasion): array
    {
        $suites = [
            ['blush-filigree', 'Blush Filigree Bloom', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['gold-crystal-oval', 'Gold Crystal Oval', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['pink-oval-rose', 'Pink Oval Rose', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['pearl-vine', 'Pearl Vine Champagne', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['emboss-gold-panel', 'Embossed Gold Panel', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['cream-oval-sculpt', 'Cream Sculpted Oval', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['ivory-capsule', 'Ivory Capsule Crest', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['anime-bride', 'Anime Bride Portrait', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'illustrated'],
            ['tulip-bride', 'Tulip Bride Glance', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['pearl-couple', 'Pearl Couple Walk', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['pearl-gold-frame', 'Pearl Gold Frame', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['veil-roses', 'Veil & Rose Bouquet', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['pajama-blush', 'Blush Pajama Party', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['pearl-bow', 'Pearl Bow Florals', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['ribbon-right', 'Champagne Ribbon Right', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['cream-panel', 'Cream Panel Blooms', 'Minimalist Modern', ['Minimalist Modern'], 'elegant'],
            ['left-ribbon', 'Left Ribbon Roses', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['rose-pearl', 'Rose Pearl Border', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['pajama-burgundy', 'Burgundy Pajama Circle', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['marble-ribbon', 'Marble Ribbon Pearls', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
        ];

        $designs = [];
        $cache = '?v=1';

        foreach ($suites as $index => $row) {
            [$key, $name, $style, $moods, $themeKey] = $row;
            $palette = self::palette('bridal-shower', $themeKey, $index % 10);
            $imagePath = public_path('images/gallery/bridal-shower/blank/card-'.$key.'-mobile.jpg');
            $dimensions = getimagesize($imagePath);

            if ($dimensions === false) {
                throw new \RuntimeException('Unable to read bridal shower card image dimensions: '.$imagePath);
            }

            $designs[] = [
                'id' => 'bridal-shower-card-'.$key,
                'name' => $name,
                'kind' => 'card',
                'style_key' => $key,
                'style' => $style,
                'moods' => array_values(array_unique(array_merge(['Top Rated'], $moods))),
                'kicker' => null,
                'layout' => 'quiet-frame',
                'format' => 'portrait',
                'theme' => $themeKey === 'playful' ? 'bollywood' : ($themeKey === 'elegant' ? 'classic' : ($themeKey === 'illustrated' ? 'south-indian' : ($themeKey === 'modern' ? 'modern' : $themeKey))),
                'event_type' => $occasion['event_type'],
                'image' => "/images/gallery/bridal-shower/blank/card-{$key}.jpg{$cache}",
                'image_mobile' => "/images/gallery/bridal-shower/blank/card-{$key}-mobile.jpg{$cache}",
                'image_desktop' => "/images/gallery/bridal-shower/blank/card-{$key}-desktop.jpg{$cache}",
                'image_width' => $dimensions[0],
                'image_height' => $dimensions[1],
                'palette' => $palette,
                'sample' => array_merge($occasion['sample'], InvitationCopy::forGallery('bridal-shower')),
            ];
        }

        return $designs;
    }

    /**
     * Blank-center housewarming invitation cards (marketplace keeps the website links).
     *
     * @param  array<string, mixed>  $occasion
     * @return array<int, array<string, mixed>>
     */
    private static function housewarmingCardDesigns(array $occasion): array
    {
        $suites = [
            ['key-corner-filigree', 'Key Corner Filigree', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['split-peach-cottage', 'Split Peach Cottage', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['keys-gold-frame', 'Keys Gold Frame', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['top-cottage-watercolor', 'Top Cottage Watercolor', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['palm-villa', 'Palm Villa Glow', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['pink-floral-cottage', 'Pink Floral Cottage', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['linen-modern-house', 'Linen Modern House', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['linen-sketch-house', 'Linen Sketch House', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['mandala-garden-home', 'Mandala Garden Home', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['foliage-gold-outline', 'Foliage Gold Outline', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['parchment-family-hearth', 'Parchment Family Hearth', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['navy-rose-bluehouse', 'Navy Rose Bluehouse', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['blush-heart-cottage', 'Blush Heart Cottage', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['ink-line-cottage', 'Ink Line Cottage', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['country-cottage-gold', 'Country Cottage Gold', 'Natural & Boho', ['Natural & Boho'], 'floral'],
            ['mediterranean-blue-door', 'Mediterranean Blue Door', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['mint-arch-cottage', 'Mint Arch Cottage', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['night-moon-cottage', 'Night Moon Cottage', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['chimney-cloud-cottage', 'Chimney Cloud Cottage', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['peach-bloom-cottage', 'Peach Bloom Cottage', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
        ];

        $designs = [];
        $cache = '?v=2';

        foreach ($suites as $index => $row) {
            [$key, $name, $style, $moods, $themeKey] = $row;
            $palette = self::palette('housewarming', $themeKey, $index % 10);
            $imagePath = public_path('images/gallery/housewarming/blank/card-'.$key.'-mobile.jpg');
            $dimensions = getimagesize($imagePath);

            if ($dimensions === false) {
                throw new \RuntimeException('Unable to read housewarming card image dimensions: '.$imagePath);
            }

            $designs[] = [
                'id' => 'housewarming-card-'.$key,
                'name' => $name,
                'kind' => 'card',
                'style_key' => $key,
                'style' => $style,
                'moods' => array_values(array_unique(array_merge(['Top Rated'], $moods))),
                'kicker' => null,
                'layout' => 'quiet-frame',
                'format' => 'portrait',
                'theme' => $themeKey === 'playful' ? 'bollywood' : ($themeKey === 'elegant' ? 'classic' : ($themeKey === 'modern' ? 'modern' : $themeKey)),
                'event_type' => $occasion['event_type'],
                'image' => "/images/gallery/housewarming/blank/card-{$key}.jpg{$cache}",
                'image_mobile' => "/images/gallery/housewarming/blank/card-{$key}-mobile.jpg{$cache}",
                'image_desktop' => "/images/gallery/housewarming/blank/card-{$key}-desktop.jpg{$cache}",
                'image_width' => $dimensions[0],
                'image_height' => $dimensions[1],
                'palette' => $palette,
                'sample' => array_merge($occasion['sample'], InvitationCopy::forGallery('housewarming')),
            ];
        }

        return $designs;
    }

    /**
     * Blank-center corporate invitation cards (marketplace keeps the website links).
     *
     * @param  array<string, mixed>  $occasion
     * @return array<int, array<string, mixed>>
     */
    private static function corporateCardDesigns(array $occasion): array
    {
        $suites = [
            ['boardroom-blueprint', 'Boardroom Blueprint', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['celebration-hands-wave', 'Celebration Hands Wave', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['purple-office-team', 'Purple Office Team', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['peach-office-desk', 'Peach Office Desk', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['online-cert-desk', 'Online Cert Desk', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['corner-tech-exam', 'Corner Tech Exam', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['math-sage-oval', 'Math Sage Oval', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['book-forum-readers', 'Book Forum Readers', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['megaphone-announce', 'Megaphone Announce', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['exam-pc-corners', 'Exam PC Corners', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['blue-binder-circle', 'Blue Binder Circle', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['desk-workspace-hands', 'Desk Workspace Hands', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['tech-desk-blue', 'Tech Desk Blue', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['skyline-team-v', 'Skyline Team V', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['handshake-flare', 'Handshake Flare', 'Luxury & Glam', ['Luxury & Glam'], 'luxury'],
            ['stationery-cream-frame', 'Stationery Cream Frame', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful'],
            ['mint-chart-growth', 'Mint Chart Growth', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['ink-desk-gadgets', 'Ink Desk Gadgets', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
            ['gear-bulb-frame', 'Gear Bulb Frame', 'Minimalist Modern', ['Minimalist Modern'], 'modern'],
            ['presentation-torn-header', 'Presentation Torn Header', 'Elegant Typography', ['Elegant Typography'], 'elegant'],
        ];

        $designs = [];
        $cache = '?v=1';

        foreach ($suites as $index => $row) {
            [$key, $name, $style, $moods, $themeKey] = $row;
            $palette = self::palette('corporate', $themeKey, $index % 10);
            $imagePath = public_path('images/gallery/corporate/blank/card-'.$key.'-mobile.jpg');
            $dimensions = getimagesize($imagePath);

            if ($dimensions === false) {
                throw new \RuntimeException('Unable to read corporate card image dimensions: '.$imagePath);
            }

            $designs[] = [
                'id' => 'corporate-card-'.$key,
                'name' => $name,
                'kind' => 'card',
                'style_key' => $key,
                'style' => $style,
                'moods' => array_values(array_unique(array_merge(['Top Rated'], $moods))),
                'kicker' => null,
                'layout' => 'quiet-frame',
                'format' => 'portrait',
                'theme' => $themeKey === 'playful' ? 'bollywood' : ($themeKey === 'elegant' ? 'classic' : ($themeKey === 'modern' ? 'modern' : $themeKey)),
                'event_type' => $occasion['event_type'],
                'image' => "/images/gallery/corporate/blank/card-{$key}.jpg{$cache}",
                'image_mobile' => "/images/gallery/corporate/blank/card-{$key}-mobile.jpg{$cache}",
                'image_desktop' => "/images/gallery/corporate/blank/card-{$key}-desktop.jpg{$cache}",
                'image_width' => $dimensions[0],
                'image_height' => $dimensions[1],
                'palette' => $palette,
                'sample' => array_merge($occasion['sample'], InvitationCopy::forGallery('corporate')),
            ];
        }

        return $designs;
    }

    /**
     * Custom cards reuse the website gallery photos (soft-blurred) with invitation copy on top.
     *
     * @param  array<string, mixed>  $occasion
     * @return array<int, array<string, mixed>>
     */
    private static function customCardDesigns(array $occasion): array
    {
        $suites = [
            ['canvas', 'Unlimited Canvas', 'Dynamic & Bold', ['Dynamic & Bold'], 'modern'],
            ['structured', 'Structured Grid', 'Sleek & Architectural', ['Sleek & Architectural'], 'type'],
            ['collage', 'Handcrafted Collage', 'Organic & Artistic', ['Organic & Artistic'], 'illustrated'],
            ['cyber', 'Futuristic Cyber', 'Playful & Illustrated', ['Playful & Illustrated', 'Dynamic & Bold'], 'modern'],
            ['sunset-art', 'Sunset Artistry', 'Organic & Artistic', ['Organic & Artistic'], 'photo'],
            ['opulence', 'Midnight Opulence', 'Luxe & Dark Mode', ['Luxe & Dark Mode'], 'luxury'],
            ['playroom', 'Creative Playroom', 'Playful & Illustrated', ['Playful & Illustrated'], 'playful'],
            ['barn', 'Rustic Barn Gather', 'Organic & Artistic', ['Organic & Artistic'], 'illustrated'],
            ['botanicals', 'Subtle Botanicals', 'Organic & Artistic', ['Organic & Artistic'], 'floral'],
            ['noir', 'Geometric Noir', 'Luxe & Dark Mode', ['Luxe & Dark Mode', 'Sleek & Architectural'], 'modern'],
            ['fusion', 'Abstract Fusion', 'Dynamic & Bold', ['Dynamic & Bold'], 'modern'],
            ['pop', 'Retro Pop Culture', 'Playful & Illustrated', ['Playful & Illustrated'], 'playful'],
            ['loft', 'Industrial Loft Open', 'Sleek & Architectural', ['Sleek & Architectural'], 'modern'],
            ['aviation', 'Aviation/Travel Adventure', 'Dynamic & Bold', ['Dynamic & Bold'], 'photo'],
            ['portfolio', 'Chic Portfolio', 'Sleek & Architectural', ['Sleek & Architectural'], 'elegant'],
            ['silhouette', 'Sunset & Silhouette', 'Organic & Artistic', ['Organic & Artistic', 'Luxe & Dark Mode'], 'photo'],
            ['next-project', 'The Next Project', 'Sleek & Architectural', ['Sleek & Architectural'], 'type'],
            ['ivy-estate', 'Ivy & Stone Estate', 'Organic & Artistic', ['Organic & Artistic'], 'floral'],
            ['splash', 'Playful Splash', 'Playful & Illustrated', ['Playful & Illustrated'], 'playful'],
            ['supper', 'Cozy Supper Assembly', 'Luxe & Dark Mode', ['Luxe & Dark Mode'], 'luxury'],
        ];

        $designs = [];
        $cache = '?v=4';

        foreach ($suites as $index => $row) {
            [$key, $name, $style, $moods, $themeKey] = $row;
            $palette = self::palette('custom', $themeKey, $index % 10);
            $imagePath = public_path('images/gallery/custom/link-'.$key.'.jpg');

            if (! is_file($imagePath)) {
                throw new \RuntimeException('Missing custom website image for card: '.$imagePath);
            }

            $designs[] = [
                'id' => 'custom-card-'.$key,
                'name' => $name,
                'kind' => 'card',
                'style_key' => $key,
                'style' => $style,
                'moods' => array_values(array_unique(array_merge(['Top Rated'], $moods))),
                'kicker' => null,
                'layout' => 'quiet-frame',
                'format' => 'portrait',
                'theme' => $themeKey === 'playful' ? 'bollywood' : ($themeKey === 'elegant' ? 'classic' : ($themeKey === 'type' ? 'minimal' : ($themeKey === 'illustrated' ? 'south-indian' : ($themeKey === 'photo' ? 'modern' : $themeKey)))),
                'event_type' => $occasion['event_type'],
                'image' => "/images/gallery/custom/link-{$key}.jpg{$cache}",
                'image_mobile' => "/images/gallery/custom/link-{$key}.jpg{$cache}",
                'image_desktop' => "/images/gallery/custom/link-{$key}.jpg{$cache}",
                // Portrait stage — landscape website photos cover-crop into the card.
                'image_width' => 1080,
                'image_height' => 1440,
                'palette' => $palette,
                'sample' => array_merge($occasion['sample'], InvitationCopy::forGallery('custom')),
            ];
        }

        return $designs;
    }

    /**
     * @return array{paper: string, ink: string, gold: string, accent: string, muted: string}
     */
    public static function paletteFor(string $slug, string $style, int $index): array
    {
        return self::palette($slug, $style, $index);
    }

    /**
     * @param  array<string, mixed>  $occasion
     * @return array<string, mixed>
     */
    private static function marketplaceCopy(array $occasion): array
    {
        return GalleryMarketplace::copy($occasion);
    }

    /**
     * @return array{paper: string, ink: string, gold: string, accent: string, muted: string}
     */
    private static function palette(string $slug, string $style, int $index): array
    {
        $sets = [
            'wedding' => [
                ['paper' => '#f7f1e6', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#6d5a45', 'muted' => '#8a7d6e'],
                ['paper' => '#16120f', 'ink' => '#f6f0e6', 'gold' => '#d4b483', 'accent' => '#8d6b3a', 'muted' => '#b7a48a'],
                ['paper' => '#eef3f0', 'ink' => '#142028', 'gold' => '#6b8f71', 'accent' => '#1e3a4c', 'muted' => '#5e6b66'],
                ['paper' => '#fbf6f4', 'ink' => '#3a2a2c', 'gold' => '#d7a3ab', 'accent' => '#8d4f5a', 'muted' => '#9a7d80'],
                ['paper' => '#fff7ed', 'ink' => '#431407', 'gold' => '#c2410c', 'accent' => '#9a3412', 'muted' => '#9a6b4a'],
                ['paper' => '#f6e7c1', 'ink' => '#3b2414', 'gold' => '#e8b84a', 'accent' => '#c45c26', 'muted' => '#8a6440'],
                ['paper' => '#f7f7f5', 'ink' => '#1a1a1a', 'gold' => '#8a8a8a', 'accent' => '#1f1f1f', 'muted' => '#6b6b6b'],
                ['paper' => '#1c1916', 'ink' => '#f4efe6', 'gold' => '#c6a36a', 'accent' => '#5c4033', 'muted' => '#b8aa9a'],
                ['paper' => '#f8efe2', 'ink' => '#4a1c1c', 'gold' => '#b4532a', 'accent' => '#7f1d1d', 'muted' => '#8a6a55'],
                ['paper' => '#f3eee6', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#3f4f3a', 'muted' => '#7a7168'],
            ],
            'birthday' => [
                ['paper' => '#fff8ef', 'ink' => '#3b2414', 'gold' => '#e8b84a', 'accent' => '#d97706', 'muted' => '#9a7b52'],
                ['paper' => '#1b1028', 'ink' => '#f5e9ff', 'gold' => '#e879f9', 'accent' => '#a21caf', 'muted' => '#c4b5d4'],
                ['paper' => '#ecfdf3', 'ink' => '#14532d', 'gold' => '#86efac', 'accent' => '#15803d', 'muted' => '#4d7c5a'],
                ['paper' => '#fff1f2', 'ink' => '#9f1239', 'gold' => '#fb7185', 'accent' => '#e11d48', 'muted' => '#9f7380'],
                ['paper' => '#fafafa', 'ink' => '#171717', 'gold' => '#a3a3a3', 'accent' => '#404040', 'muted' => '#737373'],
                ['paper' => '#fff7ed', 'ink' => '#7c2d12', 'gold' => '#fdba74', 'accent' => '#ea580c', 'muted' => '#b45309'],
                ['paper' => '#eff6ff', 'ink' => '#1e3a8a', 'gold' => '#93c5fd', 'accent' => '#2563eb', 'muted' => '#64748b'],
                ['paper' => '#fdf4ff', 'ink' => '#701a75', 'gold' => '#e879f9', 'accent' => '#c026d3', 'muted' => '#a78bfa'],
                ['paper' => '#1c1916', 'ink' => '#fde68a', 'gold' => '#fbbf24', 'accent' => '#b45309', 'muted' => '#d6c09a'],
                ['paper' => '#f4f0e6', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#7c3aed', 'muted' => '#8a7d6e'],
            ],
            'corporate' => [
                ['paper' => '#f7f7f5', 'ink' => '#171717', 'gold' => '#a3a3a3', 'accent' => '#262626', 'muted' => '#737373'],
                ['paper' => '#0f172a', 'ink' => '#e2e8f0', 'gold' => '#94a3b8', 'accent' => '#1d4ed8', 'muted' => '#94a3b8'],
                ['paper' => '#f8fafc', 'ink' => '#0f172a', 'gold' => '#64748b', 'accent' => '#0f766e', 'muted' => '#64748b'],
                ['paper' => '#111827', 'ink' => '#f9fafb', 'gold' => '#d4af37', 'accent' => '#b45309', 'muted' => '#9ca3af'],
                ['paper' => '#fff7ed', 'ink' => '#1c1917', 'gold' => '#c6a36a', 'accent' => '#44403c', 'muted' => '#78716c'],
                ['paper' => '#ecfeff', 'ink' => '#164e63', 'gold' => '#67e8f9', 'accent' => '#0e7490', 'muted' => '#57808c'],
                ['paper' => '#f4f4f5', 'ink' => '#18181b', 'gold' => '#a1a1aa', 'accent' => '#3f3f46', 'muted' => '#71717a'],
                ['paper' => '#1e1b16', 'ink' => '#f5f0e6', 'gold' => '#c6a36a', 'accent' => '#57534e', 'muted' => '#a8a29e'],
                ['paper' => '#eff6ff', 'ink' => '#1e3a8a', 'gold' => '#93c5fd', 'accent' => '#1d4ed8', 'muted' => '#64748b'],
                ['paper' => '#fafaf9', 'ink' => '#1c1917', 'gold' => '#a8a29e', 'accent' => '#44403c', 'muted' => '#78716c'],
            ],
            'baby-shower' => [
                ['paper' => '#f0f9ff', 'ink' => '#0c4a6e', 'gold' => '#7dd3fc', 'accent' => '#0284c7', 'muted' => '#648ca3'],
                ['paper' => '#f0fdf4', 'ink' => '#14532d', 'gold' => '#86efac', 'accent' => '#4d7c0f', 'muted' => '#5b7a62'],
                ['paper' => '#fff1f2', 'ink' => '#9f1239', 'gold' => '#fda4af', 'accent' => '#e11d48', 'muted' => '#a37a84'],
                ['paper' => '#faf5ff', 'ink' => '#581c87', 'gold' => '#d8b4fe', 'accent' => '#7e22ce', 'muted' => '#8b6fa0'],
                ['paper' => '#fffbeb', 'ink' => '#78350f', 'gold' => '#fcd34d', 'accent' => '#d97706', 'muted' => '#a1804a'],
                ['paper' => '#f8fafc', 'ink' => '#334155', 'gold' => '#cbd5e1', 'accent' => '#64748b', 'muted' => '#64748b'],
                ['paper' => '#fdf2f8', 'ink' => '#9d174d', 'gold' => '#f9a8d4', 'accent' => '#db2777', 'muted' => '#a67a90'],
                ['paper' => '#ecfeff', 'ink' => '#155e75', 'gold' => '#a5f3fc', 'accent' => '#0891b2', 'muted' => '#5e8a95'],
                ['paper' => '#1e293b', 'ink' => '#e0f2fe', 'gold' => '#7dd3fc', 'accent' => '#38bdf8', 'muted' => '#94a3b8'],
                ['paper' => '#f6f1e8', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#9d7463', 'muted' => '#8a7d6e'],
            ],
            'party' => [
                ['paper' => '#f0f9ff', 'ink' => '#1e3a5f', 'gold' => '#f59e0b', 'accent' => '#e11d48', 'muted' => '#64748b'],
                ['paper' => '#fafafa', 'ink' => '#171717', 'gold' => '#a855f7', 'accent' => '#2563eb', 'muted' => '#737373'],
                ['paper' => '#fff7ed', 'ink' => '#7c2d12', 'gold' => '#fbbf24', 'accent' => '#dc2626', 'muted' => '#9a6b4a'],
                ['paper' => '#fff1f2', 'ink' => '#9f1239', 'gold' => '#fb7185', 'accent' => '#db2777', 'muted' => '#9f7380'],
                ['paper' => '#fdf4ff', 'ink' => '#701a75', 'gold' => '#e879f9', 'accent' => '#c026d3', 'muted' => '#a78bfa'],
                ['paper' => '#eff6ff', 'ink' => '#1e3a8a', 'gold' => '#93c5fd', 'accent' => '#2563eb', 'muted' => '#64748b'],
                ['paper' => '#f6f1e8', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#9d7463', 'muted' => '#8a7d6e'],
                ['paper' => '#f0fdf4', 'ink' => '#14532d', 'gold' => '#86efac', 'accent' => '#15803d', 'muted' => '#4d7c5a'],
                ['paper' => '#fffbeb', 'ink' => '#78350f', 'gold' => '#fcd34d', 'accent' => '#d97706', 'muted' => '#a1804a'],
                ['paper' => '#f8fafc', 'ink' => '#334155', 'gold' => '#cbd5e1', 'accent' => '#64748b', 'muted' => '#64748b'],
            ],
            'graduation' => [
                ['paper' => '#f6f1e8', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#1e3a8a', 'muted' => '#8a7d6e'],
                ['paper' => '#f8fafc', 'ink' => '#0f172a', 'gold' => '#64748b', 'accent' => '#1e293b', 'muted' => '#64748b'],
                ['paper' => '#eff6ff', 'ink' => '#1e3a8a', 'gold' => '#93c5fd', 'accent' => '#2563eb', 'muted' => '#64748b'],
                ['paper' => '#fff7ed', 'ink' => '#7c2d12', 'gold' => '#fdba74', 'accent' => '#c2410c', 'muted' => '#9a6b4a'],
                ['paper' => '#fefce8', 'ink' => '#422006', 'gold' => '#eab308', 'accent' => '#a16207', 'muted' => '#a16207'],
                ['paper' => '#ecfdf5', 'ink' => '#064e3b', 'gold' => '#6ee7b7', 'accent' => '#047857', 'muted' => '#4d7c5a'],
                ['paper' => '#fafafa', 'ink' => '#171717', 'gold' => '#a3a3a3', 'accent' => '#404040', 'muted' => '#737373'],
                ['paper' => '#fffbeb', 'ink' => '#78350f', 'gold' => '#fcd34d', 'accent' => '#d97706', 'muted' => '#a1804a'],
                ['paper' => '#f0f9ff', 'ink' => '#0c4a6e', 'gold' => '#7dd3fc', 'accent' => '#0284c7', 'muted' => '#648ca3'],
                ['paper' => '#f5f3ef', 'ink' => '#1c1917', 'gold' => '#d4af37', 'accent' => '#44403c', 'muted' => '#78716c'],
            ],
            'bridal-shower' => [
                ['paper' => '#fff1f2', 'ink' => '#9f1239', 'gold' => '#fda4af', 'accent' => '#db2777', 'muted' => '#a37a84'],
                ['paper' => '#faf8f5', 'ink' => '#44403c', 'gold' => '#d4af37', 'accent' => '#9d7463', 'muted' => '#a8a29e'],
                ['paper' => '#fdf2f8', 'ink' => '#831843', 'gold' => '#f9a8d4', 'accent' => '#be185d', 'muted' => '#a67a90'],
                ['paper' => '#fff7ed', 'ink' => '#7c2d12', 'gold' => '#fdba74', 'accent' => '#c2410c', 'muted' => '#9a6b4a'],
                ['paper' => '#f6f1e8', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#9d174d', 'muted' => '#8a7d6e'],
                ['paper' => '#fafafa', 'ink' => '#171717', 'gold' => '#a3a3a3', 'accent' => '#404040', 'muted' => '#737373'],
                ['paper' => '#fffbeb', 'ink' => '#78350f', 'gold' => '#fcd34d', 'accent' => '#d97706', 'muted' => '#a1804a'],
                ['paper' => '#fce7f3', 'ink' => '#9d174d', 'gold' => '#f9a8d4', 'accent' => '#db2777', 'muted' => '#a67a90'],
                ['paper' => '#f5f3ef', 'ink' => '#1c1917', 'gold' => '#d4af37', 'accent' => '#78716c', 'muted' => '#a8a29e'],
                ['paper' => '#fff5f7', 'ink' => '#4a1c2c', 'gold' => '#e8b4bc', 'accent' => '#be185d', 'muted' => '#9a7d80'],
            ],
            'housewarming' => [
                ['paper' => '#fff7ed', 'ink' => '#7c2d12', 'gold' => '#fdba74', 'accent' => '#c2410c', 'muted' => '#9a6b4a'],
                ['paper' => '#f0fdf4', 'ink' => '#14532d', 'gold' => '#86efac', 'accent' => '#3f6212', 'muted' => '#5b7a62'],
                ['paper' => '#f8fafc', 'ink' => '#1e293b', 'gold' => '#94a3b8', 'accent' => '#334155', 'muted' => '#64748b'],
                ['paper' => '#fafaf9', 'ink' => '#1c1917', 'gold' => '#a8a29e', 'accent' => '#44403c', 'muted' => '#78716c'],
                ['paper' => '#fffbeb', 'ink' => '#422006', 'gold' => '#facc15', 'accent' => '#a16207', 'muted' => '#a16207'],
                ['paper' => '#1c1917', 'ink' => '#fafaf9', 'gold' => '#d6d3d1', 'accent' => '#78716c', 'muted' => '#a8a29e'],
                ['paper' => '#ecfeff', 'ink' => '#164e63', 'gold' => '#67e8f9', 'accent' => '#0e7490', 'muted' => '#57808c'],
                ['paper' => '#fef2f2', 'ink' => '#7f1d1d', 'gold' => '#fca5a5', 'accent' => '#b91c1c', 'muted' => '#9a6b6b'],
                ['paper' => '#f7fee7', 'ink' => '#3f6212', 'gold' => '#bef264', 'accent' => '#65a30d', 'muted' => '#6b8f4e'],
                ['paper' => '#f6f1e8', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#9a3412', 'muted' => '#8a7d6e'],
            ],
            'custom' => [
                ['paper' => '#f6f1e8', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#6d5a45', 'muted' => '#8a7d6e'],
                ['paper' => '#fff7ed', 'ink' => '#7c2d12', 'gold' => '#fdba74', 'accent' => '#c2410c', 'muted' => '#9a6b4a'],
                ['paper' => '#f4f4f5', 'ink' => '#18181b', 'gold' => '#a1a1aa', 'accent' => '#3f3f46', 'muted' => '#71717a'],
                ['paper' => '#14532d', 'ink' => '#ecfdf5', 'gold' => '#86efac', 'accent' => '#166534', 'muted' => '#6ee7b7'],
                ['paper' => '#fafafa', 'ink' => '#171717', 'gold' => '#737373', 'accent' => '#262626', 'muted' => '#737373'],
                ['paper' => '#1c1917', 'ink' => '#fafaf9', 'gold' => '#e7e5e4', 'accent' => '#a8a29e', 'muted' => '#d6d3d1'],
                ['paper' => '#faf5ff', 'ink' => '#581c87', 'gold' => '#d8b4fe', 'accent' => '#7e22ce', 'muted' => '#8b6fa0'],
                ['paper' => '#0f172a', 'ink' => '#e2e8f0', 'gold' => '#38bdf8', 'accent' => '#0369a1', 'muted' => '#94a3b8'],
                ['paper' => '#1c1916', 'ink' => '#fde68a', 'gold' => '#fbbf24', 'accent' => '#b45309', 'muted' => '#d6c09a'],
                ['paper' => '#f3eee6', 'ink' => '#241c16', 'gold' => '#c6a36a', 'accent' => '#3f4f3a', 'muted' => '#7a7168'],
            ],
        ];

        $rows = $sets[$slug] ?? $sets['custom'];

        return $rows[$index] ?? $rows[0];
    }
}
