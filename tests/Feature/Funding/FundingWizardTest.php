<?php

use App\Models\Borrower;
use App\Models\BorrowerPayoutMethod;
use App\Models\Coin;
use App\Models\CoinInterest;
use App\Models\User;
use App\Notifications\PayoutAwaitingVerification;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'borrower']);
    Role::firstOrCreate(['name' => 'investor']);
});

function makeWizardAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    return $admin;
}

function coinWithAgreedTerms(Borrower $borrower, float $principal = 90000): Coin
{
    $rate = 12.0;
    $days = 90;
    $count = 3;
    $totals = Coin::computeRepayment($principal, $rate, $days, $count, 1.0);

    return Coin::create([
        'borrower_id' => $borrower->id,
        'request' => 'Inventory',
        'date' => '2026-05-01',
        'request_amount' => $principal,
        'duration' => '3 months',
        'industry' => 'agriculture',
        'status' => 'approved',
        'interest_rate' => $rate,
        'service_fee_percent' => 1.0,
        'duration_days' => $days,
        'installments_count' => $count,
        'installment_interval_days' => 30,
        'total_repayment_amount' => $totals['total'],
        'installment_amount' => $totals['installment'],
        'terms_set_at' => now(),
        'borrower_agreed_to_terms_at' => now(),
    ]);
}

function makeWizardScenario(string $startingStatus = 'awaiting_admin_funding'): array
{
    $admin = makeWizardAdmin();

    $borrowerUser = User::factory()->create();
    $borrowerUser->assignRole('borrower');

    $borrower = Borrower::create([
        'user_id' => $borrowerUser->id,
        'company_name' => 'Acme Holdings',
        'company_registration_number' => '123',
        'company_type' => 'limited',
        'years_in_operation' => 3,
        'industry' => 'agriculture',
        'contact_name' => $borrowerUser->name,
        'contact_email' => $borrowerUser->email,
        'contact_phone' => '+260000000000',
        'status' => 'verified',
    ]);

    $payoutMethod = BorrowerPayoutMethod::create([
        'borrower_id' => $borrower->id,
        'kind' => 'bank',
        'account_name' => 'Acme Holdings Ltd',
        'bank_name' => 'Zanaco',
        'account_number' => '1234567890',
        'borrower_confirmed_at' => now(),
    ]);

    $coin = coinWithAgreedTerms($borrower);

    $investorUser = User::factory()->create();
    $investorUser->assignRole('investor');

    $interest = CoinInterest::create([
        'coin_id' => $coin->id,
        'user_id' => $investorUser->id,
        'investor_agreed_to_terms_at' => now(),
        'funding_status' => $startingStatus,
        'funding_started_at' => now(),
    ]);

    return compact('admin', 'borrower', 'payoutMethod', 'coin', 'interest', 'investorUser');
}

it('renders the wizard page with the borrower payout method and coin terms', function () {
    [
        'admin' => $admin,
        'coin' => $coin,
        'interest' => $interest,
    ] = makeWizardScenario();

    $response = $this->actingAs($admin)
        ->get("/admin/coins/{$coin->id}/interests/{$interest->id}/funding");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/funding-wizard/index')
        ->where('coin.id', $coin->id)
        ->where('interest.funding_status', 'awaiting_admin_funding')
        ->where('payout_method.bank_name', 'Zanaco'),
    );

    $rendered = $response->viewData('page')['props']['coin']['terms'];
    expect((float) $rendered['interest_rate'])->toBe(12.0);
});

it('verifies the payout details and stamps the payout method', function () {
    [
        'admin' => $admin,
        'coin' => $coin,
        'interest' => $interest,
        'payoutMethod' => $payoutMethod,
    ] = makeWizardScenario();

    $response = $this->actingAs($admin)
        ->from("/admin/coins/{$coin->id}/interests/{$interest->id}/funding")
        ->post("/admin/coins/{$coin->id}/interests/{$interest->id}/funding/verify-payout");

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $payoutMethod->refresh();
    $interest->refresh();

    expect($payoutMethod->admin_verified_at)->not->toBeNull();
    expect($payoutMethod->admin_verified_by)->toBe($admin->id);
    expect($interest->funding_status)->toBe('payout_verified');
});

