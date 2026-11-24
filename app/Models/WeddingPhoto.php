<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class WeddingPhoto extends Model
{
    use SoftDeletes;

    protected $table = 'event_photos';

    protected $fillable = ['event_id', 'path', 'caption', 'sort_order', 'is_cover'];

    protected function casts(): array
    {
        return ['is_cover' => 'boolean'];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }

    public function url(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}
