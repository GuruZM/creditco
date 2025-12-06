<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Investor extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'phone',
        'email',
        'id_document_path',
        'industries',
        'status',
    ];

    protected $casts = [
        'industries' => 'array', // JSON → array
    ];

    public function user() 
    {
        return $this->belongsTo(User::class);
    }

     public function verifications() 
    {
        return $this->hasMany(InvestorVerification::class);
    }

    public function latestVerification()
    {
        return $this->hasOne(InvestorVerification::class)->latestOfMany();
    }
}
