<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    |
    | This currency is used across plans, subscriptions, and payments.
    | It can be overridden per plan if needed.
    |
    */
    'currency' => 'ZMW',

    /*
    |--------------------------------------------------------------------------
    | Grace Period (Days)
    |--------------------------------------------------------------------------
    |
    | Number of days a user can continue accessing the platform
    | after a failed payment or cancellation.
    |
    */
    'grace_days' => 7,

    /*
    |--------------------------------------------------------------------------
    | Retry Schedule (Days)
    |--------------------------------------------------------------------------
    |
    | Days after a failed billing attempt when the system should retry.
    | Example: [1, 3, 5] means retry after 1 day, then 3, then 5.
    |
    */
    'retry_days' => [1, 3, 5],

    /*
    |--------------------------------------------------------------------------
    | Expiry Warning Notifications (Days)
    |--------------------------------------------------------------------------
    |
    | When to notify users that their subscription is about to end.
    |
    */
    'expiry_warning_days' => [7, 3, 1],

    /*
    |--------------------------------------------------------------------------
    | Paywall Redirect Path
    |--------------------------------------------------------------------------
    |
    | Where users are redirected if they try to access protected
    | routes without an active subscription.
    |
    */
    'paywall_path' => '/billing',

    /*
    |--------------------------------------------------------------------------
    | Default Billing Driver
    |--------------------------------------------------------------------------
    |
    | The billing driver determines how payments are processed.
    | "manual" is the default and works without an external gateway.
    |
    */
    'driver' => env('BILLING_DRIVER', 'lenco'),

    /*
    |--------------------------------------------------------------------------
    | Gateway Availability
    |--------------------------------------------------------------------------
    |
    | When false, the user-facing checkout shows a "Coming soon" notice and
    | only the manual bank-transfer + proof-of-payment flow is available.
    |
    */
    'gateway_enabled' => env('BILLING_GATEWAY_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Bank Transfer Instructions
    |--------------------------------------------------------------------------
    |
    | These details are shown on the billing page when a user is asked to
    | make a manual bank transfer. Update them with real values before
    | going live.
    |
    */
    'bank' => [
        'account_name' => env('BILLING_BANK_ACCOUNT_NAME', 'CreditCo Limited'),
        'bank_name' => env('BILLING_BANK_NAME', 'Zanaco'),
        'account_number' => env('BILLING_BANK_ACCOUNT_NUMBER', '0000000000000'),
        'branch' => env('BILLING_BANK_BRANCH', 'Lusaka Main Branch'),
        'swift_code' => env('BILLING_BANK_SWIFT', 'ZNCOZMLU'),
        'reference_hint' => env(
            'BILLING_BANK_REFERENCE_HINT',
            'Use your account email as the transfer reference.'
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Proof of Payment Upload Rules
    |--------------------------------------------------------------------------
    */
    'pop' => [
        'disk' => env('BILLING_POP_DISK', 'local'),
        'directory' => 'pops',
        'max_kb' => 5120, // 5 MB
        'mimes' => ['jpg', 'jpeg', 'png', 'pdf'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Available Billing Drivers
    |--------------------------------------------------------------------------
    |
    | Drivers are resolved via the BillingManager.
    | Each driver must implement App\Billing\Contracts\BillingDriver.
    |
    */
    'drivers' => [

        'manual' => [
            'class' => App\Billing\Drivers\ManualDriver::class,
        ],

        'lenco' => [
            'class' => App\Billing\Drivers\LencoDriver::class,
        ],

        /*
        |--------------------------------------------------------------------------
        | Example future gateway
        |--------------------------------------------------------------------------
        |
        | 'your_gateway' => [
        |     'class' => App\Billing\Drivers\YourGatewayDriver::class,
        | ],
        |
        */
    ],

];
