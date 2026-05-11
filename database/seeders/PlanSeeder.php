<?php

namespace Database\Seeders;

use App\Billing\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currency = config('billing.currency', 'ZMW');

        $plans = [
            [
                'key' => 'creditco_monthly',
                'name' => 'CreditCo',
                'interval' => 'month',
                'interval_count' => 1,
                'amount' => 150.00,
                'currency' => $currency,
                'is_active' => true,
                'meta' => [
                    'features' => [
                        'Access to platform',
                        'Create/view coins',
                        'Basic support',
                    ],
                ],
            ],
            [
                'key' => 'creditco_quarterly',
                'name' => 'CreditCo',
                'interval' => 'quarter',
                'interval_count' => 1,
                'amount' => 400.00,
                'currency' => $currency,
                'is_active' => true,
                'meta' => [
                    'features' => [
                        'Access to platform',
                        'Create/view coins',
                        'Priority review',
                        'Standard support',
                    ],
                ],
            ],
            [
                'key' => 'creditco_yearly',
                'name' => 'CreditCo',
                'interval' => 'year',
                'interval_count' => 1,
                'amount' => 1500.00,
                'currency' => $currency,
                'is_active' => true,
                'meta' => [
                    'features' => [
                        'Access to platform',
                        'Create/view coins',
                        'Fast-track verification',
                        'Premium support',
                    ],
                ],
            ],
        ];

        foreach ($plans as $data) {
            Plan::updateOrCreate(
                ['key' => $data['key']],
                $data
            );
        }
    }
}
