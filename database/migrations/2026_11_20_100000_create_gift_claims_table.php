<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gift_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('gift_item_id', 64);
            $table->string('gift_label', 160)->nullable();
            $table->string('name', 120);
            $table->string('email', 160)->nullable();
            $table->string('note', 500)->nullable();
            $table->string('status', 20)->default('claimed');
            $table->timestamps();

            $table->index(['event_id', 'gift_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gift_claims');
    }
};
