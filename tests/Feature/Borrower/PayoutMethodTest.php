<?php

use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use App\Models\Borrower;
use App\Models\BorrowerPayoutMethod;
use App\Models\Coin;
use App\Models\CoinInterest;
use App\Models\User;
use App\Notifications\PayoutMethodNeedsVerification;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'borrower']);
    Role::firstOrCreate(['name' => 'investor']);
    Role::firstOrCreate(['name' => 'admin']);
});

function makeBorrowerWithSubscription(): Borrower
{
    $user = User::factory()->create();
    $user->assignRole('borrower');

    $plan = Plan::firstOrCreate(
        ['key' => 'creditco_monthly'],
        [
            'name' => 'CreditCo',
            'interval' => 'month',
            'interval_count' => 1,
            'amount' => 150,
            'currency' => 'ZMW',
            'is_active' => true,
        ],
    );
    Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'gateway' => 'lenco',
        'starts_at' => now(),
        'renews_at' => now()->addMonth(),
        'failed_attempts' => 0,
    ]);

    return Borrower::create([
        'user_id' => $user->id,
        'company_name' => 'Acme',
        'company_registration_number' => '123',
        'company_type' => 'limited',
        'years_in_operation' => 2,
        'industry' => 'agriculture',
        'contact_name' => $user->name,
        'contact_email' => $user->email,
        'contact_phone' => '+260000000000',
        'status' => 'verified',
    ]);
}

it('saves bank payout details and notifies the borrower to verify them', function () {
    Notification::fake();
    $borrower = makeBorrowerWithSubscription();

    $response = $this->actingAs($borrower->user)
        ->from('/borrower/payout-method')
        ->post('/borrower/payout-method', [
            'kind' => 'bank',
            'account_name' => 'Acme Holdings Ltd',
            'bank_name' => 'Zanaco',
            'account_number' => '1234567890',
            'branch' => 'Cairo Road',
        ]);

    $response->assertRedirect('/borrower/payout-method');
    $response->assertSessionHas('success');

    $payoutMethod = BorrowerPayoutMethod::query()->firstOrFail();
    expect($payoutMethod->kind)->toBe('bank');
    expect($payoutMethod->bank_name)->toBe('Zanaco');
    expect($payoutMethod->account_number)->toBe('1234567890');
    expect($payoutMethod->mobile_number)->toBeNull();
    expect($payoutMethod->borrower_confirmed_at)->toBeNull();

    Notification::assertSentTo(
        $borrower->user,
        PayoutMethodNeedsVerification::class,
    );
});

it('saves mobile money payout details', function () {
    $borrower = makeBorrowerWithSubscription();

    $this->actingAs($borrower->user)
        ->from('/borrower/payout-method')
        ->post('/borrower/payout-method', [
            'kind' => 'mobile_money',
            'account_name' => 'Acme Holdings Ltd',
            'mobile_provider' => 'mtn',
            'mobile_number' => '+260971234567',
        ]);

    $payoutMethod = BorrowerPayoutMethod::query()->firstOrFail();
    expect($payoutMethod->kind)->toBe('mobile_money');
    expect($payoutMethod->mobile_provider)->toBe('mtn');
    expect($payoutMethod->mobile_number)->toBe('+260971234567');
    expect($payoutMethod->bank_name)->toBeNull();
});

it('rejects bank payout without bank fields', function () {
    $borrower = makeBorrowerWithSubscription();

    $response = $this->actingAs($borrower->user)
        ->from('/borrower/payout-method')
        ->post('/borrower/payout-method', [
            'kind' => 'bank',
            'account_name' => 'Acme Holdings Ltd',
        ]);

    $response->assertSessionHasErrors(['bank_name', 'account_number']);
});

it('confirms payout details and advances funding-initiated interests', function () {
    $borrower = makeBorrowerWithSubscription();
    $coin = Coin::create([
        'borrower_id' => $borrower->id,
        'request' => 'Cash',
        'date' => '2026-05-01',
        'request_amount' => 25000,
        'duration' => '3 months',
        'industry' => 'agriculture',
        'status' => 'approved',
    ]);
    $investorUser = User::factory()->create();
    $investorUser->assignRole('investor');

    $interest = CoinInterest::create([
        'coin_id' => $coin->id,
        'user_id' => $investorUser->id,
        'funding_status' => 'funding_initiated',
        'funding_started_at' => now(),
    ]);

    BorrowerPayoutMethod::create([
        'borrower_id' => $borrower->id,
        'kind' => 'bank',
        'account_name' => 'Acme Holdings Ltd',
        'bank_name' => 'Zanaco',
        'account_number' => '1234567890',
    ]);

    $response = $this->actingAs($borrower->user)
        ->from('/borrower/payout-method')
        ->post('/borrower/payout-method/confirm');

    $response->assertRedirect('/borrower/payout-method');
    $response->assertSessionHas('success');

    expect($borrower->payoutMethod()->first()->borrower_confirmed_at)
        ->not->toBeNull();
    expect($interest->fresh()->funding_status)->toBe('awaiting_admin_funding');
});

it('refuses to confirm when no payout method exists', function () {
    $borrower = makeBorrowerWithSubscription();

    $response = $this->actingAs($borrower->user)
        ->from('/borrower/payout-method')
        ->post('/borrower/payout-method/confirm');

    $response->assertSessionHas('error');
});

it('resets borrower confirmation when details are edited', function () {
    $borrower = makeBorrowerWithSubscription();
    BorrowerPayoutMethod::create([
        'borrower_id' => $borrower->id,
        'kind' => 'bank',
        'account_name' => 'Old name',
        'bank_name' => 'Zanaco',
        'account_number' => '1234567890',
        'borrower_confirmed_at' => now(),
        'admin_verified_at' => now(),
    ]);

    $this->actingAs($borrower->user)
        ->from('/borrower/payout-method')
        ->post('/borrower/payout-method', [
            'kind' => 'bank',
            'account_name' => 'New name',
            'bank_name' => 'Stanbic',
            'account_number' => '9876543210',
        ]);

    $payoutMethod = $borrower->payoutMethod()->first();
    expect($payoutMethod->account_name)->toBe('New name');
    expect($payoutMethod->bank_name)->toBe('Stanbic');
    expect($payoutMethod->borrower_confirmed_at)->toBeNull();
    expect($payoutMethod->admin_verified_at)->toBeNull();
});
