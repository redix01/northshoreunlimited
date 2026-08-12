<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Services\AccountSummary;
use App\Services\MarketData;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function index(MarketData $market)
    {
        $user    = Auth::user();
        $account = new AccountSummary($user, $market);

        return Inertia::render('Dashboard/Wallet', [
            'wallet'       => $account->wallet(),
            'transactions' => $account->transactions(30),
            'quotes'       => $market->quotes(),
            'wallets'      => Wallet::where('is_active', true)
                ->orderByRaw('CASE WHEN currency = ? THEN 0 ELSE 1 END', [config('markets.base', 'BTC')])
                ->orderBy('currency')
                ->orderBy('network')
                ->get(),
        ]);
    }
}
