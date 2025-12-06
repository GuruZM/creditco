<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Investor;
use App\Models\InvestorVerification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
class InvestorController extends Controller
{
       public function index(Request $request)
    {
        $investors = Investor::with(['user', 'latestVerification.verifier'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(function (Investor $investor) {
                $verification = $investor->latestVerification;

                return [
                    'id'         => $investor->id,
                    'user_id'    => $investor->user_id,
                    'name'       => $investor->first_name . ' ' . $investor->last_name,
                    'email'      => $investor->email,
                    'phone'      => $investor->phone,
                    'status'     => $investor->status,
                    'industries' => $investor->industries,
                    'created_at' => $investor->created_at?->toDateTimeString(),
                    'id_document_url' => $investor->id_document_path
                        ? asset('storage/' . $investor->id_document_path)
                        : null,
                    'verification' => $verification ? [
                        'id'               => $verification->id,
                        'note'             => $verification->note,
                        'created_at'       => $verification->created_at?->toDateTimeString(),
                        'verified_by_name' => optional($verification->verifier)->name,
                    ] : null,
                ];
            });

        return Inertia::render('admin/investors/index', [
            'investors' => $investors,
        ]);
    }

    public function verify(Request $request, Investor $investor)
    {
        $data = $request->validate([
            'note' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($investor, $data) {
            InvestorVerification::create([
                'investor_id' => $investor->id,
                'verified_by' => Auth::id(),
                'note'        => $data['note'] ?? null,
            ]);

            $investor->update([
                'status' => 'verified',
            ]);
        });

        return redirect()->back()->with('success', 'Investor verified successfully.');
    }
}
