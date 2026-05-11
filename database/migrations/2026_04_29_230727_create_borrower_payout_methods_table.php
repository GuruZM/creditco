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
        Schema::create('borrower_payout_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrower_id')->constrained()->cascadeOnDelete();
            $table->enum('kind', ['bank', 'mobile_money']);
            $table->string('account_name');

            // Bank fields (nullable when kind=mobile_money)
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('branch')->nullable();

            // Mobile money fields (nullable when kind=bank)
            $table->string('mobile_provider')->nullable();
            $table->string('mobile_number')->nullable();

            // Borrower self-confirmation (after the "verify your details" notification)
            $table->timestamp('borrower_confirmed_at')->nullable();

            // Admin verification (used by funding wizard in PR 3)
            $table->timestamp('admin_verified_at')->nullable();
            $table->foreignId('admin_verified_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            // Treat as one active payout method per borrower for now.
            $table->unique('borrower_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrower_payout_methods');
    }
};
