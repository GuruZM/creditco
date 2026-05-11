<?php

use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'borrower']);
});

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('unsubscribed borrowers are redirected to billing', function () {
    $user = User::factory()->create();
    $user->assignRole('borrower');

    $this->actingAs($user);

    $this->get(route('dashboard'))->assertRedirect('/billing');
});

test('authenticated users with an active subscription can visit the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('borrower');
    $plan = Plan::create([
        'key' => 'creditco_monthly',
        'name' => 'CreditCo',
        'interval' => 'month',
        'interval_count' => 1,
        'amount' => 150.00,
        'currency' => 'ZMW',
        'is_active' => true,
    ]);

    Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'gateway' => 'lenco',
        'starts_at' => now(),
        'renews_at' => now()->addMonth(),
        'failed_attempts' => 0,
    ]);

    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});
