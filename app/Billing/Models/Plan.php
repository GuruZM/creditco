<?php

namespace App\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = [
        'key',
        'name',
        'interval',
        'interval_count',
        'amount',
        'currency',
        'is_active',
        'meta',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_active' => 'boolean',
        'meta' => 'array',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Monthly equivalent price (used for UI like your screenshot)
     */
    public function monthlyEquivalent(): float
    {
        return match ($this->interval) {
            'month' => (float) $this->amount,
            'quarter' => round($this->amount / 3, 2),
            'year' => round($this->amount / 12, 2),
            default => (float) $this->amount,
        };
    }

    /**
     * Human label: Monthly / Quarterly / Yearly
     */
    public function intervalLabel(): string
    {
        return match ($this->interval) {
            'month' => 'Monthly',
            'quarter' => 'Quarterly',
            'year' => 'Yearly',
            default => ucfirst($this->interval),
        };
    }

    /**
     * For UI badges like "Best value"
     */
    public function isYearly(): bool
    {
        return $this->interval === 'year';
    }
}
