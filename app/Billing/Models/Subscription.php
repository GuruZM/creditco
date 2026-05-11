<?php

namespace App\Billing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'status',
        'starts_at',
        'renews_at',
        'ends_at',
        'grace_ends_at',
        'gateway',
        'gateway_customer_id',
        'gateway_subscription_id',
        'last_payment_at',
        'failed_attempts',
        'next_billing_attempt_at',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'renews_at' => 'datetime',
        'ends_at' => 'datetime',
        'grace_ends_at' => 'datetime',
        'last_payment_at' => 'datetime',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active'
            || (
                $this->status === 'past_due'
                && $this->grace_ends_at
                && now()->lessThan($this->grace_ends_at)
            );
    }
}
