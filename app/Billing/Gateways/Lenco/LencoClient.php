<?php

namespace App\Billing\Gateways\Lenco;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class LencoClient
{
    protected function http(): PendingRequest
    {
        $token = config('lenco.api_token');

        if (! $token) {
            throw new RuntimeException('LENCO_API_TOKEN is not set.');
        }

        return Http::baseUrl(config('lenco.base_url'))
            ->withToken($token)
            ->acceptJson()
            ->asJson()
            ->timeout(30);
    }

    /**
     * Verify collection status by reference.
     * GET /access/v2/collections/status/{reference}
     */
    public function collectionStatus(string $reference): array
    {
        $res = $this->http()->get("/access/v2/collections/status/{$reference}");

        if (! $res->successful()) {
            throw new RuntimeException("Lenco status check failed: {$res->status()} {$res->body()}");
        }

        return $res->json();
    }

    /**
     * Mobile money charge (we’ll wire this next step).
     * POST /access/v2/collections/mobile-money
     */
    public function mobileMoneyCharge(array $payload): array
    {
        $res = $this->http()->post('/access/v2/collections/mobile-money', $payload);

        if (! $res->successful()) {
            throw new RuntimeException("Lenco mobile money charge failed: {$res->status()} {$res->body()}");
        }

        return $res->json();
    }
}
