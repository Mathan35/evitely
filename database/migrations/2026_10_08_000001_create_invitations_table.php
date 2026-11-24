<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('status')->default('draft');
            $table->string('partner_one_name');
            $table->string('partner_two_name');
            $table->string('headline')->nullable();
            $table->text('story')->nullable();
            $table->date('ceremony_date');
            $table->time('ceremony_time');
            $table->string('venue_name');
            $table->string('venue_address')->nullable();
            $table->string('city');
            $table->string('dress_code')->nullable();
            $table->boolean('rsvp_enabled')->default(true);
            $table->date('rsvp_deadline')->nullable();
            $table->string('theme')->default('ivory');
            $table->string('host_message', 280)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
