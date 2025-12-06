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
        Schema::create('investor_verifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('investor_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('verified_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->text('note')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investor_verifications');
    }
};
