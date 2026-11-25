<?php

namespace App\Support;

class GalleryMarketplace
{
    /**
     * @return array<string, mixed>
     */
    public static function copy(array $occasion): array
    {
        $slug = $occasion['slug'];

        $sets = [
            'birthday' => [
                'heading_links' => 'Birthday Event Websites',
                'heading_cards' => 'Birthday Digital Invitation Cards & Envelopes',
                'description_links' => 'Explore 20 signature event websites. Each design includes countdown, map, RSVP, playlist, and a guest wall guests can open on any phone.',
                'description_cards' => 'Explore 20 signature digital cards and envelopes. Each design is complete with customized unboxing animations, metallic wax seals, patterned liners, and interactive reply forms.',
                'grid_title_links' => 'Birthday event websites',
                'grid_title_cards' => 'Expansive Visual Grid of 20 Unique Card and Envelope Suite Templates',
                'moods' => ['Top Rated', 'Vibrant & Modern', 'Luxury & Glam', 'Natural & Boho', 'Y2K & Retro Arcade', 'Mood Dark Mode', 'Kids & Playful', 'Elegant Typography', 'Photo Collage'],
                'default_tab' => 'cards',
                'default_mood' => 'Top Rated',
                'search_placeholder' => 'Search 20 digital card templates...',
                'search_placeholder_links' => 'Search event websites...',
                'search_placeholder_cards' => 'Search 20 digital card templates...',
                'show_planning_cta' => false,
                'tab_helper_links' => '',
                'tab_helper_cards' => '',
            ],
            'baby-shower' => [
                'heading_links' => 'Baby Shower Event Websites',
                'heading_cards' => 'Baby Shower Digital Invitation Card & Envelope Designs',
                'description_links' => 'Explore 20 curated event websites and 20 digital cards. Pick a template to launch a fully tailored baby shower event hub with RSVP, registries, prediction games, and itineraries.',
                'description_cards' => 'Explore 20 premium digital cards & envelope suites. Pieces designed for customized unboxing, metallic wax seals, patterned liners, gender reveal details, and RSVP tracking.',
                'grid_title_links' => 'Baby shower event websites',
                'grid_title_cards' => '',
                'moods' => ['All Styles', 'Botanical Nursery', 'Pastel & Whimsical', 'Woodland & Safari', 'Minimalist Modern', 'Dreamy & Sky'],
                'default_tab' => 'cards',
                'default_mood' => 'All Styles',
                'search_placeholder' => 'Search baby shower cards...',
                'search_placeholder_links' => 'Search baby shower templates...',
                'search_placeholder_cards' => 'Search baby shower cards...',
                'show_planning_cta' => true,
                'tab_helper_links' => 'Multi-page event websites with RSVP, maps, and guest tools.',
                'tab_helper_cards' => 'Check out 20 stunning templates with cards & envelopes.',
                'brand_pill' => 'Invidora',
                'breadcrumb' => 'Baby Shower Invitation Cards',
                'hide_toolbar_meta' => true,
                'hide_search' => false,
                'layout' => 'tabs',
            ],
            'wedding' => [
                'heading_links' => 'Wedding Event Websites',
                'heading_cards' => 'Wedding Digital Invitation Card & Envelope Designs',
                'description_links' => 'Explore 20 curated event websites and 20 digital cards. Pick a template to launch a fully-tailored wedding event hub with RSVP, multi-day schedules, maps, and gift registries.',
                'description_cards' => 'Explore 20 premium digital card & envelope suites. Pick a template to customize custom digital unboxing, metallic wax seals, patterned liners, and RSVP tracking.',
                'grid_title_links' => 'Wedding event websites',
                'grid_title_cards' => 'DYNAMIC SHOWCASE GRID OF 20 DIGITAL WEDDING CARD TEMPLATES',
                'moods' => ['All Styles', 'Elegant & Luxe', 'Natural & Earthy', 'Floral & Delicate', 'Traditional & Cultural', 'Modern & Minimalist'],
                'default_tab' => 'links',
                'default_mood' => 'All Styles',
                'search_placeholder' => 'Search wedding templates...',
                'search_placeholder_links' => 'Search wedding templates...',
                'search_placeholder_cards' => 'Search wedding cards...',
                'show_planning_cta' => true,
                'tab_helper_links' => 'Multi-page event websites with RSVP, maps, and guest tools.',
                'tab_helper_cards' => 'Standard static unboxing templates with cards & envelopes.',
                'brand_pill' => 'Invidora',
                'breadcrumb' => 'Wedding Invitation Designs',
                'hide_toolbar_meta' => true,
                'hide_search' => false,
                'layout' => 'tabs',
            ],
            'party' => [
                'heading_links' => 'Party Event Websites',
                'heading_cards' => 'Party Digital Invitation Card & Envelope Designs',
                'description_links' => 'Explore 20 curated event websites and 20 digital cards. Pick a template to launch a fully tailored party event hub with RSVP pollacks, jukeboxes, and dynamic schedules.',
                'description_cards' => 'Explore 20 premium party cards & envelope suites. Pick a template to customize custom digital unboxing, metallic wax seals, patterned liners, and RSVP tracking.',
                'grid_title_links' => 'Party event websites',
                'grid_title_cards' => '',
                'moods' => ['All Styles', 'Music & Concerts', 'Cocktail & Gala', 'Outdoor & BBQ', 'Games & Arcade', 'Minimalist Bliss', 'Games & Artistic', 'Minimalist Modern'],
                'default_tab' => 'links',
                'default_mood' => 'All Styles',
                'search_placeholder' => 'Search party templates...',
                'search_placeholder_links' => 'Search party templates...',
                'search_placeholder_cards' => 'Search party cards...',
                'show_planning_cta' => true,
                'tab_helper_links' => 'Multi-page event websites with RSVP, maps, and guest tools.',
                'tab_helper_cards' => 'Classic standard static unboxing templates with cards and envelopes.',
                'brand_pill' => 'Invidora',
                'breadcrumb' => 'Party Invitation Designs',
                'hide_toolbar_meta' => true,
                'hide_search' => false,
                'layout' => 'tabs',
            ],
            'custom' => [
                'heading_links' => 'Custom Event Websites',
                'heading_cards' => 'Custom Digital Invitation Cards & Envelopes',
                'description_links' => 'Explore 40 curated event websites and 20 digital cards. Pick a template to launch a fully-tailored custom event hub with RSVP, maps, timeline builder, custom forms, and flexible registries.',
                'description_cards' => 'Explore 20 premium custom card & envelope suites. Pick a template to customize with custom digital unboxing, metallic wax seals, patterned liners, and RSVP tracking.',
                'grid_title_links' => 'Custom event websites',
                'grid_title_cards' => 'DYNAMIC SHOWCASE GRID OF 20 DIGITAL CUSTOM CARD TEMPLATES',
                'moods' => ['All Styles', 'Dynamic & Bold', 'Sleek & Architectural', 'Organic & Artistic', 'Playful & Illustrated', 'Luxe & Dark Mode'],
                'default_tab' => 'links',
                'default_mood' => 'All Styles',
                'search_placeholder' => 'Search custom templates...',
                'search_placeholder_links' => 'Search custom templates...',
                'search_placeholder_cards' => 'Search custom cards...',
                'show_planning_cta' => true,
                'tab_helper_links' => 'Multi-page event websites with RSVP, maps, and guest tools.',
                'tab_helper_cards' => 'Standard static unboxing templates with cards & envelopes.',
                'brand_pill' => 'Invidora',
                'breadcrumb' => 'Custom Invitation Designs',
                'hide_toolbar_meta' => true,
                'hide_search' => false,
                'layout' => 'tabs',
            ],
            'graduation' => [
                'heading_links' => 'Graduation Event Websites',
                'heading_cards' => 'Graduation Digital Invitation Card & Envelope Designs',
                'description_links' => 'Explore 20 curated event websites and 20 digital cards. Pick a template to launch a fully-tailored graduation event hub with RSVP, future plan showcases, memory boards, and itineraries.',
                'description_cards' => 'Explore 20 premium graduation card & envelope suites. Pick a template to customize custom digital unboxing, metallic wax seals, patterned liners, and RSVP tracking.',
                'grid_title_links' => 'Graduation event websites',
                'grid_title_cards' => 'DYNAMIC SHOWCASE GRID OF 20 DIGITAL GRADUATION CARD TEMPLATES',
                'moods' => ['All Styles', 'Scholar & Academic', 'Creative & Artsy', 'Party & Gala', 'Casual & Modern', 'Minimalist Scholar'],
                'default_tab' => 'links',
                'default_mood' => 'All Styles',
                'search_placeholder' => 'Search graduation templates...',
                'search_placeholder_links' => 'Search graduation templates...',
                'search_placeholder_cards' => 'Search graduation cards...',
                'show_planning_cta' => true,
                'tab_helper_links' => 'Multi-page event websites with RSVP, maps, and guest tools.',
                'tab_helper_cards' => 'Check out 20 stunning templates with cards & envelopes.',
                'brand_pill' => 'Invidora',
                'breadcrumb' => 'Graduation Invitation Designs',
                'hide_toolbar_meta' => true,
                'hide_search' => false,
                'layout' => 'tabs',
            ],
            'housewarming' => [
                'heading_links' => 'Housewarming Event Websites',
                'heading_cards' => 'Housewarming Digital Invitation Card & Envelope Designs',
                'description_links' => 'Explore 20 curated event websites and 20 digital cards. Pick a template to launch a fully-tailored housewarming event hub with RSVP, maps and parking integration, registry wishlists, and itineraries.',
                'description_cards' => 'Explore 20 premium housewarming card & envelope suites. Pick a template to customize custom digital unboxing, metallic wax seals, patterned liners, and RSVP tracking.',
                'grid_title_links' => 'Housewarming event websites',
                'grid_title_cards' => 'DYNAMIC SHOWCASE GRID OF 20 DIGITAL HOUSEWARMING CARD TEMPLATES',
                'moods' => ['All Styles', 'Cozy & Rustic', 'Modern & Minimalist', 'New Home & Aperture', 'Natural & Greenery', 'Traditional & Estate'],
                'default_tab' => 'links',
                'default_mood' => 'All Styles',
                'search_placeholder' => 'Search housewarming templates...',
                'search_placeholder_links' => 'Search housewarming templates...',
                'search_placeholder_cards' => 'Search housewarming cards...',
                'show_planning_cta' => true,
                'tab_helper_links' => 'Multi-page event websites with RSVP, maps, and guest tools.',
                'tab_helper_cards' => 'Classic static unboxing templates with cards & envelopes.',
                'brand_pill' => 'Invidora',
                'breadcrumb' => 'Housewarming Invitation Designs',
                'hide_toolbar_meta' => true,
                'hide_search' => false,
                'layout' => 'tabs',
            ],
            'bridal-shower' => [
                'heading_links' => 'Bridal Event Websites',
                'heading_cards' => 'Bridal Digital Invitation Card & Envelope Designs',
                'description_links' => 'Explore 20 curated event websites and 20 digital cards. Pick a template to launch a fully-tailored bridal event hub with RSVP, trip itineraries, packing lists, registry links, and digital guest walls.',
                'description_cards' => 'Explore 20 premium bridal card & envelope suites. Pick a template to customize custom digital unboxing, metallic wax seals, patterned liners, and RSVP tracking.',
                'grid_title_links' => 'Bridal event websites',
                'grid_title_cards' => 'DYNAMIC SHOWCASE GRID OF 20 DIGITAL BRIDAL CARD TEMPLATES',
                'moods' => ['All Styles', 'Floral & Delicate', 'Glam & Luxe', 'Beach & Resort', 'Modern & Casual', 'Elegant Minimalist'],
                'default_tab' => 'links',
                'default_mood' => 'All Styles',
                'search_placeholder' => 'Search bridal templates...',
                'search_placeholder_links' => 'Search bridal templates...',
                'search_placeholder_cards' => 'Search bridal cards...',
                'show_planning_cta' => true,
                'tab_helper_links' => 'Multi-page event websites with RSVP, maps, and guest tools.',
                'tab_helper_cards' => 'Check out 20 stunning templates with cards & envelopes.',
                'brand_pill' => 'Invidora',
                'breadcrumb' => 'Bridal Invitation Designs',
                'hide_toolbar_meta' => true,
                'hide_search' => false,
                'layout' => 'tabs',
            ],
            'corporate' => [
                'heading_links' => 'Corporate Event Websites',
                'heading_cards' => 'Corporate Digital Invitation Cards & Envelopes',
                'description_links' => 'Explore 20 curated event websites. Pick a template to launch a fully-tailored corporate event hub with registrations, speaker agendas, and ticket check-ins.',
                'description_cards' => 'Explore 20 premium corporate card and envelope suites. Pick a template to customize corporate branding, digital ticket downloads, and RSVP options.',
                'grid_title_links' => 'Corporate event websites',
                'grid_title_cards' => 'Corporate Event Cards & Envelopes',
                'moods' => ['Top Rated', 'Enterprise Tech', 'Gala & Award Night', 'Summit & Conference', 'Sustainable & Outdoor', 'Executive & Minimalist', 'Networking & Panel'],
                'default_tab' => 'links',
                'default_mood' => 'Top Rated',
                'search_placeholder' => 'Search event websites...',
                'search_placeholder_links' => 'Search event websites...',
                'search_placeholder_cards' => 'Search 20 digital card templates...',
                'show_planning_cta' => false,
                'tab_helper_links' => '',
                'tab_helper_cards' => '',
                'brand_pill' => null,
                'breadcrumb' => null,
                'hide_toolbar_meta' => false,
            ],
        ];

        return $sets[$slug] ?? [
            'heading_links' => $occasion['name'].' Event Websites',
            'heading_cards' => $occasion['name'].' Digital Invitation Cards & Envelopes',
            'description_links' => $occasion['description'],
            'description_cards' => $occasion['description'],
            'grid_title_links' => 'Event websites',
            'grid_title_cards' => 'Card and envelope suites',
            'moods' => ['Top Rated', 'Elegant & minimal', 'Luxury & premium', 'Modern & contemporary', 'Floral & decorative', 'Colorful & playful'],
            'default_tab' => 'cards',
            'default_mood' => 'Top Rated',
            'search_placeholder' => 'Search templates...',
            'show_planning_cta' => false,
            'tab_helper_links' => '',
            'tab_helper_cards' => '',
            'search_placeholder_links' => $occasion['description'],
            'search_placeholder_cards' => $occasion['description'],
            'brand_pill' => null,
            'breadcrumb' => null,
            'hide_toolbar_meta' => false,
            'hide_search' => false,
            'layout' => 'tabs',
        ];
    }

