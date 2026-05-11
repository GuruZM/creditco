<?php

use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use App\Models\Borrower;
use App\Models\Coin;
use App\Models\User;
use App\Notifications\TermsAwaitingBorrowerAgreement;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'borrower']);
});

function ensureBorrowerSubscription(User $user): void
{
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
}

function makeBorrowerCoin(): array
{
    $borrowerUser = User::factory()->create();
    $borrowerUser->assignRole('borrower');
    ensureBorrowerSubscription($borrowerUser);

    $borrower = Borrower::create([
        'user_id' => $borrowerUser->id,
        'company_name' => 'Acme',
        'company_registration_number' => '123',
        'company_type' => 'limited',
        'years_in_operation' => 3,
        'industry' => 'retail',
        'contact_name' => $borrowerUser->name,
        'contact_email' => $borrowerUser->email,
        'contact_phone' => '+260000000000',
        'status' => 'verified',
    ]);

    $coin = Coin::create([
        'borrower_id' => $borrower->id,
        'request' => 'Working capital',
        'date' => '2026-05-01',
        'request_amount' => 10000,
        'duration' => '90 days',
        'industry' => 'retail',
        'status' => 'pending_review',
    ]);

    return [$borrowerUser, $borrower, $coin];
}

it('admin approve computes total repayment + installment amount from interest rate', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    [$borrowerUser, , $coin] = makeBorrowerCoin();

    $this->actingAs($admin)
        ->post("/admin/coins/{$coin->id}/approve", [
            'interest_rate' => 12.0,
            'service_fee_percent' => 1.0,
            'duration_days' => 90,
            'installments_count' => 3,
            'installment_interval_days' => 30,
        ])
        ->assertRedirect();

    $coin->refresh();
    // simple interest: 10000 * 12% * (90/365) = 295.89; +1% fee = 100. total = 10395.89
    expect((float) $coin->total_repayment_amount)->toBe(10395.89);
    expect((float) $coin->installment_amount)->toBe(round(10395.89 / 3, 2));

    Notification::assertSentTo($borrowerUser, TermsAwaitingBorrowerAgreement::class);
});

it('borrower can agree to the commercial terms', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    [$borrowerUser, , $coin] = makeBorrowerCoin();

    $this->actingAs($admin)
        ->post("/admin/coins/{$coin->id}/approve", [
            'interest_rate' => 12.0,
            'service_fee_percent' => 1.0,
            'duration_days' => 90,
            'installments_count' => 3,
            'installment_interval_days' => 30,
        ]);

    $this->actingAs($borrowerUser)
        ->from('/borrower/coins')
        ->post("/borrower/coins/{$coin->id}/agree-terms", ['agreed' => true])
        ->assertRedirect();

    expect($coin->fresh()->borrower_agreed_to_terms_at)->not->toBeNull();
});

it('borrower agreement requires the agreed flag', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    [$borrowerUser, , $coin] = makeBorrowerCoin();

    $this->actingAs($admin)
        ->post("/admin/coins/{$coin->id}/approve", [
            'interest_rate' => 12.0,
            'service_fee_percent' => 1.0,
            'duration_days' => 90,
            'installments_count' => 3,
            'installment_interval_days' => 30,
        ]);

    $response = $this->actingAs($borrowerUser)
        ->from('/borrower/coins')
        ->post("/borrower/coins/{$coin->id}/agree-terms", []);

    $response->assertSessionHasErrors('agreed');
    expect($coin->fresh()->borrower_agreed_to_terms_at)->toBeNull();
});

it('admin updateTerms clears the borrower agreement so they must re-agree', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    [$borrowerUser, , $coin] = makeBorrowerCoin();

    $this->actingAs($admin)
        ->post("/admin/coins/{$coin->id}/approve", [
            'interest_rate' => 12.0,
            'service_fee_percent' => 1.0,
            'duration_days' => 90,
            'installments_count' => 3,
            'installment_interval_days' => 30,
        ]);

    $this->actingAs($borrowerUser)
        ->post("/borrower/coins/{$coin->id}/agree-terms", ['agreed' => true]);

    expect($coin->fresh()->borrower_agreed_to_terms_at)->not->toBeNull();

    $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/terms", [
            'interest_rate' => 18.0,
            'service_fee_percent' => 1.0,
            'duration_days' => 90,
            'installments_count' => 3,
            'installment_interval_days' => 30,
        ])
        ->assertRedirect();

    $coin->refresh();
    expect((float) $coin->interest_rate)->toBe(18.0);
    expect($coin->borrower_agreed_to_terms_at)->toBeNull();
});

it('only borrower owner can agree to the terms', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    [, , $coin] = makeBorrowerCoin();

    $this->actingAs($admin)
        ->post("/admin/coins/{$coin->id}/approve", [
            'interest_rate' => 12.0,
            'service_fee_percent' => 1.0,
            'duration_days' => 90,
            'installments_count' => 3,
            'installment_interval_days' => 30,
        ]);

    [$otherBorrowerUser] = makeBorrowerCoin();

    $this->actingAs($otherBorrowerUser)
        ->post("/borrower/coins/{$coin->id}/agree-terms", ['agreed' => true])
        ->assertNotFound();
});
