<?php

use App\Billing\Models\Payment;
use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

function makePopPlan(): Plan
{
    return Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
        'meta' => ['features' => ['Access to platform']],
    ]);
}

function makeAdmin(): User
{
    Role::firstOrCreate(['name' => 'admin']);
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    return $admin;
}

it('lets a user upload a proof of payment to start a subscription', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $plan = makePopPlan();

    $file = UploadedFile::fake()->image('receipt.jpg', 600, 800);

    $response = $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post('/billing/proof-of-payment', [
            '_token' => 'test',
            'plan_id' => $plan->id,
            'reference' => 'TRX-9281',
            'note' => 'Paid Friday afternoon',
            'proof' => $file,
        ]);

    $response->assertRedirect('/billing');
    $response->assertSessionHas('billing.ok', true);

    $subscription = Subscription::query()->firstOrFail();
    $payment = Payment::query()->firstOrFail();

    expect($subscription->status)->toBe('pending_payment');
    expect($subscription->gateway)->toBe('manual');
    expect($subscription->plan_id)->toBe($plan->id);

    expect($payment->status)->toBe('pending');
    expect($payment->gateway)->toBe('manual');
    expect($payment->pop_reference)->toBe('TRX-9281');
    expect($payment->pop_file_path)->not->toBeNull();
    expect($payment->pop_uploaded_at)->not->toBeNull();
    expect($payment->meta['user_note'])->toBe('Paid Friday afternoon');

    Storage::disk('local')->assertExists($payment->pop_file_path);
});

it('rejects a proof of payment upload without a file', function () {
    $user = User::factory()->create();
    $plan = makePopPlan();

    $response = $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post('/billing/proof-of-payment', [
            '_token' => 'test',
            'plan_id' => $plan->id,
            'reference' => 'TRX-9281',
        ]);

    $response->assertSessionHasErrors('proof');
    expect(Payment::query()->count())->toBe(0);
});

it('rejects a proof of payment upload with the wrong file type', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $plan = makePopPlan();

    $response = $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post('/billing/proof-of-payment', [
            '_token' => 'test',
            'plan_id' => $plan->id,
            'reference' => 'TRX-9281',
            'proof' => UploadedFile::fake()->create('receipt.exe', 100, 'application/octet-stream'),
        ]);

    $response->assertSessionHasErrors('proof');
});

it('lets a user resubmit a proof after rejection', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $plan = makePopPlan();

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
        'gateway' => 'manual',
        'failed_attempts' => 0,
    ]);

    Payment::create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'amount' => $plan->amount,
        'currency' => $plan->currency,
        'status' => 'failed',
        'gateway' => 'manual',
        'gateway_reference' => 'pop_old_ref',
        'idempotency_key' => 'pop_old',
        'pop_file_path' => 'pops/'.$user->id.'/old.jpg',
        'pop_reference' => 'OLD-REF',
        'pop_uploaded_at' => now()->subDay(),
        'pop_reviewed_at' => now()->subHours(2),
        'pop_rejection_reason' => 'Receipt is unreadable',
    ]);

    $response = $this->actingAs($user)
        ->withSession(['_token' => 'test'])
        ->from('/billing')
        ->post('/billing/proof-of-payment', [
            '_token' => 'test',
            'plan_id' => $plan->id,
            'reference' => 'TRX-NEW',
            'proof' => UploadedFile::fake()->image('better.jpg'),
        ]);

    $response->assertRedirect('/billing');

    expect(Payment::query()->count())->toBe(2);
    $latest = Payment::query()->latest('id')->first();
    expect($latest->status)->toBe('pending');
    expect($latest->pop_reference)->toBe('TRX-NEW');
});

it('lets an admin approve a proof of payment and activate the subscription', function () {
    Storage::fake('local');

    $admin = makeAdmin();
    $user = User::factory()->create();
    $plan = makePopPlan();

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
        'gateway' => 'manual',
        'failed_attempts' => 0,
    ]);

    $payment = Payment::create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'amount' => $plan->amount,
        'currency' => $plan->currency,
        'status' => 'pending',
        'gateway' => 'manual',
        'gateway_reference' => 'pop_ref_1',
        'idempotency_key' => 'pop_idem_1',
        'pop_file_path' => 'pops/'.$user->id.'/receipt.jpg',
        'pop_reference' => 'TRX-9281',
        'pop_uploaded_at' => now(),
    ]);

    $response = $this->actingAs($admin)
        ->withSession(['_token' => 'test'])
        ->from('/admin/subscriptions')
        ->post("/admin/subscriptions/{$payment->id}/approve", ['_token' => 'test']);

    $response->assertRedirect('/admin/subscriptions');
    $response->assertSessionHas('success');

    $payment->refresh();
    $subscription->refresh();

    expect($payment->status)->toBe('paid');
    expect($payment->paid_at)->not->toBeNull();
    expect($payment->pop_reviewed_at)->not->toBeNull();
    expect($payment->pop_reviewed_by)->toBe($admin->id);

    expect($subscription->status)->toBe('active');
    expect($subscription->starts_at)->not->toBeNull();
    expect($subscription->renews_at)->not->toBeNull();
});

