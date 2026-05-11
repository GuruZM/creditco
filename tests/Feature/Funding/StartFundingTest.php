<?php

use App\Models\Borrower;
use App\Models\Coin;
use App\Models\CoinInterest;
use App\Models\User;
use App\Notifications\FundingInitiated;
use App\Notifications\InvestorExpressedInterest;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'borrower']);
    Role::firstOrCreate(['name' => 'investor']);
});

function makeFundingAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

function makeInvestor(): User
{
    $user = User::factory()->create();
    $user->assignRole('investor');

    return $user;
}

function makeApprovedCoin(bool $borrowerAgreed = true): Coin
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

    $totals = Coin::computeRepayment(50000, 12.0, 90, 3, 1.0);

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
        'total_repayment_amount' => $totals['total'],
        'installment_amount' => $totals['installment'],
        'terms_set_at' => now(),
        'borrower_agreed_to_terms_at' => $borrowerAgreed ? now() : null,
    ]);
}

function makeInterest(Coin $coin, User $investor, bool $agreed = true): CoinInterest
{
    return CoinInterest::create([
        'coin_id' => $coin->id,
        'user_id' => $investor->id,
        'investor_agreed_to_terms_at' => $agreed ? now() : null,
    ]);
}

it('notifies admins when an investor expresses interest', function () {
    Notification::fake();

    $admin = makeFundingAdmin();
    $investor = makeInvestor();
    $coin = makeApprovedCoin();

    $this->actingAs($investor)
        ->from('/investor/coins')
        ->post("/investor/coins/{$coin->id}/interest", ['agreed' => true]);

    Notification::assertSentTo(
        $admin,
        InvestorExpressedInterest::class,
        fn ($notification) => $notification->interest->coin_id === $coin->id,
    );
});

it('does not re-notify on a duplicate interest', function () {
    Notification::fake();

    makeFundingAdmin();
    $investor = makeInvestor();
    $coin = makeApprovedCoin();

    $this->actingAs($investor)
        ->from('/investor/coins')
        ->post("/investor/coins/{$coin->id}/interest", ['agreed' => true]);

    $this->actingAs($investor)
        ->from('/investor/coins')
        ->post("/investor/coins/{$coin->id}/interest", ['agreed' => true]);

    Notification::assertCount(1);
});

it('starts funding, notifies the borrower, and stamps the interest', function () {
    Notification::fake();

    $admin = makeFundingAdmin();
    $investor = makeInvestor();
    $coin = makeApprovedCoin();

    $interest = makeInterest($coin, $investor);

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/interests/{$interest->id}/start-funding");

    $response->assertRedirect('/admin/coins');
    $response->assertSessionHas('success');

    $interest->refresh();
    expect($interest->funding_status)->toBe('funding_initiated');
    expect($interest->funding_started_by)->toBe($admin->id);
    expect($interest->funding_started_at)->not->toBeNull();

    Notification::assertSentTo(
        $coin->borrower->user,
        FundingInitiated::class,
    );
});

it('refuses to start funding when the coin is not approved', function () {
    $admin = makeFundingAdmin();
    $investor = makeInvestor();
    $coin = makeApprovedCoin();
    $coin->update(['status' => 'pending_review']);

    $interest = makeInterest($coin, $investor);

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/interests/{$interest->id}/start-funding");

    $response->assertSessionHas('error');
    $interest->refresh();
    expect($interest->funding_status)->toBe('interested');
});

it('refuses to start funding when the borrower has not agreed to terms', function () {
    $admin = makeFundingAdmin();
    $investor = makeInvestor();
    $coin = makeApprovedCoin(borrowerAgreed: false);

    $interest = makeInterest($coin, $investor);

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/interests/{$interest->id}/start-funding");

    $response->assertSessionHas('error');
    expect($interest->fresh()->funding_status)->toBe('interested');
});

it('refuses to start funding when the investor has not agreed to terms', function () {
    $admin = makeFundingAdmin();
    $investor = makeInvestor();
    $coin = makeApprovedCoin();

    $interest = makeInterest($coin, $investor, agreed: false);

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/interests/{$interest->id}/start-funding");

    $response->assertSessionHas('error');
    expect($interest->fresh()->funding_status)->toBe('interested');
});

it('refuses to start funding twice on the same interest', function () {
    $admin = makeFundingAdmin();
    $investor = makeInvestor();
    $coin = makeApprovedCoin();

    $interest = CoinInterest::create([
        'coin_id' => $coin->id,
        'user_id' => $investor->id,
        'investor_agreed_to_terms_at' => now(),
        'funding_status' => 'funding_initiated',
        'funding_started_at' => now(),
        'funding_started_by' => $admin->id,
    ]);

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/interests/{$interest->id}/start-funding");

    $response->assertSessionHas('error');
});

it('blocks a borrower past 3 active funded coins', function () {
    $admin = makeFundingAdmin();
    $investor = makeInvestor();
    $existingCoin = makeApprovedCoin();
    $borrower = $existingCoin->borrower;

    for ($i = 0; $i < 3; $i++) {
        $coin = Coin::create([
            'borrower_id' => $borrower->id,
            'request' => "Old request #{$i}",
            'date' => '2026-04-01',
            'request_amount' => 25000,
            'duration' => '3 months',
            'industry' => 'agriculture',
            'status' => 'approved',
        ]);
        $otherInvestor = makeInvestor();
        CoinInterest::create([
            'coin_id' => $coin->id,
            'user_id' => $otherInvestor->id,
            'funding_status' => 'funding_initiated',
            'funding_started_at' => now(),
        ]);
    }

    $newInterest = makeInterest($existingCoin, $investor);

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$existingCoin->id}/interests/{$newInterest->id}/start-funding");

    $response->assertSessionHas('error');
    $newInterest->refresh();
    expect($newInterest->funding_status)->toBe('interested');
});

it('blocks an investor past 3 active funded coins', function () {
    $admin = makeFundingAdmin();
    $investor = makeInvestor();

    for ($i = 0; $i < 3; $i++) {
        $coin = makeApprovedCoin();
        CoinInterest::create([
            'coin_id' => $coin->id,
            'user_id' => $investor->id,
            'funding_status' => 'funding_initiated',
            'funding_started_at' => now(),
        ]);
    }

    $newCoin = makeApprovedCoin();
    $newInterest = makeInterest($newCoin, $investor);

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$newCoin->id}/interests/{$newInterest->id}/start-funding");

    $response->assertSessionHas('error');
    $newInterest->refresh();
    expect($newInterest->funding_status)->toBe('interested');
});

it('marks notifications as read via the endpoint', function () {
    $user = User::factory()->create();
    $user->notify(new FundingInitiated(
        CoinInterest::create([
            'coin_id' => makeApprovedCoin()->id,
            'user_id' => makeInvestor()->id,
        ]),
    ));

    $notification = $user->notifications()->firstOrFail();
    expect($notification->read_at)->toBeNull();

    $this->actingAs($user)
        ->from('/dashboard')
        ->post("/notifications/{$notification->id}/read");

    expect($notification->fresh()->read_at)->not->toBeNull();
});
