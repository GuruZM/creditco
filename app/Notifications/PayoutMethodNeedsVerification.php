<?php

namespace App\Notifications;

use App\Models\BorrowerPayoutMethod;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PayoutMethodNeedsVerification extends Notification
{
    use Queueable;

    public function __construct(public BorrowerPayoutMethod $payoutMethod) {}

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
            'kind' => 'payout_method_needs_verification',
            'payout_method_id' => $this->payoutMethod->id,
            'message' => 'Please verify the payout details you just submitted to continue with funding.',
            'href' => '/borrower/payout-method',
        ];
    }
}
