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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();

            $table->decimal('amount', 15, 2);
            $table->string('currency', 10)->default('ZMW');

            $table->enum('status', [
                'initiated',
                'pending',
                'paid',
                'failed',
                'refunded',
            ])->default('initiated');

            $table->string('gateway')->nullable();
            $table->string('gateway_reference')->nullable();
            $table->string('idempotency_key')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();

            $table->unique(['gateway', 'gateway_reference']);
            $table->unique(['subscription_id', 'idempotency_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
