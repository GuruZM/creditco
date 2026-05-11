<?php

namespace App\Http\Controllers\Borrower;

use App\Http\Controllers\Controller;
use App\Models\Borrower;
use App\Models\Coin;
use App\Models\CoinInterest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CoinController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        /** @var \App\Models\Borrower|null $borrower */
        $borrower = Borrower::where('user_id', $user->id)->firstOrFail();

        $coins = $borrower->coins()
            ->orderByDesc('created_at')
            ->paginate(10)
            ->through(function (Coin $coin) {
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
                    'created_at' => $coin->created_at?->toDateTimeString(),
                    'terms' => $coin->hasTerms() ? [
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
                        'set_at' => $coin->terms_set_at?->toDateTimeString(),
                        'borrower_agreed_at' => $coin->borrower_agreed_to_terms_at?->toDateTimeString(),
                    ] : null,
                ];
            });

        $required = Borrower::requiredDocuments();
        $verifiedTypes = $borrower->documentVerifications()
            ->whereIn('document_type', array_keys($required))
            ->distinct()
            ->pluck('document_type')
            ->all();

        $verification = [
            'can_create' => $borrower->hasAllRequiredDocumentsVerified(),
            'documents' => collect($required)
                ->map(fn (string $label, string $type) => [
                    'type' => $type,
                    'label' => $label,
                    'verified' => in_array($type, $verifiedTypes, true),
                ])
                ->values()
                ->all(),
        ];

        $payoutMethod = $borrower->payoutMethod;
        $hasActiveFunding = CoinInterest::query()
            ->whereHas('coin', fn ($q) => $q->where('borrower_id', $borrower->id))
            ->where('funding_status', '!=', 'interested')
            ->exists();

        $funding = [
            'has_active_funding' => $hasActiveFunding,
            'payout_method_present' => $payoutMethod !== null,
            'payout_method_confirmed' => $payoutMethod
                ? $payoutMethod->isBorrowerConfirmed()
                : false,
        ];

        return Inertia::render('borrower/coins/index', [
            'coins' => $coins,
            'verification' => $verification,
            'funding' => $funding,
        ]);
    }

    /**
     * Store a newly created coin (funding request) by a borrower.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        /** @var \App\Models\Borrower|null $borrower */
        $borrower = Borrower::where('user_id', $user->id)->firstOrFail();

        if (! $borrower->hasAllRequiredDocumentsVerified()) {
            return redirect()
                ->to('/borrower/coins')
                ->withErrors([
                    'verification' => 'You can only create a coin once all your onboarding documents have been verified.',
                ]);
        }

        $data = $request->validate([
            'request' => ['required', 'string', 'max:5000'],
            'date' => ['required', 'date'],
            'purchase_order' => ['nullable', 'string', 'max:255'],
            'purchase_order_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'contract' => ['nullable', 'string', 'max:255'],
            'request_amount' => ['required', 'numeric', 'min:0.01'],
            'source' => ['nullable', 'string', 'max:255'],
            'duration' => ['required', 'string', 'max:255'],
            'industry' => ['required', 'string', 'max:255'],
        ]);

        $purchaseOrderFile = $request->file('purchase_order_file');
        $purchaseOrderFilePath = $purchaseOrderFile
            ? $purchaseOrderFile->store('borrowers/coins/purchase_orders', 'public')
            : null;

        Coin::create([
            'borrower_id' => $borrower->id,
            'request' => $data['request'],
            'date' => $data['date'],
            'purchase_order' => $data['purchase_order'] ?? null,
            'purchase_order_file_path' => $purchaseOrderFilePath,
            'purchase_order_file_original_name' => $purchaseOrderFile?->getClientOriginalName(),
            'contract' => $data['contract'] ?? null,
            'request_amount' => $data['request_amount'],
            'source' => $data['source'] ?? null,
            'duration' => $data['duration'],
            'industry' => $data['industry'],
            'status' => 'pending_review', // enum default for admin review
        ]);

        return redirect()
            ->to('/borrower/coins')
            ->with('success', 'Coin created and sent for admin review.');
    }

    public function agreeToTerms(Request $request, Coin $coin): RedirectResponse
    {
        $borrower = Borrower::where('user_id', Auth::id())->firstOrFail();

        if ($coin->borrower_id !== $borrower->id) {
            abort(404);
        }

        if (! $coin->hasTerms()) {
            return back()->with('error', 'No terms have been set for this coin yet.');
        }

        if ($coin->borrowerHasAgreedToTerms()) {
            return back()->with('success', 'You have already agreed to these terms.');
        }

        $request->validate([
            'agreed' => ['required', 'accepted'],
        ]);

        $coin->update([
            'borrower_agreed_to_terms_at' => now(),
        ]);

        return back()->with('success', 'Thanks — your agreement has been recorded.');
    }
}
