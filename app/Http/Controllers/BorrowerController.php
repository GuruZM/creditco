<?php

namespace App\Http\Controllers;

use App\Models\Borrower;
use App\Models\BorrowerDocumentVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BorrowerController extends Controller
{
       public function index(Request $request)
    {
        $requiredDocuments = Borrower::requiredDocuments();

        $borrowers = Borrower::with(['user', 'documentVerifications.verifier'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(function (Borrower $borrower) use ($requiredDocuments) {
                // Group verifications by document_type
                $verificationsByType = $borrower->documentVerifications
                    ->groupBy('document_type');

                $documents = [];

                foreach ($requiredDocuments as $type => $label) {
                    $verifications = $verificationsByType->get($type, collect());

                    /** @var \App\Models\BorrowerDocumentVerification|null $latest */
                    $latest = $verifications->sortByDesc('created_at')->first();

                    $documents[] = [
                        'type'        => $type,
                        'label'       => $label,
                        'verified'    => $latest !== null,
                        'note'        => $latest?->note,
                        'verified_at' => $latest?->created_at?->toDateTimeString(),
                        'verified_by' => $latest?->verifier?->name,
                    ];
                }

                return [
                    'id'         => $borrower->id,
                    'user_id'    => $borrower->user_id,
                    'company_name'       => $borrower->company_name,
                    'registration_number'=> $borrower->registration_number,
                    'industry'           => $borrower->industry,
                    'status'             => $borrower->status,
                    'contact_name'       => $borrower->contact_name,
                    'contact_email'      => $borrower->contact_email,
                    'contact_phone'      => $borrower->contact_phone,
                    'created_at'         => $borrower->created_at?->toDateTimeString(),

                    // Document URLs (built from stored paths)
                    'documents' => [
                        'registration_documents' => $borrower->registration_documents_path
                            ? asset('storage/' . $borrower->registration_documents_path)
                            : null,
                        'bank_statement' => $borrower->bank_statement_path
                            ? asset('storage/' . $borrower->bank_statement_path)
                            : null,
                        'company_printout' => $borrower->company_printout_path
                            ? asset('storage/' . $borrower->company_printout_path)
                            : null,
                        'contact_id_document' => $borrower->contact_id_document_path
                            ? asset('storage/' . $borrower->contact_id_document_path)
                            : null,
                    ],

                    // Per-document verification info
                    'document_verification' => $documents,

                    // All documents verified?
                    'all_documents_verified' => $borrower->hasAllRequiredDocumentsVerified(),
                ];
            });

        return Inertia::render('admin/borrowers/index', [
            'borrowers'          => $borrowers,
            'required_documents' => $requiredDocuments,
        ]);
    }

    /**
     * Verify a single document for a borrower.
     *
     * This is what the UI will call when admin clicks "Verify" next
     * to a specific document (e.g. bank statement).
     */
    public function verifyDocument(Request $request, Borrower $borrower)
    {
        $requiredDocuments = array_keys(Borrower::requiredDocuments());

        $data = $request->validate([
            'document_type' => ['required', 'string', 'in:' . implode(',', $requiredDocuments)],
            'note'          => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($borrower, $data) {
            BorrowerDocumentVerification::create([
                'borrower_id'   => $borrower->id,
                'document_type' => $data['document_type'],
                'verified_by'   => Auth::id(),
                'note'          => $data['note'] ?? null,
            ]);

            // Optional: if all docs are verified after this, you could auto-update status
            // but based on your spec, we keep a separate "full verify" step.
        });

        return redirect()->back()->with('success', 'Document verified successfully.');
    }

    /**
     * Final / full borrower verification.
     *
     * Only allowed if every required document has been verified.
     */
    public function verifyBorrower(Request $request, Borrower $borrower)
    {
        if (! $borrower->hasAllRequiredDocumentsVerified()) {
            return redirect()->back()->withErrors([
                'verification' => 'Verify all required documents before marking the borrower as fully verified.',
            ]);
        }

        $request->validate([
            'note' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($borrower, $request) {
            $borrower->update([
                'status' => 'verified',
            ]);

            // If you want a high-level audit log too, you could have a BorrowerVerification model.
            // For now we just rely on document-level logs + status.
        });

        return redirect()->back()->with('success', 'Borrower fully verified.');
    }
}
