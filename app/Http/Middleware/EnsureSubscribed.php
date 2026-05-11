<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscribed
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect('/login');
        }

        if (! $user->hasRole('borrower')) {
            return $next($request);
        }

        if (! $user->isSubscribed()) {
            return redirect(config('billing.paywall_path', '/billing'));
        }

        return $next($request);
    }
}
