<?php

namespace App\Http\Controllers\Investor;

use App\Http\Controllers\Controller;
use App\Models\Coin;
use Illuminate\Http\Request;
use Inertia\Inertia;


class CoinController extends Controller
{
     public function index(Request $request)
    {
        $search   = $request->string('search')->toString();
        $industry = $request->string('industry')->toString();
        $minAmount = $request->input('min_amount');
        $maxAmount = $request->input('max_amount');

        $query = Coin::query()
            ->where('status', 'approved') // only approved coins
            ->orderByDesc('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('request', 'like', "%{$search}%")
                  ->orWhere('purchase_order', 'like', "%{$search}%")
                  ->orWhere('contract', 'like', "%{$search}%");
            });
        }

        if ($industry) {
            $query->where('industry', $industry);
        }

        if (!is_null($minAmount) && $minAmount !== '') {
            $query->where('request_amount', '>=', (float) $minAmount);
        }

        if (!is_null($maxAmount) && $maxAmount !== '') {
            $query->where('request_amount', '<=', (float) $maxAmount);
        }

        $coins = $query
            ->paginate(12)
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
                    // 🚫 No borrower details here – investor view is anonymous
                ];
            });

        $availableIndustries = Coin::query()
            ->where('status', 'approved')
            ->whereNotNull('industry')
            ->where('industry', '!=', '')
            ->distinct()
            ->orderBy('industry')
            ->pluck('industry')
            ->values()
            ->all();

        return Inertia::render('investor/coins/index', [
            'coins' => $coins,
            'filters' => [
                'search'     => $search,
                'industry'   => $industry,
                'min_amount' => $minAmount,
                'max_amount' => $maxAmount,
            ],
            'available_industries' => $availableIndustries,
        ]);
    }
}
