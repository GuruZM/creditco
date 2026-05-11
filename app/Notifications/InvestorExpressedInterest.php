<?php

namespace App\Notifications;

use App\Models\CoinInterest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class InvestorExpressedInterest extends Notification
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
        $interest = $this->interest->loadMissing(['coin', 'user']);

        return [
            'kind' => 'investor_expressed_interest',
            'coin_id' => $interest->coin_id,
            'interest_id' => $interest->id,
            'investor_id' => $interest->user_id,
            'investor_name' => $interest->user?->name,
            'coin_amount' => (float) ($interest->coin?->request_amount ?? 0),
            'coin_currency' => 'ZMW',
            'message' => sprintf(
                '%s expressed interest in coin #%d.',
                $interest->user?->name ?? 'An investor',
                $interest->coin_id,
            ),
            'href' => '/admin/coins',
        ];
    }
}
