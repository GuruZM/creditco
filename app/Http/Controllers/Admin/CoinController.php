<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveCoinRequest;
use App\Http\Requests\Admin\RejectCoinRequest;
use App\Models\Coin;
use App\Models\CoinInterest;
use App\Notifications\FundingInitiated;
use App\Notifications\TermsAwaitingBorrowerAgreement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CoinController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $industry = $request->string('industry')->toString();

        $query = Coin::query()
            ->with(['borrower.user', 'reviewer:id,name', 'interests.user:id,name,email'])
            ->orderByDesc('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('request', 'like', "%{$search}%")
                    ->orWhere('purchase_order', 'like', "%{$search}%")
                    ->orWhereHas('borrower', function ($qb) use ($search) {
                        $qb->where('company_name', 'like', "%{$search}%")
                            ->orWhere('contact_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($industry) {
            $query->where('industry', $industry);
        }

        $coins = $query
            ->paginate(15)
            ->through(function (Coin $coin) {
                $borrower = $coin->borrower;

                return [
                    'id' => $coin->id,
                    'request' => $coin->request,
                    'date' => $coin->date?->toDateString(),
                    'purchase_order' => $coin->purchase_order,
                    'purchase_order_file_url' => $coin->purchase_order_file_path
                        ? asset('storage/'.$coin->purchase_order_file_path)
                        : null,
                    'purchase_order_file_name' => $coin->purchase_order_file_original_name,
                    'contract' => $coin->contract,
                    'request_amount' => (float) $coin->request_amount,
                    'source' => $coin->source,
                    'duration' => $coin->duration,
                    'industry' => $coin->industry,
                    'status' => $coin->status,
                    'rejection_reason' => $coin->rejection_reason,
                    'reviewed_at' => $coin->reviewed_at?->toDateTimeString(),
                    'reviewer_name' => $coin->reviewer?->name,
                    'borrower_company' => $borrower?->company_name,
                    'borrower_name' => $borrower?->contact_name,
                    'created_at' => $coin->created_at?->toDateTimeString(),
                    'terms' => [
                        'interest_rate' => $coin->interest_rate !== null ? (float) $coin->interest_rate : null,
                        'service_fee_percent' => $coin->service_fee_percent !== null ? (float) $coin->service_fee_percent : null,
                        'duration_days' => $coin->duration_days,
                        'installments_count' => $coin->installments_count,
                        'installment_interval_days' => $coin->installment_interval_days,
                        'total_repayment_amount' => $coin->total_repayment_amount !== null ? (float) $coin->total_repayment_amount : null,
                        'installment_amount' => $coin->installment_amount !== null ? (float) $coin->installment_amount : null,
                        'terms_text' => $coin->terms_text,
                        'set_at' => $coin->terms_set_at?->toDateTimeString(),
                        'borrower_agreed_at' => $coin->borrower_agreed_to_terms_at?->toDateTimeString(),
                    ],
                    'interests' => $coin->interests
                        ->map(fn (CoinInterest $i) => [
                            'id' => $i->id,
                            'investor_id' => $i->user_id,
                            'investor_name' => $i->user?->name,
                            'investor_email' => $i->user?->email,
                            'note' => $i->note,
                            'funding_status' => $i->funding_status,
                            'funding_started_at' => $i->funding_started_at?->toDateTimeString(),
                            'investor_agreed_at' => $i->investor_agreed_to_terms_at?->toDateTimeString(),
                            'created_at' => $i->created_at?->toDateTimeString(),
                        ])
                        ->all(),
                ];
            });

        // Distinct industries present in coins
        $availableIndustries = Coin::query()
            ->whereNotNull('industry')
            ->where('industry', '!=', '')
            ->distinct()
            ->orderBy('industry')
            ->pluck('industry')
            ->values()
            ->all();

        return Inertia::render('admin/coins/index', [
            'coins' => $coins,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'industry' => $industry,
            ],
            'available_industries' => $availableIndustries,
        ]);
    }

    public function approve(ApproveCoinRequest $request, Coin $coin): RedirectResponse
    {
        if ($coin->status !== 'pending_review') {
            return back()->with('error', 'This coin has already been reviewed.');
        }

        $data = $request->validated();
        $terms = $this->buildTermsPayload($data, (float) $coin->request_amount);

        DB::transaction(function () use ($coin, $terms) {
            $coin->update([
                'status' => 'approved',
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
                'rejection_reason' => null,
                'borrower_agreed_to_terms_at' => null,
                ...$terms,
            ]);
        });

        $coin->refresh();
        $coin->borrower?->user?->notify(new TermsAwaitingBorrowerAgreement($coin));

        return back()->with('success', 'Coin approved with terms. The borrower has been asked to agree.');
    }

    public function updateTerms(ApproveCoinRequest $request, Coin $coin): RedirectResponse
    {
        if ($coin->status !== 'approved') {
            return back()->with('error', 'Terms can only be edited on approved coins.');
        }

        if ($coin->interests()->whereNotNull('funded_at')->exists()) {
            return back()->with('error', 'Funding has already started; terms are locked.');
        }

        $data = $request->validated();
        $terms = $this->buildTermsPayload($data, (float) $coin->request_amount);

        DB::transaction(function () use ($coin, $terms) {
            // Editing terms invalidates any existing agreements.
            $coin->update([
                ...$terms,
                'borrower_agreed_to_terms_at' => null,
            ]);

            CoinInterest::query()
                ->where('coin_id', $coin->id)
                ->whereNotNull('investor_agreed_to_terms_at')
                ->update(['investor_agreed_to_terms_at' => null]);
        });

        $coin->refresh();
        $coin->borrower?->user?->notify(new TermsAwaitingBorrowerAgreement($coin));

        return back()->with('success', 'Terms updated. The borrower and any interested investors must re-agree.');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function buildTermsPayload(array $data, float $principal): array
    {
        $rate = (float) $data['interest_rate'];
        $serviceFee = $data['service_fee_percent'] !== null
            ? (float) $data['service_fee_percent']
            : null;
        $durationDays = (int) $data['duration_days'];
        $installmentsCount = (int) $data['installments_count'];
        $intervalDays = (int) $data['installment_interval_days'];

        $totals = Coin::computeRepayment(
            $principal,
            $rate,
            $durationDays,
            $installmentsCount,
            $serviceFee,
        );

        return [
            'interest_rate' => $rate,
            'service_fee_percent' => $serviceFee,
            'duration_days' => $durationDays,
            'installments_count' => $installmentsCount,
            'installment_interval_days' => $intervalDays,
            'total_repayment_amount' => $totals['total'],
            'installment_amount' => $totals['installment'],
            'terms_text' => $data['terms_text'] ?? null,
            'terms_set_at' => now(),
        ];
    }

    public function reject(RejectCoinRequest $request, Coin $coin): RedirectResponse
    {
        if ($coin->status !== 'pending_review') {
            return back()->with('error', 'This coin has already been reviewed.');
        }

        $coin->update([
            'status' => 'rejected',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
            'rejection_reason' => trim((string) $request->validated('reason')),
        ]);

        return back()->with('success', 'Coin rejected. The borrower has been notified.');
    }

    public function startFunding(Request $request, Coin $coin, CoinInterest $interest): RedirectResponse
    {
        if ($interest->coin_id !== $coin->id) {
            abort(404);
        }

        if ($coin->status !== 'approved') {
            return back()->with('error', 'Funding can only be started on approved coins.');
        }

        if (! $coin->hasTerms()) {
            return back()->with('error', 'This coin has no agreed terms. Set commercial terms before starting funding.');
        }

        if (! $coin->borrowerHasAgreedToTerms()) {
            return back()->with('error', 'The borrower has not yet agreed to the terms.');
        }

        if (! $interest->investorHasAgreedToTerms()) {
            return back()->with('error', 'This investor has not yet agreed to the terms.');
        }

        if ($interest->funding_status !== 'interested') {
            return back()->with('error', 'Funding has already been started for this investor.');
        }

        $borrowerActiveCount = CoinInterest::query()
            ->whereHas('coin', fn ($q) => $q->where('borrower_id', $coin->borrower_id))
            ->where('funding_status', '!=', 'interested')
            ->count();

        if ($borrowerActiveCount >= 3) {
            return back()->with('error', 'This borrower already has 3 funded coins in flight (limit reached).');
        }

        $investorActiveCount = CoinInterest::query()
            ->where('user_id', $interest->user_id)
            ->where('funding_status', '!=', 'interested')
            ->count();

        if ($investorActiveCount >= 3) {
            return back()->with('error', 'This investor already has 3 funded coins in flight (limit reached).');
        }

        DB::transaction(function () use ($interest) {
            $interest->update([
                'funding_status' => 'funding_initiated',
                'funding_started_at' => now(),
                'funding_started_by' => Auth::id(),
            ]);

            $borrowerUser = $interest->coin->borrower?->user;

            if ($borrowerUser) {
                $borrowerUser->notify(new FundingInitiated($interest));
            }
        });

        return back()->with('success', 'Funding initiated. The borrower has been notified to add their payout account.');
    }
}
