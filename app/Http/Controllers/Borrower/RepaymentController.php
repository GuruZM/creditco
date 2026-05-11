<?php

namespace App\Http\Controllers\Borrower;

use App\Http\Controllers\Controller;
use App\Http\Requests\Borrower\SubmitRepaymentRequest;
use App\Models\Borrower;
use App\Models\CoinInterest;
use App\Models\CoinRepayment;
use App\Models\User;
use App\Notifications\RepaymentSubmitted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RepaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $borrower = $this->resolveBorrower();

        $loans = CoinInterest::query()
            ->whereHas('coin', fn ($q) => $q->where('borrower_id', $borrower->id))
            ->whereNotNull('funded_at')
            ->with([
                'coin:id,request,request_amount,duration,industry,borrower_id',
                'repayments' => fn ($q) => $q->latest(),
                'repayments.verifier:id,name',
            ])
            ->orderBy('next_payment_due_at')
            ->get()
            ->map(fn (CoinInterest $i) => $this->presentLoan($i))
            ->all();

        return Inertia::render('borrower/repayments/index', [
            'loans' => $loans,
            'pop' => [
                'max_kb' => (int) config('billing.pop.max_kb', 5120),
                'mimes' => (array) config('billing.pop.mimes', ['jpg', 'jpeg', 'png', 'pdf']),
            ],
        ]);
    }

    public function store(SubmitRepaymentRequest $request): RedirectResponse
    {
        $borrower = $this->resolveBorrower();
        $validated = $request->validated();

        $interest = CoinInterest::query()
            ->with('coin:id,borrower_id')
            ->whereHas('coin', fn ($q) => $q->where('borrower_id', $borrower->id))
            ->whereNotNull('funded_at')
            ->find((int) $validated['coin_interest_id']);

        if (! $interest) {
            return back()->with('error', 'That loan was not found or has not been funded yet.');
        }

        if ($interest->isFullyRepaid()) {
            return back()->with('error', 'This loan has already been fully repaid.');
        }

        if ($interest->repayments()->where('status', 'pending_verification')->exists()) {
            return back()->with('error', 'You already have a payment awaiting verification on this loan.');
        }

        $disk = (string) config('billing.pop.disk', 'local');
        $directory = trim((string) config('billing.pop.directory', 'pops'), '/').'/repayments/'.$borrower->id;

        $storedPath = $request->file('proof')->store($directory, $disk);

        if ($storedPath === false) {
            return back()->with('error', 'Could not store the uploaded proof of payment. Please try again.');
        }

        try {
            $repayment = DB::transaction(function () use ($interest, $validated, $request, $storedPath) {
                $installmentNumber = (int) $interest->installments_paid + 1;

                return CoinRepayment::create([
                    'coin_interest_id' => $interest->id,
                    'submitted_by' => Auth::id(),
                    'installment_number' => $installmentNumber,
                    'amount' => $validated['amount'],
                    'currency' => 'ZMW',
                    'paid_at' => $validated['paid_at'],
                    'reference' => $validated['reference'] ?? null,
                    'note' => $validated['note'] ?? null,
                    'proof_path' => $storedPath,
                    'proof_original_name' => $request->file('proof')->getClientOriginalName(),
                    'status' => 'pending_verification',
                ]);
            });
        } catch (Throwable $e) {
            report($e);

            $resolvedDisk = Storage::disk($disk);
            if ($resolvedDisk->exists($storedPath)) {
                $resolvedDisk->delete($storedPath);
            }

            return back()->with('error', 'Could not record your repayment. Please try again.');
        }

        Notification::send(User::role('admin')->get(), new RepaymentSubmitted($repayment));

        return back()->with('success', 'Repayment submitted. CreditCo will verify and confirm with the funder.');
    }

    protected function resolveBorrower(): Borrower
    {
        return Borrower::where('user_id', Auth::id())->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    protected function presentLoan(CoinInterest $i): array
    {
        return [
            'id' => $i->id,
            'coin_id' => $i->coin_id,
            'coin_request' => $i->coin?->request,
            'industry' => $i->coin?->industry,
            'funded_amount' => (float) ($i->funded_amount ?? 0),
            'installments_count' => (int) ($i->installments_count ?? 0),
            'installments_paid' => (int) $i->installments_paid,
            'installments_remaining' => $i->installmentsRemaining(),
            'installment_amount' => (float) ($i->installment_amount ?? 0),
            'installment_interval_days' => (int) ($i->installment_interval_days ?? 0),
            'next_payment_due_at' => $i->next_payment_due_at?->toDateString(),
            'is_fully_repaid' => $i->isFullyRepaid(),
            'has_pending' => $i->repayments->contains(fn ($r) => $r->status === 'pending_verification'),
            'history' => $i->repayments->map(fn (CoinRepayment $r) => [
                'id' => $r->id,
                'installment_number' => $r->installment_number,
                'amount' => (float) $r->amount,
                'paid_at' => $r->paid_at?->toDateString(),
                'reference' => $r->reference,
                'note' => $r->note,
                'status' => $r->status,
                'rejection_reason' => $r->rejection_reason,
                'verified_at' => $r->verified_at?->toDateTimeString(),
                'verifier_name' => $r->verifier?->name,
                'has_proof' => (bool) $r->proof_path,
                'proof_original_name' => $r->proof_original_name,
                'created_at' => $r->created_at?->toDateTimeString(),
            ])->all(),
        ];
    }
}
