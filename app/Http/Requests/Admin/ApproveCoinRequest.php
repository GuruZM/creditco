<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ApproveCoinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'interest_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'service_fee_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'installments_count' => ['required', 'integer', 'min:1', 'max:60'],
            'installment_interval_days' => ['required', 'integer', 'min:1', 'max:365'],
            'terms_text' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
