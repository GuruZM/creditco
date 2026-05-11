<?php

namespace App\Notifications;

use App\Models\CoinRepayment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RepaymentVerified extends Notification
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
        $repayment = $this->repayment->loadMissing(['interest.coin.borrower', 'interest.user', 'submitter']);
        $interest = $repayment->interest;
        $isBorrower = $notifiable instanceof User && $notifiable->id === $repayment->submitted_by;

        $href = $isBorrower ? '/borrower/repayments' : '/investor/coins';

        return [
            'kind' => 'repayment_verified',
            'repayment_id' => $repayment->id,
            'coin_id' => $interest?->coin_id,
            'amount' => (float) $repayment->amount,
            'currency' => $repayment->currency,
            'installment_number' => $repayment->installment_number,
            'installments_remaining' => $interest?->installmentsRemaining(),
            'borrower_company' => $interest?->coin?->borrower?->company_name,
            'message' => $isBorrower
                ? 'Your repayment has been verified. Thank you.'
                : 'A borrower repayment was verified on a coin you funded.',
            'href' => $href,
        ];
    }
}
