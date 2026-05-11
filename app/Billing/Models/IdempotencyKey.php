<?php

namespace App\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class IdempotencyKey extends Model
{
    protected $table = 'idempotency_keys';

    protected $fillable = [
        'key',
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'request',
        'response',
        'status',
    ];

    protected $casts = [
        'request' => 'array',
        'response' => 'array',
    ];
}
