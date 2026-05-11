<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Testing\AssertableInertia as Assert;

test('welcome page can be rendered for guests', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('auth.user', null)
        );
});

test('signup role selection page can be rendered for guests', function () {
    $this->get(route('signup'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/select-role/index')
        );
});

test('auth guest pages return valid inertia responses for inertia requests', function () {
    $version = app(\App\Http\Middleware\HandleInertiaRequests::class)->version(request());

    $headers = [
        'X-Inertia' => 'true',
        'X-Requested-With' => 'XMLHttpRequest',
        'X-Inertia-Version' => $version,
    ];

    $this->get(route('login'), $headers)
        ->assertSuccessful()
        ->assertHeader('X-Inertia', 'true');

    $this->get(route('signup'), $headers)
        ->assertSuccessful()
        ->assertHeader('X-Inertia', 'true');
});

test('guest auth routes exclude subscription checks', function () {
    $loginRoute = app('router')->getRoutes()->getByName('login');
    $signupRoute = app('router')->getRoutes()->getByName('signup');

    expect($loginRoute->excludedMiddleware())->toContain('subscribed')
        ->and($signupRoute->excludedMiddleware())->toContain('subscribed');
});

test('guest routes skip billing shared data even for authenticated users', function () {
    $user = User::factory()->create();

    $request = Request::create('/login');
    $request->setUserResolver(fn () => $user);

    $shared = app(HandleInertiaRequests::class)->share($request);

    expect($shared['billing'])->toBeNull()
        ->and($shared['plans'])->toBe([]);
});
