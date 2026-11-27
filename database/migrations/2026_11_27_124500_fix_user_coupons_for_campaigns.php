<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * For databases that already had the original user_coupons schema
 * (global unique code + NOT NULL percent_off).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('user_coupons')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // Fresh test DBs already use the corrected create migration.
            return;
        }

        try {
            DB::statement('ALTER TABLE user_coupons MODIFY percent_off TINYINT UNSIGNED NULL');
        } catch (\Throwable) {
            // Column may already be nullable.
        }

        try {
            Schema::table('user_coupons', function (Blueprint $table): void {
                $table->dropUnique(['code']);
            });
        } catch (\Throwable) {
            try {
                DB::statement('ALTER TABLE user_coupons DROP INDEX user_coupons_code_unique');
            } catch (\Throwable) {
            }
        }

        try {
            Schema::table('user_coupons', function (Blueprint $table): void {
                $table->unique(['user_id', 'code']);
            });
        } catch (\Throwable) {
            // Already exists.
        }
    }

    public function down(): void
    {
        //
    }
};
