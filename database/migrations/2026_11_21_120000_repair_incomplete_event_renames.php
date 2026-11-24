<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Completes renames that 2026_10_08_180000_event_first_platform may have left unfinished
 * when the migration history and MySQL schema drifted apart.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        $this->renameTableIfNeeded('wedding_settings', 'event_settings');
        $this->renameTableIfNeeded('wedding_translations', 'event_translations');
        $this->renameTableIfNeeded('wedding_slug_redirects', 'event_slug_redirects');

        $this->renameColumnIfNeeded('event_settings', 'wedding_id', 'event_id');
        $this->renameColumnIfNeeded('event_translations', 'wedding_id', 'event_id');
        $this->renameColumnIfNeeded('event_slug_redirects', 'wedding_id', 'event_id');

        if (Schema::hasTable('event_settings') && ! Schema::hasColumn('event_settings', 'details')) {
            Schema::table('event_settings', function (Blueprint $table): void {
                $table->json('details')->nullable();
            });
        }

        if (! Schema::hasTable('event_cards')) {
            Schema::create('event_cards', function (Blueprint $table): void {
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

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Irreversible repair — leave schema as-is.
    }

    private function renameTableIfNeeded(string $from, string $to): void
    {
        if (Schema::hasTable($from) && ! Schema::hasTable($to)) {
            Schema::rename($from, $to);
        }
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
