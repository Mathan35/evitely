<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $provider
 * @property string $kind
 * @property string $sku
 * @property int $amount_paise
 * @property string $currency
 * @property string $status
 * @property string|null $razorpay_order_id
 * @property string|null $razorpay_payment_id
 * @property string|null $razorpay_signature
 * @property array<string, mixed>|null $meta
 * @property \Illuminate\Support\Carbon|null $paid_at
 */
class BillingPayment extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'provider',
        'kind',
        'sku',
        'amount_paise',
        'currency',
        'status',
        'razorpay_order_id',
        'razorpay_payment_id',
        'razorpay_signature',
        'stripe_session_id',
        'stripe_payment_intent',
        'meta',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_paise' => 'integer',
            'meta' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, ['paid', 'failed', 'cancelled', 'expired'], true);
    }

    /**
     * Mark an unpaid attempt as failed / cancelled / expired (idempotent).
     *
     * @param  array<string, mixed>  $meta
     */
    public function markAttempt(string $status, array $meta = []): bool
    {
        if ($this->isPaid() || $this->status === $status) {
            return false;
        }

        if (! in_array($status, ['failed', 'cancelled', 'expired'], true)) {
            return false;
        }

        $merged = is_array($this->meta) ? $this->meta : [];
        foreach ($meta as $key => $value) {
            $merged[$key] = $value;
        }
        $merged['status_changed_at'] = now()->toIso8601String();

        $this->forceFill([
            'status' => $status,
            'meta' => $merged,
        ])->save();

        return true;
    }
}
