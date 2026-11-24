<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_guests', function (Blueprint $table) {
            $table->timestamp('invitation_sent_at')->nullable()->after('invitation_status');
            $table->unsignedSmallInteger('invitation_send_count')->default(0)->after('invitation_sent_at');
            $table->string('invitation_last_error', 255)->nullable()->after('invitation_send_count');
        });
    }

    public function down(): void
    {
        Schema::table('event_guests', function (Blueprint $table) {
            $table->dropColumn(['invitation_sent_at', 'invitation_send_count', 'invitation_last_error']);
        });
    }
};
