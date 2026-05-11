<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BorrowerPayoutMethod extends Model
{
    protected $fillable = [
        'borrower_id',
        'kind',
        'account_name',
        'bank_name',
        'account_number',
        'branch',
        'mobile_provider',
        'mobile_number',
        'borrower_confirmed_at',
        'admin_verified_at',
        'admin_verified_by',
    ];

    protected function casts(): array
    {
        return [
            'borrower_confirmed_at' => 'datetime',
            'admin_verified_at' => 'datetime',
        ];
    }

    public function borrower(): BelongsTo
    {
        return $this->belongsTo(Borrower::class);
    }

    public function adminVerifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_verified_by');
    }

    public function isBorrowerConfirmed(): bool
    {
        return $this->borrower_confirmed_at !== null;
    }

    public function isAdminVerified(): bool
    {
        return $this->admin_verified_at !== null;
    }
}
