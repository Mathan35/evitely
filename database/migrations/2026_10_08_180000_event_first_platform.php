<?php

use App\Support\EventCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category');
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('configuration');
            $table->timestamps();
        });

        $now = now();

        foreach (EventCatalog::definitions() as $index => $type) {
            DB::table('event_types')->insert([
                'name' => $type['name'],
                'slug' => $type['slug'],
                'category' => $type['category'],
                'icon' => $type['icon'],
                'is_active' => true,
                'sort_order' => $index + 1,
                'configuration' => json_encode(EventCatalog::configuration($type['slug'])),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $weddingTypeId = DB::table('event_types')->where('slug', 'wedding')->value('id');

        Schema::table('weddings', function (Blueprint $table) {
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('invitation_mode')->default('both');
            $table->foreignId('event_type_id')->nullable()->constrained('event_types')->nullOnDelete();
        });

        Schema::table('wedding_settings', function (Blueprint $table) {
            $table->json('details')->nullable();
        });

        Schema::create('event_hosts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->string('name');
            $table->string('role')->nullable();
            $table->string('photo')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index('event_id');
        });

        foreach (DB::table('weddings')->orderBy('id')->get() as $wedding) {
            $title = trim($wedding->bride_name.' & '.$wedding->groom_name);
            DB::table('weddings')->where('id', $wedding->id)->update([
                'title' => $title !== '&' ? $title : 'Celebration',
                'description' => $wedding->story,
                'invitation_mode' => 'both',
                'event_type_id' => $weddingTypeId,
            ]);

            if (filled($wedding->bride_name)) {
                DB::table('event_hosts')->insert([
                    'event_id' => $wedding->id,
                    'name' => $wedding->bride_display_name ?: $wedding->bride_name,
                    'role' => 'bride',
                    'sort_order' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            if (filled($wedding->groom_name)) {
                DB::table('event_hosts')->insert([
                    'event_id' => $wedding->id,
                    'name' => $wedding->groom_display_name ?: $wedding->groom_name,
                    'role' => 'groom',
                    'sort_order' => 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        Schema::table('weddings', function (Blueprint $table) {
            $table->dropIndex(['occasion']);
        });

        Schema::table('weddings', function (Blueprint $table) {
            $table->dropColumn(['bride_name', 'groom_name', 'bride_display_name', 'groom_display_name', 'occasion']);
        });

        Schema::table('weddings', function (Blueprint $table) {
            $table->renameColumn('wedding_date', 'starts_on');
            $table->renameColumn('wedding_time', 'starts_at');
        });

        Schema::disableForeignKeyConstraints();

        Schema::rename('event_rsvps', 'event_schedule_responses');
        Schema::rename('weddings', 'events');
        Schema::rename('wedding_events', 'event_schedules');
        Schema::rename('guest_groups', 'event_guest_groups');
        Schema::rename('wedding_guests', 'event_guests');
        Schema::rename('wedding_rsvps', 'event_rsvps');
        Schema::rename('wedding_photos', 'event_photos');
        Schema::rename('wedding_settings', 'event_settings');
        Schema::rename('wedding_translations', 'event_translations');
        Schema::rename('wedding_slug_redirects', 'event_slug_redirects');

        $this->renameForeignKey('event_schedules', 'wedding_id', 'event_id');
        $this->renameForeignKey('event_guest_groups', 'wedding_id', 'event_id');
        $this->renameForeignKey('event_guests', 'wedding_id', 'event_id');
        $this->renameForeignKey('event_rsvps', 'wedding_id', 'event_id');
        $this->renameForeignKey('event_rsvps', 'wedding_guest_id', 'event_guest_id');
        $this->renameForeignKey('event_photos', 'wedding_id', 'event_id');
        $this->renameForeignKey('event_settings', 'wedding_id', 'event_id');
        $this->renameForeignKey('event_translations', 'wedding_id', 'event_id');
        $this->renameForeignKey('event_slug_redirects', 'wedding_id', 'event_id');
        $this->renameForeignKey('travel_details', 'wedding_id', 'event_id');
        $this->renameForeignKey('accommodations', 'wedding_id', 'event_id');
        $this->renameForeignKey('guestbook_entries', 'wedding_id', 'event_id');
        $this->renameForeignKey('analytics_events', 'wedding_id', 'event_id');
        $this->renameForeignKey('analytics_events', 'wedding_guest_id', 'event_guest_id');
        $this->renameForeignKey('event_schedule_responses', 'wedding_rsvp_id', 'event_rsvp_id');
        $this->renameForeignKey('event_schedule_responses', 'wedding_event_id', 'event_schedule_id');

        Schema::enableForeignKeyConstraints();

        Schema::table('event_hosts', function (Blueprint $table) {
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });

        Schema::create('event_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->unique()->constrained('events')->cascadeOnDelete();
            $table->string('format')->default('portrait');
            $table->unsignedInteger('width')->default(1080);
            $table->unsignedInteger('height')->default(1920);
            $table->string('status')->default('draft');
            $table->json('document');
            $table->string('preview_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_cards');
        Schema::dropIfExists('event_hosts');
        Schema::dropIfExists('event_types');
    }

    private function renameForeignKey(string $table, string $from, string $to): void
    {
        if (! Schema::hasColumn($table, $from)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($from, $to): void {
            $blueprint->renameColumn($from, $to);
        });
    }
};
