<?php

namespace App\Http\Controllers\Billing;

use App\Billing\Models\GatewayWebhookEvent;
use App\Billing\Models\Payment;
use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use App\Billing\Services\BillingManager;
use App\Billing\Services\Idempotency;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StartPaymentRequest;
use App\Http\Requests\Billing\UploadProofRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class BillingController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $plans = Plan::query()
            ->where('is_active', true)
            ->orderByRaw("case `interval` when 'month' then 1 when 'quarter' then 2 when 'year' then 3 else 4 end")
            ->get()
            ->map(fn (Plan $p) => [
                'id' => $p->id,
                'key' => $p->key,
                'name' => $p->name,
                'interval' => $p->interval,
                'amount' => (float) $p->amount,
                'currency' => $p->currency,
                'meta' => $p->meta,
            ]);

        $requestedPlanId = $request->integer('plan');
        $selectedPlanId = $plans->contains('id', $requestedPlanId)
            ? $requestedPlanId
            : null;

        $subscription = Subscription::query()
            ->with('plan')
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        $latestPayment = $subscription
            ? Payment::query()
                ->where('subscription_id', $subscription->id)
                ->latest()
                ->first()
            : null;

        return Inertia::render('billing/index', [
            'plans' => $plans,
            'selectedPlanId' => $selectedPlanId,
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'renews_at' => $subscription->renews_at?->toDateString(),
                'grace_ends_at' => $subscription->grace_ends_at?->toDateString(),
                'plan' => $subscription->plan ? [
                    'name' => $subscription->plan->name,
                    'interval' => $subscription->plan->interval,
                    'amount' => (float) $subscription->plan->amount,
                    'currency' => $subscription->plan->currency,
                ] : null,
            ] : null,
            'latestPayment' => $latestPayment ? [
                'id' => $latestPayment->id,
                'status' => $latestPayment->status,
                'amount' => (float) $latestPayment->amount,
                'currency' => $latestPayment->currency,
                'gateway' => $latestPayment->gateway,
                'created_at' => $latestPayment->created_at->toDateTimeString(),
                'meta' => $latestPayment->meta,
                'pop' => $latestPayment->pop_file_path ? [
                    'reference' => $latestPayment->pop_reference,
                    'file_original_name' => $latestPayment->pop_file_original_name,
                    'uploaded_at' => $latestPayment->pop_uploaded_at?->toDateTimeString(),
                    'reviewed_at' => $latestPayment->pop_reviewed_at?->toDateTimeString(),
                    'rejection_reason' => $latestPayment->pop_rejection_reason,
                ] : null,
            ] : null,
            'flash' => [
                'billing' => session('billing'),
            ],
            'gatewayEnabled' => (bool) config('billing.gateway_enabled', false),
            'bank' => [
                'account_name' => config('billing.bank.account_name'),
                'bank_name' => config('billing.bank.bank_name'),
                'account_number' => config('billing.bank.account_number'),
                'branch' => config('billing.bank.branch'),
                'swift_code' => config('billing.bank.swift_code'),
                'reference_hint' => config('billing.bank.reference_hint'),
            ],
            'pop' => [
                'max_kb' => (int) config('billing.pop.max_kb', 5120),
                'mimes' => (array) config('billing.pop.mimes', ['jpg', 'jpeg', 'png', 'pdf']),
            ],
        ]);
    }

    public function uploadProof(UploadProofRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $plan = Plan::query()->findOrFail((int) $validated['plan_id']);

        $disk = (string) config('billing.pop.disk', 'local');
        $directory = trim((string) config('billing.pop.directory', 'pops'), '/');

        $storedPath = $request->file('proof')->store(
            $directory.'/'.$user->id,
            $disk
        );

        if ($storedPath === false) {
            return back()->with('billing', [
                'ok' => false,
                'message' => 'Could not store the uploaded proof of payment. Please try again.',
                'data' => null,
            ]);
        }

        try {
            DB::transaction(function () use ($user, $plan, $validated, $request, $storedPath) {
                $subscription = Subscription::query()
                    ->where('user_id', $user->id)
                    ->latest()
                    ->first();

                $attributes = [
                    'plan_id' => $plan->id,
                    'status' => 'pending_payment',
                    'gateway' => 'manual',
                    'starts_at' => null,
                    'renews_at' => null,
                    'ends_at' => null,
                    'grace_ends_at' => null,
                    'failed_attempts' => 0,
                    'next_billing_attempt_at' => null,
                ];

                if ($subscription && in_array($subscription->status, ['pending_payment', 'past_due'], true)) {
                    $subscription->fill($attributes);
                    $subscription->save();
                } else {
                    $subscription = Subscription::create([
                        'user_id' => $user->id,
                        ...$attributes,
                    ]);
                }

                $reference = trim((string) $validated['reference']);
                $note = trim((string) ($validated['note'] ?? ''));

                Payment::create([
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                    'amount' => $plan->amount,
                    'currency' => $plan->currency,
                    'status' => 'pending',
                    'gateway' => 'manual',
                    'gateway_reference' => 'pop_'.Str::lower(Str::random(16)),
                    'idempotency_key' => 'pop_'.Str::uuid()->toString(),
                    'pop_file_path' => $storedPath,
                    'pop_file_original_name' => $request->file('proof')->getClientOriginalName(),
                    'pop_reference' => $reference,
                    'pop_uploaded_at' => now(),
                    'meta' => [
                        'instruction' => 'Awaiting admin review of the uploaded proof of payment.',
                        'reference' => $reference,
                        'user_note' => $note !== '' ? $note : null,
                    ],
                ]);
            });
        } catch (Throwable $exception) {
            report($exception);

            $resolvedDisk = Storage::disk($disk);
            if ($resolvedDisk->exists($storedPath)) {
                $resolvedDisk->delete($storedPath);
            }

            return back()->with('billing', [
                'ok' => false,
                'message' => 'Could not record your proof of payment. Please try again.',
                'data' => null,
            ]);
        }

        return redirect('/billing')->with('billing', [
            'ok' => true,
            'message' => 'Proof of payment uploaded. An admin will review it shortly.',
            'data' => null,
        ]);
    }

    public function checkout(Request $request, Payment $payment): Response|RedirectResponse
    {
        $user = $request->user();

        abort_if($payment->user_id !== $user->id, 403);

        if ($payment->status !== 'initiated' || $payment->gateway !== 'lenco') {
            return redirect('/billing');
        }

        $payment->loadMissing('subscription.plan');

        $plan = $payment->subscription?->plan;

        if (! $plan) {
            return redirect('/billing');
        }

        $checkout = $this->checkoutPayload($payment, $plan, $user->email);

        if (! $checkout) {
            return redirect('/billing');
        }

        return Inertia::render('billing/checkout', [
            'checkout' => $checkout,
        ]);
    }

    public function startPayment(
        StartPaymentRequest $request,
        BillingManager $billing,
        Idempotency $idem
    ): RedirectResponse {
        $user = $request->user();
        $driver = config('billing.driver', 'manual');

        if ($driver === 'lenco' && blank(config('lenco.public_key'))) {
            return back()->with('billing', [
                'ok' => false,
                'message' => 'LENCO_PUBLIC_KEY is not configured for checkout.',
                'data' => null,
            ]);
        }

        $validated = $request->validated();

        $plan = Plan::query()->findOrFail((int) $validated['plan_id']);
        $key = (string) $validated['idempotency_key'];

        try {
            $result = $idem->run(
                key: $key,
                action: 'subscription.start_payment',
                request: $validated,
                userId: $user->id,
                resourceType: 'user',
                resourceId: $user->id,
                callback: function () use ($user, $plan, $billing, $key) {
                    return DB::transaction(function () use ($user, $plan, $billing, $key) {
                        $subscription = $billing->subscriptions()->createOrSwitch(
                            userId: $user->id,
                            plan: $plan
                        );

                        $payment = $billing->driver()->chargeSubscription($subscription, $key);

                        return [
                            'ok' => true,
                            'subscription_id' => $subscription->id,
                            'payment_id' => $payment->id,
                            'payment_status' => $payment->status,
                            'checkout' => $this->checkoutPayload($payment, $plan, $user->email),
                        ];
                    });
                }
            );
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('billing', [
                'ok' => false,
                'message' => 'Unable to start payment. Please try again.',
                'data' => null,
            ]);
        }

        $ok = (bool) ($result['ok'] ?? false);
        $paymentId = $result['payment_id'] ?? null;

        if ($ok && $paymentId && ! empty($result['checkout'])) {
            return redirect("/billing/checkout/{$paymentId}");
        }

        return back()->with('billing', [
            'ok' => $ok,
            'message' => $ok
                ? 'Payment initiated. Follow the instructions below to complete payment.'
                : 'Unable to start payment. Please try again.',
            'data' => $result,
        ]);
    }

    public function verify(
        Request $request,
        Payment $payment,
        BillingManager $billing
    ): RedirectResponse {
        abort_if($payment->user_id !== $request->user()?->id, 403);

        if (blank($payment->gateway_reference)) {
            return back()->with('billing', [
                'ok' => false,
                'message' => 'This payment is missing a gateway reference.',
                'data' => null,
            ]);
        }

        try {
            $gatewayResponse = $billing
                ->driver($payment->gateway)
                ->verifyPayment($payment->gateway_reference);

            $gatewayData = $this->extractGatewayData($gatewayResponse);
            $gatewayStatus = $this->normalizeGatewayStatus(
                (string) Arr::get($gatewayData, 'status', Arr::get($gatewayResponse, 'status', 'pending'))
            );

            DB::transaction(function () use ($payment, $gatewayStatus, $gatewayData, $billing) {
                $this->syncPayment($payment, $gatewayStatus, $gatewayData, $billing);
            });

            return redirect('/billing')->with('billing', [
                'ok' => $gatewayStatus === 'successful',
                'message' => $this->messageForGatewayStatus($gatewayStatus),
                'data' => [
                    'payment_id' => $payment->id,
                    'gateway_status' => $gatewayStatus,
                ],
            ]);
        } catch (Throwable $exception) {
            report($exception);

            $this->markPaymentVerificationPending($payment, $exception, $billing);

            return redirect('/billing')->with('billing', [
                'ok' => false,
                'message' => $this->messageForVerificationFailure($exception),
                'data' => [
                    'payment_id' => $payment->id,
                    'gateway_status' => 'pending',
                ],
            ]);
        }
    }

    public function webhook(Request $request, BillingManager $billing): JsonResponse
    {
        if (! $this->hasValidWebhookSignature($request)) {
            return response()->json(['ok' => false], 401);
        }

        $payload = $request->json()->all();
        $eventType = (string) Arr::get($payload, 'event', '');
        $eventId = (string) Arr::get($payload, 'data.id', Arr::get($payload, 'data.reference', hash('sha256', $request->getContent())));

        $event = GatewayWebhookEvent::query()->firstOrCreate(
            [
                'gateway' => 'lenco',
                'event_id' => $eventId,
            ],
            [
                'type' => $eventType,
                'payload' => $payload,
            ],
        );

        if ($event->processed_at) {
            return response()->json(['ok' => true, 'duplicate' => true]);
        }

        $reference = (string) Arr::get($payload, 'data.reference', '');
        $payment = Payment::query()
            ->where('gateway', 'lenco')
            ->where('gateway_reference', $reference)
            ->first();

        if ($payment) {
            $gatewayStatus = $this->statusFromWebhookEvent($payload);

            DB::transaction(function () use ($payment, $gatewayStatus, $payload, $billing) {
                $this->syncPayment($payment, $gatewayStatus, $this->extractGatewayData($payload), $billing);
            });
        }

        $event->fill([
            'type' => $eventType,
            'payload' => $payload,
            'processed_at' => now(),
        ]);
        $event->save();

        return response()->json(['ok' => true]);
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function checkoutPayload(Payment $payment, Plan $plan, string $email): ?array
    {
        if ($payment->gateway !== 'lenco') {
            return null;
        }

        return [
            'payment_id' => $payment->id,
            'script_url' => config('lenco.script_url'),
            'key' => config('lenco.public_key'),
            'reference' => $payment->gateway_reference,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'email' => $email,
            'label' => sprintf('%s %s plan', $plan->name, $plan->intervalLabel()),
            'channels' => config('lenco.channels', ['card', 'mobile-money']),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function extractGatewayData(array $payload): array
    {
        $data = Arr::get($payload, 'data', $payload);

        return is_array($data) ? $data : [];
    }

    protected function normalizeGatewayStatus(string $status): string
    {
        return match (Str::lower($status)) {
            'successful', 'success', 'paid' => 'successful',
            'failed', 'cancelled', 'canceled', 'error' => 'failed',
            default => 'pending',
        };
    }

    protected function messageForGatewayStatus(string $status): string
    {
        return match ($status) {
            'successful' => 'Payment confirmed. Your subscription is now active.',
            'failed' => 'Payment failed. Try again or use another payment method.',
            default => 'Payment is still pending. We will update your access once Lenco confirms it.',
        };
    }

    protected function messageForVerificationFailure(Throwable $exception): string
    {
        $message = Str::lower($exception->getMessage());

        if (Str::contains($message, ['401', 'unauthorized'])) {
            return 'Lenco accepted the payment, but automatic verification was rejected by the gateway. Check LENCO_API_TOKEN and keep the payment pending until the webhook confirms it.';
        }

        return 'We could not verify the payment immediately. The payment is still pending and we will update your access once Lenco confirms it.';
    }

    protected function markPaymentVerificationPending(
        Payment $payment,
        Throwable $exception,
        BillingManager $billing
    ): void {
        $payment->loadMissing('subscription');

        if ($payment->status === 'paid') {
            return;
        }

        $meta = array_merge($payment->meta ?? [], [
            'reference' => $payment->gateway_reference,
            'gateway_status' => 'pending',
            'verification_error' => $exception->getMessage(),
            'verification_failed_at' => now()->toIso8601String(),
        ]);

        DB::transaction(function () use ($payment, $meta, $billing) {
            $payment->fill([
                'status' => 'pending',
                'meta' => $meta,
            ]);
            $payment->save();

            if ($payment->subscription) {
                $billing->subscriptions()->markPending($payment->subscription);
            }
        });
    }

    /**
     * @param  array<string, mixed>  $gatewayData
     */
    protected function syncPayment(
        Payment $payment,
        string $gatewayStatus,
        array $gatewayData,
        BillingManager $billing
    ): void {
        $payment->loadMissing('subscription.plan');

        $meta = array_merge($payment->meta ?? [], [
            'reference' => $payment->gateway_reference,
            'gateway_status' => $gatewayStatus,
            'verified_at' => now()->toIso8601String(),
            'gateway_data' => $gatewayData,
        ]);

        if ($payment->status === 'paid' && $gatewayStatus !== 'successful') {
            $payment->fill(['meta' => $meta]);
            $payment->save();

            return;
        }

        if ($gatewayStatus === 'successful') {
            $paidAt = $payment->paid_at ?? now();

            $payment->fill([
                'status' => 'paid',
                'paid_at' => $paidAt,
                'meta' => $meta,
            ]);
            $payment->save();

            if ($payment->subscription) {
                $billing->subscriptions()->activate($payment->subscription, $paidAt);
            }

            return;
        }

        if ($gatewayStatus === 'failed') {
            $payment->fill([
                'status' => 'failed',
                'meta' => $meta,
            ]);
            $payment->save();

            if ($payment->subscription) {
                $billing->subscriptions()->markFailed($payment->subscription);
            }

            return;
        }

        $payment->fill([
            'status' => 'pending',
            'meta' => $meta,
        ]);
        $payment->save();

        if ($payment->subscription) {
            $billing->subscriptions()->markPending($payment->subscription);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function statusFromWebhookEvent(array $payload): string
    {
        return match (Str::lower((string) Arr::get($payload, 'event', ''))) {
            'collection.successful' => 'successful',
            'collection.failed' => 'failed',
            default => $this->normalizeGatewayStatus((string) Arr::get($payload, 'data.status', 'pending')),
        };
    }

    protected function hasValidWebhookSignature(Request $request): bool
    {
        $signature = (string) $request->header('x-lenco-signature');
        $signingKey = config('lenco.webhook_signing_key');

        if (blank($signature) || blank($signingKey)) {
            return false;
        }

        $expected = hash_hmac('sha512', $request->getContent(), $signingKey);

        return hash_equals($expected, $signature);
    }
}
