<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function markAsRead(Request $request, string $notification): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 403);

        $user->unreadNotifications()
            ->where('id', $notification)
            ->update(['read_at' => now()]);

        return back();
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 403);

        $user->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
