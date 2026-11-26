<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_coupons', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('code', 32)->unique();
            $table->string('type', 40)->default('referral_site_50');
            $table->unsignedTinyInteger('percent_off')->default(50);
            $table->string('applies_to', 40)->default('site_cost');
            $table->string('status', 20)->default('available')->index();
            $table->foreignId('source_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('redeemed_event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->timestamp('redeemed_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('app_notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40)->index();
            $table->string('group_key', 120);
            $table->string('title');
            $table->string('body')->nullable();
            $table->unsignedInteger('count')->default(1);
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamp('last_occurred_at')->index();
            $table->timestamps();

            $table->unique(['user_id', 'group_key']);
            $table->index(['user_id', 'last_occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
        Schema::dropIfExists('user_coupons');
    }
};
