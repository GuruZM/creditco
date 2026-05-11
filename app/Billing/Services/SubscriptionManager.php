<?php

namespace App\Billing\Services;

use App\Billing\Models\Plan;
use App\Billing\Models\Subscription;
use Carbon\CarbonInterface;

class SubscriptionManager
{
    public function createOrSwitch(int $userId, Plan $plan): Subscription
    {
        $attributes = [
            'plan_id' => $plan->id,
            'status' => 'pending_payment',
            'starts_at' => null,
            'renews_at' => null,
            'ends_at' => null,
            'grace_ends_at' => null,
            'gateway' => config('billing.driver', 'manual'),
            'last_payment_at' => null,
            'failed_attempts' => 0,
            'next_billing_attempt_at' => null,
        ];

        $subscription = Subscription::query()
            ->where('user_id', $userId)
            ->latest()
            ->first();

        if ($subscription && in_array($subscription->status, ['pending_payment', 'past_due'], true)) {
            $subscription->fill($attributes);
            $subscription->save();

            return $subscription->refresh();
        }

        return Subscription::create([
            'user_id' => $userId,
            ...$attributes,
        ]);
    }

    public function activate(Subscription $subscription, ?CarbonInterface $paidAt = null): Subscription
    {
        $subscription->loadMissing('plan');

        $paidAt ??= now();
        $startsAt = $subscription->starts_at ?? $paidAt;

        $subscription->fill([
            'status' => 'active',
            'starts_at' => $startsAt,
            'renews_at' => $this->nextRenewalAt($subscription, $startsAt),
            'ends_at' => null,
            'grace_ends_at' => null,
            'last_payment_at' => $paidAt,
            'failed_attempts' => 0,
            'next_billing_attempt_at' => null,
        ]);
        $subscription->save();

        return $subscription->refresh();
    }

    public function markPending(Subscription $subscription): Subscription
    {
        if ($subscription->status === 'active') {
            return $subscription;
        }

        $subscription->fill([
            'status' => 'pending_payment',
            'grace_ends_at' => null,
            'next_billing_attempt_at' => null,
        ]);
        $subscription->save();

        return $subscription->refresh();
    }

    public function markFailed(Subscription $subscription): Subscription
    {
        $updates = [
            'failed_attempts' => $subscription->failed_attempts + 1,
        ];

        if ($subscription->status === 'active') {
            $updates['status'] = 'past_due';
            $updates['grace_ends_at'] = now()->addDays((int) config('billing.grace_days', 7));

            $firstRetry = (int) collect(config('billing.retry_days', [1]))->first();
            $updates['next_billing_attempt_at'] = now()->addDays(max(1, $firstRetry));
        } else {
            $updates['status'] = 'pending_payment';
            $updates['grace_ends_at'] = null;
            $updates['next_billing_attempt_at'] = null;
        }

        $subscription->fill($updates);
        $subscription->save();

        return $subscription->refresh();
    }

    protected function nextRenewalAt(Subscription $subscription, CarbonInterface $startsAt): CarbonInterface
    {
        $plan = $subscription->plan;

        return match ($plan->interval) {
            'month' => $startsAt->copy()->addMonths($plan->interval_count),
            'quarter' => $startsAt->copy()->addMonths($plan->interval_count * 3),
            'year' => $startsAt->copy()->addYears($plan->interval_count),
            default => $startsAt->copy()->addMonths(1),
        };
    }
}
