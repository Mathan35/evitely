<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportMessage extends Model
{
    public const TOPICS = [
        'bug' => 'Bug report',
        'help' => 'Help using Invidora',
        'billing' => 'Billing & payments',
        'feedback' => 'Feedback',
        'feature' => 'Feature idea',
        'other' => 'Something else',
    ];

    public const STATUSES = [
        'new' => 'New',
        'read' => 'Read',
        'resolved' => 'Resolved',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'topic',
        'message',
        'page_url',
        'ip_address',
        'user_agent',
        'status',
        'resolved_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function topicLabel(): string
    {
        return self::TOPICS[$this->topic] ?? $this->topic;
    }

    public function statusLabel(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', ['new', 'read']);
    }

    public function markRead(): void
    {
        if ($this->status === 'new') {
            $this->forceFill(['status' => 'read'])->save();
        }
    }

    public function markResolved(): void
    {
        $this->forceFill([
            'status' => 'resolved',
            'resolved_at' => now(),
        ])->save();
    }

    public function reopen(): void
    {
        $this->forceFill([
            'status' => 'read',
            'resolved_at' => null,
        ])->save();
    }
}
