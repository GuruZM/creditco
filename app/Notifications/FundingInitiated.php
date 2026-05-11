<?php

namespace App\Notifications;

use App\Models\CoinInterest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class FundingInitiated extends Notification
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
        $interest = $this->interest->loadMissing('coin');

        return [
            'kind' => 'funding_initiated',
            'coin_id' => $interest->coin_id,
            'interest_id' => $interest->id,
            'coin_amount' => (float) ($interest->coin?->request_amount ?? 0),
            'coin_currency' => 'ZMW',
            'message' => 'A prospect has been found for your coin. Add your payout account to continue.',
            'href' => '/borrower/coins',
        ];
    }
}
