<?php

use App\Billing\Models\GatewayWebhookEvent;
use App\Billing\Models\Payment;
use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'borrower']);
    Role::firstOrCreate(['name' => 'investor']);
    Role::firstOrCreate(['name' => 'admin']);
});

it('starts a lenco checkout session for a plan', function () {
    config()->set('billing.driver', 'lenco');
    config()->set('lenco.public_key', 'pub_test_key');
    config()->set('lenco.script_url', 'https://pay.sandbox.lenco.co/v1/inline.js');
    config()->set('lenco.channels', ['card', 'mobile-money']);

    $user = User::factory()->create();
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
        'meta' => ['features' => ['Access to platform']],
    ]);

    $response = $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post('/billing/start-payment', [
            '_token' => 'test',
            'plan_id' => $plan->id,
            'idempotency_key' => 'idem_test_123456',
        ]);

    $payment = Payment::query()->firstOrFail();

    $response->assertRedirect("/billing/checkout/{$payment->id}");

    $subscription = Subscription::query()->first();

    expect($subscription)->not->toBeNull();
    expect($subscription?->status)->toBe('pending_payment');
    expect($subscription?->gateway)->toBe('lenco');

    expect($payment->status)->toBe('initiated');
    expect($payment->gateway)->toBe('lenco');
    expect($payment->idempotency_key)->toBe('idem_test_123456');
});

it('preselects the requested plan on the billing page', function () {
    $user = User::factory()->create();

    $monthlyPlan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    Plan::create([
        'key' => 'creditco_yearly',
        'name' => 'CreditCo',
        'interval' => 'year',
        'interval_count' => 1,
        'amount' => 1200.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->get("/billing?plan={$monthlyPlan->id}");

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('billing/index')
            ->where('selectedPlanId', $monthlyPlan->id)
        );
});

it('verifies a successful lenco payment and activates the subscription', function () {
    config()->set('billing.driver', 'lenco');
    config()->set('lenco.api_token', 'test_api_token');
    config()->set('lenco.base_url', 'https://api.lenco.co');

    $user = User::factory()->create();
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
        'gateway' => 'lenco',
        'failed_attempts' => 0,
    ]);

    $payment = Payment::create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'amount' => $plan->amount,
        'currency' => $plan->currency,
        'status' => 'initiated',
        'gateway' => 'lenco',
        'gateway_reference' => 'cc_test_reference',
        'idempotency_key' => 'idem_test_123456',
        'meta' => [
            'reference' => 'cc_test_reference',
            'gateway_status' => 'initiated',
        ],
    ]);

    Http::fake([
        'https://api.lenco.co/access/v2/collections/*' => Http::response([
            'status' => 'success',
            'data' => [
                'status' => 'successful',
                'reference' => $payment->gateway_reference,
            ],
        ]),
    ]);

    $response = $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post("/billing/payments/{$payment->id}/verify", [
            '_token' => 'test',
            'reference' => $payment->gateway_reference,
        ]);

    $response->assertRedirect('/billing');
    $response->assertSessionHas('billing.ok', true);

    $payment->refresh();
    $subscription->refresh();

    expect($payment->status)->toBe('paid');
    expect($payment->paid_at)->not->toBeNull();
    expect($subscription->status)->toBe('active');
    expect($subscription->last_payment_at)->not->toBeNull();
    expect($subscription->renews_at)->not->toBeNull();
});

it('processes a signed lenco webhook', function () {
    config()->set('lenco.webhook_signing_key', 'test_signing_key');

    $user = User::factory()->create();
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
        'gateway' => 'lenco',
        'failed_attempts' => 0,
    ]);

    $payment = Payment::create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'amount' => $plan->amount,
        'currency' => $plan->currency,
        'status' => 'initiated',
        'gateway' => 'lenco',
        'gateway_reference' => 'cc_webhook_reference',
        'idempotency_key' => 'idem_test_654321',
        'meta' => [
            'reference' => 'cc_webhook_reference',
            'gateway_status' => 'initiated',
        ],
    ]);

    $payload = [
        'event' => 'collection.successful',
        'data' => [
            'id' => 'evt_test_123',
            'reference' => $payment->gateway_reference,
            'status' => 'successful',
        ],
    ];

    $signature = hash_hmac(
        'sha512',
        json_encode($payload),
        'test_signing_key',
    );

    $response = $this->withHeaders([
        'X-Lenco-Signature' => $signature,
    ])->postJson('/webhooks/lenco', $payload);

    $response->assertSuccessful();
    $response->assertJson(['ok' => true]);

    $payment->refresh();
    $subscription->refresh();

    expect($payment->status)->toBe('paid');
    expect($subscription->status)->toBe('active');
    expect(GatewayWebhookEvent::query()->count())->toBe(1);
    expect(GatewayWebhookEvent::query()->first()->processed_at)->not->toBeNull();
});

it('rejects a lenco webhook with an invalid signature', function () {
    config()->set('lenco.webhook_signing_key', 'test_signing_key');

    $response = $this->withHeaders([
        'X-Lenco-Signature' => 'invalid_signature',
    ])->postJson('/webhooks/lenco', [
        'event' => 'collection.successful',
        'data' => ['id' => 'evt_test_bad', 'reference' => 'cc_fake', 'status' => 'successful'],
    ]);

    $response->assertStatus(401);
});

