<?php

namespace App\Models;

use App\Enums\InvitationDeliveryStatus;
use App\Enums\RsvpStatus;
use Database\Factories\WeddingGuestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $wedding_id
 * @property int|null $guest_group_id
 * @property string $first_name
 * @property string|null $last_name
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $country_code
 * @property string|null $relationship
 * @property int $number_of_guests
 * @property string|null $notes
 * @property InvitationDeliveryStatus $invitation_status
 * @property \Illuminate\Support\Carbon|null $invitation_sent_at
 * @property int $invitation_send_count
 * @property string|null $invitation_last_error
 * @property \Illuminate\Support\Carbon|null $reminder_sent_at
 * @property int $reminder_send_count
 * @property string|null $reminder_last_error
 * @property RsvpStatus $rsvp_status
 * @property string $guest_token
 */
class WeddingGuest extends Model
{
    /** @use HasFactory<WeddingGuestFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'event_guests';

    protected $fillable = [
        'guest_group_id', 'table_id', 'first_name', 'last_name', 'email', 'phone', 'country_code',
        'relationship', 'number_of_guests', 'notes', 'invitation_status', 'rsvp_status',
        'invitation_sent_at', 'invitation_send_count', 'invitation_last_error', 'invitation_last_channel',
        'email_sent_at', 'email_send_count', 'email_last_error',
        'whatsapp_sent_at', 'whatsapp_send_count', 'whatsapp_last_error',
        'sms_sent_at', 'sms_send_count', 'sms_last_error',
        'reminder_sent_at', 'reminder_send_count', 'reminder_last_error',
        'guest_token', 'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'invitation_status' => InvitationDeliveryStatus::class,
            'rsvp_status' => RsvpStatus::class,
            'invitation_sent_at' => 'datetime',
            'invitation_send_count' => 'integer',
            'email_sent_at' => 'datetime',
            'email_send_count' => 'integer',
            'whatsapp_sent_at' => 'datetime',
            'whatsapp_send_count' => 'integer',
            'sms_sent_at' => 'datetime',
            'sms_send_count' => 'integer',
            'reminder_sent_at' => 'datetime',
            'reminder_send_count' => 'integer',
            'revoked_at' => 'datetime',
            'number_of_guests' => 'integer',
        ];
    }

    public function hasChannelFailure(): bool
    {
        return filled($this->email_last_error)
            || filled($this->whatsapp_last_error)
            || filled($this->sms_last_error)
            || filled($this->invitation_last_error);
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(GuestGroup::class, 'guest_group_id');
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(EventTable::class, 'table_id');
    }

    public function fullName(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }
}
