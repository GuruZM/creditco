<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;

class StartPaymentRequest extends FormRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'idempotency_key' => ['required', 'string', 'min:10'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plan_id.required' => 'Choose a billing plan before continuing.',
            'plan_id.exists' => 'The selected billing plan is invalid.',
            'idempotency_key.required' => 'A payment request key is required.',
            'idempotency_key.min' => 'The payment request key is invalid.',
        ];
    }
}
