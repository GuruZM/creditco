<?php

namespace App\Billing\Services;

use App\Billing\Contracts\BillingDriver;
use RuntimeException;

class BillingManager
{
    public function driver(?string $driverKey = null): BillingDriver
    {
        $driverKey ??= config('billing.driver', 'manual');
        $drivers = config('billing.drivers', []);

        if (! isset($drivers[$driverKey]['class'])) {
            throw new RuntimeException("Billing driver [$driverKey] not configured.");
        }

        $class = $drivers[$driverKey]['class'];

        return app($class);
    }

    public function subscriptions(): SubscriptionManager
    {
        return app(SubscriptionManager::class);
    }
}
