<?php

namespace App\Billing\Contracts;

use App\Billing\Models\Payment;
use App\Billing\Models\PaymentMethod;
use App\Billing\Models\Subscription;

interface BillingDriver
{
    /**
     * Create a customer at the gateway (optional).
     */
    public function createCustomer(int $userId): array;

    /**
     * Store/attach a payment method (tokenization/mandate).
     * For manual driver, this can be a no-op.
     */
    public function storePaymentMethod(int $userId, array $payload): PaymentMethod;

    /**
     * Charge a subscription renewal or initial payment.
     * Must be idempotent using the provided idempotency key.
     */
    public function chargeSubscription(Subscription $subscription, string $idempotencyKey): Payment;

    /**
     * Verify/confirm a payment (for gateways that need confirmation).
     */
    public function verifyPayment(string $gatewayReference): array;
}
