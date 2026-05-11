<?php

namespace App\Http\Controllers\Admin;

use App\Billing\Models\Payment;
use App\Billing\Services\BillingManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\RejectProofRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubscriptionController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString() ?: 'pending';
        $search = $request->string('search')->toString();

        $statusFilter = match ($status) {
            'approved' => 'paid',
            'rejected' => 'failed',
            default => 'pending',
        };

        $query = Payment::query()
            ->where('gateway', 'manual')
            ->whereNotNull('pop_file_path')
            ->with(['user:id,name,email', 'subscription.plan', 'popReviewer:id,name'])
            ->where('status', $statusFilter);

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $payments = $query
            ->orderByDesc('pop_uploaded_at')
            ->paginate(15)
            ->through(fn (Payment $payment) => $this->presentPayment($payment));

        $counts = [
            'pending' => Payment::query()
                ->where('gateway', 'manual')
                ->whereNotNull('pop_file_path')
                ->where('status', 'pending')
                ->count(),
            'approved' => Payment::query()
                ->where('gateway', 'manual')
                ->whereNotNull('pop_file_path')
                ->where('status', 'paid')
                ->count(),
            'rejected' => Payment::query()
                ->where('gateway', 'manual')
                ->whereNotNull('pop_file_path')
                ->where('status', 'failed')
                ->count(),
        ];

        return Inertia::render('admin/subscriptions/index', [
            'payments' => $payments,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'counts' => $counts,
        ]);
    }

    public function file(Request $request, Payment $payment): StreamedResponse
    {
        abort_unless($payment->gateway === 'manual' && $payment->pop_file_path, 404);

        $disk = Storage::disk((string) config('billing.pop.disk', 'local'));

        abort_unless($disk->exists($payment->pop_file_path), 404);

        $filename = $payment->pop_file_original_name ?: basename($payment->pop_file_path);

        return $disk->response($payment->pop_file_path, $filename, [
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    public function approve(Request $request, Payment $payment, BillingManager $billing): RedirectResponse
    {
        abort_unless($payment->gateway === 'manual' && $payment->pop_file_path, 404);

        if ($payment->status === 'paid') {
            return back()->with('success', 'This proof of payment is already approved.');
        }

        DB::transaction(function () use ($payment, $request, $billing) {
            $now = now();

            $payment->fill([
                'status' => 'paid',
                'paid_at' => $payment->paid_at ?? $now,
                'pop_reviewed_by' => $request->user()->id,
                'pop_reviewed_at' => $now,
                'pop_rejection_reason' => null,
                'meta' => array_merge($payment->meta ?? [], [
                    'instruction' => null,
                    'reviewed_by' => $request->user()->id,
                    'review_outcome' => 'approved',
                    'reviewed_at' => $now->toIso8601String(),
                ]),
            ]);
            $payment->save();

            if ($payment->subscription) {
                $billing->subscriptions()->activate($payment->subscription, $payment->paid_at);
            }
        });

        return back()->with('success', 'Proof of payment approved. Subscription is now active.');
    }

    public function reject(RejectProofRequest $request, Payment $payment): RedirectResponse
    {
        abort_unless($payment->gateway === 'manual' && $payment->pop_file_path, 404);

        if ($payment->status === 'paid') {
            return back()->with('error', 'This proof of payment was already approved and cannot be rejected.');
        }

        $reason = trim((string) $request->validated('reason'));

        DB::transaction(function () use ($payment, $request, $reason) {
            $now = now();

            $payment->fill([
                'status' => 'failed',
                'pop_reviewed_by' => $request->user()->id,
                'pop_reviewed_at' => $now,
                'pop_rejection_reason' => $reason,
                'meta' => array_merge($payment->meta ?? [], [
                    'instruction' => null,
                    'reviewed_by' => $request->user()->id,
                    'review_outcome' => 'rejected',
                    'review_reason' => $reason,
                    'reviewed_at' => $now->toIso8601String(),
                ]),
            ]);
            $payment->save();
        });

        return back()->with('success', 'Proof of payment rejected. The user has been notified.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function presentPayment(Payment $payment): array
    {
        $payment->loadMissing(['user', 'subscription.plan', 'popReviewer']);

        return [
            'id' => $payment->id,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'status' => $payment->status,
            'reference' => $payment->pop_reference,
            'file_original_name' => $payment->pop_file_original_name,
            'has_file' => (bool) $payment->pop_file_path,
            'uploaded_at' => $payment->pop_uploaded_at?->toDateTimeString(),
            'reviewed_at' => $payment->pop_reviewed_at?->toDateTimeString(),
            'rejection_reason' => $payment->pop_rejection_reason,
            'user_note' => $payment->meta['user_note'] ?? null,
            'user' => $payment->user ? [
                'id' => $payment->user->id,
                'name' => $payment->user->name,
                'email' => $payment->user->email,
            ] : null,
            'plan' => $payment->subscription?->plan ? [
                'name' => $payment->subscription->plan->name,
                'interval' => $payment->subscription->plan->interval,
                'amount' => (float) $payment->subscription->plan->amount,
                'currency' => $payment->subscription->plan->currency,
            ] : null,
            'reviewer' => $payment->popReviewer ? [
                'id' => $payment->popReviewer->id,
                'name' => $payment->popReviewer->name,
            ] : null,
        ];
    }
}
