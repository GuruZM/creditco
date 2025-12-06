<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
 
use App\Models\User;
 
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
class UserController extends Controller
{
       public function index(Request $request)
    {
        $search = $request->string('search')->toString();
        $role   = $request->string('role')->toString();
        $status = $request->string('status')->toString(); // e.g. active/suspended

        $query = User::query()->with('roles');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status) {
            // assumes a "status" column on users (e.g. active / suspended)
            $query->where('status', $status);
        }

        if ($role) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        $users = $query
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(function (User $user) {
                return [
                    'id'         => $user->id,
                    'name'       => $user->name,
                    'email'      => $user->email,
                    'status'     => $user->status ?? 'active',
                    'roles'      => $user->roles->pluck('name')->all(),
                    'created_at' => $user->created_at?->toDateTimeString(),
                ];
            });

        $roles = Role::orderBy('name')->pluck('name')->all();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role'   => $role,
                'status' => $status,
            ],
            'available_roles' => $roles,
        ]);
    }

    /**
     * Toggle user status between active / suspended.
     */
    public function toggleStatus(User $user)
    {
        $user->update([
            'status' => $user->status === 'suspended' ? 'active' : 'suspended',
        ]);

        return redirect()->back()->with('success', 'User status updated.');
    }

    /**
     * Reset user password to a random or fixed temp password.
     */
    public function resetPassword(User $user)
    {
        // You can change this to send email, etc.
        $tempPassword = 'CreditCo123!'; // or Str::random(12);

        $user->update([
            'password' => Hash::make($tempPassword),
        ]);

        // Optionally store temp password in session just for admin feedback
        return redirect()->back()->with('success', "Password reset to temporary value.");
    }

    /**
     * Delete user account.
     */
    public function destroy(User $user)
    {
        // optional checks to prevent deleting self or super admin
        if (auth()->id() === $user->id) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted.');
    }
}
