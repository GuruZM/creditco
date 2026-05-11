<?php

use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use App\Models\Borrower;
use App\Models\Coin;
use App\Models\CoinInterest;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'investor']);
    Role::firstOrCreate(['name' => 'borrower']);
});

function approvedCoin(): Coin
{
    $borrowerUser = User::factory()->create();
    $borrowerUser->assignRole('borrower');

    $borrower = Borrower::create([
        'user_id' => $borrowerUser->id,
        'company_name' => 'Acme Holdings',
        'company_registration_number' => '123456',
        'company_type' => 'limited',
        'years_in_operation' => 3,
        'industry' => 'agriculture',
        'contact_name' => $borrowerUser->name,
        'contact_email' => $borrowerUser->email,
        'contact_phone' => '+260000000000',
        'status' => 'verified',
    ]);

    return Coin::create([
        'borrower_id' => $borrower->id,
        'request' => 'Inventory',
        'date' => '2026-05-01',
        'request_amount' => 50000,
        'duration' => '3 months',
        'industry' => 'agriculture',
        'status' => 'approved',
        'interest_rate' => 12.0,
        'service_fee_percent' => 1.0,
        'duration_days' => 90,
        'installments_count' => 3,
        'installment_interval_days' => 30,
        'total_repayment_amount' => 51980.82,
        'installment_amount' => 17326.94,
        'terms_set_at' => now(),
        'borrower_agreed_to_terms_at' => now(),
    ]);
}

function investor(): User
{
    $user = User::factory()->create();
    $user->assignRole('investor');

    return $user;
}

it('records investor interest with terms agreement', function () {
    $investor = investor();
    $coin = approvedCoin();

    $response = $this->actingAs($investor)
        ->from('/investor/coins')
        ->post("/investor/coins/{$coin->id}/interest", [
            'note' => 'Reach out for more details.',
            'agreed' => true,
        ]);

    $response->assertRedirect('/investor/coins');
    $response->assertSessionHas('success');

    $interest = CoinInterest::query()->firstOrFail();
    expect($interest->coin_id)->toBe($coin->id);
    expect($interest->user_id)->toBe($investor->id);
    expect($interest->note)->toBe('Reach out for more details.');
    expect($interest->investor_agreed_to_terms_at)->not->toBeNull();
});

it('rejects interest without terms agreement', function () {
    $investor = investor();
    $coin = approvedCoin();

    $response = $this->actingAs($investor)
        ->from('/investor/coins')
        ->post("/investor/coins/{$coin->id}/interest", [
            'note' => 'No agreement here.',
        ]);

    $response->assertSessionHasErrors('agreed');
    expect(CoinInterest::query()->count())->toBe(0);
});

it('does not double-record interest from the same investor', function () {
    $investor = investor();
    $coin = approvedCoin();

    $this->actingAs($investor)
        ->from('/investor/coins')
        ->post("/investor/coins/{$coin->id}/interest", ['agreed' => true]);

    $this->actingAs($investor)
        ->from('/investor/coins')
        ->post("/investor/coins/{$coin->id}/interest", ['agreed' => true]);

    expect(CoinInterest::query()->count())->toBe(1);
});

it('rejects interest in a non-approved coin', function () {
    $investor = investor();
    $coin = approvedCoin();
    $coin->update(['status' => 'pending_review']);

    $response = $this->actingAs($investor)
        ->from('/investor/coins')
        ->post("/investor/coins/{$coin->id}/interest", ['agreed' => true]);

    $response->assertSessionHas('error');
    expect(CoinInterest::query()->count())->toBe(0);
});

it('hides coins where the borrower has not yet agreed to terms', function () {
    $investor = investor();
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
        'user_id' => $investor->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'gateway' => 'lenco',
        'starts_at' => now(),
        'renews_at' => now()->addMonth(),
        'failed_attempts' => 0,
    ]);

    $coin = approvedCoin();
    $coin->update(['borrower_agreed_to_terms_at' => null]);

    $response = $this->actingAs($investor)->get('/investor/coins');
    $response->assertSuccessful();
    $rendered = $response->viewData('page')['props']['coins']['data'];
    expect($rendered)->toHaveCount(0);
});

it('exposes is_interested + interests_count + terms in the investor index', function () {
    $investor = investor();
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
        'user_id' => $investor->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'gateway' => 'lenco',
        'starts_at' => now(),
        'renews_at' => now()->addMonth(),
        'failed_attempts' => 0,
    ]);

    $coin = approvedCoin();
    CoinInterest::create([
        'coin_id' => $coin->id,
        'user_id' => $investor->id,
    ]);

    $response = $this->actingAs($investor)->get('/investor/coins');
    $response->assertSuccessful();

    $rendered = $response->viewData('page')['props']['coins']['data'];
    expect($rendered)->toHaveCount(1);
    expect($rendered[0]['is_interested'])->toBeTrue();
    expect($rendered[0]['interests_count'])->toBe(1);
    expect((float) $rendered[0]['terms']['interest_rate'])->toBe(12.0);
    expect((float) $rendered[0]['terms']['installment_amount'])->toBe(17326.94);
});
