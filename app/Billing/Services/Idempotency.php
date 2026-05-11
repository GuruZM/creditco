<?php

namespace App\Billing\Services;

use App\Billing\Models\IdempotencyKey;
use Closure;
use Illuminate\Support\Facades\DB;
use Throwable;

class Idempotency
{
    /**
     * Run an idempotent action.
     */
    public function run(
        string $key,
        string $action,
        array $request,
        int $userId,
        string $resourceType,
        int $resourceId,
        Closure $callback
    ): array {
        return DB::transaction(function () use (
            $key,
            $action,
            $request,
            $userId,
            $resourceType,
            $resourceId,
            $callback
        ) {
            // 🔒 Lock by key to prevent race conditions
            $existing = IdempotencyKey::where('key', $key)
                ->lockForUpdate()
                ->first();

            // If key already used → return stored response
            if ($existing) {
                return $existing->response ?? [
                    'ok' => false,
                    'message' => 'Duplicate request',
                ];
            }

            // Create idempotency record
            $record = IdempotencyKey::create([
                'key' => $key,
                'user_id' => $userId,
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'request' => $request,
                'status' => 'started',
            ]);

            try {
                // Execute business logic
                $response = $callback();

                $record->update([
                    'response' => $response,
                    'status' => 'completed',
                ]);

                return $response;
            } catch (Throwable $e) {
                $record->update([
                    'response' => [
                        'ok' => false,
                        'error' => $e->getMessage(),
                    ],
                    'status' => 'failed',
                ]);

                throw $e;
            }
        });
    }
}
