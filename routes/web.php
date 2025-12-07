<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\InvestorController;
use App\Http\Controllers\BorrowerController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\CoinController;
use App\Http\Controllers\Borrower\CoinController as BorrowerCoinController;
use App\Http\Controllers\Investor\CoinController as InvestorCoinController;
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

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
     Route::get('/admin/coins', [CoinController::class, 'index']);
    });

    Route::middleware(['role:borrower'])->group(function () {
    Route::get('/borrower/coins', [BorrowerCoinController::class, 'index']);
    Route::post('/borrower/coins', [BorrowerCoinController::class, 'store']);
});

  Route::middleware(['role:investor'])->group(function () {
        Route::get('/investor/coins', [InvestorCoinController::class, 'index']);
        // later: express interest, etc.
    });
}); 

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
