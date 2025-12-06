<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Coin;

class CoinController extends Controller
{
    public function index(Request $request)
    {
        $search   = $request->string('search')->toString();
        $status   = $request->string('status')->toString();
        $industry = $request->string('industry')->toString();

        $query = Coin::query()
            ->with(['borrower.user']) // assumes Borrower has user() relation
            ->orderByDesc('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('request', 'like', "%{$search}%")
                    ->orWhere('purchase_order', 'like', "%{$search}%")
                    ->orWhereHas('borrower', function ($qb) use ($search) {
                        $qb->where('company_name', 'like', "%{$search}%")
                           ->orWhere('contact_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($industry) {
            $query->where('industry', $industry);
        }

        $coins = $query
            ->paginate(15)
            ->through(function (Coin $coin) {
                $borrower = $coin->borrower;

                return [
                    'id'              => $coin->id,
                    'request'         => $coin->request,
                    'date'            => $coin->date?->toDateString(),
                    'purchase_order'  => $coin->purchase_order,
                    'contract'        => $coin->contract,
                    'request_amount'  => (float) $coin->request_amount,
                    'source'          => $coin->source,
                    'duration'        => $coin->duration,
                    'industry'        => $coin->industry,
                    'status'          => $coin->status,
                    'borrower_company'=> $borrower?->company_name,
                    'borrower_name'   => $borrower?->contact_name,
                    'created_at'      => $coin->created_at?->toDateTimeString(),
                ];
            });

        // Distinct industries present in coins
        $availableIndustries = Coin::query()
            ->whereNotNull('industry')
            ->where('industry', '!=', '')
            ->distinct()
            ->orderBy('industry')
            ->pluck('industry')
            ->values()
            ->all();

        return Inertia::render('admin/coins/index', [
            'coins' => $coins,
            'filters' => [
                'search'   => $search,
                'status'   => $status,
                'industry' => $industry,
            ],
            'available_industries' => $availableIndustries,
        ]);
    }
}