it('refuses to verify payout when the borrower has not confirmed', function () {
    [
        'admin' => $admin,
        'coin' => $coin,
        'interest' => $interest,
        'payoutMethod' => $payoutMethod,
    ] = makeWizardScenario('funding_initiated');

    $payoutMethod->update(['borrower_confirmed_at' => null]);

    $response = $this->actingAs($admin)
        ->from("/admin/coins/{$coin->id}/interests/{$interest->id}/funding")
        ->post("/admin/coins/{$coin->id}/interests/{$interest->id}/funding/verify-payout");

    $response->assertSessionHas('error');
    expect($interest->fresh()->funding_status)->toBe('funding_initiated');
});

it('records funding using the coin terms and starts the repayment countdown', function () {
    [
        'admin' => $admin,
        'coin' => $coin,
        'interest' => $interest,
    ] = makeWizardScenario('payout_verified');

    $response = $this->actingAs($admin)
        ->from("/admin/coins/{$coin->id}/interests/{$interest->id}/funding")
        ->post("/admin/coins/{$coin->id}/interests/{$interest->id}/funding/disburse");

    $response->assertRedirect();
    $interest->refresh();

    expect($interest->funding_status)->toBe('funded');
    expect((float) $interest->funded_amount)->toBe(90000.0);
    expect($interest->installments_count)->toBe(3);
    expect((float) $interest->installment_amount)->toBe((float) $coin->installment_amount);
    expect($interest->installment_interval_days)->toBe(30);
    expect($interest->next_payment_due_at)->not->toBeNull();
});

it('refuses to disburse before payout is verified', function () {
    [
        'admin' => $admin,
        'coin' => $coin,
        'interest' => $interest,
    ] = makeWizardScenario('awaiting_admin_funding');

    $response = $this->actingAs($admin)
        ->from("/admin/coins/{$coin->id}/interests/{$interest->id}/funding")
        ->post("/admin/coins/{$coin->id}/interests/{$interest->id}/funding/disburse");

    $response->assertSessionHas('error');
    expect($interest->fresh()->funding_status)->toBe('awaiting_admin_funding');
});

it('notifies admins when the borrower confirms payout details', function () {
    Notification::fake();

    $admin = makeWizardAdmin();

    $borrowerUser = User::factory()->create();
    $borrowerUser->assignRole('borrower');

    \App\Billing\Models\Plan::firstOrCreate(
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
    \App\Billing\Models\Subscription::create([
        'user_id' => $borrowerUser->id,
        'plan_id' => \App\Billing\Models\Plan::first()->id,
        'status' => 'active',
        'gateway' => 'lenco',
        'starts_at' => now(),
        'renews_at' => now()->addMonth(),
        'failed_attempts' => 0,
    ]);

    $borrower = Borrower::create([
        'user_id' => $borrowerUser->id,
        'company_name' => 'Acme',
        'company_registration_number' => '123',
        'company_type' => 'limited',
        'years_in_operation' => 3,
        'industry' => 'agriculture',
        'contact_name' => $borrowerUser->name,
        'contact_email' => $borrowerUser->email,
        'contact_phone' => '+260000000000',
        'status' => 'verified',
    ]);

    BorrowerPayoutMethod::create([
        'borrower_id' => $borrower->id,
        'kind' => 'bank',
        'account_name' => 'Acme',
        'bank_name' => 'Zanaco',
        'account_number' => '1234567890',
    ]);

    $coin = coinWithAgreedTerms($borrower, 50000);

    $investor = User::factory()->create();
    $investor->assignRole('investor');

    CoinInterest::create([
        'coin_id' => $coin->id,
        'user_id' => $investor->id,
        'funding_status' => 'funding_initiated',
        'funding_started_at' => now(),
    ]);

    $this->actingAs($borrowerUser)
        ->from('/borrower/payout-method')
        ->post('/borrower/payout-method/confirm');

    Notification::assertSentTo($admin, PayoutAwaitingVerification::class);
});
