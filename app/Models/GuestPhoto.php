<?php

namespace App\Models;

use App\Enums\GuestbookStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class GuestPhoto extends Model
{
    protected $fillable = ['event_id', 'name', 'caption', 'photo_path', 'status'];

    protected function casts(): array
    {
        return ['status' => GuestbookStatus::class];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }

    public function photoUrl(): ?string
    {
        return $this->photo_path ? Storage::disk('public')->url($this->photo_path) : null;
    }
}
