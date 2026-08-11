<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\Earning;
use App\Models\Setting;
use App\Models\User;
use App\Models\Withdrawal;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_users'         => User::where('role', 'user')->count(),
            'active_users'        => User::where('role', 'user')->where('status', 'active')->count(),
            'suspended_users'     => User::where('role', 'user')->where('status', 'suspended')->count(),
            'total_balance'       => (float) User::where('role', 'user')->sum('balance'),
            'pending_deposits'    => Deposit::where('status', 'pending')->count(),
            'pending_withdrawals' => Withdrawal::where('status', 'pending')->count(),
            'total_deposited'     => (float) Deposit::where('status', 'approved')->sum('amount'),
            'total_withdrawn'     => (float) Withdrawal::whereIn('status', ['approved', 'completed'])->sum('amount'),
            'earnings_paid'       => (float) Earning::where('type', 'daily_topup')->sum('amount'),
            'earnings_today'      => (float) Earning::where('type', 'daily_topup')->whereDate('created_at', today())->sum('amount'),
            'credited_today'      => Earning::where('type', 'daily_topup')->whereDate('created_at', today())->count(),
        ];

        $pendingDeposits = Deposit::with('user')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $pendingWithdrawals = Withdrawal::with('user')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $recentUsers = User::where('role', 'user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $system = [
            'maintenance_mode'    => (bool) Setting::get('maintenance_mode'),
            'topup_enabled'       => (bool) Setting::get('topup_enabled'),
            'daily_topup_percent' => (float) Setting::get('daily_topup_percent'),
            'deposits_enabled'    => (bool) Setting::get('deposits_enabled'),
            'withdrawals_enabled' => (bool) Setting::get('withdrawals_enabled'),
            'last_topup_at'       => User::where('role', 'user')->max('last_topup_at'),
        ];

        return Inertia::render('Admin/Index', [
            'stats'              => $stats,
            'pendingDeposits'    => $pendingDeposits,
            'pendingWithdrawals' => $pendingWithdrawals,
            'recentUsers'        => $recentUsers,
            'system'             => $system,
        ]);
    }
}
