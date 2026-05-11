<?php

namespace App\Billing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'subscription_id',
        'amount',
        'currency',
        'status',
        'gateway',
        'gateway_reference',
        'idempotency_key',
        'paid_at',
        'meta',
        'pop_file_path',
        'pop_file_original_name',
        'pop_reference',
        'pop_uploaded_at',
        'pop_reviewed_by',
        'pop_reviewed_at',
        'pop_rejection_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'meta' => 'array',
        'pop_uploaded_at' => 'datetime',
        'pop_reviewed_at' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function popReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pop_reviewed_by');
    }

    public function isAwaitingPopReview(): bool
    {
        return $this->gateway === 'manual'
            && $this->status === 'pending'
            && $this->pop_file_path !== null
            && $this->pop_reviewed_at === null;
    }
}