it('ignores a duplicate lenco webhook event', function () {
    config()->set('lenco.webhook_signing_key', 'test_signing_key');

    $payload = [
        'event' => 'collection.successful',
        'data' => ['id' => 'evt_duplicate_123', 'reference' => 'cc_no_match', 'status' => 'successful'],
    ];

    $signature = hash_hmac('sha512', json_encode($payload), 'test_signing_key');

    $headers = ['X-Lenco-Signature' => $signature];

    $this->withHeaders($headers)->postJson('/webhooks/lenco', $payload)->assertSuccessful();

    $response = $this->withHeaders($headers)->postJson('/webhooks/lenco', $payload);

    $response->assertSuccessful();
    $response->assertJson(['ok' => true, 'duplicate' => true]);
    expect(GatewayWebhookEvent::query()->count())->toBe(1);
});

it('verifies a failed lenco payment and marks the subscription as pending', function () {
    config()->set('billing.driver', 'lenco');
    config()->set('lenco.api_token', 'test_api_token');
    config()->set('lenco.base_url', 'https://api.lenco.co');

    $user = User::factory()->create();
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
        'gateway' => 'lenco',
        'failed_attempts' => 0,
    ]);

    $payment = Payment::create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'amount' => $plan->amount,
        'currency' => $plan->currency,
        'status' => 'initiated',
        'gateway' => 'lenco',
        'gateway_reference' => 'cc_failed_reference',
        'idempotency_key' => 'idem_test_failed',
        'meta' => ['reference' => 'cc_failed_reference', 'gateway_status' => 'initiated'],
    ]);

    Http::fake([
        'https://api.lenco.co/access/v2/collections/*' => Http::response([
            'status' => 'success',
            'data' => ['status' => 'failed', 'reference' => $payment->gateway_reference],
        ]),
    ]);

    $response = $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post("/billing/payments/{$payment->id}/verify", [
            '_token' => 'test',
            'reference' => $payment->gateway_reference,
        ]);

    $response->assertRedirect('/billing');
    $response->assertSessionHas('billing.ok', false);

    $payment->refresh();
    $subscription->refresh();

    expect($payment->status)->toBe('failed');
    expect($subscription->status)->toBe('pending_payment');
});

it('keeps the payment pending when lenco verification is unauthorized', function () {
    config()->set('billing.driver', 'lenco');
    config()->set('lenco.api_token', 'wrong_api_token');
    config()->set('lenco.base_url', 'https://api.lenco.co');

    $user = User::factory()->create();
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
        'gateway' => 'lenco',
        'failed_attempts' => 0,
    ]);

    $payment = Payment::create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'amount' => $plan->amount,
        'currency' => $plan->currency,
        'status' => 'initiated',
        'gateway' => 'lenco',
        'gateway_reference' => 'cc_unauthorized_reference',
        'idempotency_key' => 'idem_test_unauthorized',
        'meta' => [
            'reference' => 'cc_unauthorized_reference',
            'gateway_status' => 'initiated',
        ],
    ]);

    Http::fake([
        'https://api.lenco.co/access/v2/collections/*' => Http::response([
            'status' => false,
            'errorCode' => '09',
            'message' => 'Unauthorized',
            'data' => null,
        ], 401),
    ]);

    $response = $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post("/billing/payments/{$payment->id}/verify", [
            '_token' => 'test',
            'reference' => $payment->gateway_reference,
        ]);

    $response->assertRedirect('/billing');
    $response->assertSessionHas('billing.ok', false);
    $response->assertSessionHas('billing.data.gateway_status', 'pending');
    $response->assertSessionHas(
        'billing.message',
        'Lenco accepted the payment, but automatic verification was rejected by the gateway. Check LENCO_API_TOKEN and keep the payment pending until the webhook confirms it.',
    );

    $payment->refresh();
    $subscription->refresh();

    expect($payment->status)->toBe('pending');
    expect($payment->meta['gateway_status'])->toBe('pending');
    expect($payment->meta['verification_error'])->toContain('Unauthorized');
    expect($subscription->status)->toBe('pending_payment');
});

it('returns the cached response when the same idempotency key is used twice', function () {
    config()->set('billing.driver', 'lenco');
    config()->set('lenco.public_key', 'pub_test_key');

    $user = User::factory()->create();
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    $idempotencyKey = 'idem_duplicate_key_test';

    $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post('/billing/start-payment', ['_token' => 'test', 'plan_id' => $plan->id, 'idempotency_key' => $idempotencyKey]);

    $firstPaymentCount = Payment::query()->count();

    $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post('/billing/start-payment', ['_token' => 'test', 'plan_id' => $plan->id, 'idempotency_key' => $idempotencyKey]);

    expect(Payment::query()->count())->toBe($firstPaymentCount);
});

it('redirects an unsubscribed borrower from the dashboard to billing', function () {
    $user = User::factory()->create();
    $user->assignRole('borrower');

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertRedirect('/billing');
});

it('does not gate non-borrowers behind a subscription', function () {
    $investor = User::factory()->create();
    $investor->assignRole('investor');

    $this->actingAs($investor)->get('/dashboard')->assertSuccessful();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/dashboard')->assertSuccessful();
});

it('allows a subscribed user to access the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('borrower');
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'gateway' => 'lenco',
        'starts_at' => now(),
        'renews_at' => now()->addMonth(),
        'failed_attempts' => 0,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertSuccessful();
});

it('allows a user in grace period to access the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('borrower');
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'past_due',
        'gateway' => 'lenco',
        'grace_ends_at' => now()->addDays(3),
        'failed_attempts' => 1,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertSuccessful();
});

it('blocks a user whose grace period has expired from the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('borrower');
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'past_due',
        'gateway' => 'lenco',
        'grace_ends_at' => now()->subDay(),
        'failed_attempts' => 1,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertRedirect('/billing');
});
