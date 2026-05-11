<?php

namespace App\Notifications;

use App\Models\Coin;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TermsAwaitingBorrowerAgreement extends Notification
{
    use Queueable;

    public function __construct(public Coin $coin) {}

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
        return [
            'kind' => 'terms_awaiting_borrower',
            'coin_id' => $this->coin->id,
            'interest_rate' => (float) $this->coin->interest_rate,
            'total_repayment_amount' => (float) $this->coin->total_repayment_amount,
            'installment_amount' => (float) $this->coin->installment_amount,
            'installments_count' => $this->coin->installments_count,
            'message' => 'CreditCo has set commercial terms on your coin. Please review and agree to continue.',
            'href' => '/borrower/coins',
        ];
    }
}
