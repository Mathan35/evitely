<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupon_campaigns', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('discount_type', 20)->default('percent'); // percent|amount
            $table->unsignedTinyInteger('percent_off')->nullable();
            $table->unsignedInteger('amount_off_minor')->nullable();
            $table->string('currency', 8)->default('inr');
            $table->string('applies_to', 40)->default('site_cost');
            $table->timestamp('starts_at')->nullable()->index();
            $table->timestamp('ends_at')->nullable()->index();
            $table->unsignedInteger('max_claims')->default(100);
            $table->unsignedInteger('claimed_count')->default(0);
            $table->unsignedTinyInteger('max_per_user')->default(1);
            $table->boolean('is_active')->default(true)->index();
            $table->string('notify_status', 20)->default('pending')->index(); // pending|running|done
            $table->unsignedInteger('notified_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('user_coupons', function (Blueprint $table): void {
            $table->foreignId('campaign_id')->nullable()->after('user_id')->constrained('coupon_campaigns')->nullOnDelete();
            $table->string('discount_type', 20)->default('percent')->after('type');
            $table->unsignedInteger('amount_off_minor')->nullable()->after('percent_off');
            $table->timestamp('expires_at')->nullable()->after('status')->index();
            $table->index(['campaign_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('user_coupons', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('campaign_id');
            $table->dropColumn(['discount_type', 'amount_off_minor', 'expires_at']);
        });

        Schema::dropIfExists('coupon_campaigns');
    }
};
