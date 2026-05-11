<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectRepaymentRequest;
use App\Models\CoinRepayment;
use App\Notifications\RepaymentRejected;
use App\Notifications\RepaymentVerified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RepaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString() ?: 'pending_verification';
        $search = $request->string('search')->toString();

        $query = CoinRepayment::query()
            ->with([
                'submitter:id,name,email',
                'verifier:id,name',
                'interest:id,coin_id,user_id,installments_count,installments_paid,installment_amount,installment_interval_days,next_payment_due_at,funded_amount',
                'interest.coin:id,borrower_id,request,request_amount',
                'interest.coin.borrower:id,company_name',
                'interest.user:id,name',
            ])
            ->where('status', $status);

        if ($search) {
            $query->whereHas('submitter', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $repayments = $query
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(fn (CoinRepayment $r) => $this->present($r));

        $counts = [
            'pending_verification' => CoinRepayment::query()->where('status', 'pending_verification')->count(),
            'verified' => CoinRepayment::query()->where('status', 'verified')->count(),
            'rejected' => CoinRepayment::query()->where('status', 'rejected')->count(),
        ];

        return Inertia::render('admin/repayments/index', [
            'repayments' => $repayments,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'counts' => $counts,
        ]);
    }

    public function file(Request $request, CoinRepayment $repayment): StreamedResponse
    {
        abort_unless((bool) $repayment->proof_path, 404);

        $disk = Storage::disk((string) config('billing.pop.disk', 'local'));
        abort_unless($disk->exists($repayment->proof_path), 404);

        $filename = $repayment->proof_original_name ?: basename($repayment->proof_path);

        return $disk->response($repayment->proof_path, $filename, [
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    public function approve(Request $request, CoinRepayment $repayment): RedirectResponse
    {
        if ($repayment->status !== 'pending_verification') {
            return back()->with('error', 'This repayment has already been reviewed.');
        }

        DB::transaction(function () use ($repayment) {
            $interest = $repayment->interest()->lockForUpdate()->first();

            if (! $interest) {
                throw new \RuntimeException('Repayment is not attached to a loan.');
            }

            $repayment->fill([
                'status' => 'verified',
                'verified_by' => Auth::id(),
                'verified_at' => now(),
                'rejection_reason' => null,
            ])->save();

            $newPaid = (int) $interest->installments_paid + 1;
            $remaining = max(0, (int) $interest->installments_count - $newPaid);

            $nextDue = null;
            if ($remaining > 0) {
                $base = $interest->next_payment_due_at instanceof Carbon
                    ? $interest->next_payment_due_at->copy()
                    : Carbon::now();
                $nextDue = $base->addDays((int) $interest->installment_interval_days);
            }

            $interest->update([
                'installments_paid' => $newPaid,
                'next_payment_due_at' => $nextDue,
                'funding_status' => $remaining === 0 ? 'repaid' : $interest->funding_status,
            ]);
        });

        $repayment->refresh()->load('interest.user', 'submitter');

        $borrowerUser = $repayment->submitter;
        $investorUser = $repayment->interest?->user;

        if ($borrowerUser) {
            $borrowerUser->notify(new RepaymentVerified($repayment));
        }
        if ($investorUser) {
            $investorUser->notify(new RepaymentVerified($repayment));
        }

        return back()->with('success', 'Repayment verified. The schedule has been advanced.');
    }

    public function reject(RejectRepaymentRequest $request, CoinRepayment $repayment): RedirectResponse
    {
        if ($repayment->status !== 'pending_verification') {
            return back()->with('error', 'This repayment has already been reviewed.');
        }

        $reason = trim((string) $request->validated('reason'));

        $repayment->fill([
            'status' => 'rejected',
            'verified_by' => Auth::id(),
            'verified_at' => now(),
            'rejection_reason' => $reason,
        ])->save();

        $repayment->load('submitter');

        $repayment->submitter?->notify(new RepaymentRejected($repayment));

        return back()->with('success', 'Repayment rejected. The borrower has been notified.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function present(CoinRepayment $r): array
    {
        $interest = $r->interest;
        $coin = $interest?->coin;
        $borrower = $coin?->borrower;
        $investor = $interest?->user;

        return [
            'id' => $r->id,
            'amount' => (float) $r->amount,
            'currency' => $r->currency,
            'status' => $r->status,
            'installment_number' => $r->installment_number,
            'paid_at' => $r->paid_at?->toDateString(),
            'reference' => $r->reference,
            'note' => $r->note,
            'rejection_reason' => $r->rejection_reason,
            'has_proof' => (bool) $r->proof_path,
            'proof_original_name' => $r->proof_original_name,
            'created_at' => $r->created_at?->toDateTimeString(),
            'verified_at' => $r->verified_at?->toDateTimeString(),
            'verifier_name' => $r->verifier?->name,
            'submitter' => $r->submitter ? [
                'id' => $r->submitter->id,
                'name' => $r->submitter->name,
                'email' => $r->submitter->email,
            ] : null,
            'interest' => $interest ? [
                'id' => $interest->id,
                'installments_count' => (int) ($interest->installments_count ?? 0),
                'installments_paid' => (int) $interest->installments_paid,
                'installment_amount' => (float) ($interest->installment_amount ?? 0),
                'funded_amount' => (float) ($interest->funded_amount ?? 0),
                'next_payment_due_at' => $interest->next_payment_due_at?->toDateString(),
            ] : null,
            'coin' => $coin ? [
                'id' => $coin->id,
                'request' => $coin->request,
                'borrower_company' => $borrower?->company_name,
            ] : null,
            'investor_name' => $investor?->name,
        ];
    }
}
