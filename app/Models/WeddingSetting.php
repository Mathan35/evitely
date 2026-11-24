<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeddingSetting extends Model
{
    protected $table = 'event_settings';

    protected $fillable = ['event_id', 'sections', 'seo', 'details'];

    protected function casts(): array
    {
        return [
            'sections' => 'array',
            'seo' => 'array',
            'details' => 'array',
        ];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }
}
