<?php

use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use App\Models\Borrower;
use App\Models\Coin;
use App\Models\CoinInterest;
use App\Models\CoinRepayment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'borrower']);
    Role::firstOrCreate(['name' => 'investor']);
    Storage::fake('local');
});

function activeSubscription(User $user): void
{
    $plan = Plan::firstOrCreate(
        ['key' => 'creditco_monthly'],
        [
            'name' => 'CreditCo',
            'interval' => 'month',
            'interval_count' => 1,
            'amount' => 150.00,
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

function fundedInterest(): array
{
    $borrowerUser = User::factory()->create();
    $borrowerUser->assignRole('borrower');
    activeSubscription($borrowerUser);

    $borrower = Borrower::create([
        'user_id' => $borrowerUser->id,
        'company_name' => 'Acme Co',
        'company_registration_number' => 'CR123456',
        'company_type' => 'PLC',
        'years_in_operation' => 5,
        'industry' => 'Retail',
        'contact_name' => 'Acme Contact',
        'contact_email' => 'acme@example.com',
        'contact_phone' => '+260000000000',
        'status' => 'verified',
    ]);

    $investorUser = User::factory()->create();
    $investorUser->assignRole('investor');

    $coin = Coin::create([
        'borrower_id' => $borrower->id,
        'request' => 'Working capital',
        'date' => now()->toDateString(),
        'request_amount' => 5000.00,
        'duration' => '90 days',
        'industry' => 'Retail',
        'status' => 'approved',
    ]);

    $interest = CoinInterest::create([
        'coin_id' => $coin->id,
        'user_id' => $investorUser->id,
        'funding_status' => 'funded',
        'funded_at' => now()->subDays(2),
        'funded_amount' => 5000.00,
        'installments_count' => 3,
        'installment_amount' => 1666.67,
        'installment_interval_days' => 30,
        'next_payment_due_at' => now()->addDays(30),
        'installments_paid' => 0,
    ]);

    return [$borrowerUser, $borrower, $investorUser, $interest];
}

test('borrower can submit a repayment proof', function () {
    [$borrowerUser, , , $interest] = fundedInterest();

    $this->actingAs($borrowerUser)
        ->post('/borrower/repayments', [
            'coin_interest_id' => $interest->id,
            'amount' => 1666.67,
            'paid_at' => now()->toDateString(),
            'reference' => 'TX12345',
            'note' => 'paid via mobile money',
            'proof' => UploadedFile::fake()->image('receipt.jpg'),
        ])
        ->assertRedirect();

    $repayment = CoinRepayment::query()->where('coin_interest_id', $interest->id)->first();
    expect($repayment)->not->toBeNull();
    expect($repayment->status)->toBe('pending_verification');
    expect($repayment->installment_number)->toBe(1);
    expect($repayment->proof_path)->not->toBeNull();
});

test('borrower cannot submit twice while one is pending', function () {
    [$borrowerUser, , , $interest] = fundedInterest();

    CoinRepayment::create([
        'coin_interest_id' => $interest->id,
        'submitted_by' => $borrowerUser->id,
        'installment_number' => 1,
        'amount' => 1666.67,
        'currency' => 'ZMW',
        'paid_at' => now()->toDateString(),
        'status' => 'pending_verification',
        'proof_path' => 'pops/dummy.jpg',
    ]);

    $this->actingAs($borrowerUser)
        ->from('/borrower/repayments')
        ->post('/borrower/repayments', [
            'coin_interest_id' => $interest->id,
            'amount' => 1666.67,
            'paid_at' => now()->toDateString(),
            'proof' => UploadedFile::fake()->image('receipt2.jpg'),
        ])
        ->assertRedirect('/borrower/repayments');

    expect(CoinRepayment::where('coin_interest_id', $interest->id)->count())->toBe(1);
});

test('admin approval advances the repayment schedule', function () {
    [$borrowerUser, , , $interest] = fundedInterest();
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $repayment = CoinRepayment::create([
        'coin_interest_id' => $interest->id,
        'submitted_by' => $borrowerUser->id,
        'installment_number' => 1,
        'amount' => 1666.67,
        'currency' => 'ZMW',
        'paid_at' => now()->toDateString(),
        'status' => 'pending_verification',
        'proof_path' => 'pops/dummy.jpg',
    ]);

    $originalDue = $interest->next_payment_due_at;

    $this->actingAs($admin)
        ->post("/admin/repayments/{$repayment->id}/approve")
        ->assertRedirect();

    $repayment->refresh();
    $interest->refresh();

    expect($repayment->status)->toBe('verified');
    expect((int) $interest->installments_paid)->toBe(1);
    expect($interest->next_payment_due_at->toDateString())
        ->toBe($originalDue->copy()->addDays(30)->toDateString());
});

test('approving the final installment marks the loan repaid and clears next due', function () {
    [$borrowerUser, , , $interest] = fundedInterest();
    $interest->update(['installments_paid' => 2]); // last one remaining
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $repayment = CoinRepayment::create([
        'coin_interest_id' => $interest->id,
        'submitted_by' => $borrowerUser->id,
        'installment_number' => 3,
        'amount' => 1666.67,
        'currency' => 'ZMW',
        'paid_at' => now()->toDateString(),
        'status' => 'pending_verification',
        'proof_path' => 'pops/dummy.jpg',
    ]);

    $this->actingAs($admin)
        ->post("/admin/repayments/{$repayment->id}/approve")
        ->assertRedirect();

    $interest->refresh();

    expect((int) $interest->installments_paid)->toBe(3);
    expect($interest->next_payment_due_at)->toBeNull();
    expect($interest->funding_status)->toBe('repaid');
});

test('admin can reject a repayment with a reason', function () {
    [$borrowerUser, , , $interest] = fundedInterest();
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $repayment = CoinRepayment::create([
        'coin_interest_id' => $interest->id,
        'submitted_by' => $borrowerUser->id,
        'installment_number' => 1,
        'amount' => 1666.67,
        'currency' => 'ZMW',
        'paid_at' => now()->toDateString(),
        'status' => 'pending_verification',
        'proof_path' => 'pops/dummy.jpg',
    ]);

    $this->actingAs($admin)
        ->post("/admin/repayments/{$repayment->id}/reject", [
            'reason' => 'Proof unreadable; please re-upload.',
        ])
        ->assertRedirect();

    $repayment->refresh();
    $interest->refresh();

    expect($repayment->status)->toBe('rejected');
    expect($repayment->rejection_reason)->toBe('Proof unreadable; please re-upload.');
    expect((int) $interest->installments_paid)->toBe(0);
});
