<?php

namespace App\Http\Controllers;

use App\Support\MarketingSeo;
use Inertia\Inertia;
use Inertia\Response;

class SeoPageController extends Controller
{
    public function show(string $page): Response
    {
        $pages = $this->pages();
        abort_unless(isset($pages[$page]), 404);

        $payload = $pages[$page];

        return Inertia::render('seo/landing', [
            'page' => $payload,
            'themes' => array_values(config('wedding.themes')),
            'seo' => MarketingSeo::seoLanding($page, $payload),
        ]);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function pages(): array
    {
        return [
            'wedding-invitation' => self::page(
                'Wedding invitations that feel like the day itself',
                'A wedding invitation, a wedding website, and a guest experience — one link your family can open on any phone.',
                'Most digital invitations stop at a card. This one carries the whole celebration: the names, the hours, the venues, the map, the photographs, and a reply that does not get lost in a chat thread.',
                ['One address for every guest', 'Events, travel, and stay in the same place', 'RSVP without asking anyone to create an account'],
                'Wedding invitation',
                'classic',
                self::preview('Ava', 'Julian', '12 June 2027', 'Lake Como · Italy', ['Ceremony', 'Reception'], 'Worldwide'),
            ),
            'indian-wedding-invitation' => self::page(
                'Indian wedding invitations, without flattening the celebration',
                'Mehendi, haldi, sangeet, ceremony, reception — each with its own time and place, in the language your family actually reads.',
                'An Indian wedding is rarely one evening. The invitation should be able to hold a week of gatherings, a dress code that changes by night, and a second language beside English. Choose an Indian, fusion, or custom style. Nothing is assumed from the city you type.',
                ['Optional Indian, fusion, or international styling', 'Suggested ceremonies you can rename or ignore', 'English beside Tamil, Hindi, Telugu, and seven more languages'],
                'Indian weddings',
                'royal',
                self::preview('Ananya', 'Rohan', '18 Nov 2027', 'Mumbai · Dubai · London', ['Mehendi', 'Wedding', 'Reception'], 'Global Indian'),
            ),
            'tamil-wedding-invitation' => self::page(
                'Tamil wedding invitations with a proper bilingual page',
                'Write the invitation in English and Tamil. The page chrome — RSVP, events, venue — follows the language your guest selects.',
                'Tamil weddings often travel between Chennai, Coimbatore, Madurai, and cities far outside India. The invitation keeps muhurtham, venue, and the week of functions readable in தமிழ் and English, without a separate website for each.',
                ['Tamil cultural template as a choice, not a guess', 'Tamil and English on the same invitation', 'Guest links you can send on WhatsApp'],
                'Tamil weddings',
                'south-indian',
                self::preview('Meera', 'Karthik', '9 Jan 2027', 'Singapore · Chennai', ['Muhurtham', 'Reception'], 'Tamil · Global'),
            ),
            'hindi-wedding-invitation' => self::page(
                'Hindi wedding invitations families will actually forward',
                'A Hindi and English wedding website with events, map, and RSVP on a single link.',
                'When the invitation is only a JPEG, the date is in the caption and the venue is in a voice note. A Hindi wedding page keeps both scripts, the full address, and a reply button that works for guests who never install another app.',
                ['Hindi alongside English', 'Share a prefilled WhatsApp message', 'Per-guest links so replies stay attached to the right family'],
                'Hindi weddings',
                'classic',
                self::preview('Aisha', 'Vihaan', '22 Oct 2027', 'Delhi · Toronto', ['Sangeet', 'Wedding'], 'Hindi · Global'),
            ),
            'digital-wedding-invitation' => self::page(
                'Digital wedding invitations that still feel considered',
                'Typography, colour, music, and motion — chosen by you, rendered the same in preview and on the published page.',
                'A digital invitation does not have to look like a template with the names swapped. Themes change colour and type. They do not fork the page. What you preview is what guests open.',
                ['Nine themes, one layout system', 'Live preview while you edit', 'Drafts stay private until you publish'],
                'Digital',
                'modern',
                self::preview('Nora', 'Mateo', '4 Sep 2027', 'Barcelona · Spain', ['Welcome', 'Vows'], 'Digital'),
            ),
            'whatsapp-wedding-invitation' => self::page(
                'WhatsApp wedding invitations with a link worth opening',
                'Send a personal invitation link in WhatsApp. Guests open the wedding, not a compressed photograph.',
                'WhatsApp is how the invitation travels. It should not be the invitation. Each guest can receive their own link. You see who opened it. They reply on the page. Instagram gets a copied link, because that network does not accept a prefilled share the way WhatsApp does.',
                ['Prefilled WhatsApp message', 'Personal guest links', 'QR codes for cards, tables, and the entrance'],
                'WhatsApp',
                'modern',
                self::preview('Lina', 'Omar', '30 Apr 2027', 'Dubai · Worldwide', ['Share', 'RSVP'], 'WhatsApp ready'),
            ),
            'wedding-website' => self::page(
                'A wedding website your guests can use on the way there',
                'Schedule, map, travel, hotels, photographs, and RSVP — arranged for a phone in a moving car.',
                'Guests do not want a login. They want the muhurtham, the hall name, and a button that opens directions. The wedding website is the invitation. It stays readable at 320 pixels wide and does not ask for an account.',
                ['Sticky RSVP on small screens', 'Directions from the venue, not a pasted screenshot', 'Travel and hotel notes beside the events'],
                'Wedding website',
                'classic',
                self::preview('Elena', 'James', '16 May 2027', 'New York · Lisbon', ['Schedule', 'Map', 'RSVP'], 'Guest site'),
            ),
            'free-wedding-invitation' => self::page(
                'Start a wedding invitation for free',
                'Create the draft, invite your own guests, and publish when the wording is ready. No guest accounts.',
                'The free plan is enough for a real wedding invitation: design, one event, guests, RSVP, gallery, and a public link (path or custom subdomain). Publish starts a '.(int) config('billing.trial_days', 30).'-day free guest-site trial (up to '.(int) config('billing.trial.guest_limit', 100).' guests). Share personal WhatsApp links free from your phone. Paid site packs extend the live window, unlock styles, and optional message credits.',
                ['Unlimited editing while it is a draft', (int) config('billing.trial_days', 30).'-day free guest site on publish', 'Share WhatsApp links free from your phone', 'Your guests never need to register'],
                'Free to start',
                'classic',
                self::preview('Sofia', 'Noah', '7 Aug 2027', 'Anywhere you celebrate', ['Draft', 'Publish'], 'Free plan'),
            ),
            'online-wedding-invitation' => self::page(
                'Online wedding invitations for families in more than one country',
                'A timezone-aware invitation with a countdown, a map, and a reply that updates if someone changes their mind.',
                'The same family may be in Chennai, Dubai, and New Jersey. The invitation stores a timezone, counts down in that zone, and lets a guest send a new reply without creating a second one.',
                ['Timezone on the wedding and on each event', 'Replay-safe RSVP', 'Add to Google Calendar or download an .ics file'],
                'Online',
                'modern',
                self::preview('Maya', 'Elias', '21 Mar 2027', 'Singapore · Dubai · NYC', ['Countdown', 'RSVP'], 'Multi-city'),
            ),
            'wedding-rsvp' => self::page(
                'Wedding RSVP that stays attached to the guest',
                'Yes, sorry, or maybe. Party size, meals, and which events they will actually attend.',
                'A reply in a group chat disappears. Here the guest confirms once. If they write again with the same email, the original reply is updated. You see invited, viewed, responded, attending, and still pending — without exporting a spreadsheet to find out.',
                ['Yes, sorry, and maybe', 'Per-event attendance', 'Counts on the wedding, not in a separate tool'],
                'Replies',
                'modern',
                self::preview('Chloe', 'Daniel', '14 Feb 2027', 'London · Berlin', ['Yes', 'Maybe', 'Sorry'], 'RSVP'),
            ),
            'telugu-wedding-invitation' => self::page(
                'Telugu wedding invitations with the muhurtham intact',
                'A Telugu and English wedding page for pellikuthuru, the ceremony, and the reception — each with its own hour.',
                'Telugu families often host the week across Hyderabad, Vijayawada, and a second city abroad. The invitation keeps the muhurtham, the kalyana mandapam, and the dress note readable in తెలుగు and English. Guests open one link. They do not hunt through a forwarded JPEG.',
                ['Telugu beside English', 'Separate cards for each function', 'A map that opens the mandapam, not a pin dropped on the city'],
                'Telugu weddings',
                'south-indian',
                self::preview('Sneha', 'Arjun', '5 Dec 2026', 'Hyderabad · Dallas', ['Muhurtham', 'Reception'], 'Telugu · Global'),
            ),
            'malayalam-wedding-invitation' => self::page(
                'Malayalam wedding invitations for a house and a hall',
                'Write the welcome in മലയാളം. Keep the church, temple, or auditorium, the time, and the reply on the same page.',
                'A Malayalam wedding might begin at home and continue in a hall the next morning. The invitation can hold both, with travel notes for guests coming from Kochi, Kozhikode, or the Gulf. The language switch changes the page, not just a caption under a photograph.',
                ['Malayalam and English on one invitation', 'Home ceremony and hall reception as separate events', 'Travel notes for guests flying in'],
                'Malayalam weddings',
                'traditional',
                self::preview('Nisha', 'Rahul', '28 Nov 2026', 'Kochi · Doha', ['Home', 'Reception'], 'Malayalam · Global'),
            ),
            'kannada-wedding-invitation' => self::page(
                'Kannada wedding invitations families in Bengaluru will forward',
                'A Kannada and English wedding website with the maduve, the reception, and a reply that stays with the guest.',
                'When the invitation is a status image, the venue name is too small to read on a phone. A Kannada page keeps the names large, the address tappable, and the RSVP attached to the household you actually invited.',
                ['Kannada alongside English', 'Personal links for each household', 'Publish when the wording is finished, not before'],
                'Kannada weddings',
                'floral',
                self::preview('Diya', 'Nikhil', '11 Sep 2027', 'Bengaluru · San Jose', ['Maduve', 'Reception'], 'Kannada · Global'),
            ),
            'punjabi-wedding-invitation' => self::page(
                'Punjabi wedding invitations for the whole week',
                'Mehendi, sangeet, anand karaj or pheras, and the reception — one link, not four separate cards.',
                'A Punjabi wedding moves. The lawn on Friday is not the gurdwara on Sunday. Each gathering keeps its own time, dress, and map pin. Share the week on WhatsApp once. Guests pick the functions they will attend.',
                ['A schedule for the full week', 'Per-event replies', 'A message ready to paste into the family group'],
                'Punjabi weddings',
                'bollywood',
                self::preview('Simran', 'Kabir', '3 Oct 2027', 'Chandigarh · London', ['Sangeet', 'Anand Karaj'], 'Punjabi · Global'),
            ),
            'marathi-wedding-invitation' => self::page(
                'Marathi wedding invitations with the lagna and the reception',
                'मराठी and English, a clear muhurta, and a hall guests can navigate to without calling you.',
                'Marathi invitations still travel as printed cards, then get photographed into a chat. This page is the thing people open: the lagna, the reception the next evening, the city, and a reply that does not depend on who last saw the message.',
                ['Marathi and English', 'Muhurta and reception kept apart', 'Directions from the venue address'],
                'Marathi weddings',
                'classic',
                self::preview('Isha', 'Aditya', '19 Dec 2026', 'Pune · Melbourne', ['Lagna', 'Reception'], 'Marathi · Global'),
            ),
            'gujarati-wedding-invitation' => self::page(
                'Gujarati wedding invitations for garba night through the vidaai',
                'A Gujarati and English wedding page that can hold a garba, a mandap, and a reception without collapsing them into one evening.',
                'Guests flying into Ahmedabad or Surat need the hotel note as much as the mandap time. The invitation keeps both, in ગુજરાતી and English, and lets a family reply once for everyone travelling together.',
                ['Gujarati beside English', 'Garba, wedding, and reception as their own events', 'Hotel notes beside the schedule'],
                'Gujarati weddings',
                'royal',
                self::preview('Kiara', 'Dev', '6 Nov 2027', 'Ahmedabad · Nairobi', ['Garba', 'Wedding'], 'Gujarati · Global'),
            ),
            'bengali-wedding-invitation' => self::page(
                'Bengali wedding invitations for the biye and the bou bhat',
                'Write in বাংলা and English. Keep the evening biye and the next day’s reception from blurring together.',
                'A Bengali wedding has its own sequence, and guests from Kolkata and from abroad do not share a timezone. The page stores the wedding’s timezone, counts down in it, and still lets someone in another country add the hour to their calendar.',
                ['Bengali and English', 'Timezone-aware countdown', 'Calendar files for the biye and the reception'],
                'Bengali weddings',
                'floral',
                self::preview('Riya', 'Aryan', '25 Jan 2027', 'Kolkata · New Jersey', ['Biye', 'Bou Bhat'], 'Bengali · Global'),
            ),
            'south-indian-wedding-invitation' => self::page(
                'South Indian wedding invitations without a single-template look',
                'Tamil, Telugu, Malayalam, and Kannada families can start from a South Indian theme and then write the week in their own language.',
                'South Indian weddings are not one script and not one city. The invitation suggests the ceremonies you might host, then lets you rename, drop, or add them. The theme changes colour and type. It does not lock the order of the day.',
                ['A South Indian theme you can still edit', 'Four Dravidian languages beside English', 'Nothing assumed from the city you type'],
                'South Indian · Worldwide',
                'south-indian',
                self::preview('Ava', 'Julian', '12 June 2027', 'Singapore · Sydney · London', ['Ceremony', 'Reception', 'Dinner'], 'Global celebration'),
            ),
            'destination-wedding-invitation' => self::page(
                'Destination wedding invitations guests can use on the journey',
                'A timezone, a map, travel notes, and hotels — on the same link as the names and the date.',
                'A destination wedding fails when the invitation is beautiful and the logistics live in a separate email. Put the flight window, the welcome dinner, and the ceremony in one place. Guests landing in Goa, Udaipur, Tuscany, or Bali open the same page they were sent on WhatsApp.',
                ['Travel and stay beside the events', 'A timezone that is not assumed to be India', 'Maps that open the venue, not a screenshot'],
                'Destination weddings',
                'modern',
                self::preview('Sofia', 'Lucas', '8 May 2027', 'Santorini · Greece', ['Welcome', 'Vows', 'Dinner'], 'Destination'),
            ),
            'luxury-wedding-invitation' => self::page(
                'Luxury wedding invitations with room to breathe',
                'Dark or light, serif or quiet, with the week of events still doing the practical work.',
                'A luxury invitation is not a gold border around a form. It is type, space, and a page that still tells a guest where to be at seven. Choose a restrained theme, hide the sections you do not need, and publish one link that feels considered on a phone.',
                ['Themes that change colour and type, not the product', 'Sections you can hide', 'The same design in preview and after publish'],
                'Luxury weddings',
                'luxury',
                self::preview('Isabelle', 'Alexandre', '2 Sep 2027', 'Paris · France', ['Cocktail', 'Dinner'], 'Luxury'),
            ),
            'birthday-invitation' => self::page(
                'Birthday invitations with a page guests can open',
                'A card for the chat, a link for the details, and an RSVP that is not a group-thread reply.',
                'Say who is celebrating, the age if you want it, the place, and the time. The page does not ask for a bride or a groom.',
                ['Celebrant, date, and venue', 'A digital card sized for WhatsApp and Instagram', 'Party-size RSVP'],
                'Birthday',
                'floral',
                self::previewSingle("Zara's 30th", '14 Jul 2027', 'New York · Rooftop', ['Party', 'Cake'], 'Birthday'),
            ),
            'baby-invitation' => self::page(
                'Baby shower and naming invitations',
                'Parents, a note about the baby, a registry, and a reply.',
                'Keep the gathering details and the registry on one link, with a card you can share beside it.',
                ['Parents and baby information', 'Registry section', 'Messages from guests'],
                'Baby',
                'floral',
                self::previewSingle('Welcome, little one', '20 Aug 2027', 'Toronto · Garden', ['Shower', 'Gifts'], 'Baby'),
            ),
            'housewarming-invitation' => self::page(
                'Housewarming invitations with the new address',
                'Family, the new home, the date, and a map.',
                'Guests need the address more than a long story. The invitation puts the home, the hour, and the reply first.',
                ['New home and address', 'Map', 'Simple RSVP'],
                'Housewarming',
                'traditional',
                self::previewSingle('Our new home', '3 Apr 2027', 'Amsterdam · Canal house', ['Open house', 'Dinner'], 'Housewarming'),
            ),
            'corporate-invitation' => self::page(
                'Corporate invitations for launches, talks, and team gatherings',
                'Company, agenda, speakers, and registration — without a wedding layout.',
                'A professional event gets a professional page: title, agenda, speakers, venue, and a registration form with company and job title.',
                ['Agenda and speakers', 'Registration fields', 'A theme that is not a wedding theme'],
                'Corporate',
                'minimal',
                self::previewSingle('Product Launch 2027', '11 Mar 2027', 'Berlin · HQ atrium', ['Agenda', 'Register'], 'Corporate'),
            ),
            'graduation-invitation' => self::page(
                'Graduation invitations',
                'The graduate or the institution, the date, the venue, and a map.',
                'Share the ceremony without borrowing a wedding template.',
                ['Celebrant or institution', 'Date and venue', 'RSVP'],
                'Graduation',
                'modern',
                self::previewSingle('Class of 2027', '6 Jun 2027', 'Boston · Campus green', ['Ceremony', 'Reception'], 'Graduation'),
            ),
            'party-invitation' => self::page(
                'Party invitations',
                'Hosts, a short message, the hour, and the place.',
                'Dinners, reunions, farewells, and welcome parties use the same invitation, with the sections you actually need.',
                ['Hosts and message', 'Date, time, and map', 'Party-size RSVP'],
                'Party',
                'bollywood',
                self::previewSingle('Summer soirée', '19 Jul 2027', 'Cape Town · Sea view', ['Cocktails', 'Dinner'], 'Party'),
            ),
            'religious-invitation' => self::page(
                'Invitations for religious and cultural gatherings',
                'Hosts, a message, the date, the venue, and a map.',
                'Ceremonies, prayer gatherings, and festivals can use a quiet page and a card, in the language your guests read.',
                ['Hosts and message', 'Venue and map', 'Gallery and RSVP when you want them'],
                'Religious',
                'traditional',
                self::previewSingle('Community gathering', '15 Jan 2027', 'Kuala Lumpur · Hall', ['Ceremony', 'Meal'], 'Faith & culture'),
            ),
        ];
    }

    /**
     * @param  array<int, string>  $points
     * @param  array<string, mixed>  $preview
     * @return array<string, mixed>
     */
    private static function page(
        string $title,
        string $description,
        string $body,
        array $points,
        string $kicker = 'Wedding invitation',
        string $theme = 'classic',
        array $preview = [],
    ): array {
        return [
            'title' => $title,
            'description' => $description,
            'body' => $body,
            'points' => $points,
            'kicker' => $kicker,
            'theme' => $theme,
            'preview' => $preview !== [] ? $preview : self::preview(
                'Ava',
                'Julian',
                '12 June 2027',
                'Lake Como · Italy',
                ['Ceremony', 'Reception'],
                'Worldwide',
            ),
            'faqs' => MarketingSeo::defaultLandingFaqs(),
        ];
    }

    /**
     * @param  list<string>  $events
     * @return array<string, mixed>
     */
    private static function preview(
        string $partnerOne,
        string $partnerTwo,
        string $date,
        string $place,
        array $events,
        string $label,
    ): array {
        return [
            'partner_one' => $partnerOne,
            'partner_two' => $partnerTwo,
            'date' => $date,
            'place' => $place,
            'events' => $events,
            'label' => $label,
        ];
    }

    /**
     * @param  list<string>  $events
     * @return array<string, mixed>
     */
    private static function previewSingle(
        string $headline,
        string $date,
        string $place,
        array $events,
        string $label,
    ): array {
        return [
            'headline' => $headline,
            'date' => $date,
            'place' => $place,
            'events' => $events,
            'label' => $label,
        ];
    }
}
