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
            // Funding lifecycle for this (coin, investor) pair.
            $table->string('funding_status')->default('interested')->after('note');
            $table->timestamp('funding_started_at')->nullable()->after('funding_status');
            $table->foreignId('funding_started_by')->nullable()->after('funding_started_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coin_interests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('funding_started_by');
            $table->dropColumn(['funding_status', 'funding_started_at']);
        });
    }
};
