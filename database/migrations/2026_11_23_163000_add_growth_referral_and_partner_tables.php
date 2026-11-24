<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('label')->nullable();
            $table->unsignedSmallInteger('bonus_trial_days')->default(14);
            $table->boolean('active')->default(true);
            $table->unsignedInteger('uses_count')->default(0);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->string('referral_code', 16)->nullable()->unique()->after('email');
            $table->foreignId('referred_by_user_id')->nullable()->after('referral_code')->constrained('users')->nullOnDelete();
            $table->foreignId('partner_code_id')->nullable()->after('referred_by_user_id')->constrained('partner_codes')->nullOnDelete();
            $table->timestamp('referral_rewarded_at')->nullable()->after('partner_code_id');
            $table->timestamp('partner_rewarded_at')->nullable()->after('referral_rewarded_at');
        });

        Schema::table('events', function (Blueprint $table): void {
            if (! Schema::hasColumn('events', 'growth_share_count')) {
                $table->unsignedSmallInteger('growth_share_count')->default(0)->after('site_trial_ends_at');
            }
            if (! Schema::hasColumn('events', 'first_shared_at')) {
                $table->timestamp('first_shared_at')->nullable()->after('growth_share_count');
            }
        });

        Schema::create('growth_rewards', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->unsignedSmallInteger('site_days')->default(0);
            $table->unsignedInteger('credits')->default(0);
            $table->foreignId('source_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('growth_rewards');

        Schema::table('events', function (Blueprint $table): void {
            if (Schema::hasColumn('events', 'first_shared_at')) {
                $table->dropColumn('first_shared_at');
            }
            if (Schema::hasColumn('events', 'growth_share_count')) {
                $table->dropColumn('growth_share_count');
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('partner_code_id');
            $table->dropConstrainedForeignId('referred_by_user_id');
            $table->dropColumn(['referral_code', 'referral_rewarded_at', 'partner_rewarded_at']);
        });

        Schema::dropIfExists('partner_codes');
    }
};