it('lets an admin reject a proof of payment with a reason', function () {
    Storage::fake('local');

    $admin = makeAdmin();
    $user = User::factory()->create();
    $plan = makePopPlan();

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
        'gateway' => 'manual',
        'failed_attempts' => 0,
    ]);

    $payment = Payment::create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'amount' => $plan->amount,
        'currency' => $plan->currency,
        'status' => 'pending',
        'gateway' => 'manual',
        'gateway_reference' => 'pop_ref_2',
        'idempotency_key' => 'pop_idem_2',
        'pop_file_path' => 'pops/'.$user->id.'/receipt.jpg',
        'pop_reference' => 'TRX-1234',
        'pop_uploaded_at' => now(),
    ]);

    $response = $this->actingAs($admin)
        ->withSession(['_token' => 'test'])
        ->from('/admin/subscriptions')
        ->post("/admin/subscriptions/{$payment->id}/reject", [
            '_token' => 'test',
            'reason' => 'Receipt is unreadable; please re-upload a clearer image.',
        ]);

    $response->assertRedirect('/admin/subscriptions');
    $response->assertSessionHas('success');

    $payment->refresh();
    $subscription->refresh();

    expect($payment->status)->toBe('failed');
    expect($payment->pop_rejection_reason)->toBe('Receipt is unreadable; please re-upload a clearer image.');
    expect($payment->pop_reviewed_by)->toBe($admin->id);

    expect($subscription->status)->toBe('pending_payment');
});

it('requires a reason when an admin rejects a proof of payment', function () {
    $admin = makeAdmin();
    $user = User::factory()->create();
    $plan = makePopPlan();

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
        'gateway' => 'manual',
        'failed_attempts' => 0,
    ]);

    $payment = Payment::create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'amount' => $plan->amount,
        'currency' => $plan->currency,
        'status' => 'pending',
        'gateway' => 'manual',
        'gateway_reference' => 'pop_ref_3',
        'idempotency_key' => 'pop_idem_3',
        'pop_file_path' => 'pops/'.$user->id.'/receipt.jpg',
        'pop_reference' => 'TRX-3333',
        'pop_uploaded_at' => now(),
    ]);

    $response = $this->actingAs($admin)
        ->withSession(['_token' => 'test'])
        ->from('/admin/subscriptions')
        ->post("/admin/subscriptions/{$payment->id}/reject", [
            '_token' => 'test',
        ]);

    $response->assertSessionHasErrors('reason');
    expect($payment->fresh()->status)->toBe('pending');
});

it('blocks non-admin users from the subscriptions admin screen', function () {
    Role::firstOrCreate(['name' => 'admin']);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/admin/subscriptions');

    $response->assertForbidden();
});

it('streams the proof of payment file to admins', function () {
    Storage::fake('local');

    $admin = makeAdmin();
    $user = User::factory()->create();
    $plan = makePopPlan();

    Storage::disk('local')->put('pops/'.$user->id.'/receipt.jpg', 'fake-image-bytes');

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
        'gateway' => 'manual',
        'failed_attempts' => 0,
    ]);

    $payment = Payment::create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'amount' => $plan->amount,
        'currency' => $plan->currency,
        'status' => 'pending',
        'gateway' => 'manual',
        'gateway_reference' => 'pop_ref_4',
        'idempotency_key' => 'pop_idem_4',
        'pop_file_path' => 'pops/'.$user->id.'/receipt.jpg',
        'pop_file_original_name' => 'receipt.jpg',
        'pop_reference' => 'TRX-4444',
        'pop_uploaded_at' => now(),
    ]);

    $response = $this->actingAs($admin)->get("/admin/subscriptions/{$payment->id}/file");

    $response->assertOk();
});
