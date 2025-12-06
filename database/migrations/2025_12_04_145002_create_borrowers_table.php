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
        Schema::create('borrowers', function (Blueprint $table) {
           $table->id();

            // Link to users table
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Company profile
            $table->string('company_name');
            $table->string('company_registration_number');
            $table->string('company_type');
            $table->unsignedSmallInteger('years_in_operation')->default(0);
            $table->string('industry');

            // Files (store file paths here)
            $table->string('reg_documents_path')->nullable();
            $table->string('bank_statement_path')->nullable();
            $table->string('company_printout_path')->nullable();
            $table->string('contact_id_copy_path')->nullable();

            // Contact details
            $table->string('contact_name');
            $table->string('contact_email');
            $table->string('contact_phone');
            $table->text('contact_address')->nullable();

            // Status
            // Using enum with normalized values (no spaces)
            $table->enum('status', [
                'pending_verification',
                'verified',
                'suspended',
            ])->default('pending_verification');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrowers');
    }
};
