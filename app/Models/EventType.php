<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventType extends Model
{
    protected $fillable = ['name', 'slug', 'category', 'icon', 'is_active', 'sort_order', 'configuration'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'configuration' => 'array',
        ];
    }

    public function events(): HasMany
    {
        return $this->hasMany(Wedding::class, 'event_type_id');
    }
}
