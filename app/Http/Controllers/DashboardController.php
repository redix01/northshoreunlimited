<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\Earning;
use App\Models\PortfolioSnapshot;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $snapshots = PortfolioSnapshot::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($s) => [
                'date'    => $s->created_at->format('M d'),
                'balance' => (float) $s->balance,
            ]);

        if ($snapshots->isEmpty() && (float) $user->balance > 0) {
            $snapshots = collect([['date' => now()->format('M d'), 'balance' => (float) $user->balance]]);
        }

        $recentDeposits = Deposit::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $recentWithdrawals = Withdrawal::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $stats = [
            'total_deposited'     => (float) Deposit::where('user_id', $user->id)->where('status', 'approved')->sum('amount'),
            'total_withdrawn'     => (float) Withdrawal::where('user_id', $user->id)->whereIn('status', ['approved', 'completed'])->sum('amount'),
            'total_earned'        => (float) Earning::where('user_id', $user->id)->where('type', 'daily_topup')->sum('amount'),
            'pending_deposits'    => Deposit::where('user_id', $user->id)->where('status', 'pending')->count(),
            'pending_withdrawals' => Withdrawal::where('user_id', $user->id)->where('status', 'pending')->count(),
        ];

        return Inertia::render('Dashboard/Index', [
            'dashUser'          => $user,
            'snapshots'         => $snapshots,
            'recentDeposits'    => $recentDeposits,
            'recentWithdrawals' => $recentWithdrawals,
            'stats'             => $stats,
        ]);
    }
}
