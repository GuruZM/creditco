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
        'contract',
        'request_amount',
        'source',
        'duration',
        'industry',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'request_amount' => 'decimal:2',
    ];

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

    // ───────────────────────────────────────────
    // Accessors / Helpers
    // ───────────────────────────────────────────

    /**
     * High-level labels for statuses.
     */
    public static function statusLabels() 
    {
        return [
            'pending_review' => 'Pending admin review',
            'approved'       => 'Approved',
            'rejected'       => 'Rejected',
        ];
    }

    /**
     * Check if status is pending.
     */
    public function isPending() 
    {
        return $this->status === 'pending_review';
    }

    /**
     * Check if approved.
     */
    public function isApproved() 
    {
        return $this->status === 'approved';
    }

    /**
     * Check if rejected.
     */
    public function isRejected() 
    {
        return $this->status === 'rejected';
    }
}
