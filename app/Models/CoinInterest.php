<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CoinInterest extends Model
{
    protected $fillable = [
        'coin_id',
        'user_id',
        'note',
        'investor_agreed_to_terms_at',
        'funding_status',
        'funding_started_at',
        'funding_started_by',
        'terms_accepted_at',
        'terms_accepted_by',
        'funded_at',
        'funded_by',
        'funded_amount',
        'installments_count',
        'installment_amount',
        'installment_interval_days',
        'next_payment_due_at',
        'installments_paid',
    ];

    protected function casts(): array
    {
        return [
            'funding_started_at' => 'datetime',
            'investor_agreed_to_terms_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'funded_at' => 'datetime',
            'next_payment_due_at' => 'datetime',
            'funded_amount' => 'decimal:2',
            'installment_amount' => 'decimal:2',
        ];
    }

    public function termsAcceptor()
    {
        return $this->belongsTo(User::class, 'terms_accepted_by');
    }

    public function funder()
    {
        return $this->belongsTo(User::class, 'funded_by');
    }

    public function coin(): BelongsTo
    {
        return $this->belongsTo(Coin::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function repayments(): HasMany
    {
        return $this->hasMany(CoinRepayment::class);
    }

    public function installmentsRemaining(): int
    {
        return max(0, (int) $this->installments_count - (int) $this->installments_paid);
    }

    public function isFullyRepaid(): bool
    {
        return $this->installments_count !== null
            && $this->installments_paid >= $this->installments_count;
    }

    public function investorHasAgreedToTerms(): bool
    {
        return $this->investor_agreed_to_terms_at !== null;
    }
}
