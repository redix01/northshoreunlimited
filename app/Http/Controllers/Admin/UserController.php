<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\Earning;
use App\Models\Setting;
use App\Models\User;
use App\Models\Withdrawal;
use App\Services\TopupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status', 'all');

        $users = User::where('role', 'user')
            ->when($search, fn ($q) => $q->where(fn ($q2) => $q2
                ->where('name', 'like', "%{$search}%")
                ->orWhere('username', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
            ))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->withCount(['deposits', 'withdrawals'])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Users', [
            'users'   => $users,
            'filters' => ['search' => $search, 'status' => $status],
            'defaults' => [
                'daily_topup_percent' => (float) Setting::get('daily_topup_percent'),
            ],
        ]);
    }

    public function show(User $user)
    {
        abort_if($user->role === 'admin', 403);

        $deposits = Deposit::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get();

        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get();

        $earnings = Earning::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get();

        $stats = [
            'total_deposited'     => (float) Deposit::where('user_id', $user->id)->where('status', 'approved')->sum('amount'),
            'total_withdrawn'     => (float) Withdrawal::where('user_id', $user->id)->whereIn('status', ['approved', 'completed'])->sum('amount'),
            'total_earned'        => (float) Earning::where('user_id', $user->id)->where('type', 'daily_topup')->sum('amount'),
            'pending_deposits'    => Deposit::where('user_id', $user->id)->where('status', 'pending')->count(),
            'pending_withdrawals' => Withdrawal::where('user_id', $user->id)->where('status', 'pending')->count(),
        ];

        return Inertia::render('Admin/UserDetail', [
            'profileUser' => $user,
            'deposits'    => $deposits,
            'withdrawals' => $withdrawals,
            'earnings'    => $earnings,
            'stats'       => $stats,
            'topup'       => [
                'default_percent'   => (float) Setting::get('daily_topup_percent'),
                'effective_percent' => $user->effectiveTopupPercent(),
                'platform_enabled'  => (bool) Setting::get('topup_enabled'),
                'projected_amount'  => round((float) $user->balance * $user->effectiveTopupPercent() / 100, 2),
                'last_topup_at'     => $user->last_topup_at?->toIso8601String(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:users,username'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
        ]);

        $memberId = 'GCC-' . strtoupper(Str::random(8));
        while (User::where('member_id', $memberId)->exists()) {
            $memberId = 'GCC-' . strtoupper(Str::random(8));
        }

        User::create([
            'name'      => $validated['name'],
            'username'  => $validated['username'],
            'email'     => $validated['email'],
            'password'  => $validated['password'],
            'role'      => 'user',
            'member_id' => $memberId,
        ]);

        return back()->with('success', "Account created for {$validated['name']}.");
    }

    public function update(Request $request, User $user)
    {
        abort_if($user->role === 'admin', 403);

        $validated = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'phone'             => ['nullable', 'string', 'max:30'],
            'address'           => ['nullable', 'string', 'max:500'],
            'employment_status' => ['nullable', 'string', 'max:100'],
            'occupation'        => ['nullable', 'string', 'max:100'],
            'source_of_funds'   => ['nullable', 'string', 'max:100'],
            'pep_status'        => ['boolean'],
            'is_verified'       => ['boolean'],
        ]);

        $user->update($validated);

        return back()->with('success', 'User updated successfully.');
    }

    /**
     * Account-level controls: standing, verification and the client's own
     * daily top-up rate.
     */
    public function updateSettings(Request $request, User $user)
    {
        abort_if($user->role === 'admin', 403);

        $validated = $request->validate([
            'status'              => ['required', Rule::in(['active', 'suspended'])],
            'is_verified'         => ['boolean'],
            'topup_enabled'       => ['boolean'],
            'daily_topup_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $user->update([
            'status'              => $validated['status'],
            'is_verified'         => $validated['is_verified'] ?? false,
            'topup_enabled'       => $validated['topup_enabled'] ?? false,
            // An empty override means "follow the platform default".
            'daily_topup_percent' => $validated['daily_topup_percent'] === null || $validated['daily_topup_percent'] === ''
                ? null
                : $validated['daily_topup_percent'],
        ]);

        return back()->with('success', 'Account settings updated.');
    }

    /**
     * Credit or debit a client balance by hand, recorded in the ledger.
     */
    public function adjustBalance(Request $request, User $user, TopupService $topups)
    {
        abort_if($user->role === 'admin', 403);

        $validated = $request->validate([
            'direction' => ['required', Rule::in(['credit', 'debit'])],
            'amount'    => ['required', 'numeric', 'min:0.01', 'max:9999999'],
            'notes'     => ['nullable', 'string', 'max:255'],
        ]);

        $amount = (float) $validated['amount'];

        if ($validated['direction'] === 'debit') {
            if ((float) $user->balance < $amount) {
                return back()->withErrors(['amount' => 'Debit exceeds the client balance.']);
            }

            $amount = -$amount;
        }

        $topups->recordAdjustment(
            $user,
            $amount,
            $validated['direction'] === 'credit' ? 'manual_credit' : 'manual_debit',
            $validated['notes'] ?: 'Manual adjustment by admin',
            Auth::id(),
        );

        return back()->with('success', sprintf(
            '%s $%s %s %s.',
            $validated['direction'] === 'credit' ? 'Credited' : 'Debited',
            number_format(abs($amount), 2),
            $validated['direction'] === 'credit' ? 'to' : 'from',
            $user->name,
        ));
    }

    /**
     * Apply this client's daily top-up right away.
     */
    public function runTopup(Request $request, User $user, TopupService $topups)
    {
        abort_if($user->role === 'admin', 403);

        $credited = $topups->runForUser($user, $request->boolean('force'), Auth::id());

        if ($credited === null) {
            return back()->withErrors(['error' => 'Client is not eligible for a top-up right now (already credited today, disabled, suspended or below the minimum balance).']);
        }

        return back()->with('success', 'Credited $' . number_format($credited, 2) . " to {$user->name}.");
    }

    public function resetPassword(Request $request, User $user)
    {
        abort_if($user->role === 'admin', 403);

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user->update(['password' => $validated['password']]);

        return back()->with('success', "Password reset for {$user->name}.");
    }
}
