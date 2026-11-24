<?php

namespace Tests\Feature;

use App\Support\CardLibrary;
use App\Support\DesignGallery;
use Tests\TestCase;

class DesignGalleryTest extends TestCase
{
    public function test_birthday_gallery_matches_the_marketplace_suite(): void
    {
        $this->get('/designs/birthday')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('tab', 'cards')
                ->where('gallery.heading_cards', 'Birthday Digital Invitation Cards & Envelopes')
                ->where('gallery.event_type', 'birthday')
                ->has('gallery.links', 20)
                ->has('gallery.cards', 20)
                ->where('gallery.cards.0.name', 'Neon Glow Celebration Party')
                ->where('gallery.cards.19.name', 'Retro Ticket Invitation')
                ->where('gallery.links.0.name', 'Neon Glow Celebration Party')
                ->where('gallery.cards.0.image', '/images/gallery/birthday/blank/card-neon-glow.jpg?v=2')
                ->where('gallery.cards.0.image_mobile', '/images/gallery/birthday/blank/card-neon-glow-mobile.jpg?v=2')
                ->where('gallery.cards.0.image_desktop', '/images/gallery/birthday/blank/card-neon-glow-desktop.jpg?v=2')
                ->where('gallery.cards.0.image_width', 585)
                ->where('gallery.cards.0.image_height', 1024)
                ->where('gallery.cards.0.sample.hosts', 'David')
                ->where('gallery.cards.0.sample.headline', "You're Invited! 🎉"));
    }

    public function test_other_event_galleries_still_load(): void
    {
        $this->get(route('designs.event', 'wedding'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->has('gallery.links', 20)
                ->has('gallery.cards', 20));
    }

    public function test_remaining_marketplace_galleries_have_twenty_named_suites(): void
    {
        $cases = [
            'baby-shower' => ['Sweet Baby Woodland', 'Whimsical Watercolor Balloon'],
            'party' => ['Neon Glow Party', 'The Annual Potluck'],
            'graduation' => ["The Scholar's Cap", 'Graduation Dinner Open'],
            'bridal-shower' => ['Pre-Wedding Bash', 'Bridal Feast Intimate'],
            'corporate' => ['Tech Frontier Summit', 'Executive Dinner Circle'],
        ];

        foreach ($cases as $slug => [$first, $last]) {
            $this->get(route('designs.event', $slug))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('marketing/event-gallery')
                    ->where('tab', $slug === 'baby-shower' ? 'cards' : 'links')
                    ->has('gallery.links', 20)
                    ->has('gallery.cards', 20)
                    ->where('gallery.links.0.name', $first)
                    ->where('gallery.links.19.name', $last));
        }
    }

    public function test_baby_shower_gallery_matches_the_marketplace_mock(): void
    {
        $this->get('/designs/baby-shower')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('tab', 'cards')
                ->where('gallery.heading_cards', 'Baby Shower Digital Invitation Card & Envelope Designs')
                ->where('gallery.heading_links', 'Baby Shower Event Websites')
                ->where('gallery.layout', 'tabs')
                ->where('gallery.hide_search', false)
                ->where('gallery.default_mood', 'All Styles')
                ->where('gallery.show_planning_cta', true)
                ->where('gallery.grid_title_links', 'Baby shower event websites')
                ->where('gallery.tab_helper_links', 'Multi-page event websites with RSVP, maps, and guest tools.')
                ->has('gallery.links', 20)
                ->has('gallery.cards', 20)
                ->where('gallery.links.0.name', 'Sweet Baby Woodland')
                ->where('gallery.links.0.image', '/images/gallery/baby-shower/link-woodland.jpg?v=1')
                ->where('gallery.cards.0.name', 'Sweet Baby Woodland')
                ->where('gallery.cards.0.image', '/images/gallery/baby-shower/blank/card-woodland.jpg?v=1')
                ->where('gallery.cards.0.image_mobile', '/images/gallery/baby-shower/blank/card-woodland-mobile.jpg?v=1')
                ->where('gallery.cards.0.sample.hosts', 'Chloe & Jordan')
                ->where('gallery.cards.0.sample.headline', '✨ A New Adventure Begins!')
                ->where('gallery.cards.19.name', 'Whimsical Watercolor Balloon')
                ->where('gallery.links.19.name', 'Whimsical Watercolor Balloon')
                ->has('gallery.moods', 6));
    }

    public function test_wedding_gallery_matches_the_marketplace_mock(): void
    {
        $this->get('/designs/wedding')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('tab', 'links')
                ->where('gallery.heading_links', 'Wedding Event Websites')
                ->where('gallery.heading_cards', 'Wedding Digital Invitation Card & Envelope Designs')
                ->where('gallery.layout', 'tabs')
                ->where('gallery.hide_search', false)
                ->where('gallery.default_mood', 'All Styles')
                ->where('gallery.show_planning_cta', true)
                ->where('gallery.grid_title_links', 'Wedding event websites')
                ->where('gallery.tab_helper_links', 'Multi-page event websites with RSVP, maps, and guest tools.')
                ->has('gallery.links', 20)
                ->has('gallery.cards', 20)
                ->where('gallery.links.0.name', 'The Glasshouse Romance')
                ->where('gallery.links.0.image', '/images/gallery/wedding/link-glasshouse.jpg?v=11')
                ->where('gallery.cards.0.image', '/images/gallery/wedding/blank/card-glasshouse.jpg?v=16')
                ->where('gallery.cards.0.image_mobile', '/images/gallery/wedding/blank/card-glasshouse-mobile.jpg?v=16')
                ->where('gallery.cards.0.image_desktop', '/images/gallery/wedding/blank/card-glasshouse-desktop.jpg?v=16')
                ->where('gallery.cards.0.image_width', 576)
                ->where('gallery.cards.0.image_height', 1024)
                ->where('gallery.cards.0.image_2x', '/images/gallery/wedding/super-res/card-glasshouse-2x.webp?v=16')
                ->where('gallery.cards.0.image_8k', '/images/gallery/wedding/super-res/card-glasshouse-8k.webp?v=16')
                ->where('gallery.cards.0.sample.blessing', 'Together with their families')
                ->where('gallery.cards.0.sample.request_line', "request the pleasure of your company\nat their wedding celebration")
                ->where('gallery.cards.0.sample.ceremony_time', 'at 4:00 PM')
                ->where('gallery.cards.0.sample.bride', 'Emma')
                ->where('gallery.cards.0.sample.groom', 'Alexander')
                ->where('gallery.cards.0.sample.contact', 'rsvp@emmaandalex.com')
                ->where('gallery.cards.0.sample.venue_name', 'The Glasshouse Pavilion')
                ->where('gallery.links.19.name', 'Whimsical Wonderland')
                ->has('gallery.moods', 6));
    }

    public function test_custom_gallery_matches_the_marketplace_mock(): void
    {
        $this->get('/designs/custom')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('tab', 'links')
                ->where('gallery.heading_links', 'Custom Event Websites')
                ->where('gallery.heading_cards', 'Custom Digital Invitation Cards & Envelopes')
                ->where('gallery.layout', 'tabs')
                ->where('gallery.hide_search', false)
                ->where('gallery.default_mood', 'All Styles')
                ->where('gallery.show_planning_cta', true)
                ->where('gallery.grid_title_links', 'Custom event websites')
                ->where('gallery.grid_title_cards', 'DYNAMIC SHOWCASE GRID OF 20 DIGITAL CUSTOM CARD TEMPLATES')
                ->where('gallery.tab_helper_links', 'Multi-page event websites with RSVP, maps, and guest tools.')
                ->has('gallery.links', 40)
                ->has('gallery.cards', 20)
                ->where('gallery.links.0.name', 'Unlimited Canvas')
                ->where('gallery.links.0.image', '/images/gallery/custom/link-canvas.jpg?v=3')
                ->where('gallery.cards.0.image', '/images/gallery/custom/link-canvas.jpg?v=4')
                ->where('gallery.cards.0.image_mobile', '/images/gallery/custom/link-canvas.jpg?v=4')
                ->where('gallery.cards.0.sample.headline', "You're Invited!")
                ->where('gallery.cards.0.sample.hosts', 'The Gathering')
                ->where('gallery.links.19.name', 'Cozy Supper Assembly')
                ->where('gallery.links.14.name', 'Chic Portfolio')
                ->where('gallery.links.39.name', 'Mesa Dusk Lounge')
                ->has('gallery.moods', 6));
    }

    public function test_housewarming_gallery_matches_the_marketplace_mock(): void
    {
        $this->get('/designs/housewarming')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('tab', 'links')
                ->where('gallery.heading_links', 'Housewarming Event Websites')
                ->where('gallery.heading_cards', 'Housewarming Digital Invitation Card & Envelope Designs')
                ->where('gallery.layout', 'tabs')
                ->where('gallery.hide_search', false)
                ->where('gallery.default_mood', 'All Styles')
                ->where('gallery.show_planning_cta', true)
                ->where('gallery.grid_title_links', 'Housewarming event websites')
                ->where('gallery.tab_helper_links', 'Multi-page event websites with RSVP, maps, and guest tools.')
                ->has('gallery.links', 20)
                ->has('gallery.cards', 20)
                ->where('gallery.links.0.name', 'Our New Hearth')
                ->where('gallery.links.0.image', '/images/gallery/housewarming/link-hearth.jpg?v=1')
                ->where('gallery.cards.0.name', 'Key Corner Filigree')
                ->where('gallery.cards.0.image', '/images/gallery/housewarming/blank/card-key-corner-filigree.jpg?v=2')
                ->where('gallery.cards.0.image_mobile', '/images/gallery/housewarming/blank/card-key-corner-filigree-mobile.jpg?v=2')
                ->where('gallery.cards.0.sample.headline', 'Home Sweet Home! 🏡')
                ->where('gallery.cards.0.sample.date_label', 'Saturday, November 28')
                ->where('gallery.cards.0.sample.ceremony_time', 'Starting at 16:00')
                ->where('gallery.cards.19.name', 'Peach Bloom Cottage')
                ->where('gallery.links.19.name', 'Cozy Hearth Dinner')
                ->where('gallery.links.14.name', 'Chic Botanical House')
                ->has('gallery.moods', 6));
    }

    public function test_bridal_shower_gallery_matches_the_marketplace_mock(): void
    {
        $this->get('/designs/bridal-shower')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('tab', 'links')
                ->where('gallery.heading_links', 'Bridal Event Websites')
                ->where('gallery.heading_cards', 'Bridal Digital Invitation Card & Envelope Designs')
                ->where('gallery.layout', 'tabs')
                ->where('gallery.hide_search', false)
                ->where('gallery.default_mood', 'All Styles')
                ->where('gallery.show_planning_cta', true)
                ->where('gallery.grid_title_links', 'Bridal event websites')
                ->where('gallery.tab_helper_links', 'Multi-page event websites with RSVP, maps, and guest tools.')
                ->has('gallery.links', 20)
                ->has('gallery.cards', 20)
                ->where('gallery.links.0.name', 'Pre-Wedding Bash')
                ->where('gallery.links.0.image', '/images/gallery/bridal-shower/link-pre-wedding.jpg?v=1')
                ->where('gallery.cards.0.name', 'Blush Filigree Bloom')
                ->where('gallery.cards.0.image', '/images/gallery/bridal-shower/blank/card-blush-filigree.jpg?v=1')
                ->where('gallery.cards.0.image_mobile', '/images/gallery/bridal-shower/blank/card-blush-filigree-mobile.jpg?v=1')
                ->where('gallery.cards.19.name', 'Marble Ribbon Pearls')
                ->where('gallery.links.19.name', 'Bridal Feast Intimate')
                ->has('gallery.moods', 6));
    }

    public function test_graduation_gallery_matches_the_marketplace_mock(): void
    {
        $this->get('/designs/graduation')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('tab', 'links')
                ->where('gallery.heading_links', 'Graduation Event Websites')
                ->where('gallery.heading_cards', 'Graduation Digital Invitation Card & Envelope Designs')
                ->where('gallery.layout', 'tabs')
                ->where('gallery.hide_search', false)
                ->where('gallery.default_mood', 'All Styles')
                ->where('gallery.show_planning_cta', true)
                ->where('gallery.grid_title_links', 'Graduation event websites')
                ->where('gallery.tab_helper_links', 'Multi-page event websites with RSVP, maps, and guest tools.')
                ->has('gallery.links', 20)
                ->has('gallery.cards', 20)
                ->where('gallery.links.0.name', "The Scholar's Cap")
                ->where('gallery.links.0.image', '/images/gallery/graduation/link-scholar-cap.jpg?v=1')
                ->where('gallery.cards.0.name', 'Kraft Scrap Memory')
                ->where('gallery.cards.0.image', '/images/gallery/graduation/blank/card-kraft-scrap.jpg?v=1')
                ->where('gallery.cards.0.image_mobile', '/images/gallery/graduation/blank/card-kraft-scrap-mobile.jpg?v=1')
                ->where('gallery.cards.19.name', 'Chalk Classroom Glow')
                ->where('gallery.links.19.name', 'Graduation Dinner Open')
                ->has('gallery.moods', 6));
    }

    public function test_party_gallery_matches_the_marketplace_mock(): void
    {
        $this->get('/designs/party')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('tab', 'links')
                ->where('gallery.heading_links', 'Party Event Websites')
                ->where('gallery.heading_cards', 'Party Digital Invitation Card & Envelope Designs')
                ->where('gallery.layout', 'tabs')
                ->where('gallery.hide_search', false)
                ->where('gallery.default_mood', 'All Styles')
                ->where('gallery.show_planning_cta', true)
                ->where('gallery.grid_title_links', 'Party event websites')
                ->where('gallery.tab_helper_links', 'Multi-page event websites with RSVP, maps, and guest tools.')
                ->has('gallery.links', 20)
                ->has('gallery.cards', 20)
                ->where('gallery.links.0.name', 'Neon Glow Party')
                ->where('gallery.links.0.image', '/images/gallery/party/link-neon-glow.jpg?v=1')
                ->where('gallery.cards.0.name', 'Confetti Party Hats')
                ->where('gallery.cards.0.image', '/images/gallery/party/blank/card-confetti-hats.jpg?v=1')
                ->where('gallery.cards.0.image_mobile', '/images/gallery/party/blank/card-confetti-hats-mobile.jpg?v=1')
                ->where('gallery.cards.19.name', 'Confetti Corner Flags')
                ->where('gallery.links.19.name', 'The Annual Potluck')
                ->has('gallery.moods', 8));
    }

    public function test_corporate_gallery_matches_the_marketplace_mock(): void
    {
        $this->get('/designs/corporate')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('tab', 'links')
                ->where('gallery.heading_links', 'Corporate Event Websites')
                ->where('gallery.heading_cards', 'Corporate Digital Invitation Cards & Envelopes')
                ->where('gallery.links.0.name', 'Tech Frontier Summit')
                ->where('gallery.links.1.name', 'Executive Leadership Forum')
                ->where('gallery.links.4.name', 'Creative Tech Summit')
                ->where('gallery.links.16.name', 'The Annual Corporate Retreat')
                ->where('gallery.cards.0.name', 'Boardroom Blueprint')
                ->where('gallery.cards.0.image', '/images/gallery/corporate/blank/card-boardroom-blueprint.jpg?v=1')
                ->where('gallery.cards.0.image_mobile', '/images/gallery/corporate/blank/card-boardroom-blueprint-mobile.jpg?v=1')
                ->where('gallery.cards.0.sample.headline', 'Connect, Collaborate, Celebrate! 🚀')
                ->where('gallery.cards.19.name', 'Presentation Torn Header')
                ->where('gallery.links.0.image', '/images/gallery/corporate/link-tech-frontier.jpg?v=1')
                ->has('gallery.cards', 20)
                ->has('gallery.moods', 7));
    }

    public function test_link_tab_query_is_preserved(): void
    {
        $this->get('/designs/birthday?tab=links')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('tab', 'links')
                ->has('gallery.links', 20));
    }

    public function test_designs_index_lists_every_event_type_with_existing_artwork(): void
    {
        $this->get('/designs')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/designs')
                ->has('occasions', 9)
                ->where('occasions.0.slug', 'wedding')
                ->where('occasions.0.name', 'Wedding')
                ->has('occasions.0.links', 4)
                ->has('occasions.0.cards', 4)
                ->where('occasions.8.slug', 'custom')
                ->where('occasions.2.slug', 'corporate')
                ->where('occasions.0.links.0.image', '/images/gallery/wedding/link-glasshouse.jpg?v=11'));
    }

    public function test_unknown_event_renders_an_empty_gallery_state(): void
    {
        $this->get('/designs/not-an-occasion')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('marketing/event-gallery')
                ->where('gallery', null)
                ->where('slug', 'not-an-occasion'));
    }

    public function test_birthday_card_ids_resolve_in_the_card_library(): void
    {
        $template = CardLibrary::resolve('birthday-card-english-garden');

        $this->assertSame('birthday-card-english-garden', $template['id']);
        $this->assertSame('English Garden Watercolor', $template['name']);
        $this->assertSame('portrait', $template['format']);
    }

    public function test_birthday_suite_names_are_unique(): void
    {
        $gallery = DesignGallery::forSlug('birthday');

        $this->assertCount(20, array_unique(array_column($gallery['cards'], 'id')));
        $this->assertCount(20, array_unique(array_column($gallery['cards'], 'name')));
        $this->assertCount(20, array_unique(array_column($gallery['links'], 'id')));
    }
}