    /**
     * @return array<int, array<string, mixed>>|null
     */
    public static function designs(array $occasion, string $kind): ?array
    {
        $suites = self::suites()[$occasion['slug']] ?? null;

        if ($suites === null) {
            return null;
        }

        $designs = [];

        foreach ($suites as $index => $row) {
            if ($kind === 'card' && $occasion['slug'] === 'custom' && $index >= 20) {
                continue;
            }

            [$key, $name, $style, $moods, $themeKey, $format] = $row;
            $n = str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);
            $palette = DesignGallery::paletteFor($occasion['slug'], $themeKey, $index % 10);
            $cache = self::imageCache($occasion['slug'], $kind);
            $design = [
                'id' => $occasion['slug'].'-'.$kind.'-'.$key,
                'name' => $name,
                'kind' => $kind,
                'style_key' => $key,
                'style' => $style,
                'moods' => array_values(array_unique(array_merge(['All Styles', 'Top Rated'], $moods))),
                'layout' => $kind === 'link' ? 'full-bleed' : 'quiet-frame',
                'format' => $kind === 'link' ? 'website' : $format,
                'theme' => self::theme($themeKey),
                'event_type' => $occasion['event_type'],
                'image' => in_array($occasion['slug'], ['corporate', 'baby-shower', 'party', 'wedding', 'graduation', 'bridal-shower', 'housewarming', 'custom'], true)
                    ? '/images/gallery/'.$occasion['slug'].'/'.$kind.'-'.$key.'.jpg'.$cache
                    : '/images/gallery/'.$occasion['slug'].'/link-'.$n.'.jpg',
                'image_complete' => true,
                'kicker' => in_array($occasion['slug'], ['corporate', 'baby-shower', 'party', 'wedding', 'graduation', 'bridal-shower', 'housewarming', 'custom'], true) ? null : $style,
                'palette' => $palette,
                'sample' => array_merge(
                    $occasion['sample'],
                    InvitationCopy::forGallery($occasion['slug']),
                ),
            ];

            if ($kind === 'card' && in_array($occasion['slug'], ['wedding', 'housewarming'], true)) {
                $cardDir = $occasion['slug'] === 'wedding' ? 'wedding/blank' : $occasion['slug'];
                $design['image'] = '/images/gallery/'.$cardDir.'/card-'.$key.'.jpg'.$cache;
                $design['image_mobile'] = '/images/gallery/'.$cardDir.'/card-'.$key.'-mobile.jpg'.$cache;
                $design['image_desktop'] = '/images/gallery/'.$cardDir.'/card-'.$key.'-desktop.jpg'.$cache;

                if ($occasion['slug'] === 'wedding') {
                    $imagePath = public_path('images/gallery/'.$cardDir.'/card-'.$key.'-mobile.jpg');
                    $dimensions = getimagesize($imagePath);

                    if ($dimensions === false) {
                        throw new \RuntimeException('Unable to read gallery card image dimensions: '.$imagePath);
                    }

                    $design['image_width'] = $dimensions[0];
                    $design['image_height'] = $dimensions[1];
                    $design['image_2x'] = '/images/gallery/wedding/super-res/card-'.$key.'-2x.webp'.$cache;
                    $design['image_8k'] = '/images/gallery/wedding/super-res/card-'.$key.'-8k.webp'.$cache;
                }
            }

            $designs[] = $design;
        }

