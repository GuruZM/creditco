<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('pop_file_path')->nullable()->after('gateway_reference');
            $table->string('pop_file_original_name')->nullable()->after('pop_file_path');
            $table->string('pop_reference', 191)->nullable()->after('pop_file_original_name');
            $table->timestamp('pop_uploaded_at')->nullable()->after('pop_reference');
            $table->foreignId('pop_reviewed_by')->nullable()->after('pop_uploaded_at')->constrained('users')->nullOnDelete();
            $table->timestamp('pop_reviewed_at')->nullable()->after('pop_reviewed_by');
            $table->text('pop_rejection_reason')->nullable()->after('pop_reviewed_at');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pop_reviewed_by');
            $table->dropColumn([
                'pop_file_path',
                'pop_file_original_name',
                'pop_reference',
                'pop_uploaded_at',
                'pop_reviewed_at',
                'pop_rejection_reason',
            ]);
        });
    }
};
