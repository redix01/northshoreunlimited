<?php

namespace App\Http\Controllers;

use App\Models\Withdrawal;
use App\Models\Wallet;
use App\Services\AccountSummary;
use App\Services\MarketData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    public function index(MarketData $market)
    {
        $user = Auth::user();

        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Dashboard/Withdraw', [
            'withdrawals' => $withdrawals,
            'wallet'      => (new AccountSummary($user, $market))->wallet(),
            'wallets'     => Wallet::where('is_active', true)
                ->orderByRaw('CASE WHEN currency = ? THEN 0 ELSE 1 END', [config('markets.base', 'BTC')])
                ->orderBy('currency')
                ->orderBy('network')
                ->get(),
            'balance'     => (float) $user->balance,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'amount'         => ['required', 'numeric', 'min:10', 'max:9999999'],
            'wallet_id'      => ['required', 'exists:wallets,id'],
            'wallet_address' => ['required', 'string', 'max:255'],
        ]);

        $wallet = Wallet::where('is_active', true)->findOrFail($validated['wallet_id']);

        if ((float) $user->balance < (float) $validated['amount']) {
            return back()->withErrors(['amount' => 'Insufficient balance for this withdrawal.']);
        }

        $pendingCount = Withdrawal::where('user_id', $user->id)->where('status', 'pending')->count();
        if ($pendingCount >= 3) {
            return back()->withErrors(['amount' => 'Maximum 3 pending withdrawal requests allowed. Please wait for processing.']);
        }

        Withdrawal::create([
            'user_id'        => $user->id,
            'amount'         => $validated['amount'],
            'currency'       => $wallet->currency,
            'wallet_address' => $validated['wallet_address'],
            'network'        => $wallet->network,
            'status'         => 'pending',
        ]);

        // back(), not a fixed route: the form is also submitted from the
        // withdraw modal on the dashboard.
        return back()->with('success', 'Withdrawal request submitted. It will be reviewed from transaction history.');
    }
}
