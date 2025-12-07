<?php

namespace App\Http\Controllers\Borrower;

use App\Http\Controllers\Controller;
use App\Models\Borrower;
use App\Models\Coin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CoinController extends Controller
{
     public function index(Request $request)
    {
        $user = Auth::user();

        /** @var \App\Models\Borrower|null $borrower */
        $borrower = Borrower::where('user_id', $user->id)->firstOrFail();

        $coins = $borrower->coins()
            ->orderByDesc('created_at')
            ->paginate(10)
            ->through(function (Coin $coin) {
                return [
                    'id'             => $coin->id,
                    'request'        => $coin->request,
                    'date'           => $coin->date?->toDateString(),
                    'purchase_order' => $coin->purchase_order,
                    'contract'       => $coin->contract,
                    'request_amount' => (float) $coin->request_amount,
                    'source'         => $coin->source,
                    'duration'       => $coin->duration,
                    'industry'       => $coin->industry,
                    'status'         => $coin->status,
                    'created_at'     => $coin->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('borrower/coins/index', [
            'coins' => $coins,
        ]);
    }

    /**
     * Store a newly created coin (funding request) by a borrower.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        /** @var \App\Models\Borrower|null $borrower */
        $borrower = Borrower::where('user_id', $user->id)->firstOrFail();

        $data = $request->validate([
            'request'        => ['required', 'string', 'max:5000'],
            'date'           => ['required', 'date'],
            'purchase_order' => ['nullable', 'string', 'max:255'],
            'contract'       => ['nullable', 'string', 'max:255'],
            'request_amount' => ['required', 'numeric', 'min:0.01'],
            'source'         => ['nullable', 'string', 'max:255'],
            'duration'       => ['required', 'string', 'max:255'],
            'industry'       => ['required', 'string', 'max:255'],
        ]);

        Coin::create([
            'borrower_id'    => $borrower->id,
            'request'        => $data['request'],
            'date'           => $data['date'],
            'purchase_order' => $data['purchase_order'] ?? null,
            'contract'       => $data['contract'] ?? null,
            'request_amount' => $data['request_amount'],
            'source'         => $data['source'] ?? null,
            'duration'       => $data['duration'],
            'industry'       => $data['industry'],
            'status'         => 'pending_review', // enum default for admin review
        ]);

        return redirect()
            ->to('/borrower/coins')
            ->with('success', 'Coin created and sent for admin review.');
    }
}
