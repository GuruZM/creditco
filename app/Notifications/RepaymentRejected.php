<?php

namespace App\Notifications;

use App\Models\CoinRepayment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RepaymentRejected extends Notification
{
    use Queueable;

    public function __construct(public CoinRepayment $repayment) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $repayment = $this->repayment->loadMissing(['interest.coin.borrower']);

        return [
            'kind' => 'repayment_rejected',
            'repayment_id' => $repayment->id,
            'coin_id' => $repayment->interest?->coin_id,
            'amount' => (float) $repayment->amount,
            'currency' => $repayment->currency,
            'reason' => $repayment->rejection_reason,
            'message' => 'A repayment proof was rejected. Please review the reason and resubmit.',
            'href' => '/borrower/repayments',
        ];
    }
}
