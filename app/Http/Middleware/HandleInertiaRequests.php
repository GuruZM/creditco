<?php

namespace App\Http\Middleware;

use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();

        $billing = null;
        $plans = [];
        $notifications = null;

        if ($user && ! $this->isGuestRoute($request)) {
            $unreadCount = $user->unreadNotifications()->count();
            $recent = $user->notifications()
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'data' => $n->data,
                    'read_at' => $n->read_at?->toDateTimeString(),
                    'created_at' => $n->created_at?->toDateTimeString(),
                ])
                ->all();

            $notifications = [
                'unread_count' => $unreadCount,
                'items' => $recent,
            ];

            $sub = Subscription::query()
                ->with('plan')
                ->where('user_id', $user->id)
                ->latest()
                ->first();

            $billing = [
                'is_subscribed' => $user->isSubscribed(),
                'subscription' => $sub ? [
                    'id' => $sub->id,
                    'status' => $sub->status,
                    'starts_at' => optional($sub->starts_at)?->toDateString(),
                    'renews_at' => optional($sub->renews_at)?->toDateString(),
                    'grace_ends_at' => optional($sub->grace_ends_at)?->toDateString(),
                    'plan' => $sub->plan ? [
                        'id' => $sub->plan->id,
                        'key' => $sub->plan->key,
                        'name' => $sub->plan->name,
                        'interval' => $sub->plan->interval,
                        'amount' => (float) $sub->plan->amount,
                        'currency' => $sub->plan->currency,
                        'meta' => $sub->plan->meta, // ✅ useful for UI badges/features if needed
                    ] : null,
                ] : null,
            ];

            // ✅ Active plans (global, so layout modal can render plans anywhere)
            $plans = Plan::query()
                ->where('is_active', true)
                ->orderByRaw("case `interval` when 'month' then 1 when 'quarter' then 2 when 'year' then 3 else 4 end")
                ->get()
                ->map(fn (Plan $p) => [
                    'id' => $p->id,
                    'key' => $p->key,
                    'name' => $p->name,
                    'interval' => $p->interval,
                    'interval_count' => (int) $p->interval_count,
                    'amount' => (float) $p->amount,
                    'currency' => $p->currency,
                    'meta' => $p->meta,
                ])
                ->all();
        }

        return [
            ...parent::share($request),

            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],

            'auth' => [
                'user' => $user,
                'roles' => $user?->getRoleNames() ?? [],
                'permissions' => $user?->getAllPermissions()->pluck('name') ?? [],
                'can' => $user
                    ? $user->getAllPermissions()
                        ->pluck('name')
                        ->mapWithKeys(fn ($p) => [$p => true])
                    : [],
            ],

            // ✅ Global billing payload for layout paywall modal
            'billing' => $billing,

            // ✅ Global plans so the layout modal can show plan cards
            'plans' => $plans,

            // ✅ Notifications payload for app-header bell
            'notifications' => $notifications,

            // ✅ Flash payload for payment start messages
            'flash' => [
                'billing' => session('billing'),
            ],

            'sidebarOpen' => ! $request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',
        ];
    }

    protected function isGuestRoute(Request $request): bool
    {
        if ($request->is('login', 'register', 'forgot-password', 'reset-password/*', 'signup', 'signup/*')) {
            return true;
        }

        $route = $request->route();

        if (! $route) {
            return false;
        }

        return in_array('guest', $route->gatherMiddleware(), true);
    }
}
