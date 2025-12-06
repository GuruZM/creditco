<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
      public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401); // not authenticated
        }

        // Make sure User model uses Spatie's HasRoles trait
        // use Spatie\Permission\Traits\HasRoles;
        // class User extends Authenticatable { use HasRoles; }

        // If you pass multiple roles: role:admin,borrower
        if (method_exists($user, 'hasAnyRole')) {
            if (! $user->hasAnyRole($roles)) {
                abort(403, 'You do not have the required role.');
            }
        } else {
            // Fallback: if HasRoles is not set up correctly
            abort(500, 'Role system not configured on User model.');
        }

        return $next($request);
    }
}
