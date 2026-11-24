<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        $renames = [
            'event_rsvps' => [
                'wedding_id' => 'event_id',
                'wedding_guest_id' => 'event_guest_id',
            ],
            'event_guests' => [
                'wedding_id' => 'event_id',
            ],
            'event_photos' => [
                'wedding_id' => 'event_id',
            ],
            'event_schedules' => [
                'wedding_id' => 'event_id',
            ],
            'event_guest_groups' => [
                'wedding_id' => 'event_id',
            ],
            'event_schedule_responses' => [
                'wedding_rsvp_id' => 'event_rsvp_id',
                'wedding_event_id' => 'event_schedule_id',
            ],
            'travel_details' => [
                'wedding_id' => 'event_id',
            ],
            'accommodations' => [
                'wedding_id' => 'event_id',
            ],
            'guestbook_entries' => [
                'wedding_id' => 'event_id',
            ],
            'analytics_events' => [
                'wedding_id' => 'event_id',
                'wedding_guest_id' => 'event_guest_id',
            ],
        ];

        foreach ($renames as $table => $columns) {
            foreach ($columns as $from => $to) {
                $this->renameColumnIfNeeded($table, $from, $to);
            }
        }

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Irreversible repair.
    }

    private function renameColumnIfNeeded(string $table, string $from, string $to): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        if (Schema::hasColumn($table, $from) && ! Schema::hasColumn($table, $to)) {
            Schema::table($table, function (Blueprint $blueprint) use ($from, $to): void {
                $blueprint->renameColumn($from, $to);
            });
        }
    }
};
