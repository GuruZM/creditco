<?php

namespace App\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class GatewayWebhookEvent extends Model
{
    protected $fillable = [
        'gateway',
        'event_id',
        'type',
        'payload',
        'processed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'processed_at' => 'datetime',
    ];
}
