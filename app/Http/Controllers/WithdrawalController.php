<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Wallet;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Dashboard/Withdraw', [
            'withdrawals' => $withdrawals,
            'wallets'     => Wallet::where('is_active', true)
                ->orderBy('currency')
                ->orderBy('network')
                ->get(),
            'balance'     => (float) $user->balance,
            'limits'      => [
                'enabled'     => (bool) Setting::get('withdrawals_enabled'),
                'min'         => (float) Setting::get('withdrawal_min'),
                'max'         => (float) Setting::get('withdrawal_max'),
                'fee_percent' => (float) Setting::get('withdrawal_fee_percent'),
                'max_pending' => (int) Setting::get('withdrawal_max_pending'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!Setting::get('withdrawals_enabled')) {
            return back()->withErrors(['amount' => 'Withdrawals are temporarily unavailable. Please try again later.']);
        }

        if (Setting::get('withdrawal_require_verified') && !$user->is_verified) {
            return back()->withErrors(['amount' => 'Your account must be verified before you can withdraw.']);
        }

        $min = (float) Setting::get('withdrawal_min');
        $max = (float) Setting::get('withdrawal_max');

        $validated = $request->validate([
            'amount'         => ['required', 'numeric', "min:{$min}", "max:{$max}"],
            'wallet_id'      => ['required', 'exists:wallets,id'],
            'wallet_address' => ['required', 'string', 'max:255'],
        ]);

        $wallet = Wallet::where('is_active', true)->findOrFail($validated['wallet_id']);

        $fee = round((float) $validated['amount'] * (float) Setting::get('withdrawal_fee_percent') / 100, 2);

        if ((float) $user->balance < (float) $validated['amount'] + $fee) {
            return back()->withErrors([
                'amount' => $fee > 0
                    ? 'Insufficient balance for this withdrawal plus the $' . number_format($fee, 2) . ' fee.'
                    : 'Insufficient balance for this withdrawal.',
            ]);
        }

        $maxPending = (int) Setting::get('withdrawal_max_pending');
        $pendingCount = Withdrawal::where('user_id', $user->id)->where('status', 'pending')->count();
        if ($pendingCount >= $maxPending) {
            return back()->withErrors(['amount' => "Maximum {$maxPending} pending withdrawal requests allowed. Please wait for processing."]);
        }

        Withdrawal::create([
            'user_id'        => $user->id,
            'amount'         => $validated['amount'],
            'fee'            => $fee,
            'currency'       => $wallet->currency,
            'wallet_address' => $validated['wallet_address'],
            'network'        => $wallet->network,
            'status'         => 'pending',
        ]);

        return redirect()->route('withdrawals.index')
            ->with('success', 'Withdrawal request submitted. It will be reviewed from transaction history.');
    }
}
