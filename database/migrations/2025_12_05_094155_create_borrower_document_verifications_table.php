<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('borrower_document_verifications', function (Blueprint $table) {
             $table->id();

            // Borrower who owns the document
            $table->foreignId('borrower_id')
                ->constrained()
                ->cascadeOnDelete();

            // Document type — must match the enum list in Borrower::REQUIRED_DOCUMENTS
            $table->string('document_type'); 
            // e.g.
            // registration_documents
            // bank_statement
            // company_printout
            // contact_id_document

            // Admin who verified this document
            $table->foreignId('verified_by')
                ->constrained('users')
                ->cascadeOnDelete();

            // Optional verification note — visible in the UI
            $table->text('note')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrower_document_verifications');
    }
};
