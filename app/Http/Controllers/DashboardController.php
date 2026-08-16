<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\Wallet;
use App\Models\Withdrawal;
use App\Services\AccountSummary;
use App\Services\MarketData;
use App\Services\PortfolioMetrics;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(MarketData $market)
    {
        $user    = Auth::user();
        $metrics = new PortfolioMetrics($user, $market);
        $summary = $metrics->summary();
        $account = new AccountSummary($user, $market);

        $recentDeposits = Deposit::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $recentWithdrawals = Withdrawal::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $stats = [
            'total_deposited'     => $summary['deposited'],
            'total_withdrawn'     => $summary['withdrawn'],
            'pending_deposits'    => Deposit::where('user_id', $user->id)->where('status', 'pending')->count(),
            'pending_withdrawals' => Withdrawal::where('user_id', $user->id)->where('status', 'pending')->count(),
        ];

        return Inertia::render('Dashboard/Index', [
            'dashUser' => [
                'name'        => $user->name,
                'email'       => $user->email,
                'balance'     => (float) $user->balance,
                'is_verified' => (bool) $user->is_verified,
                'member_id'   => $user->member_id,
                'avatar'      => $user->avatar,
                'created_at'  => optional($user->created_at)->toIso8601String(),
            ],
            // Same shape the profile screen uses, so the verified details read
            // identically on both.
            'verification'      => $account->verification(),
            'summary'           => $summary,
            'highlights'        => $metrics->highlights(),
            'assets'            => $metrics->assets(),
            'series'            => $metrics->series(),
            'ranges'            => $metrics->ranges(),
            'quotes'            => $market->quotes(),
            'wallets'           => Wallet::where('is_active', true)
                ->orderByRaw("CASE WHEN currency = ? THEN 0 ELSE 1 END", [config('markets.base', 'BTC')])
                ->orderBy('currency')
                ->orderBy('network')
                ->get(),
            'recentDeposits'    => $recentDeposits,
            'recentWithdrawals' => $recentWithdrawals,
            'stats'             => $stats,
        ]);
    }
}
