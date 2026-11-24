<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GrowthReward extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'site_days',
        'credits',
        'source_user_id',
        'event_id',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'site_days' => 'integer',
            'credits' => 'integer',
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
