<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Inertia\Inertia;
use App\Models\Investor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class InvestorRegisterController extends Controller
{
       public function create()
    {
        return Inertia::render('auth/investor/index');
    }

        public function store(Request $request)
    {
        $validated = $request->validate([
            // Step 1: personal details
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'phone'      => ['required', 'string', 'max:50'],
            'email'      => ['required', 'string', 'email', 'max:255', 'unique:users,email'],

            // Step 2: ID document
            'id_document' => ['required', 'file', 'mimes:pdf'],

            // Step 3: industries (multi-select)
            'industries'   => ['required', 'array', 'min:1'],
            'industries.*' => ['string', 'max:150'],
        ]);

        $investor = DB::transaction(function () use ($request, $validated) {
            // 1️⃣ Create the user account
            $user = User::create([
                'name'     => $validated['first_name'].' '.$validated['last_name'],
                'email'    => $validated['email'],
                'password' => Hash::make('admin123'), // same temp password as borrowers for now
            ]);

            // Give them the investor role
            $user->assignRole('investor');

            // 2️⃣ Handle ID upload
            $idDocumentPath = $request->file('id_document')
                ? $request->file('id_document')->store('investors/id_documents', 'public')
                : null;

            // 3️⃣ Create investor profile
            $investor = Investor::create([
                'user_id'          => $user->id,
                'first_name'       => $validated['first_name'],
                'last_name'        => $validated['last_name'],
                'phone'            => $validated['phone'],
                'email'            => $validated['email'],
                'id_document_path' => $idDocumentPath,
                // assuming `industries` column is json or text
                'industries'       => $validated['industries'],
                // if you added a status column, you can uncomment:
                // 'status'           => 'pending_verification',
            ]);

            return $investor;
        });

        // 4️⃣ Log them in
        Auth::login($investor->user);

        // 5️⃣ Redirect – later you can point this to an investor dashboard or KYC status page
        return redirect('/dashboard');
    }
}
