<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\Wallet;
use App\Services\AccountSummary;
use App\Services\MarketData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DepositController extends Controller
{
    public function index(MarketData $market)
    {
        $user = Auth::user();

        $deposits = Deposit::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Dashboard/Deposit', [
            'deposits' => $deposits,
            'wallet'   => (new AccountSummary($user, $market))->wallet(),
            'wallets'  => Wallet::where('is_active', true)
                ->orderByRaw('CASE WHEN currency = ? THEN 0 ELSE 1 END', [config('markets.base', 'BTC')])
                ->orderBy('currency')
                ->orderBy('network')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount'   => ['required', 'numeric', 'min:10', 'max:9999999'],
            'wallet_id' => ['required', 'exists:wallets,id'],
            'tx_hash'  => ['nullable', 'string', 'max:255'],
            'proof'    => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf,webp', 'max:5120'],
        ]);

        $wallet = Wallet::where('is_active', true)->findOrFail($validated['wallet_id']);

        $proofPath = null;
        if ($request->hasFile('proof') && $request->file('proof')->isValid()) {
            $proofPath = $request->file('proof')->store('deposits/proofs', 'public');
        }

        Deposit::create([
            'user_id'        => Auth::id(),
            'amount'         => $validated['amount'],
            'currency'       => $wallet->currency,
            'wallet_address' => $wallet->address,
            'tx_hash'        => $validated['tx_hash'] ?? null,
            'proof_path'     => $proofPath,
            'status'         => 'pending',
        ]);

        // back(), not a fixed route: the form is also submitted from the
        // deposit modal on the dashboard.
        return back()->with('success', 'Deposit request submitted. It will be reviewed from transaction history.');
    }
}
