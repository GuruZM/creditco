<?php

namespace App\Billing\Drivers;

use App\Billing\Contracts\BillingDriver;
use App\Billing\Gateways\Lenco\LencoClient;
use App\Billing\Models\Payment;
use App\Billing\Models\PaymentMethod;
use App\Billing\Models\Subscription;
use Illuminate\Support\Str;

class LencoDriver implements BillingDriver
{
    public function __construct(protected LencoClient $client) {}

    public function createCustomer(int $userId): array
    {
        return ['ok' => true, 'customer_id' => null];
    }

    public function storePaymentMethod(int $userId, array $payload): PaymentMethod
    {
        return PaymentMethod::create([
            'user_id' => $userId,
            'gateway' => 'lenco',
            'token' => (string) ($payload['token'] ?? Str::ulid()),
            'is_default' => (bool) ($payload['is_default'] ?? false),
            'label' => $payload['label'] ?? 'Lenco payment method',
            'meta' => $payload,
        ]);
    }

    public function chargeSubscription(Subscription $subscription, string $idempotencyKey): Payment
    {
        $reference = 'cc_'.Str::lower((string) Str::ulid());

        return Payment::create([
            'user_id' => $subscription->user_id,
            'subscription_id' => $subscription->id,
            'amount' => $subscription->plan->amount,
            'currency' => $subscription->plan->currency,
            'status' => 'initiated',
            'gateway' => 'lenco',
            'gateway_reference' => $reference,
            'idempotency_key' => $idempotencyKey,
            'meta' => [
                'reference' => $reference,
                'gateway_status' => 'initiated',
            ],
        ]);
    }

    public function verifyPayment(string $gatewayReference): array
    {
        return $this->client->collectionStatus($gatewayReference);
    }
}
