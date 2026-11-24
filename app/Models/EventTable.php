<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $event_id
 * @property string $name
 * @property int $capacity
 * @property int $sort_order
 */
class EventTable extends Model
{
    protected $table = 'event_tables';

    protected $fillable = [
        'event_id', 'name', 'capacity', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }

    public function guests(): HasMany
    {
        return $this->hasMany(WeddingGuest::class, 'table_id');
    }

    public function seatedCount(): int
    {
        return (int) $this->guests->sum(fn (WeddingGuest $guest) => max(1, (int) $guest->number_of_guests));
    }
}
