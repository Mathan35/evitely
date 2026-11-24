<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerCode extends Model
{
    protected $fillable = [
        'code',
        'label',
        'bonus_trial_days',
        'active',
        'uses_count',
    ];

    protected function casts(): array
    {
        return [
            'bonus_trial_days' => 'integer',
            'active' => 'boolean',
            'uses_count' => 'integer',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
