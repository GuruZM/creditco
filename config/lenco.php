<?php

$lencoEnv = env('LENCO_ENV', 'sandbox');
$lencoApiToken = env('LENCO_API_TOKEN');

return [
    'env' => $lencoEnv,

    'base_url' => 'https://api.lenco.co',

    'public_key' => env('LENCO_PUBLIC_KEY'),
    'api_token' => $lencoApiToken,

    'currency' => env('LENCO_CURRENCY', 'ZMW'),

    'channels' => ['card', 'mobile-money'],

    'script_url' => $lencoEnv === 'production'
        ? 'https://pay.lenco.co/js/v1/inline.js'
        : 'https://pay.sandbox.lenco.co/js/v1/inline.js',

    'webhook_path' => '/webhooks/lenco',

    'webhook_signing_key' => env('LENCO_WEBHOOK_SECRET')
        ?: ($lencoApiToken ? hash('sha256', (string) $lencoApiToken) : null),
];
