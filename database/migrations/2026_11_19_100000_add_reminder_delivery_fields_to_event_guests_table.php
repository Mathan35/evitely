<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_guests', function (Blueprint $table) {
            $table->timestamp('reminder_sent_at')->nullable()->after('invitation_last_error');
            $table->unsignedSmallInteger('reminder_send_count')->default(0)->after('reminder_sent_at');
            $table->string('reminder_last_error', 255)->nullable()->after('reminder_send_count');
        });
    }

    public function down(): void
    {
        Schema::table('event_guests', function (Blueprint $table) {
            $table->dropColumn(['reminder_sent_at', 'reminder_send_count', 'reminder_last_error']);
        });
    }
};
