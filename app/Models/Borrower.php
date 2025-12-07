<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Borrower extends Model
{
  protected $fillable = [
        'user_id',
        'company_name',
        'company_registration_number',
        'company_type',
        'years_in_operation',
        'industry',
        'reg_documents_path',
        'bank_statement_path',
        'company_printout_path',
        'contact_id_copy_path',
        'contact_name',
        'contact_email',
        'contact_phone',
        'contact_address',
        'status',
    ];

         public const REQUIRED_DOCUMENTS = [
        'registration_documents'  => 'Registration documents',
        'bank_statement'          => 'Bank statement',
        'company_printout'        => 'Company print-out',
        'contact_id_document'     => 'Contact ID copy',
    ];

    public static function requiredDocuments(): array
    {
        return self::REQUIRED_DOCUMENTS;
    }

    public function user() 
    {
        return $this->belongsTo(User::class);
    }

    public function coins() 
    {
        return $this->hasMany(Coin::class);
    }

    public function documentVerifications() 
    {
        return $this->hasMany(BorrowerDocumentVerification::class);
    }

    public function hasAllRequiredDocumentsVerified(): bool
    {
        $required = array_keys(self::REQUIRED_DOCUMENTS);

        $verifiedTypes = $this->documentVerifications()
            ->whereIn('document_type', $required)
            ->distinct()
            ->pluck('document_type')
            ->all();

        sort($required);
        sort($verifiedTypes);

        return $required === $verifiedTypes;
    }
}
