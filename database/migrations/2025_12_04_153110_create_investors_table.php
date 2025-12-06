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
        Schema::create('investors', function (Blueprint $table) {
             $table->id();

            // Associate investor to user record
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Personal details
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone');
            $table->string('email');

            // Stamped ID (PDF)
            $table->string('id_document_path')->nullable();

            // Industries (multi-select)
            $table->json('industries')->nullable();

            // Optional status — mirroring borrower flow
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
        Schema::dropIfExists('investors');
    }
};
