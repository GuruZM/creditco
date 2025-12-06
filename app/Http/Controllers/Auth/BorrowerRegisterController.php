<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Inertia\Inertia;
use App\Models\Borrower;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BorrowerRegisterController extends Controller
{
     public function create()
{
    return Inertia::render('auth/borrower/index');
}

    /**
     * Handle borrower registration.
     */
   public function store(Request $request)
    {
        // Validate all fields from the multistep form
        $validated = $request->validate([
            // Company profile
            'company_name'                 => ['required', 'string', 'max:255'],
            'company_registration_number'  => ['required', 'string', 'max:255'],
            'company_type'                 => ['required', 'string', 'max:100'],
            'years_in_operation'           => ['required', 'integer', 'min:0'],
            'industry'                     => ['required', 'string', 'max:150'],

            // Files
            'reg_documents'                => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,pdf'],
            'bank_statement'               => ['required', 'file', 'mimes:pdf'],
            'company_printout'             => ['required', 'file', 'mimes:pdf,jpg,jpeg,png'],
            'contact_id_copy'              => ['required', 'file', 'mimes:pdf,jpg,jpeg,png'],

            // Contact details
            'contact_name'                 => ['required', 'string', 'max:255'],
            'contact_email'                => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'contact_phone'                => ['required', 'string', 'max:50'],
            'contact_address'              => ['nullable', 'string'],
        ]);

        // Wrap in a DB transaction so user + borrower stay in sync
        $borrower = DB::transaction(function () use ($request, $validated) {

            // 1️⃣ Create the user account
            $user = User::create([
                'name'     => $validated['contact_name'],
                'email'    => $validated['contact_email'],
                 'password' => Hash::make('admin123'),
            ]);

            // Assign borrower role (Spatie)
            $user->assignRole('borrower');

            // 2️⃣ Handle file uploads
            $regDocumentsPath = $request->file('reg_documents')
                ? $request->file('reg_documents')->store('borrowers/reg_documents', 'public')
                : null;

            $bankStatementPath = $request->file('bank_statement')
                ? $request->file('bank_statement')->store('borrowers/bank_statements', 'public')
                : null;

            $companyPrintoutPath = $request->file('company_printout')
                ? $request->file('company_printout')->store('borrowers/company_printouts', 'public')
                : null;

            $contactIdCopyPath = $request->file('contact_id_copy')
                ? $request->file('contact_id_copy')->store('borrowers/contact_ids', 'public')
                : null;

            // 3️⃣ Create borrower record
            $borrower = Borrower::create([
                'user_id'                      => $user->id,
                'company_name'                 => $validated['company_name'],
                'company_registration_number'  => $validated['company_registration_number'],
                'company_type'                 => $validated['company_type'],
                'years_in_operation'           => $validated['years_in_operation'],
                'industry'                     => $validated['industry'],

                'reg_documents_path'           => $regDocumentsPath,
                'bank_statement_path'          => $bankStatementPath,
                'company_printout_path'        => $companyPrintoutPath,
                'contact_id_copy_path'         => $contactIdCopyPath,

                'contact_name'                 => $validated['contact_name'],
                'contact_email'                => $validated['contact_email'],
                'contact_phone'                => $validated['contact_phone'],
                'contact_address'              => $validated['contact_address'] ?? null,

                // New borrower always starts as pending_verification
                'status'                       => 'pending_verification',
            ]);

            return $borrower;
        });

        // 4️⃣ Log in the new borrower user
        Auth::login($borrower->user);

        // 5️⃣ Redirect to payment (or dashboard for now)
        // Later you can change this to something like:
        // return redirect('/payments/borrower/' . $borrower->id);
        return redirect('/dashboard');
    }
}
