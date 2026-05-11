<?php

namespace App\Notifications;

use App\Models\CoinRepayment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RepaymentSubmitted extends Notification
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
        $repayment = $this->repayment->loadMissing(['interest.coin.borrower', 'submitter']);

        return [
            'kind' => 'repayment_submitted',
            'repayment_id' => $repayment->id,
            'coin_id' => $repayment->interest?->coin_id,
            'amount' => (float) $repayment->amount,
            'currency' => $repayment->currency,
            'borrower_company' => $repayment->interest?->coin?->borrower?->company_name,
            'borrower_name' => $repayment->submitter?->name,
            'message' => 'A borrower has submitted a repayment proof for verification.',
            'href' => '/admin/repayments',
        ];
    }
}
