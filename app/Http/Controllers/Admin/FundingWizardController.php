<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coin;
use App\Models\CoinInterest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FundingWizardController extends Controller
{
    public function show(Request $request, Coin $coin, CoinInterest $interest): Response
    {
        $this->ensureMatch($coin, $interest);

        $interest->loadMissing([
            'user:id,name,email',
            'coin.borrower.user',
            'coin.borrower.payoutMethod',
            'termsAcceptor:id,name',
            'funder:id,name',
        ]);

        $borrower = $interest->coin?->borrower;
        $payoutMethod = $borrower?->payoutMethod;

        return Inertia::render('admin/funding-wizard/index', [
            'coin' => [
                'id' => $coin->id,
                'request' => $coin->request,
                'request_amount' => (float) $coin->request_amount,
                'duration' => $coin->duration,
                'industry' => $coin->industry,
                'borrower_company' => $borrower?->company_name,
                'terms' => [
                    'interest_rate' => $coin->interest_rate !== null ? (float) $coin->interest_rate : null,
                    'service_fee_percent' => $coin->service_fee_percent !== null ? (float) $coin->service_fee_percent : null,
                    'duration_days' => $coin->duration_days,
                    'installments_count' => $coin->installments_count,
                    'installment_interval_days' => $coin->installment_interval_days,
                    'total_repayment_amount' => $coin->total_repayment_amount !== null ? (float) $coin->total_repayment_amount : null,
                    'installment_amount' => $coin->installment_amount !== null ? (float) $coin->installment_amount : null,
                    'terms_text' => $coin->terms_text,
                    'borrower_agreed_at' => $coin->borrower_agreed_to_terms_at?->toDateTimeString(),
                ],
            ],
            'interest' => [
                'id' => $interest->id,
                'investor_name' => $interest->user?->name,
                'investor_email' => $interest->user?->email,
                'note' => $interest->note,
                'funding_status' => $interest->funding_status,
                'funding_started_at' => $interest->funding_started_at?->toDateTimeString(),
                'investor_agreed_at' => $interest->investor_agreed_to_terms_at?->toDateTimeString(),
                'funded_at' => $interest->funded_at?->toDateTimeString(),
                'funded_by_name' => $interest->funder?->name,
                'funded_amount' => $interest->funded_amount !== null
                    ? (float) $interest->funded_amount
                    : null,
                'installments_count' => $interest->installments_count,
                'installment_amount' => $interest->installment_amount !== null
                    ? (float) $interest->installment_amount
                    : null,
                'installment_interval_days' => $interest->installment_interval_days,
                'next_payment_due_at' => $interest->next_payment_due_at?->toDateTimeString(),
            ],
            'payout_method' => $payoutMethod ? [
                'id' => $payoutMethod->id,
                'kind' => $payoutMethod->kind,
                'account_name' => $payoutMethod->account_name,
                'bank_name' => $payoutMethod->bank_name,
                'account_number' => $payoutMethod->account_number,
                'branch' => $payoutMethod->branch,
                'mobile_provider' => $payoutMethod->mobile_provider,
                'mobile_number' => $payoutMethod->mobile_number,
                'borrower_confirmed_at' => $payoutMethod->borrower_confirmed_at?->toDateTimeString(),
                'admin_verified_at' => $payoutMethod->admin_verified_at?->toDateTimeString(),
            ] : null,
        ]);
    }

    public function verifyPayout(Request $request, Coin $coin, CoinInterest $interest): RedirectResponse
    {
        $this->ensureMatch($coin, $interest);

        $payoutMethod = $coin->borrower?->payoutMethod;

        if (! $payoutMethod || ! $payoutMethod->isBorrowerConfirmed()) {
            return back()->with('error', 'The borrower must confirm their payout details before you can verify them.');
        }

        if ($interest->funding_status !== 'awaiting_admin_funding') {
            return back()->with('error', 'This interest is not awaiting admin verification.');
        }

        DB::transaction(function () use ($payoutMethod, $interest) {
            $payoutMethod->update([
                'admin_verified_at' => now(),
                'admin_verified_by' => Auth::id(),
            ]);

            $interest->update(['funding_status' => 'payout_verified']);
        });

        return back()->with('success', 'Payout details verified. You can now record the disbursement.');
    }

    public function disburse(Request $request, Coin $coin, CoinInterest $interest): RedirectResponse
    {
        $this->ensureMatch($coin, $interest);

        if ($interest->funding_status !== 'payout_verified') {
            return back()->with('error', 'Verify the payout details before recording the disbursement.');
        }

        if (! $coin->hasTerms()) {
            return back()->with('error', 'This coin does not have agreed terms.');
        }

        $data = $request->validate([
            'first_payment_at' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $intervalDays = (int) $coin->installment_interval_days;
        $firstPaymentAt = isset($data['first_payment_at'])
            ? \Carbon\Carbon::parse($data['first_payment_at'])
            : now()->addDays($intervalDays);

        $interest->update([
            'funding_status' => 'funded',
            'funded_at' => now(),
            'funded_by' => Auth::id(),
            'funded_amount' => (float) $coin->request_amount,
            'installments_count' => $coin->installments_count,
            'installment_amount' => $coin->installment_amount,
            'installment_interval_days' => $intervalDays,
            'next_payment_due_at' => $firstPaymentAt,
        ]);

        return back()->with('success', 'Funding recorded. The repayment countdown has started.');
    }

    protected function ensureMatch(Coin $coin, CoinInterest $interest): void
    {
        if ($interest->coin_id !== $coin->id) {
            abort(404);
        }
    }
}
