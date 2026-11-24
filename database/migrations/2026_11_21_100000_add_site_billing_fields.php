<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            if (! Schema::hasColumn('events', 'site_billing_status')) {
                $table->string('site_billing_status', 32)->default('none')->after('published_at');
            }
            if (! Schema::hasColumn('events', 'site_trial_started_at')) {
                $table->timestamp('site_trial_started_at')->nullable()->after('site_billing_status');
            }
            if (! Schema::hasColumn('events', 'site_trial_ends_at')) {
                $table->timestamp('site_trial_ends_at')->nullable()->after('site_trial_started_at');
            }
            if (! Schema::hasColumn('events', 'site_pack_sku')) {
                $table->string('site_pack_sku', 64)->nullable()->after('site_trial_ends_at');
            }
            if (! Schema::hasColumn('events', 'site_pack_days')) {
                $table->unsignedInteger('site_pack_days')->nullable()->after('site_pack_sku');
            }
            if (! Schema::hasColumn('events', 'site_pack_paid_at')) {
                $table->timestamp('site_pack_paid_at')->nullable()->after('site_pack_days');
            }
            if (! Schema::hasColumn('events', 'site_pack_starts_at')) {
                $table->timestamp('site_pack_starts_at')->nullable()->after('site_pack_paid_at');
            }
            if (! Schema::hasColumn('events', 'site_pack_ends_at')) {
                $table->timestamp('site_pack_ends_at')->nullable()->after('site_pack_starts_at');
            }
            if (! Schema::hasColumn('events', 'site_custom_starts_on')) {
                $table->date('site_custom_starts_on')->nullable()->after('site_pack_ends_at');
            }
            if (! Schema::hasColumn('events', 'site_custom_ends_on')) {
                $table->date('site_custom_ends_on')->nullable()->after('site_custom_starts_on');
            }
            if (! Schema::hasColumn('events', 'site_credits_granted')) {
                $table->unsignedInteger('site_credits_granted')->default(0)->after('site_custom_ends_on');
            }
            if (! Schema::hasColumn('events', 'scheduled_publish_at')) {
                $table->timestamp('scheduled_publish_at')->nullable()->after('site_credits_granted');
            }
            if (! Schema::hasColumn('events', 'scheduled_publish_status')) {
                $table->string('scheduled_publish_status', 32)->default('none')->after('scheduled_publish_at');
            }
            if (! Schema::hasColumn('events', 'scheduled_publish_attempts')) {
                $table->unsignedTinyInteger('scheduled_publish_attempts')->default(0)->after('scheduled_publish_status');
            }
        });

        Schema::table('events', function (Blueprint $table): void {
            $table->index(['site_billing_status', 'site_pack_ends_at'], 'events_site_billing_ends_idx');
            $table->index(['scheduled_publish_status', 'scheduled_publish_at'], 'events_scheduled_publish_idx');
        });

        Schema::table('billing_payments', function (Blueprint $table): void {
            if (! Schema::hasColumn('billing_payments', 'event_id')) {
                $table->foreignId('event_id')->nullable()->after('user_id')->constrained('events')->nullOnDelete();
            }
            if (! Schema::hasColumn('billing_payments', 'stripe_session_id')) {
                $table->string('stripe_session_id')->nullable()->index()->after('razorpay_signature');
            }
            if (! Schema::hasColumn('billing_payments', 'stripe_payment_intent')) {
                $table->string('stripe_payment_intent')->nullable()->index()->after('stripe_session_id');
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'billing_currency_pref')) {
                $table->string('billing_currency_pref', 8)->nullable()->after('plan_ends_at');
            }
            if (! Schema::hasColumn('users', 'billing_region')) {
                $table->string('billing_region', 8)->nullable()->after('billing_currency_pref');
            }
        });

        if (! Schema::hasTable('billing_expiry_notifications')) {
            Schema::create('billing_expiry_notifications', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
                $table->string('kind', 64);
                $table->timestamp('sent_at');
                $table->timestamps();
                $table->unique(['event_id', 'kind']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_expiry_notifications');

        Schema::table('users', function (Blueprint $table): void {
            foreach (['billing_currency_pref', 'billing_region'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('billing_payments', function (Blueprint $table): void {
            if (Schema::hasColumn('billing_payments', 'event_id')) {
                $table->dropConstrainedForeignId('event_id');
            }
            foreach (['stripe_session_id', 'stripe_payment_intent'] as $col) {
                if (Schema::hasColumn('billing_payments', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('events', function (Blueprint $table): void {
            $table->dropIndex('events_site_billing_ends_idx');
            $table->dropIndex('events_scheduled_publish_idx');
            $cols = [
                'site_billing_status',
                'site_trial_started_at',
                'site_trial_ends_at',
                'site_pack_sku',
                'site_pack_days',
                'site_pack_paid_at',
                'site_pack_starts_at',
                'site_pack_ends_at',
                'site_custom_starts_on',
                'site_custom_ends_on',
                'site_credits_granted',
                'scheduled_publish_at',
                'scheduled_publish_status',
                'scheduled_publish_attempts',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('events', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
