<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coins', function (Blueprint $table) {
            // Admin-defined commercial terms (set at approval time).
            $table->decimal('interest_rate', 5, 2)->nullable()->after('industry'); // annual %
            $table->decimal('service_fee_percent', 5, 2)->nullable()->after('interest_rate');
            $table->unsignedSmallInteger('duration_days')->nullable()->after('service_fee_percent');
            $table->unsignedSmallInteger('installments_count')->nullable()->after('duration_days');
            $table->unsignedSmallInteger('installment_interval_days')->nullable()->after('installments_count');

            // Computed totals — stored for clarity in the borrower/investor UI.
            $table->decimal('total_repayment_amount', 15, 2)->nullable()->after('installment_interval_days');
            $table->decimal('installment_amount', 15, 2)->nullable()->after('total_repayment_amount');

            $table->text('terms_text')->nullable()->after('installment_amount');
            $table->timestamp('terms_set_at')->nullable()->after('terms_text');
            $table->timestamp('borrower_agreed_to_terms_at')->nullable()->after('terms_set_at');
        });

        Schema::table('coin_interests', function (Blueprint $table) {
            $table->timestamp('investor_agreed_to_terms_at')->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('coin_interests', function (Blueprint $table) {
            $table->dropColumn('investor_agreed_to_terms_at');
        });

        Schema::table('coins', function (Blueprint $table) {
            $table->dropColumn([
                'interest_rate',
                'service_fee_percent',
                'duration_days',
                'installments_count',
                'installment_interval_days',
                'total_repayment_amount',
                'installment_amount',
                'terms_text',
                'terms_set_at',
                'borrower_agreed_to_terms_at',
            ]);
        });
    }
};
