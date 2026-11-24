<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $event_id
 * @property int|null $user_id
 * @property string $email
 * @property string $role
 * @property int|null $invited_by
 * @property Carbon|null $accepted_at
 * @property string $invite_token
 */
class EventCollaborator extends Model
{
    protected $table = 'event_collaborators';

    protected $fillable = [
        'event_id', 'user_id', 'email', 'role', 'invited_by', 'accepted_at', 'invite_token',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
        ];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null;
    }

    public function canEdit(): bool
    {
        return $this->role === 'editor';
    }
}
