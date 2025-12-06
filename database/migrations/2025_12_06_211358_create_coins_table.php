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
        Schema::create('coins', function (Blueprint $table) {
             $table->id();

            // Borrower who created the coin
            $table->foreignId('borrower_id')
                ->constrained()
                ->cascadeOnDelete();

            // Core details
            $table->text('request');                 // The request text/description
            $table->date('date')->nullable();        // Date of request

            $table->string('purchase_order')->nullable(); // PO number or reference
            $table->string('contract')->nullable();        // Contract reference

            $table->decimal('request_amount', 15, 2); // Financial amount requested

            $table->string('source')->nullable();         // Funding source (borrower-provided)
            $table->string('duration')->nullable();       // Duration string (e.g. "30 days")
            $table->string('industry')->nullable();       // Industry of the request

            // Admin review status
            $table->enum('status', [
                'pending_review',
                'approved',
                'rejected',
            ])->default('pending_review');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coins');
    }
};
