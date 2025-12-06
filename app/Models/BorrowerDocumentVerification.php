<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BorrowerDocumentVerification extends Model
{
    protected $fillable = [
        'borrower_id',
        'document_type', // e.g. registration_documents, bank_statement, ...
        'verified_by',   // user id
        'note',
    ];

    public function borrower() 
    {
        return $this->belongsTo(Borrower::class);
    }

    public function verifier() 
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
