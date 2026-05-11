<?php

namespace App\Http\Controllers\Borrower;

use App\Http\Controllers\Controller;
use App\Models\Borrower;
use App\Models\BorrowerPayoutMethod;
use App\Models\CoinInterest;
use App\Models\User;
use App\Notifications\PayoutAwaitingVerification;
use App\Notifications\PayoutMethodNeedsVerification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PayoutMethodController extends Controller
{
    public function show(Request $request): Response
    {
        $borrower = $this->resolveBorrower($request);

        $payoutMethod = $borrower->payoutMethod;

        $hasFundingNeeded = CoinInterest::query()
            ->whereHas('coin', fn ($q) => $q->where('borrower_id', $borrower->id))
            ->where('funding_status', '!=', 'interested')
            ->exists();

        return Inertia::render('borrower/payout-method/index', [
            'payout_method' => $payoutMethod ? $this->present($payoutMethod) : null,
            'has_funding_needed' => $hasFundingNeeded,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $borrower = $this->resolveBorrower($request);

        $data = $request->validate([
            'kind' => ['required', Rule::in(['bank', 'mobile_money'])],
            'account_name' => ['required', 'string', 'max:255'],
            'bank_name' => ['nullable', 'required_if:kind,bank', 'string', 'max:255'],
            'account_number' => ['nullable', 'required_if:kind,bank', 'string', 'max:64'],
            'branch' => ['nullable', 'string', 'max:255'],
            'mobile_provider' => ['nullable', 'required_if:kind,mobile_money', 'string', 'max:50'],
            'mobile_number' => ['nullable', 'required_if:kind,mobile_money', 'string', 'max:32'],
        ]);

        $payload = [
            'kind' => $data['kind'],
            'account_name' => $data['account_name'],
            'bank_name' => $data['kind'] === 'bank' ? $data['bank_name'] : null,
            'account_number' => $data['kind'] === 'bank' ? $data['account_number'] : null,
            'branch' => $data['kind'] === 'bank' ? ($data['branch'] ?? null) : null,
            'mobile_provider' => $data['kind'] === 'mobile_money' ? $data['mobile_provider'] : null,
            'mobile_number' => $data['kind'] === 'mobile_money' ? $data['mobile_number'] : null,
            // Editing always invalidates a previous self-confirmation; admin re-verification too.
            'borrower_confirmed_at' => null,
            'admin_verified_at' => null,
            'admin_verified_by' => null,
        ];

        $payoutMethod = $borrower->payoutMethod()->updateOrCreate(
            ['borrower_id' => $borrower->id],
            $payload,
        );

        $borrower->user?->notify(new PayoutMethodNeedsVerification($payoutMethod));

        return redirect()
            ->to('/borrower/payout-method')
            ->with('success', 'Payout details saved. Please verify them on the next screen.');
    }

    public function confirm(Request $request): RedirectResponse
    {
        $borrower = $this->resolveBorrower($request);
        $payoutMethod = $borrower->payoutMethod;

        if (! $payoutMethod) {
            return redirect()
                ->to('/borrower/payout-method')
                ->with('error', 'Add your payout details before verifying them.');
        }

        $advanced = collect();

        DB::transaction(function () use ($payoutMethod, $borrower, &$advanced) {
            $payoutMethod->update([
                'borrower_confirmed_at' => now(),
            ]);

            // Move every funding-initiated interest on this borrower's coins forward.
            $advanced = CoinInterest::query()
                ->whereHas('coin', fn ($q) => $q->where('borrower_id', $borrower->id))
                ->where('funding_status', 'funding_initiated')
                ->get();

            CoinInterest::query()
                ->whereIn('id', $advanced->pluck('id'))
                ->update(['funding_status' => 'awaiting_admin_funding']);
        });

        if ($advanced->isNotEmpty()) {
            $admins = User::role('admin')->get();
            foreach ($advanced as $interest) {
                $interest->refresh();
                Notification::send($admins, new PayoutAwaitingVerification($interest));
            }
        }

        return redirect()
            ->to('/borrower/payout-method')
            ->with('success', 'Payout details verified. The CreditCo team will continue with funding.');
    }

    protected function resolveBorrower(Request $request): Borrower
    {
        return Borrower::where('user_id', Auth::id())->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    protected function present(BorrowerPayoutMethod $payoutMethod): array
    {
        return [
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
        ];
    }
}
