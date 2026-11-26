<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_auto_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->boolean('enabled')->default(true);
            $table->string('status', 32)->default('pending')->index();
            $table->string('channel_mode', 16)->default('smart');
            $table->unsignedInteger('reserved_credits')->default(0);
            $table->unsignedInteger('spent_credits')->default(0);
            $table->timestamp('scheduled_for')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['event_id', 'status']);
        });

        Schema::create('scheduled_auto_share_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scheduled_auto_share_id')
                ->constrained('scheduled_auto_shares')
                ->cascadeOnDelete();
            $table->foreignId('event_guest_id')->constrained('event_guests')->cascadeOnDelete();
            $table->string('channel_override', 16)->nullable();
            $table->string('send_status', 16)->default('pending');
            $table->string('resolved_channel', 16)->nullable();
            $table->text('error')->nullable();
            $table->timestamps();

            $table->unique(
                ['scheduled_auto_share_id', 'event_guest_id'],
                'auto_share_recipient_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_auto_share_recipients');
        Schema::dropIfExists('scheduled_auto_shares');
    }
};
