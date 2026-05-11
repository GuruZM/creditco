<?php

namespace App\Http\Requests\Borrower;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitRepaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('borrower') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maxKb = (int) config('billing.pop.max_kb', 5120);
        $mimes = implode(',', (array) config('billing.pop.mimes', ['jpg', 'jpeg', 'png', 'pdf']));

        return [
            'coin_interest_id' => ['required', 'integer', Rule::exists('coin_interests', 'id')],
            'amount' => ['required', 'numeric', 'min:1'],
            'paid_at' => ['required', 'date', 'before_or_equal:today'],
            'reference' => ['nullable', 'string', 'max:191'],
            'note' => ['nullable', 'string', 'max:1000'],
            'proof' => ['required', 'file', 'mimes:'.$mimes, 'max:'.$maxKb],
        ];
    }
}
