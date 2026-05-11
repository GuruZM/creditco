<?php

namespace App\Notifications;

use App\Models\CoinInterest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PayoutAwaitingVerification extends Notification
{
    use Queueable;

    public function __construct(public CoinInterest $interest) {}

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
        $interest = $this->interest->loadMissing('coin.borrower');

        return [
            'kind' => 'payout_awaiting_verification',
            'coin_id' => $interest->coin_id,
            'interest_id' => $interest->id,
            'borrower_company' => $interest->coin?->borrower?->company_name,
            'message' => sprintf(
                'Borrower %s confirmed payout details for coin #%d. Continue funding.',
                $interest->coin?->borrower?->company_name ?? 'borrower',
                $interest->coin_id,
            ),
            'href' => sprintf(
                '/admin/coins/%d/interests/%d/funding',
                $interest->coin_id,
                $interest->id,
            ),
        ];
    }
}
