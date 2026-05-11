<?php

namespace App\Http\Controllers\Investor;

use App\Http\Controllers\Controller;
use App\Models\Coin;
use App\Models\CoinInterest;
use App\Models\User;
use App\Notifications\InvestorExpressedInterest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class CoinController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $industry = $request->string('industry')->toString();
        $minAmount = $request->input('min_amount');
        $maxAmount = $request->input('max_amount');

        // Investors only see coins where the borrower has agreed to the commercial terms.
        $query = Coin::query()
            ->where('status', 'approved')
            ->whereNotNull('borrower_agreed_to_terms_at')
            ->orderByDesc('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('request', 'like', "%{$search}%")
                    ->orWhere('purchase_order', 'like', "%{$search}%")
                    ->orWhere('contract', 'like', "%{$search}%");
            });
        }

        if ($industry) {
            $query->where('industry', $industry);
        }

        if (! is_null($minAmount) && $minAmount !== '') {
            $query->where('request_amount', '>=', (float) $minAmount);
        }

        if (! is_null($maxAmount) && $maxAmount !== '') {
            $query->where('request_amount', '<=', (float) $maxAmount);
        }

        $userId = Auth::id();

        $interestedCoinIds = CoinInterest::query()
            ->where('user_id', $userId)
            ->pluck('coin_id')
            ->all();

        $coins = $query
            ->withCount('interests')
            ->paginate(12)
            ->through(function (Coin $coin) use ($interestedCoinIds) {
                return [
                    'id' => $coin->id,
                    'request' => $coin->request,
                    'date' => $coin->date?->toDateString(),
                    'purchase_order' => $coin->purchase_order,
                    'contract' => $coin->contract,
                    'request_amount' => (float) $coin->request_amount,
                    'source' => $coin->source,
                    'duration' => $coin->duration,
                    'industry' => $coin->industry,
                    'status' => $coin->status,
                    'interests_count' => (int) $coin->interests_count,
                    'is_interested' => in_array($coin->id, $interestedCoinIds, true),
                    'created_at' => $coin->created_at?->toDateTimeString(),
                    'terms' => [
                        'interest_rate' => (float) $coin->interest_rate,
                        'service_fee_percent' => $coin->service_fee_percent !== null
                            ? (float) $coin->service_fee_percent
                            : null,
                        'duration_days' => $coin->duration_days,
                        'installments_count' => $coin->installments_count,
                        'installment_interval_days' => $coin->installment_interval_days,
                        'total_repayment_amount' => (float) $coin->total_repayment_amount,
                        'installment_amount' => (float) $coin->installment_amount,
                        'terms_text' => $coin->terms_text,
                    ],
                    // 🚫 No borrower details — investor view is anonymous
                ];
            });

        $availableIndustries = Coin::query()
            ->where('status', 'approved')
            ->whereNotNull('industry')
            ->where('industry', '!=', '')
            ->distinct()
            ->orderBy('industry')
            ->pluck('industry')
            ->values()
            ->all();

        return Inertia::render('investor/coins/index', [
            'coins' => $coins,
            'filters' => [
                'search' => $search,
                'industry' => $industry,
                'min_amount' => $minAmount,
                'max_amount' => $maxAmount,
            ],
            'available_industries' => $availableIndustries,
        ]);
    }

    public function expressInterest(Request $request, Coin $coin): RedirectResponse
    {
        if ($coin->status !== 'approved') {
            return back()->with('error', 'You can only express interest in approved coins.');
        }

        if (! $coin->hasTerms() || ! $coin->borrowerHasAgreedToTerms()) {
            return back()->with('error', 'This coin is not yet open for interest — terms have not been finalised.');
        }

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:500'],
            'agreed' => ['required', 'accepted'],
        ]);

        $interest = CoinInterest::firstOrCreate(
            ['coin_id' => $coin->id, 'user_id' => Auth::id()],
            [
                'note' => $data['note'] ?? null,
                'investor_agreed_to_terms_at' => now(),
            ],
        );

        if (! $interest->wasRecentlyCreated && ! $interest->investorHasAgreedToTerms()) {
            $interest->update(['investor_agreed_to_terms_at' => now()]);
        }

        if ($interest->wasRecentlyCreated) {
            $admins = User::role('admin')->get();
            Notification::send($admins, new InvestorExpressedInterest($interest));
        }

        return back()->with('success', 'Your interest has been recorded with the agreed terms. The CreditCo team will be in touch.');
    }
}