        return $designs;
    }

    private static function imageCache(string $slug, string $kind): string
    {
        if ($slug === 'wedding') {
            return $kind === 'link' ? '?v=11' : '?v=16';
        }

        if ($kind === 'link' && in_array($slug, ['corporate', 'baby-shower', 'party', 'bridal-shower', 'graduation', 'housewarming'], true)) {
            return '?v=1';
        }

        if ($slug === 'custom') {
            return $kind === 'link' ? '?v=3' : '?v=2';
        }

        if ($slug === 'housewarming' && $kind === 'card') {
            return '?v=5';
        }

        return '';
    }

    private static function theme(string $themeKey): string
    {
        return match ($themeKey) {
            'playful' => 'bollywood',
            'elegant' => 'classic',
            'type' => 'minimal',
            'illustrated' => 'south-indian',
            'photo' => 'modern',
            default => $themeKey,
        };
    }

    /**
     * @return array<string, array<int, array{0: string, 1: string, 2: string, 3: array<int, string>, 4: string, 5: string}>>
     */
    private static function suites(): array
    {
        return [
            'wedding' => [
                ['glasshouse', 'The Glasshouse Romance', 'Elegant & Luxe', ['Elegant & Luxe'], 'elegant', 'portrait'],
                ['eucalyptus', 'Boho Eucalyptus', 'Natural & Earthy', ['Natural & Earthy'], 'floral', 'portrait'],
                ['black-tie', 'Black Tie Grandeur', 'Elegant & Luxe', ['Elegant & Luxe'], 'luxury', 'portrait'],
                ['tropical', 'Tropical Seaside', 'Floral & Delicate', ['Floral & Delicate'], 'floral', 'portrait'],
                ['vintage-botanical', 'Vintage Botanical', 'Floral & Delicate', ['Floral & Delicate'], 'floral', 'portrait'],
                ['estate', 'Classic Estate', 'Traditional & Cultural', ['Traditional & Cultural'], 'elegant', 'portrait'],
                ['monochrome', 'Modern Chic Monochromatic', 'Modern & Minimalist', ['Modern & Minimalist'], 'modern', 'portrait'],
                ['golden-hour', 'Golden Hour Sunset', 'Elegant & Luxe', ['Elegant & Luxe'], 'photo', 'portrait'],
                ['foliage', 'Minimalist Foliage', 'Natural & Earthy', ['Natural & Earthy'], 'elegant', 'portrait'],
                ['fairytale', 'Fairytale Enchantment', 'Floral & Delicate', ['Floral & Delicate'], 'luxury', 'portrait'],
                ['industrial', 'Metropolitan Industrial', 'Modern & Minimalist', ['Modern & Minimalist'], 'modern', 'portrait'],
                ['castle', 'Castle Romance', 'Traditional & Cultural', ['Traditional & Cultural'], 'elegant', 'portrait'],
                ['harvest', 'Autumn Harvest', 'Natural & Earthy', ['Natural & Earthy'], 'illustrated', 'portrait'],
                ['celestial', 'Midnight Celestial', 'Elegant & Luxe', ['Elegant & Luxe'], 'luxury', 'story'],
                ['vineyard', 'Tuscan Vineyard', 'Natural & Earthy', ['Natural & Earthy'], 'floral', 'portrait'],
                ['deco', 'Contemporary Art Deco', 'Modern & Minimalist', ['Modern & Minimalist'], 'luxury', 'portrait'],
                ['rose-gold', 'Rose Gold Shimmer', 'Elegant & Luxe', ['Elegant & Luxe'], 'luxury', 'portrait'],
                ['secret-garden', 'Secret Garden', 'Natural & Earthy', ['Natural & Earthy'], 'floral', 'portrait'],
                ['cathedral', 'Classic Cathedral', 'Traditional & Cultural', ['Traditional & Cultural'], 'elegant', 'portrait'],
                ['wonderland', 'Whimsical Wonderland', 'Floral & Delicate', ['Floral & Delicate'], 'playful', 'portrait'],
            ],
            'baby-shower' => [
                ['woodland', 'Sweet Baby Woodland', 'Woodland & Safari', ['Woodland & Safari'], 'illustrated', 'portrait'],
                ['cloudland', 'Pastel Cloudland Journey', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful', 'portrait'],
                ['olive', 'Botanical Olive Garland', 'Botanical Nursery', ['Botanical Nursery'], 'floral', 'portrait'],
                ['terracotta', 'Boho Terracotta Earth', 'Modern Earthy', ['Botanical Nursery'], 'floral', 'portrait'],
                ['safari', 'Safari Wild One Baby', 'Woodland & Safari', ['Woodland & Safari'], 'illustrated', 'portrait'],
                ['celestial', 'Celestial Teddy', 'Dreamy & Sky', ['Dreamy & Sky'], 'luxury', 'story'],
                ['minimal-teddy', 'Minimal Teddy Natural', 'Minimalist Modern', ['Minimalist Modern'], 'elegant', 'portrait'],
                ['balloon', 'Whimsical Hot Air Balloon', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful', 'portrait'],
                ['eucalyptus', 'Eucalyptus Bliss', 'Botanical Nursery', ['Botanical Nursery'], 'floral', 'portrait'],
                ['stars', 'Under the Stars Baby', 'Dreamy & Sky', ['Dreamy & Sky'], 'luxury', 'story'],
                ['jungle', 'Modern Jungle Safari', 'Woodland & Safari', ['Woodland & Safari'], 'illustrated', 'portrait'],
                ['retro-love', 'Retro Baby Love', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful', 'square'],
                ['picnic', 'Teddy bear Picnic', 'Natural', ['Woodland & Safari'], 'illustrated', 'portrait'],
                ['giraffe', 'Dreamy Baby Giraffe', 'Dreamy & Sky', ['Dreamy & Sky'], 'playful', 'portrait'],
                ['floral-bloom', 'Chic Floral Bloom', 'Botanical Nursery', ['Botanical Nursery'], 'floral', 'portrait'],
                ['geometric', 'Geometric Nursery Blue', 'Minimalist Modern', ['Minimalist Modern'], 'modern', 'square'],
                ['ocean', 'Ocean Adventure Splash', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful', 'portrait'],
                ['forest', 'Forest Friends', 'Woodland & Safari', ['Woodland & Safari'], 'illustrated', 'portrait'],
                ['sage', 'Modern Minimalist Sage', 'Minimalist Modern', ['Minimalist Modern'], 'elegant', 'portrait'],
                ['watercolor', 'Whimsical Watercolor Balloon', 'Pastel & Whimsical', ['Pastel & Whimsical'], 'playful', 'portrait'],
            ],
            'party' => [
                ['neon-glow', 'Neon Glow Party', 'Music & Concerts', ['Music & Concerts'], 'luxury', 'story'],
                ['rooftop', 'Sunset Rooftop Mixer', 'Cocktail & Gala', ['Cocktail & Gala'], 'luxury', 'portrait'],
                ['campfire', 'Campfire & Acoustic', 'Outdoor & BBQ', ['Outdoor & BBQ'], 'illustrated', 'portrait'],
                ['y2k', 'Y2K Retro Bash', 'Games & Arcade', ['Games & Arcade'], 'playful', 'square'],
                ['tropical', 'Tropical Beach Fiesta', 'Outdoor & BBQ', ['Outdoor & BBQ'], 'floral', 'portrait'],
                ['velvet', 'Midnight Velvet Social', 'Cocktail & Gala', ['Cocktail & Gala'], 'luxury', 'portrait'],
                ['gaming', 'Retro Gaming Night', 'Games & Arcade', ['Games & Arcade'], 'playful', 'square'],
                ['bbq', 'Backyard BBQ Jam', 'Outdoor & BBQ', ['Outdoor & BBQ'], 'illustrated', 'portrait'],
                ['art-wine', 'Art & Wine Evening', 'Games & Artistic', ['Games & Artistic', 'Cocktail & Gala'], 'elegant', 'portrait'],
                ['disco', 'Disco Fever Reunion', 'Music & Concerts', ['Music & Concerts'], 'playful', 'square'],
                ['bass', 'Underground Bass', 'Music & Concerts', ['Music & Concerts'], 'luxury', 'story'],
                ['board-game', 'Cozy Board Game Night', 'Games & Arcade', ['Games & Arcade'], 'illustrated', 'portrait'],
                ['hollywood', 'Glam Hollywood Gala', 'Cocktail & Gala', ['Cocktail & Gala'], 'luxury', 'portrait'],
                ['pool', 'Retro Pool Splash', 'Outdoor & BBQ', ['Outdoor & BBQ'], 'playful', 'portrait'],
                ['showcase', 'Creative Art Showcase', 'Games & Artistic', ['Games & Artistic', 'Minimalist Modern'], 'modern', 'portrait'],
                ['fireside', 'Fireside Gathering', 'Outdoor & BBQ', ['Outdoor & BBQ'], 'illustrated', 'portrait'],
                ['golden-hour', 'Golden Hour Rooftop', 'Cocktail & Gala', ['Cocktail & Gala'], 'luxury', 'portrait'],
                ['arcade', 'Arcade Tournament', 'Games & Arcade', ['Games & Arcade'], 'playful', 'square'],
                ['lounge', 'Minimal Lounge', 'Minimalist Modern', ['Minimalist Modern', 'Minimalist Bliss'], 'elegant', 'portrait'],
                ['potluck', 'The Annual Potluck', 'Outdoor & BBQ', ['Outdoor & BBQ'], 'illustrated', 'portrait'],
            ],
            'custom' => [
                ['canvas', 'Unlimited Canvas', 'Dynamic & Bold', ['Dynamic & Bold'], 'modern', 'portrait'],
                ['structured', 'Structured Grid', 'Sleek & Architectural', ['Sleek & Architectural'], 'type', 'portrait'],
                ['collage', 'Handcrafted Collage', 'Organic & Artistic', ['Organic & Artistic'], 'illustrated', 'portrait'],
                ['cyber', 'Futuristic Cyber', 'Playful & Illustrated', ['Playful & Illustrated', 'Dynamic & Bold'], 'modern', 'portrait'],
                ['sunset-art', 'Sunset Artistry', 'Organic & Artistic', ['Organic & Artistic'], 'photo', 'portrait'],
                ['opulence', 'Midnight Opulence', 'Luxe & Dark Mode', ['Luxe & Dark Mode'], 'luxury', 'portrait'],
                ['playroom', 'Creative Playroom', 'Playful & Illustrated', ['Playful & Illustrated'], 'playful', 'portrait'],
                ['barn', 'Rustic Barn Gather', 'Organic & Artistic', ['Organic & Artistic'], 'illustrated', 'portrait'],
                ['botanicals', 'Subtle Botanicals', 'Organic & Artistic', ['Organic & Artistic'], 'floral', 'portrait'],
                ['noir', 'Geometric Noir', 'Luxe & Dark Mode', ['Luxe & Dark Mode', 'Sleek & Architectural'], 'modern', 'portrait'],
                ['fusion', 'Abstract Fusion', 'Dynamic & Bold', ['Dynamic & Bold'], 'modern', 'portrait'],
                ['pop', 'Retro Pop Culture', 'Playful & Illustrated', ['Playful & Illustrated'], 'playful', 'portrait'],
                ['loft', 'Industrial Loft Open', 'Sleek & Architectural', ['Sleek & Architectural'], 'modern', 'portrait'],
                ['aviation', 'Aviation/Travel Adventure', 'Dynamic & Bold', ['Dynamic & Bold'], 'photo', 'portrait'],
                ['portfolio', 'Chic Portfolio', 'Sleek & Architectural', ['Sleek & Architectural'], 'elegant', 'portrait'],
                ['silhouette', 'Sunset & Silhouette', 'Organic & Artistic', ['Organic & Artistic', 'Luxe & Dark Mode'], 'photo', 'portrait'],
                ['next-project', 'The Next Project', 'Sleek & Architectural', ['Sleek & Architectural'], 'type', 'portrait'],
                ['ivy-estate', 'Ivy & Stone Estate', 'Organic & Artistic', ['Organic & Artistic'], 'floral', 'portrait'],
                ['splash', 'Playful Splash', 'Playful & Illustrated', ['Playful & Illustrated'], 'playful', 'portrait'],
                ['supper', 'Cozy Supper Assembly', 'Luxe & Dark Mode', ['Luxe & Dark Mode'], 'luxury', 'portrait'],
                ['pool-cabana', 'Tropical Pool Cabana', 'Organic & Artistic', ['Organic & Artistic'], 'photo', 'portrait'],
                ['blossom-bridge', 'Blossom Garden Bridge', 'Organic & Artistic', ['Organic & Artistic'], 'floral', 'portrait'],
                ['shore-arch', 'Seaside Floral Arch', 'Organic & Artistic', ['Organic & Artistic'], 'photo', 'portrait'],
                ['rainbow-drape', 'Color Festival Drape', 'Playful & Illustrated', ['Playful & Illustrated', 'Dynamic & Bold'], 'playful', 'portrait'],
                ['crystal-hall', 'Crystal Dining Hall', 'Luxe & Dark Mode', ['Luxe & Dark Mode'], 'luxury', 'portrait'],
                ['palm-shore', 'Palm Shore Gathering', 'Organic & Artistic', ['Organic & Artistic'], 'photo', 'portrait'],
                ['canvas-tents', 'Canvas Tent Garden', 'Playful & Illustrated', ['Playful & Illustrated'], 'illustrated', 'portrait'],
                ['lantern-supper', 'Lantern Garden Supper', 'Organic & Artistic', ['Organic & Artistic'], 'illustrated', 'portrait'],
                ['alpine-hearth', 'Alpine Cabin Hearth', 'Luxe & Dark Mode', ['Luxe & Dark Mode'], 'luxury', 'portrait'],
                ['balloon-salon', 'Balloon Salon Soiree', 'Playful & Illustrated', ['Playful & Illustrated'], 'playful', 'portrait'],
                ['harvest-banquet', 'Harvest Lawn Banquet', 'Organic & Artistic', ['Organic & Artistic'], 'floral', 'portrait'],
                ['desert-lounge', 'Desert Lounge', 'Sleek & Architectural', ['Sleek & Architectural'], 'modern', 'portrait'],
                ['gilded-ballroom', 'Gilded Ballroom', 'Luxe & Dark Mode', ['Luxe & Dark Mode'], 'luxury', 'portrait'],
                ['skyline-night', 'Skyline Night Table', 'Sleek & Architectural', ['Sleek & Architectural', 'Luxe & Dark Mode'], 'modern', 'portrait'],
                ['library-gather', 'Library Gathering', 'Sleek & Architectural', ['Sleek & Architectural'], 'elegant', 'portrait'],
                ['villa-shore', 'Villa Shore Day', 'Organic & Artistic', ['Organic & Artistic'], 'photo', 'portrait'],
                ['stair-balloons', 'Stairway Balloons', 'Playful & Illustrated', ['Playful & Illustrated'], 'playful', 'portrait'],
                ['harbor-table', 'Harbor Sunset Table', 'Organic & Artistic', ['Organic & Artistic'], 'photo', 'portrait'],
                ['festival-mandap', 'Festival Color Mandap', 'Playful & Illustrated', ['Playful & Illustrated', 'Dynamic & Bold'], 'playful', 'portrait'],
                ['mesa-dusk', 'Mesa Dusk Lounge', 'Organic & Artistic', ['Organic & Artistic'], 'photo', 'portrait'],
            ],
            'graduation' => [
                ['scholar-cap', "The Scholar's Cap", 'Scholar & Academic', ['Scholar & Academic'], 'luxury', 'portrait'],
                ['achievement', 'Modern Achievement', 'Casual & Modern', ['Casual & Modern', 'Minimalist Scholar'], 'elegant', 'portrait'],
                ['caps-off', 'Caps Off Celebration', 'Party & Gala', ['Party & Gala'], 'playful', 'portrait'],
                ['creative-grad', 'Creative Graduate', 'Creative & Artsy', ['Creative & Artsy'], 'illustrated', 'portrait'],
                ['regal', 'Regal Commencement', 'Scholar & Academic', ['Scholar & Academic', 'Party & Gala'], 'luxury', 'portrait'],
                ['golden-journey', 'The Golden Journey', 'Scholar & Academic', ['Scholar & Academic'], 'luxury', 'portrait'],
                ['retro-academic', 'Retro Academic Bash', 'Party & Gala', ['Party & Gala'], 'playful', 'square'],
                ['backyard-grad', 'Outdoor Backyard Grad', 'Casual & Modern', ['Casual & Modern'], 'illustrated', 'portrait'],
                ['scholar-grid', 'Minimal Scholar Grid', 'Minimalist Scholar', ['Minimalist Scholar'], 'type', 'portrait'],
                ['night-stars', 'Night of Stars', 'Party & Gala', ['Party & Gala'], 'luxury', 'story'],
                ['stem', 'STEM & Tech Grad', 'Creative & Artsy', ['Creative & Artsy', 'Casual & Modern'], 'modern', 'story'],
                ['portfolio', 'The Creative Portfolio', 'Creative & Artsy', ['Creative & Artsy'], 'photo', 'portrait'],
                ['open-house', 'Casual Open House', 'Casual & Modern', ['Casual & Modern'], 'elegant', 'portrait'],
                ['ballroom', 'Grand Ballroom Gala', 'Party & Gala', ['Party & Gala'], 'luxury', 'portrait'],
                ['throwback', 'Nostalgic Throwback', 'Creative & Artsy', ['Creative & Artsy'], 'photo', 'portrait'],
                ['sunset-commencement', 'Sunset Commencement', 'Scholar & Academic', ['Scholar & Academic'], 'photo', 'portrait'],
                ['next-step', 'The Next Big Step', 'Casual & Modern', ['Casual & Modern'], 'elegant', 'portrait'],
                ['crest', "Scholar's Crest", 'Scholar & Academic', ['Scholar & Academic'], 'luxury', 'portrait'],
                ['horizons', 'Bright New Horizons', 'Casual & Modern', ['Casual & Modern'], 'photo', 'portrait'],
                ['dinner-open', 'Graduation Dinner Open', 'Party & Gala', ['Party & Gala'], 'luxury', 'portrait'],
            ],
            'housewarming' => [
                ['hearth', 'Our New Hearth', 'New Home & Aperture', ['New Home & Aperture', 'Cozy & Rustic'], 'illustrated', 'portrait'],
                ['architecture', 'Modern Architecture', 'Modern & Minimalist', ['Modern & Minimalist'], 'modern', 'portrait'],
                ['sweet-home', 'Home Sweet Home', 'Cozy & Rustic', ['Cozy & Rustic'], 'floral', 'portrait'],
                ['bungalow', 'Tropical Bungalow', 'Natural & Greenery', ['Natural & Greenery'], 'floral', 'portrait'],
                ['gilded', 'Gilded Aperture', 'New Home & Aperture', ['New Home & Aperture', 'Traditional & Estate'], 'luxury', 'portrait'],
                ['foliage', 'Boho Foliage Move', 'Natural & Greenery', ['Natural & Greenery'], 'floral', 'portrait'],
                ['urban-flat', 'Urban Flat Open', 'Modern & Minimalist', ['Modern & Minimalist'], 'modern', 'portrait'],
                ['welcome-bbq', 'Backyard Welcome BBQ', 'Cozy & Rustic', ['Cozy & Rustic'], 'illustrated', 'portrait'],
                ['ivy', 'Elegant Minimalist Ivy', 'Modern & Minimalist', ['Modern & Minimalist', 'Natural & Greenery'], 'elegant', 'portrait'],
                ['midnight-gala', 'Midnight Welcome Gala', 'Traditional & Estate', ['Traditional & Estate'], 'luxury', 'portrait'],
                ['suburban', 'Suburban Bliss Estate', 'Traditional & Estate', ['Traditional & Estate'], 'elegant', 'portrait'],
                ['creative-house', 'The Creative House', 'Modern & Minimalist', ['Modern & Minimalist'], 'illustrated', 'portrait'],
                ['seaside', 'Seaside Haven Open', 'Natural & Greenery', ['Natural & Greenery'], 'photo', 'portrait'],
                ['industrial', 'Industrial Loft Tour', 'Modern & Minimalist', ['Modern & Minimalist'], 'modern', 'portrait'],
                ['garden', 'Chic Botanical House', 'Natural & Greenery', ['Natural & Greenery'], 'floral', 'portrait'],
                ['sunset-roof', 'Sunset Roof Opening', 'New Home & Aperture', ['New Home & Aperture'], 'photo', 'portrait'],
                ['neighborhood', 'The Next Neighborhood', 'Modern & Minimalist', ['Modern & Minimalist'], 'type', 'portrait'],
                ['ivy-brick', 'Ivy & Brick Cottage', 'Traditional & Estate', ['Traditional & Estate', 'Cozy & Rustic'], 'illustrated', 'portrait'],
                ['whimsical-move', 'Whimsical Move Party', 'Cozy & Rustic', ['Cozy & Rustic'], 'playful', 'square'],
                ['hearth-dinner', 'Cozy Hearth Dinner', 'Cozy & Rustic', ['Cozy & Rustic'], 'illustrated', 'portrait'],
            ],
            'bridal-shower' => [
                ['pre-wedding', 'Pre-Wedding Bash', 'Modern & Casual', ['Modern & Casual'], 'playful', 'portrait'],
                ['miss-to-mrs', 'Modern Miss to Mrs', 'Modern & Casual', ['Modern & Casual'], 'elegant', 'portrait'],
                ['brunch-bloom', 'Bridal Brunch Bloom', 'Floral & Delicate', ['Floral & Delicate'], 'floral', 'portrait'],
                ['tropical-bach', 'Tropical Bachelorette', 'Beach & Resort', ['Beach & Resort'], 'playful', 'portrait'],
                ['gilded-gala', 'Gilded Bride Gala', 'Glam & Luxe', ['Glam & Luxe'], 'luxury', 'portrait'],
                ['wildflower', 'Boho Wildflower Shower', 'Floral & Delicate', ['Floral & Delicate'], 'floral', 'portrait'],
                ['desert', 'Desert Bride Camp', 'Beach & Resort', ['Beach & Resort', 'Modern & Casual'], 'illustrated', 'portrait'],
                ['pajama', 'Pajama Bash Slumber', 'Modern & Casual', ['Modern & Casual'], 'playful', 'square'],
                ['minimal-rose', 'Elegant Minimalist Rose', 'Elegant Minimalist', ['Elegant Minimalist', 'Floral & Delicate'], 'elegant', 'portrait'],
                ['girls-night', 'Girls Night Out Glam', 'Glam & Luxe', ['Glam & Luxe'], 'luxury', 'portrait'],
                ['spa', 'Spa & Pamper Day', 'Elegant Minimalist', ['Elegant Minimalist'], 'elegant', 'portrait'],
                ['hen', 'The Creative Hen Party', 'Modern & Casual', ['Modern & Casual'], 'illustrated', 'portrait'],
                ['yacht', 'Oceanside Yacht Soiree', 'Beach & Resort', ['Beach & Resort', 'Glam & Luxe'], 'luxury', 'portrait'],
                ['tea', 'Vintage Afternoon Tea', 'Floral & Delicate', ['Floral & Delicate'], 'floral', 'portrait'],
                ['lounge', 'Chic Bridal Lounge', 'Glam & Luxe', ['Glam & Luxe', 'Elegant Minimalist'], 'elegant', 'portrait'],
                ['sparkles', 'Sunset & Sparkles', 'Glam & Luxe', ['Glam & Luxe'], 'luxury', 'portrait'],
                ['next-journey', 'The Next Journey', 'Elegant Minimalist', ['Elegant Minimalist'], 'type', 'portrait'],
                ['registry', "Bride's Botanical Registry", 'Floral & Delicate', ['Floral & Delicate'], 'floral', 'portrait'],
                ['confetti', 'Whimsical Confetti Bash', 'Modern & Casual', ['Modern & Casual'], 'playful', 'square'],
                ['feast', 'Bridal Feast Intimate', 'Glam & Luxe', ['Glam & Luxe'], 'luxury', 'portrait'],
            ],
            'corporate' => [
                ['tech-frontier', 'Tech Frontier Summit', 'Enterprise Tech', ['Enterprise Tech', 'Summit & Conference'], 'modern', 'portrait'],
                ['leadership', 'Executive Leadership Forum', 'Executive & Minimalist', ['Executive & Minimalist'], 'elegant', 'portrait'],
                ['industry-gala', 'Industry Gala Awards', 'Gala & Award Night', ['Gala & Award Night'], 'luxury', 'portrait'],
                ['sustainable', 'Sustainable Growth Forum', 'Sustainable & Outdoor', ['Sustainable & Outdoor'], 'floral', 'portrait'],
                ['creative-summit', 'Creative Tech Summit', 'Enterprise Tech', ['Enterprise Tech', 'Summit & Conference'], 'modern', 'portrait'],
                ['trade', 'Global Trade Expo', 'Summit & Conference', ['Summit & Conference'], 'modern', 'portrait'],
                ['fintech', 'FinTech Futures', 'Enterprise Tech', ['Enterprise Tech'], 'modern', 'portrait'],
                ['cowork', 'Co-Working Catalyst', 'Summit & Conference', ['Summit & Conference', 'Networking & Panel'], 'elegant', 'portrait'],
                ['healthcare', 'Healthcare Innovations Showcase', 'Summit & Conference', ['Summit & Conference'], 'modern', 'portrait'],
                ['jubilee', 'Corporate Jubilee Gala', 'Gala & Award Night', ['Gala & Award Night'], 'luxury', 'portrait'],
                ['ai-summit', 'Next-Gen AI Forum', 'Enterprise Tech', ['Enterprise Tech'], 'modern', 'portrait'],
                ['design-thinking', 'Design Thinking Retreat', 'Summit & Conference', ['Summit & Conference'], 'playful', 'portrait'],
                ['real-estate', 'Real Estate Forum', 'Executive & Minimalist', ['Executive & Minimalist'], 'elegant', 'portrait'],
                ['diversity', 'Diversity & Inclusion Round', 'Sustainable & Outdoor', ['Sustainable & Outdoor', 'Networking & Panel'], 'floral', 'portrait'],
                ['aerospace', 'AeroSpace Convention', 'Enterprise Tech', ['Enterprise Tech'], 'modern', 'portrait'],
                ['nonprofit', 'Non-Profit Gala 2026', 'Gala & Award Night', ['Gala & Award Night'], 'luxury', 'portrait'],
                ['retreat', 'The Annual Corporate Retreat', 'Sustainable & Outdoor', ['Sustainable & Outdoor'], 'illustrated', 'portrait'],
                ['hr', 'HR Summit & Panel', 'Networking & Panel', ['Networking & Panel', 'Summit & Conference'], 'elegant', 'portrait'],
                ['cyber', 'CyberSecurity Symposium', 'Enterprise Tech', ['Enterprise Tech'], 'modern', 'portrait'],
                ['dinner-circle', 'Executive Dinner Circle', 'Executive & Minimalist', ['Executive & Minimalist', 'Gala & Award Night'], 'luxury', 'portrait'],
            ],
        ];
    }
}
