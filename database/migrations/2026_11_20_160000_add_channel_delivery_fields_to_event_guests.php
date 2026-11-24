<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_guests', function (Blueprint $table): void {
            $table->timestamp('email_sent_at')->nullable()->after('invitation_last_error');
            $table->unsignedInteger('email_send_count')->default(0)->after('email_sent_at');
            $table->string('email_last_error')->nullable()->after('email_send_count');

            $table->timestamp('whatsapp_sent_at')->nullable()->after('email_last_error');
            $table->unsignedInteger('whatsapp_send_count')->default(0)->after('whatsapp_sent_at');
            $table->string('whatsapp_last_error')->nullable()->after('whatsapp_send_count');

            $table->timestamp('sms_sent_at')->nullable()->after('whatsapp_last_error');
            $table->unsignedInteger('sms_send_count')->default(0)->after('sms_sent_at');
            $table->string('sms_last_error')->nullable()->after('sms_send_count');

            $table->string('invitation_last_channel', 16)->nullable()->after('sms_last_error');
        });
    }

    public function down(): void
    {
        Schema::table('event_guests', function (Blueprint $table): void {
            $table->dropColumn([
                'email_sent_at',
                'email_send_count',
                'email_last_error',
                'whatsapp_sent_at',
                'whatsapp_send_count',
                'whatsapp_last_error',
                'sms_sent_at',
                'sms_send_count',
                'sms_last_error',
                'invitation_last_channel',
            ]);
        });
    }
};
