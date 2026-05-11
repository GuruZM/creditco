<?php

namespace App\Http\Controllers;

use App\Billing\Models\Payment;
use App\Billing\Models\Subscription;
use App\Models\Borrower;
use App\Models\Coin;
use App\Models\CoinInterest;
use App\Models\CoinRepayment;
use App\Models\Investor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $role = match (true) {
            $user->hasRole('admin') => 'admin',
            $user->hasRole('investor') => 'investor',
            $user->hasRole('borrower') => 'borrower',
            default => 'borrower',
        };

        $payload = match ($role) {
            'admin' => $this->adminPayload(),
            'investor' => $this->investorPayload($user),
            'borrower' => $this->borrowerPayload($user),
        };

        return Inertia::render('dashboard', [
            'role' => $role,
            'data' => $payload,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function adminPayload(): array
    {
        $now = Carbon::now();

        $stats = [
            'total_users' => User::query()->count(),
            'total_borrowers' => Borrower::query()->count(),
            'total_investors' => Investor::query()->count(),
            'pending_coins' => Coin::query()->where('status', 'pending_review')->count(),
            'approved_coins' => Coin::query()->where('status', 'approved')->count(),
            'rejected_coins' => Coin::query()->where('status', 'rejected')->count(),
            'capital_requested' => (float) Coin::query()->sum('request_amount'),
            'capital_approved' => (float) Coin::query()->where('status', 'approved')->sum('request_amount'),
            'capital_funded' => (float) CoinInterest::query()->whereNotNull('funded_at')->sum('funded_amount'),
            'active_subscriptions' => Subscription::query()->where('status', 'active')->count(),
        ];

        // Coins per month (last 6 months) — split by status approved vs pending vs rejected.
        $monthBuckets = collect(range(5, 0))->map(function (int $offset) use ($now) {
            $start = $now->copy()->startOfMonth()->subMonths($offset);
            $end = $start->copy()->endOfMonth();

            $approved = Coin::query()
                ->where('status', 'approved')
                ->whereBetween('created_at', [$start, $end])
                ->count();
            $pending = Coin::query()
                ->where('status', 'pending_review')
                ->whereBetween('created_at', [$start, $end])
                ->count();
            $rejected = Coin::query()
                ->where('status', 'rejected')
                ->whereBetween('created_at', [$start, $end])
                ->count();

            return [
                'label' => $start->format('M'),
                'approved' => $approved,
                'pending' => $pending,
                'rejected' => $rejected,
            ];
        })->values()->all();

        $industryBreakdown = Coin::query()
            ->selectRaw('coalesce(nullif(industry, ""), "General") as industry, count(*) as total')
            ->groupBy('industry')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'label' => (string) $row->industry,
                'value' => (int) $row->total,
            ])
            ->all();

        $upcomingDueDates = CoinInterest::query()
            ->with(['coin:id,borrower_id,request_amount', 'coin.borrower:id,company_name', 'user:id,name'])
            ->whereNotNull('next_payment_due_at')
            ->where('next_payment_due_at', '>=', $now->copy()->subDays(7))
            ->orderBy('next_payment_due_at')
            ->limit(15)
            ->get()
            ->map(fn (CoinInterest $i) => [
                'id' => $i->id,
                'due_at' => $i->next_payment_due_at?->toDateString(),
                'amount' => (float) ($i->installment_amount ?? 0),
                'borrower_company' => $i->coin?->borrower?->company_name,
                'investor_name' => $i->user?->name,
                'is_overdue' => $i->next_payment_due_at?->lt($now) ?? false,
            ])
            ->all();

        $tasks = [
            'pending_coins' => $stats['pending_coins'],
            'pending_borrower_verifications' => Borrower::query()
                ->where('status', '!=', 'verified')
                ->count(),
            'pending_investor_verifications' => Investor::query()
                ->where('status', '!=', 'verified')
                ->count(),
            'pending_subscription_pops' => Payment::query()
                ->whereIn('status', ['pending', 'initiated'])
                ->whereNotNull('meta')
                ->count(),
            'pending_repayments' => CoinRepayment::query()
                ->where('status', 'pending_verification')
                ->count(),
        ];

        $recentCoins = Coin::query()
            ->with('borrower:id,company_name')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Coin $coin) => [
                'id' => $coin->id,
                'company' => $coin->borrower?->company_name,
                'amount' => (float) $coin->request_amount,
                'status' => $coin->status,
                'created_at' => $coin->created_at?->toDateTimeString(),
            ])
            ->all();

        return [
            'stats' => $stats,
            'coin_trend' => $monthBuckets,
            'industry_breakdown' => $industryBreakdown,
            'upcoming_due_dates' => $upcomingDueDates,
            'tasks' => $tasks,
            'recent_coins' => $recentCoins,
            'currency' => 'ZMW',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function borrowerPayload(User $user): array
    {
        $now = Carbon::now();

        $borrower = Borrower::query()->where('user_id', $user->id)->first();
        $coinsQuery = Coin::query()->where('borrower_id', optional($borrower)->id ?? 0);

        $stats = [
            'total_coins' => (clone $coinsQuery)->count(),
            'approved_coins' => (clone $coinsQuery)->where('status', 'approved')->count(),
            'pending_coins' => (clone $coinsQuery)->where('status', 'pending_review')->count(),
            'rejected_coins' => (clone $coinsQuery)->where('status', 'rejected')->count(),
            'capital_requested' => (float) (clone $coinsQuery)->sum('request_amount'),
            'capital_funded' => (float) CoinInterest::query()
                ->whereHas('coin', fn ($q) => $q->where('borrower_id', optional($borrower)->id ?? 0))
                ->whereNotNull('funded_at')
                ->sum('funded_amount'),
        ];

        // Status breakdown for chart
        $statusBreakdown = [
            ['label' => 'Approved', 'value' => $stats['approved_coins']],
            ['label' => 'Pending', 'value' => $stats['pending_coins']],
            ['label' => 'Rejected', 'value' => $stats['rejected_coins']],
        ];

        // Requests over last 6 months
        $monthlyRequests = collect(range(5, 0))->map(function (int $offset) use ($now, $coinsQuery) {
            $start = $now->copy()->startOfMonth()->subMonths($offset);
            $end = $start->copy()->endOfMonth();

            $count = (clone $coinsQuery)
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $amount = (float) (clone $coinsQuery)
                ->whereBetween('created_at', [$start, $end])
                ->sum('request_amount');

            return [
                'label' => $start->format('M'),
                'count' => $count,
                'amount' => $amount,
            ];
        })->values()->all();

        // Upcoming installments — borrower owes these payments to investors
        $upcomingDueDates = CoinInterest::query()
            ->with(['coin:id,borrower_id,request', 'user:id,name'])
            ->whereHas('coin', fn ($q) => $q->where('borrower_id', optional($borrower)->id ?? 0))
            ->whereNotNull('next_payment_due_at')
            ->orderBy('next_payment_due_at')
            ->limit(10)
            ->get()
            ->map(fn (CoinInterest $i) => [
                'id' => $i->id,
                'due_at' => $i->next_payment_due_at?->toDateString(),
                'amount' => (float) ($i->installment_amount ?? 0),
                'investor_name' => $i->user?->name,
                'request' => $i->coin?->request,
                'is_overdue' => $i->next_payment_due_at?->lt($now) ?? false,
            ])
            ->all();

        $recentCoins = (clone $coinsQuery)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Coin $coin) => [
                'id' => $coin->id,
                'request' => $coin->request,
                'amount' => (float) $coin->request_amount,
                'status' => $coin->status,
                'duration' => $coin->duration,
                'created_at' => $coin->created_at?->toDateTimeString(),
            ])
            ->all();

        return [
            'stats' => $stats,
            'status_breakdown' => $statusBreakdown,
            'monthly_requests' => $monthlyRequests,
            'upcoming_due_dates' => $upcomingDueDates,
            'recent_coins' => $recentCoins,
            'has_borrower_profile' => $borrower !== null,
            'currency' => 'ZMW',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function investorPayload(User $user): array
    {
        $now = Carbon::now();

        $interestsQuery = CoinInterest::query()->where('user_id', $user->id);

        $stats = [
            'total_interests' => (clone $interestsQuery)->count(),
            'funded_interests' => (clone $interestsQuery)->whereNotNull('funded_at')->count(),
            'pending_interests' => (clone $interestsQuery)->where('funding_status', 'interested')->count(),
            'in_progress_interests' => (clone $interestsQuery)
                ->whereNotIn('funding_status', ['interested'])
                ->whereNull('funded_at')
                ->count(),
            'capital_invested' => (float) (clone $interestsQuery)
                ->whereNotNull('funded_at')
                ->sum('funded_amount'),
            'expected_repayments' => (float) (clone $interestsQuery)
                ->whereNotNull('funded_at')
                ->selectRaw('coalesce(sum(installment_amount * installments_count), 0) as total')
                ->value('total'),
        ];

        $statusBreakdown = (clone $interestsQuery)
            ->selectRaw('funding_status, count(*) as total')
            ->groupBy('funding_status')
            ->get()
            ->map(fn ($row) => [
                'label' => str_replace('_', ' ', (string) $row->funding_status),
                'value' => (int) $row->total,
            ])
            ->all();

        // Monthly funding over the last 6 months
        $monthlyFunded = collect(range(5, 0))->map(function (int $offset) use ($now, $user) {
            $start = $now->copy()->startOfMonth()->subMonths($offset);
            $end = $start->copy()->endOfMonth();

            $amount = (float) CoinInterest::query()
                ->where('user_id', $user->id)
                ->whereNotNull('funded_at')
                ->whereBetween('funded_at', [$start, $end])
                ->sum('funded_amount');

            $count = CoinInterest::query()
                ->where('user_id', $user->id)
                ->whereNotNull('funded_at')
                ->whereBetween('funded_at', [$start, $end])
                ->count();

            return [
                'label' => $start->format('M'),
                'amount' => $amount,
                'count' => $count,
            ];
        })->values()->all();

        // Upcoming repayments (income) due to investor
        $upcomingDueDates = (clone $interestsQuery)
            ->with(['coin:id,borrower_id,request', 'coin.borrower:id,company_name'])
            ->whereNotNull('next_payment_due_at')
            ->orderBy('next_payment_due_at')
            ->limit(10)
            ->get()
            ->map(fn (CoinInterest $i) => [
                'id' => $i->id,
                'due_at' => $i->next_payment_due_at?->toDateString(),
                'amount' => (float) ($i->installment_amount ?? 0),
                'borrower_company' => $i->coin?->borrower?->company_name,
                'request' => $i->coin?->request,
                'is_overdue' => $i->next_payment_due_at?->lt($now) ?? false,
            ])
            ->all();

        $recentInterests = (clone $interestsQuery)
            ->with(['coin:id,borrower_id,request,request_amount,industry', 'coin.borrower:id,company_name'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (CoinInterest $i) => [
                'id' => $i->id,
                'company' => $i->coin?->borrower?->company_name,
                'request' => $i->coin?->request,
                'industry' => $i->coin?->industry,
                'amount' => (float) ($i->coin?->request_amount ?? 0),
                'funding_status' => $i->funding_status,
                'created_at' => $i->created_at?->toDateTimeString(),
            ])
            ->all();

        return [
            'stats' => $stats,
            'status_breakdown' => $statusBreakdown,
            'monthly_funded' => $monthlyFunded,
            'upcoming_due_dates' => $upcomingDueDates,
            'recent_interests' => $recentInterests,
            'currency' => 'ZMW',
        ];
    }
}
