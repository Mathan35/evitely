<?php

namespace App\Models;

use Database\Factories\WeddingEventFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $wedding_id
 * @property string $title
 * @property string $event_type
 * @property string|null $description
 * @property Carbon|null $event_date
 * @property string|null $start_time
 * @property string|null $end_time
 * @property string $timezone
 * @property string|null $venue_name
 * @property string|null $venue_address
 * @property string|null $city
 * @property string|null $state
 * @property string|null $country
 * @property string|null $latitude
 * @property string|null $longitude
 * @property string|null $dress_code
 * @property string|null $cover_image
 * @property int $sort_order
 * @property bool $is_public
 */
class WeddingEvent extends Model
{
    /** @use HasFactory<WeddingEventFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'event_schedules';

    protected $fillable = [
        'event_id', 'title', 'event_type', 'description', 'event_date', 'start_time', 'end_time',
        'timezone', 'venue_name', 'venue_address', 'city', 'state', 'country',
        'latitude', 'longitude', 'dress_code', 'cover_image', 'sort_order', 'is_public',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'is_public' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }
}
