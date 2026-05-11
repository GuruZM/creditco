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
        Schema::table('coin_interests', function (Blueprint $table) {
            // Step 2: terms accepted
            $table->timestamp('terms_accepted_at')->nullable()->after('funding_started_by');
            $table->foreignId('terms_accepted_by')->nullable()->after('terms_accepted_at')->constrained('users')->nullOnDelete();

            // Step 3: funded
            $table->timestamp('funded_at')->nullable()->after('terms_accepted_by');
            $table->foreignId('funded_by')->nullable()->after('funded_at')->constrained('users')->nullOnDelete();
            $table->decimal('funded_amount', 15, 2)->nullable()->after('funded_by');

            // Step 4: repayment schedule
            $table->unsignedSmallInteger('installments_count')->nullable()->after('funded_amount');
            $table->decimal('installment_amount', 15, 2)->nullable()->after('installments_count');
            $table->unsignedSmallInteger('installment_interval_days')->nullable()->after('installment_amount');
            $table->timestamp('next_payment_due_at')->nullable()->after('installment_interval_days');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coin_interests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('terms_accepted_by');
            $table->dropConstrainedForeignId('funded_by');
            $table->dropColumn([
                'terms_accepted_at',
                'funded_at',
                'funded_amount',
                'installments_count',
                'installment_amount',
                'installment_interval_days',
                'next_payment_due_at',
            ]);
        });
    }
};
