<?php

use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use App\Models\Borrower;
use App\Models\BorrowerDocumentVerification;
use App\Models\Coin;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'borrower']);
});

function makeBorrower(): Borrower
{
    $user = User::factory()->create();
    $user->assignRole('borrower');

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

    return Borrower::create([
        'user_id' => $user->id,
        'company_name' => 'Acme Holdings',
        'company_registration_number' => '123456',
        'company_type' => 'limited',
        'years_in_operation' => 3,
        'industry' => 'agriculture',
        'contact_name' => $user->name,
        'contact_email' => $user->email,
        'contact_phone' => '+260000000000',
        'status' => 'pending_verification',
    ]);
}

function verifyAllDocuments(Borrower $borrower): void
{
    foreach (array_keys(Borrower::requiredDocuments()) as $type) {
        BorrowerDocumentVerification::create([
            'borrower_id' => $borrower->id,
            'document_type' => $type,
            'verified_by' => $borrower->user_id,
        ]);
    }
}

$validCoinPayload = [
    'request' => 'Working capital for Q2 inventory',
    'date' => '2026-05-01',
    'request_amount' => 50000,
    'duration' => '3 months',
    'industry' => 'agriculture',
];

it('blocks coin creation when documents are not fully verified', function () use ($validCoinPayload) {
    $borrower = makeBorrower();

    $response = $this->actingAs($borrower->user)
        ->from('/borrower/coins')
        ->post('/borrower/coins', $validCoinPayload);

    $response->assertRedirect('/borrower/coins');
    $response->assertSessionHasErrors('verification');

    expect(Coin::query()->count())->toBe(0);
});

it('allows coin creation once all documents are verified', function () use ($validCoinPayload) {
    $borrower = makeBorrower();
    verifyAllDocuments($borrower);

    $response = $this->actingAs($borrower->user)
        ->from('/borrower/coins')
        ->post('/borrower/coins', $validCoinPayload);

    $response->assertRedirect('/borrower/coins');
    $response->assertSessionHas('success');

    expect(Coin::query()->count())->toBe(1);
    expect(Coin::query()->first()->borrower_id)->toBe($borrower->id);
});

it('stores an uploaded purchase order file', function () use ($validCoinPayload) {
    Storage::fake('public');

    $borrower = makeBorrower();
    verifyAllDocuments($borrower);

    $file = UploadedFile::fake()->create('po.pdf', 50, 'application/pdf');

    $this->actingAs($borrower->user)
        ->from('/borrower/coins')
        ->post('/borrower/coins', array_merge($validCoinPayload, [
            'purchase_order_file' => $file,
        ]));

    $coin = Coin::query()->firstOrFail();

    expect($coin->purchase_order_file_path)->not->toBeNull();
    expect($coin->purchase_order_file_original_name)->toBe('po.pdf');

    Storage::disk('public')->assertExists($coin->purchase_order_file_path);
});

it('exposes verification state on the borrower coin index', function () {
    $borrower = makeBorrower();

    $response = $this->actingAs($borrower->user)->get('/borrower/coins');

    $response->assertSuccessful();

    $verification = $response->viewData('page')['props']['verification'];

    expect($verification['can_create'])->toBeFalse();
    expect($verification['documents'])->toHaveCount(count(Borrower::requiredDocuments()));
    expect(collect($verification['documents'])->every(fn ($d) => $d['verified'] === false))->toBeTrue();

    verifyAllDocuments($borrower);

    $response = $this->actingAs($borrower->user)->get('/borrower/coins');
    $verification = $response->viewData('page')['props']['verification'];

    expect($verification['can_create'])->toBeTrue();
    expect(collect($verification['documents'])->every(fn ($d) => $d['verified'] === true))->toBeTrue();
});
