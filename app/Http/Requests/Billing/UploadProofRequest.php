<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadProofRequest extends FormRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $mimes = implode(',', (array) config('billing.pop.mimes', ['jpg', 'jpeg', 'png', 'pdf']));
        $maxKb = (int) config('billing.pop.max_kb', 5120);

        return [
            'plan_id' => ['required', 'integer', Rule::exists('plans', 'id')->where('is_active', true)],
            'reference' => ['required', 'string', 'min:3', 'max:191'],
            'proof' => ['required', 'file', "mimes:{$mimes}", "max:{$maxKb}"],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $maxKb = (int) config('billing.pop.max_kb', 5120);
        $maxMb = number_format($maxKb / 1024, 1);

        return [
            'plan_id.required' => 'Choose a billing plan before uploading proof of payment.',
            'plan_id.exists' => 'The selected billing plan is invalid.',
            'reference.required' => 'Enter the bank transfer reference you used.',
            'proof.required' => 'Upload a proof of payment file.',
            'proof.file' => 'The proof of payment must be a valid file.',
            'proof.mimes' => 'Proof of payment must be a JPG, PNG or PDF file.',
            'proof.max' => "Proof of payment must be smaller than {$maxMb} MB.",
        ];
    }
}
