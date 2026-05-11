<?php

use App\Models\Borrower;
use App\Models\Coin;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'borrower']);
});

function admin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    return $admin;
}

function pendingCoin(): Coin
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
        'request' => 'Working capital',
        'date' => '2026-05-01',
        'request_amount' => 25000,
        'duration' => '3 months',
        'industry' => 'agriculture',
        'status' => 'pending_review',
    ]);
}

function termsPayload(array $overrides = []): array
{
    return array_merge([
        'interest_rate' => 12.0,
        'service_fee_percent' => 1.0,
        'duration_days' => 90,
        'installments_count' => 3,
        'installment_interval_days' => 30,
        'terms_text' => null,
    ], $overrides);
}

it('approves a pending coin with commercial terms and stamps the reviewer', function () {
    $admin = admin();
    $coin = pendingCoin();

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/approve", termsPayload());

    $response->assertRedirect('/admin/coins');
    $response->assertSessionHas('success');

    $coin->refresh();
    expect($coin->status)->toBe('approved');
    expect($coin->reviewed_by)->toBe($admin->id);
    expect($coin->reviewed_at)->not->toBeNull();
    expect((float) $coin->interest_rate)->toBe(12.0);
    expect((int) $coin->installments_count)->toBe(3);
    expect($coin->terms_set_at)->not->toBeNull();
    expect($coin->total_repayment_amount)->not->toBeNull();
    expect($coin->installment_amount)->not->toBeNull();
    expect($coin->borrower_agreed_to_terms_at)->toBeNull(); // borrower must agree separately
});

it('rejects a pending coin with a reason', function () {
    $admin = admin();
    $coin = pendingCoin();

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/reject", [
            'reason' => 'Amount exceeds risk appetite for this borrower.',
        ]);

    $response->assertRedirect('/admin/coins');
    $response->assertSessionHas('success');

    $coin->refresh();
    expect($coin->status)->toBe('rejected');
    expect($coin->reviewed_by)->toBe($admin->id);
    expect($coin->rejection_reason)->toContain('risk appetite');
});

it('refuses to reject without a reason', function () {
    $admin = admin();
    $coin = pendingCoin();

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/reject", ['reason' => '']);

    $response->assertSessionHasErrors('reason');

    $coin->refresh();
    expect($coin->status)->toBe('pending_review');
});

it('rejects approval without terms', function () {
    $admin = admin();
    $coin = pendingCoin();

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/approve");

    $response->assertSessionHasErrors([
        'interest_rate',
        'duration_days',
        'installments_count',
        'installment_interval_days',
    ]);

    expect($coin->fresh()->status)->toBe('pending_review');
});

it('does not allow re-reviewing an already approved coin', function () {
    $admin = admin();
    $coin = pendingCoin();
    $coin->update([
        'status' => 'approved',
        'reviewed_by' => $admin->id,
        'reviewed_at' => now(),
    ]);

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/approve", termsPayload());

    $response->assertSessionHas('error');
});

it('blocks non-admins from approving a coin', function () {
    $borrowerUser = User::factory()->create();
    $borrowerUser->assignRole('borrower');
    $coin = pendingCoin();

    $response = $this->actingAs($borrowerUser)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/approve", termsPayload());

    $response->assertForbidden();

    $coin->refresh();
    expect($coin->status)->toBe('pending_review');
});

it('lets admin update terms on an approved coin and clears prior agreements', function () {
    $admin = admin();
    $coin = pendingCoin();

    $this->actingAs($admin)
        ->post("/admin/coins/{$coin->id}/approve", termsPayload());

    $coin->refresh();
    $coin->update(['borrower_agreed_to_terms_at' => now()]);

    $response = $this->actingAs($admin)
        ->from('/admin/coins')
        ->post("/admin/coins/{$coin->id}/terms", termsPayload(['interest_rate' => 18.5]));

    $response->assertRedirect('/admin/coins');

    $coin->refresh();
    expect((float) $coin->interest_rate)->toBe(18.5);
    expect($coin->borrower_agreed_to_terms_at)->toBeNull();
});
