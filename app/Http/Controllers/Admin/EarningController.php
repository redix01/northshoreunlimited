<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Earning;
use App\Models\Setting;
use App\Models\User;
use App\Services\TopupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EarningController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->input('type', 'all');

        $earnings = Earning::with('user:id,name,username,email')
            ->when($type !== 'all', fn ($q) => $q->where('type', $type))
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Earnings', [
            'earnings' => $earnings,
            'filters'  => ['type' => $type],
            'stats'    => [
                'paid_total'   => (float) Earning::where('type', 'daily_topup')->sum('amount'),
                'paid_today'   => (float) Earning::where('type', 'daily_topup')->whereDate('created_at', today())->sum('amount'),
                'credited_today' => Earning::where('type', 'daily_topup')->whereDate('created_at', today())->count(),
                'eligible_users' => User::where('role', 'user')
                    ->where('status', 'active')
                    ->where('topup_enabled', true)
                    ->count(),
            ],
            'config' => [
                'topup_enabled'       => (bool) Setting::get('topup_enabled'),
                'daily_topup_percent' => (float) Setting::get('daily_topup_percent'),
                'topup_min_balance'   => (float) Setting::get('topup_min_balance'),
            ],
        ]);
    }

    /**
     * Run the daily top-up immediately rather than waiting for the scheduler.
     */
    public function run(Request $request, TopupService $topups)
    {
        $validated = $request->validate([
            'force' => ['boolean'],
        ]);

        $force = $validated['force'] ?? false;
        $result = $topups->runForAll($force, Auth::id());

        if ($result['reason']) {
            return back()->withErrors(['error' => $result['reason']]);
        }

        return back()->with('success', sprintf(
            'Top-up run complete: %d client(s) credited $%s, %d skipped.',
            $result['credited'],
            number_format($result['total'], 2),
            $result['skipped'],
        ));
    }
}
