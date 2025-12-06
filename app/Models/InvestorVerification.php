<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvestorVerification extends Model
{
      protected $fillable = [
        'investor_id',
        'verified_by',
        'note',
    ];

    public function investor() 
    {
        return $this->belongsTo(Investor::class);
    }

    public function verifier() 
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
