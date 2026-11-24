<?php

namespace Database\Seeders;

use App\Enums\GuestbookStatus;
use App\Enums\InvitationDeliveryStatus;
use App\Enums\RsvpStatus;
use App\Enums\WeddingStatus;
use App\Models\EventType;
use App\Models\User;
use App\Models\Wedding;
use App\Support\CardLibrary;
use App\Support\EventCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(PlatformOwnerSeeder::class);

        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $wedding = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'slug' => 'arun-priya',
            'title' => 'Priya Sharma & Arun Kumar',
            'invitation_mode' => 'both',
            'event_type_id' => EventType::query()->where('slug', 'wedding')->value('id'),
            'headline' => 'with their families, request the pleasure of your company',
            'story' => "Priya and Arun met at a friend's house in Chennai, argued about the best filter coffee in Mylapore, and have been choosing each other ever since. They will be married on a Monday in December, with the people who raised them and the people who grew up beside them.",
            'starts_on' => '2026-12-15',
            'starts_at' => '09:30',
            'timezone' => 'Asia/Kolkata',
            'venue_name' => 'The Leela Palace',
            'venue_address' => 'Adyar Seaface, MRC Nagar',
            'city' => 'Chennai',
            'state' => 'Tamil Nadu',
            'country' => 'India',
            'latitude' => 13.0168,
            'longitude' => 80.2707,
            'theme' => 'south-indian',
            'style' => 'indian',
            'cultural_template' => 'tamil',
            'language' => 'en',
            'secondary_language' => 'ta',
            'host_message' => 'Come for the muhurtham. Stay through the last song.',
            'music_enabled' => false,
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);

        $wedding->translations()->create([
            'locale' => 'ta',
            'content' => [
                'headline' => 'எங்கள் குடும்பங்களுடன், உங்களை அன்புடன் அழைக்கிறோம்',
                'story' => 'பிரியாவும் அருணும் சென்னையில் சந்தித்தனர். டிசம்பர் திங்களன்று, அவர்களை வளர்த்தவர்களுடன் அவர்கள் திருமணம் செய்து கொள்கிறார்கள்.',
                'host_message' => 'முகூர்த்தத்திற்கு வாருங்கள். கடைசி பாடல் வரை இருங்கள்.',
                'bride_display_name' => 'பிரியா',
                'groom_display_name' => 'அருண்',
            ],
        ]);

        $events = [
            ['Mehendi', 'mehendi', '2026-12-13', '16:00', '19:00', 'Garden lawn', 'Floral, comfortable'],
            ['Haldi', 'haldi', '2026-12-14', '10:00', '12:30', 'Pool pavilion', 'Yellow welcome'],
            ['Sangeet', 'sangeet', '2026-12-14', '19:00', '23:00', 'Grand ballroom', 'Festive, dance-ready'],
            ['Wedding Ceremony', 'wedding', '2026-12-15', '09:30', '12:30', 'The Leela Palace', 'Traditional silk'],
            ['Reception', 'reception', '2026-12-15', '19:00', '23:00', 'Grand ballroom', 'Black tie or silk'],
        ];

        foreach ($events as $index => [$title, $type, $date, $start, $end, $venue, $dress]) {
            $wedding->events()->create([
                'title' => $title,
                'event_type' => $type,
                'event_date' => $date,
                'start_time' => $start,
                'end_time' => $end,
                'timezone' => 'Asia/Kolkata',
                'venue_name' => $venue,
                'venue_address' => 'Adyar Seaface, MRC Nagar',
                'city' => 'Chennai',
                'state' => 'Tamil Nadu',
                'country' => 'India',
                'dress_code' => $dress,
                'sort_order' => $index + 1,
                'is_public' => true,
            ]);
        }

        $family = $wedding->groups()->create(['name' => 'Bride family', 'description' => 'Sharma family']);
        $friends = $wedding->groups()->create(['name' => 'Friends']);
        $office = $wedding->groups()->create(['name' => 'Office']);

        $ramesh = $wedding->guests()->create([
            'guest_group_id' => $family->id,
            'first_name' => 'Ramesh',
            'last_name' => 'Kumar',
            'email' => 'ramesh@example.com',
            'phone' => '9840011122',
            'country_code' => '+91',
            'relationship' => 'Uncle',
            'number_of_guests' => 4,
            'invitation_status' => InvitationDeliveryStatus::Responded,
            'rsvp_status' => RsvpStatus::Attending,
            'guest_token' => bin2hex(random_bytes(16)),
        ]);

        $wedding->guests()->create([
            'guest_group_id' => $friends->id,
            'first_name' => 'Meera',
            'last_name' => 'Iyer',
            'email' => 'meera@example.com',
            'relationship' => 'Friend',
            'number_of_guests' => 2,
            'invitation_status' => InvitationDeliveryStatus::Sent,
            'rsvp_status' => RsvpStatus::Pending,
            'guest_token' => bin2hex(random_bytes(16)),
        ]);

        $wedding->guests()->create([
            'guest_group_id' => $office->id,
            'first_name' => 'Karthik',
            'last_name' => 'Rao',
            'email' => 'karthik@example.com',
            'relationship' => 'Colleague',
            'number_of_guests' => 1,
            'invitation_status' => InvitationDeliveryStatus::Viewed,
            'rsvp_status' => RsvpStatus::Pending,
            'guest_token' => bin2hex(random_bytes(16)),
        ]);

        $rsvp = $wedding->rsvps()->create([
            'wedding_guest_id' => $ramesh->id,
            'guest_name' => 'Ramesh Kumar',
            'email' => 'ramesh@example.com',
            'status' => RsvpStatus::Attending,
            'guest_count' => 4,
            'meal_preference' => 'vegetarian',
            'message' => 'The whole family will be there.',
        ]);

        $ceremony = $wedding->events()->where('event_type', 'wedding')->first();

        if ($ceremony) {
            $rsvp->eventReplies()->create([
                'event_schedule_id' => $ceremony->id,
                'attending' => true,
            ]);
        }

        $wedding->travelDetails()->create([
            'kind' => 'airport',
            'title' => 'Chennai International Airport',
            'description' => 'MAA is about 25 minutes from the hotel by car. Tell us your flight and we will help with a pickup window.',
            'sort_order' => 1,
        ]);

        $wedding->accommodations()->create([
            'hotel_name' => 'The Leela Palace Chennai',
            'address' => 'Adyar Seaface, MRC Nagar, Chennai',
            'phone' => '+91 44 3366 1234',
            'website' => 'https://www.theleela.com',
            'price_info' => 'A room block is held under Sharma–Kumar',
            'description' => 'The ceremonies are in the hotel. Ask for the wedding block when you book.',
            'sort_order' => 1,
        ]);

        $wedding->guestbookEntries()->create([
            'name' => 'Lakshmi Sharma',
            'message' => 'We have waited for this Monday. Travel safely.',
            'status' => GuestbookStatus::Approved,
        ]);

        $path = 'weddings/'.$wedding->id.'/cover.svg';
        Storage::disk('public')->put($path, <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#7f1d1d"/>
  <circle cx="600" cy="360" r="180" fill="none" stroke="#b45309" stroke-width="8"/>
  <circle cx="600" cy="360" r="140" fill="none" stroke="#f6e7c1" stroke-width="2"/>
  <text x="600" y="372" text-anchor="middle" font-family="Georgia" font-size="42" fill="#fff7ed">Priya &amp; Arun</text>
</svg>
SVG);

        $wedding->photos()->create([
            'path' => $path,
            'caption' => 'Priya and Arun',
            'sort_order' => 1,
            'is_cover' => true,
        ]);
        $wedding->cover_image = $path;
        $wedding->save();

        $wedding->card()->create([
            'format' => 'portrait',
            'width' => 1080,
            'height' => 1920,
            'status' => 'generated',
            'document' => CardLibrary::document($wedding, 'elegant-wedding', true),
        ]);

        Wedding::factory()->create([
            'user_id' => $user->id,
            'slug' => 'nora-and-ellis',
            'title' => 'Nora Vale & Ellis Quinn',
            'headline' => 'invite you to their wedding',
            'city' => 'Hudson',
            'country' => 'United States',
            'style' => 'western',
            'theme' => 'floral',
            'cultural_template' => null,
            'language' => 'en',
            'starts_on' => '2027-09-12',
            'status' => WeddingStatus::Draft,
        ]);

        $birthdayType = EventType::query()->where('slug', 'birthday')->value('id');
        $birthday = Wedding::factory()->published()->create([
            'user_id' => $user->id,
            'slug' => 'rahul-birthday',
            'title' => "Rahul's birthday",
            'invitation_mode' => 'both',
            'event_type_id' => $birthdayType,
            'description' => 'Join us for cake, games, and a long lunch.',
            'starts_on' => '2026-11-02',
            'starts_at' => '16:00',
            'city' => 'Chennai',
            'country' => 'India',
            'theme' => 'floral',
            'status' => WeddingStatus::Published,
            'published_at' => now(),
        ]);
        $birthday->hosts()->delete();
        $birthday->hosts()->create(['name' => 'Rahul', 'role' => 'celebrant', 'sort_order' => 1]);
        $birthday->setting()->update([
            'sections' => EventCatalog::sectionsFor('birthday'),
            'details' => ['age' => '7'],
        ]);

        $homeType = EventType::query()->where('slug', 'housewarming')->value('id');
        $home = Wedding::factory()->create([
            'user_id' => $user->id,
            'slug' => 'sharma-housewarming',
            'title' => 'Sharma housewarming',
            'invitation_mode' => 'link',
            'event_type_id' => $homeType,
            'description' => 'The new address, and tea.',
            'starts_on' => '2026-12-01',
            'city' => 'Coimbatore',
            'country' => 'India',
            'theme' => 'traditional',
            'status' => WeddingStatus::Draft,
        ]);
        $home->hosts()->delete();
        $home->hosts()->create(['name' => 'The Sharma family', 'role' => 'host', 'sort_order' => 1]);
        $home->setting()->update([
            'sections' => EventCatalog::sectionsFor('housewarming'),
        ]);
    }
}
