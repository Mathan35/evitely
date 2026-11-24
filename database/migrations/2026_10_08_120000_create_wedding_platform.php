<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('plan')->default('free')->after('email');
        });

        Schema::create('weddings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('occasion')->default('wedding')->index();
            $table->string('bride_name');
            $table->string('groom_name');
            $table->string('bride_display_name')->nullable();
            $table->string('groom_display_name')->nullable();
            $table->date('wedding_date')->nullable()->index();
            $table->time('wedding_time')->nullable();
            $table->string('timezone')->default('Asia/Kolkata');
            $table->string('venue_name')->nullable();
            $table->string('venue_address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('story')->nullable();
            $table->string('headline')->nullable();
            $table->string('host_message')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('theme')->default('classic')->index();
            $table->string('style')->default('indian');
            $table->string('cultural_template')->nullable();
            $table->string('language')->default('en');
            $table->string('secondary_language')->nullable();
            $table->string('music_url')->nullable();
            $table->boolean('music_enabled')->default(false);
            $table->string('status')->default('draft')->index();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('wedding_slug_redirects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('wedding_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('sections');
            $table->json('seo')->nullable();
            $table->timestamps();
        });

        Schema::create('wedding_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->string('locale');
            $table->json('content');
            $table->timestamps();
            $table->unique(['wedding_id', 'locale']);
        });

        Schema::create('wedding_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('event_type')->default('custom');
            $table->text('description')->nullable();
            $table->date('event_date')->nullable()->index();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('timezone')->default('Asia/Kolkata');
            $table->string('venue_name')->nullable();
            $table->string('venue_address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('dress_code')->nullable();
            $table->string('cover_image')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_public')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index('wedding_id');
        });

        Schema::create('guest_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('wedding_guests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->foreignId('guest_group_id')->nullable()->constrained()->nullOnDelete();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('country_code', 8)->nullable();
            $table->string('relationship')->nullable();
            $table->unsignedSmallInteger('number_of_guests')->default(1);
            $table->text('notes')->nullable();
            $table->string('invitation_status')->default('pending')->index();
            $table->string('rsvp_status')->default('pending')->index();
            $table->string('guest_token', 64)->unique();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('wedding_id');
        });

        Schema::create('wedding_rsvps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wedding_guest_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_name');
            $table->string('email');
            $table->string('status');
            $table->unsignedSmallInteger('guest_count')->default(1);
            $table->string('meal_preference')->nullable();
            $table->string('dietary_restrictions')->nullable();
            $table->text('message')->nullable();
            $table->json('answers')->nullable();
            $table->timestamps();
            $table->unique(['wedding_id', 'email']);
        });

        Schema::create('event_rsvps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_rsvp_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wedding_event_id')->constrained()->cascadeOnDelete();
            $table->boolean('attending')->default(true);
            $table->timestamps();
            $table->unique(['wedding_rsvp_id', 'wedding_event_id']);
        });

        Schema::create('wedding_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('caption')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_cover')->default(false);
            $table->timestamps();
            $table->softDeletes();
            $table->index('wedding_id');
        });

        Schema::create('travel_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->string('kind')->default('directions');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('accommodations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->string('hotel_name');
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('booking_url')->nullable();
            $table->string('price_info')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('guestbook_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('message');
            $table->string('photo_path')->nullable();
            $table->string('status')->default('pending')->index();
            $table->timestamps();
        });

        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wedding_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wedding_guest_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type')->index();
            $table->string('channel')->nullable();
            $table->string('visitor_hash', 64)->nullable()->index();
            $table->timestamp('created_at')->nullable()->index();
        });

        $this->migrateLegacyInvitations();
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
        Schema::dropIfExists('guestbook_entries');
        Schema::dropIfExists('accommodations');
        Schema::dropIfExists('travel_details');
        Schema::dropIfExists('wedding_photos');
        Schema::dropIfExists('event_rsvps');
        Schema::dropIfExists('wedding_rsvps');
        Schema::dropIfExists('wedding_guests');
        Schema::dropIfExists('guest_groups');
        Schema::dropIfExists('wedding_events');
        Schema::dropIfExists('wedding_translations');
        Schema::dropIfExists('wedding_settings');
        Schema::dropIfExists('wedding_slug_redirects');
        Schema::dropIfExists('weddings');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('plan');
        });
    }

    private function migrateLegacyInvitations(): void
    {
        if (! Schema::hasTable('invitations')) {
            return;
        }

        $themeMap = [
            'ivory' => 'classic',
            'garden' => 'floral',
            'midnight' => 'royal',
            'blush' => 'floral',
        ];

        $invitations = DB::table('invitations')->orderBy('id')->get();

        foreach ($invitations as $invitation) {
            $slug = $invitation->slug;
            $suffix = 2;

            while (DB::table('weddings')->where('slug', $slug)->exists()) {
                $slug = $invitation->slug.'-'.$suffix;
                $suffix++;
            }

            $weddingId = DB::table('weddings')->insertGetId([
                'user_id' => $invitation->user_id,
                'slug' => $slug,
                'occasion' => 'wedding',
                'bride_name' => $invitation->partner_one_name,
                'groom_name' => $invitation->partner_two_name,
                'wedding_date' => $invitation->ceremony_date,
                'wedding_time' => $invitation->ceremony_time,
                'timezone' => 'Asia/Kolkata',
                'venue_name' => $invitation->venue_name,
                'venue_address' => $invitation->venue_address,
                'city' => $invitation->city,
                'country' => 'India',
                'story' => $invitation->story,
                'headline' => $invitation->headline,
                'host_message' => $invitation->host_message,
                'theme' => $themeMap[$invitation->theme] ?? 'classic',
                'style' => 'indian',
                'language' => 'en',
                'status' => $invitation->status === 'published' ? 'published' : 'draft',
                'published_at' => $invitation->published_at,
                'created_at' => $invitation->created_at,
                'updated_at' => $invitation->updated_at,
            ]);

            $sections = array_fill_keys(config('wedding.sections'), true);
            $sections['rsvp'] = (bool) $invitation->rsvp_enabled;

            DB::table('wedding_settings')->insert([
                'wedding_id' => $weddingId,
                'sections' => json_encode($sections),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('wedding_events')->insert([
                'wedding_id' => $weddingId,
                'title' => 'Wedding Ceremony',
                'event_type' => 'wedding',
                'event_date' => $invitation->ceremony_date,
                'start_time' => $invitation->ceremony_time,
                'timezone' => 'Asia/Kolkata',
                'venue_name' => $invitation->venue_name,
                'venue_address' => $invitation->venue_address,
                'city' => $invitation->city,
                'country' => 'India',
                'dress_code' => $invitation->dress_code,
                'sort_order' => 1,
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (Schema::hasTable('rsvps')) {
                $replies = DB::table('rsvps')->where('invitation_id', $invitation->id)->get();

                foreach ($replies as $reply) {
                    DB::table('wedding_rsvps')->insert([
                        'wedding_id' => $weddingId,
                        'guest_name' => $reply->guest_name,
                        'email' => $reply->email,
                        'status' => $reply->attending ? 'attending' : 'not_attending',
                        'guest_count' => $reply->guest_count,
                        'message' => $reply->message,
                        'created_at' => $reply->created_at,
                        'updated_at' => $reply->updated_at,
                    ]);
                }
            }
        }

        Schema::dropIfExists('rsvps');
        Schema::dropIfExists('invitations');
    }
};
