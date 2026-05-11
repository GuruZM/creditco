<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoinRepayment extends Model
{
    protected $fillable = [
        'coin_interest_id',
        'submitted_by',
        'installment_number',
        'amount',
        'currency',
        'paid_at',
        'reference',
        'proof_path',
        'proof_original_name',
        'note',
        'status',
        'verified_by',
        'verified_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'date',
            'verified_at' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }

    public function interest(): BelongsTo
    {
        return $this->belongsTo(CoinInterest::class, 'coin_interest_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending_verification';
    }

    public function isVerified(): bool
    {
        return $this->status === 'verified';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}
