<?php

namespace App\Billing\Drivers;

use App\Billing\Contracts\BillingDriver;
use App\Billing\Models\Payment;
use App\Billing\Models\PaymentMethod;
use App\Billing\Models\Subscription;

class ManualDriver implements BillingDriver
{
    public function createCustomer(int $userId): array
    {
        return ['ok' => true, 'customer_id' => null];
    }

    public function storePaymentMethod(int $userId, array $payload): PaymentMethod
    {
        // Manual driver doesn't store tokens; return a placeholder record if needed
        return PaymentMethod::create([
            'user_id' => $userId,
            'gateway' => 'manual',
            'token' => 'manual',
            'is_default' => true,
            'label' => $payload['label'] ?? 'Manual payment',
            'meta' => $payload,
        ]);
    }

    public function chargeSubscription(Subscription $subscription, string $idempotencyKey): Payment
    {
        // For manual payments: create a payment record and mark as pending.
        // Later: user completes payment off-platform, webhook flips it to paid.
        return Payment::create([
            'user_id' => $subscription->user_id,
            'subscription_id' => $subscription->id,
            'amount' => $subscription->plan->amount,
            'currency' => $subscription->plan->currency,
            'status' => 'pending',
            'gateway' => 'manual',
            'gateway_reference' => null,
            'idempotency_key' => $idempotencyKey,
            'meta' => [
                'instruction' => 'Manual payment required',
            ],
        ]);
    }

    public function verifyPayment(string $gatewayReference): array
    {
        return ['ok' => false, 'message' => 'Manual driver has no verification'];
    }
}
