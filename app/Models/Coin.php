<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coin extends Model
{
    protected $fillable = [
        'borrower_id',
        'request',
        'date',
        'purchase_order',
        'purchase_order_file_path',
        'purchase_order_file_original_name',
        'contract',
        'request_amount',
        'source',
        'duration',
        'industry',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        // Terms (admin-defined at approval).
        'interest_rate',
        'service_fee_percent',
        'duration_days',
        'installments_count',
        'installment_interval_days',
        'total_repayment_amount',
        'installment_amount',
        'terms_text',
        'terms_set_at',
        'borrower_agreed_to_terms_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'request_amount' => 'decimal:2',
            'reviewed_at' => 'datetime',
            'interest_rate' => 'decimal:2',
            'service_fee_percent' => 'decimal:2',
            'total_repayment_amount' => 'decimal:2',
            'installment_amount' => 'decimal:2',
            'terms_set_at' => 'datetime',
            'borrower_agreed_to_terms_at' => 'datetime',
        ];
    }

    // ───────────────────────────────────────────
    // Relationships
    // ───────────────────────────────────────────

    public function borrower()
    {
        return $this->belongsTo(Borrower::class);
    }

    // Borrower → User
    public function borrowerUser()
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function interests()
    {
        return $this->hasMany(CoinInterest::class);
    }

    // ───────────────────────────────────────────
    // Accessors / Helpers
    // ───────────────────────────────────────────

    public static function statusLabels()
    {
        return [
            'pending_review' => 'Pending admin review',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
        ];
    }

    public function isPending()
    {
        return $this->status === 'pending_review';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function hasTerms(): bool
    {
        return $this->terms_set_at !== null
            && $this->interest_rate !== null
            && $this->installments_count !== null
            && $this->installment_amount !== null;
    }

    public function borrowerHasAgreedToTerms(): bool
    {
        return $this->borrower_agreed_to_terms_at !== null;
    }

    /**
     * Compute total repayment + installment amount from the principal & rate.
     *
     * Simple interest model: total = principal * (1 + rate * years) + service fee.
     *
     * @return array{total: float, installment: float}
     */
    public static function computeRepayment(
        float $principal,
        float $annualRatePercent,
        int $durationDays,
        int $installmentsCount,
        ?float $serviceFeePercent = null,
    ): array {
        $rate = $annualRatePercent / 100.0;
        $years = $durationDays / 365.0;
        $interest = $principal * $rate * $years;
        $fee = $serviceFeePercent !== null
            ? $principal * ($serviceFeePercent / 100.0)
            : 0.0;

        $total = round($principal + $interest + $fee, 2);
        $installment = $installmentsCount > 0
            ? round($total / $installmentsCount, 2)
            : 0.0;

        return ['total' => $total, 'installment' => $installment];
    }
}
