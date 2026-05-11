<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coin_repayments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('coin_interest_id')->constrained('coin_interests')->cascadeOnDelete();
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();

            // Which scheduled installment this submission represents (1-based).
            $table->unsignedSmallInteger('installment_number');

            $table->decimal('amount', 15, 2);
            $table->string('currency', 10)->default('ZMW');

            $table->date('paid_at')->nullable();
            $table->string('reference', 191)->nullable();
            $table->string('proof_path')->nullable();
            $table->string('proof_original_name')->nullable();
            $table->text('note')->nullable();

            $table->enum('status', [
                'pending_verification',
                'verified',
                'rejected',
            ])->default('pending_verification');

            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();

            $table->index(['coin_interest_id', 'status']);
        });

        Schema::table('coin_interests', function (Blueprint $table) {
            $table->unsignedSmallInteger('installments_paid')->default(0)->after('next_payment_due_at');
        });
    }

    public function down(): void
    {
        Schema::table('coin_interests', function (Blueprint $table) {
            $table->dropColumn('installments_paid');
        });

        Schema::dropIfExists('coin_repayments');
    }
};
