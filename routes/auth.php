<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->withoutMiddleware('subscribed')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store'])
        ->name('register.store');

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store'])
        ->name('login.store');

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('guest')->withoutMiddleware('subscribed')->prefix('signup')->group(function () {

    // Step 1: choose borrower or investor
    Route::get('/', [\App\Http\Controllers\Auth\RegisterController::class, 'showRoleSelection'])
        ->name('signup');

    // Borrower
    Route::get('/borrower', [\App\Http\Controllers\Auth\BorrowerRegisterController::class, 'create'])
        ->name('signup.borrower');

    Route::post('/borrower', [\App\Http\Controllers\Auth\BorrowerRegisterController::class, 'store'])
        ->name('signup.borrower.store');

    // Investor
    Route::get('/investor', [\App\Http\Controllers\Auth\InvestorRegisterController::class, 'create'])
        ->name('signup.investor');

    Route::post('/investor', [\App\Http\Controllers\Auth\InvestorRegisterController::class, 'store'])
        ->name('signup.investor.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
