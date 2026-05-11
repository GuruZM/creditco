<?php

use App\Http\Controllers\Admin\CoinController;
use App\Http\Controllers\Admin\FundingWizardController;
use App\Http\Controllers\Admin\RepaymentController as AdminRepaymentController;
use App\Http\Controllers\Admin\SubscriptionController as AdminSubscriptionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Billing\BillingController;
use App\Http\Controllers\Borrower\CoinController as BorrowerCoinController;
use App\Http\Controllers\Borrower\PayoutMethodController;
use App\Http\Controllers\Borrower\RepaymentController as BorrowerRepaymentController;
use App\Http\Controllers\BorrowerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Investor\CoinController as InvestorCoinController;
use App\Http\Controllers\InvestorController;
use App\Http\Controllers\NotificationController;
use App\Models\Borrower;
use App\Models\Coin;
use App\Models\Investor;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $approvedCoins = Coin::query()
        ->with('borrower:id,company_name,industry')
        ->where('status', 'approved')
        ->latest()
        ->limit(6)
        ->get();

    $listings = $approvedCoins->map(fn (Coin $coin) => [
        'id' => $coin->id,
        'company' => $coin->borrower?->company_name ?? 'Verified business',
        'industry' => $coin->industry ?: ($coin->borrower?->industry ?? 'General'),
        'amount' => (float) $coin->request_amount,
        'duration' => $coin->duration,
    ])->values();

    $hero = [
        'stats' => [
            'capital_requested' => (float) Coin::sum('request_amount'),
            'approved_capital' => (float) Coin::where('status', 'approved')->sum('request_amount'),
            'verified_borrowers' => Borrower::count(),
            'active_investors' => Investor::count(),
            'live_listings' => Coin::where('status', 'approved')->count(),
            'industries_served' => Coin::query()->whereNotNull('industry')->distinct()->count('industry'),
        ],
        'listings' => $listings,
    ];

    return Inertia::render('welcome', [
        'hero' => $hero,
    ]);
})->name('home');

Route::post('/webhooks/lenco', [BillingController::class, 'webhook']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    Route::get('/billing', [BillingController::class, 'index']);
    Route::get('/billing/checkout/{payment}', [BillingController::class, 'checkout']);
    Route::post('/billing/start-payment', [BillingController::class, 'startPayment']);
    Route::post('/billing/proof-of-payment', [BillingController::class, 'uploadProof']);
    Route::post('/billing/payments/{payment}/verify', [BillingController::class, 'verify']);
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->middleware('subscribed')
        ->name('dashboard');

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/investors', [InvestorController::class, 'index']);
        Route::post('/investors/{investor}/verify', [InvestorController::class, 'verify']);
        Route::get('/borrowers', [BorrowerController::class, 'index']);
        Route::post('/borrowers/{borrower}/verify-document', [BorrowerController::class, 'verifyDocument']);
        Route::post('/borrowers/{borrower}/verify', [BorrowerController::class, 'verifyBorrower']);
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::get('/admin/coins', [CoinController::class, 'index'])->name('admin.coins.index');
        Route::post('/admin/coins/{coin}/approve', [CoinController::class, 'approve'])->name('admin.coins.approve');
        Route::post('/admin/coins/{coin}/reject', [CoinController::class, 'reject'])->name('admin.coins.reject');
        Route::post('/admin/coins/{coin}/terms', [CoinController::class, 'updateTerms'])->name('admin.coins.update-terms');
        Route::post('/admin/coins/{coin}/interests/{interest}/start-funding', [CoinController::class, 'startFunding'])->name('admin.coins.start-funding');

        Route::get('/admin/coins/{coin}/interests/{interest}/funding', [FundingWizardController::class, 'show'])->name('admin.funding.show');
        Route::post('/admin/coins/{coin}/interests/{interest}/funding/verify-payout', [FundingWizardController::class, 'verifyPayout'])->name('admin.funding.verify-payout');
        Route::post('/admin/coins/{coin}/interests/{interest}/funding/disburse', [FundingWizardController::class, 'disburse'])->name('admin.funding.disburse');

        Route::get('/admin/repayments', [AdminRepaymentController::class, 'index'])
            ->name('admin.repayments.index');
        Route::get('/admin/repayments/{repayment}/file', [AdminRepaymentController::class, 'file'])
            ->name('admin.repayments.file');
        Route::post('/admin/repayments/{repayment}/approve', [AdminRepaymentController::class, 'approve'])
            ->name('admin.repayments.approve');
        Route::post('/admin/repayments/{repayment}/reject', [AdminRepaymentController::class, 'reject'])
            ->name('admin.repayments.reject');

        Route::get('/admin/subscriptions', [AdminSubscriptionController::class, 'index'])
            ->name('admin.subscriptions.index');
        Route::get('/admin/subscriptions/{payment}/file', [AdminSubscriptionController::class, 'file'])
            ->name('admin.subscriptions.file');
        Route::post('/admin/subscriptions/{payment}/approve', [AdminSubscriptionController::class, 'approve'])
            ->name('admin.subscriptions.approve');
        Route::post('/admin/subscriptions/{payment}/reject', [AdminSubscriptionController::class, 'reject'])
            ->name('admin.subscriptions.reject');
    });

    Route::middleware(['role:borrower', 'subscribed'])->group(function () {
        Route::get('/borrower/coins', [BorrowerCoinController::class, 'index']);
        Route::post('/borrower/coins', [BorrowerCoinController::class, 'store']);
        Route::post('/borrower/coins/{coin}/agree-terms', [BorrowerCoinController::class, 'agreeToTerms'])->name('borrower.coins.agree-terms');

        Route::get('/borrower/payout-method', [PayoutMethodController::class, 'show'])->name('borrower.payout-method.show');
        Route::post('/borrower/payout-method', [PayoutMethodController::class, 'store'])->name('borrower.payout-method.store');
        Route::post('/borrower/payout-method/confirm', [PayoutMethodController::class, 'confirm'])->name('borrower.payout-method.confirm');

        Route::get('/borrower/repayments', [BorrowerRepaymentController::class, 'index'])->name('borrower.repayments.index');
        Route::post('/borrower/repayments', [BorrowerRepaymentController::class, 'store'])->name('borrower.repayments.store');
    });

    Route::middleware(['role:investor'])->group(function () {
        Route::get('/investor/coins', [InvestorCoinController::class, 'index'])->name('investor.coins.index');
        Route::post('/investor/coins/{coin}/interest', [InvestorCoinController::class, 'expressInterest'])->name('investor.coins.interest');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
