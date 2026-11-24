<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'message_credits')) {
                $table->unsignedInteger('message_credits')->default(0)->after('plan');
            }
            if (! Schema::hasColumn('users', 'plan_ends_at')) {
                $table->timestamp('plan_ends_at')->nullable()->after('message_credits');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $columns = array_values(array_filter([
                Schema::hasColumn('users', 'message_credits') ? 'message_credits' : null,
                Schema::hasColumn('users', 'plan_ends_at') ? 'plan_ends_at' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
