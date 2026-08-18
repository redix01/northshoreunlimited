<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\Earning;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserDocument;
use App\Models\Withdrawal;
use App\Services\TopupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
            // Verified and pending are read off the KYC flag rather than the
            // stored column, so legacy rows filter correctly too.
            ->when($status === 'verified', fn ($q) => $q->where('status', '!=', 'suspended')->where('is_verified', true))
            ->when($status === 'pending', fn ($q) => $q->where('status', 'pending')->where('is_verified', false))
            ->when($status === 'active', fn ($q) => $q->where('status', 'active')->where('is_verified', false))
            ->when($status === 'suspended', fn ($q) => $q->where('status', 'suspended'))
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

    public function show(User $user, TopupService $topups)
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
            // Matches the client's own dashboard: their deposits plus whatever
            // an admin credited by hand.
            'total_deposited'     => (float) Deposit::where('user_id', $user->id)->where('status', 'approved')->sum('amount')
                + Earning::creditedTo($user->id),
            'total_withdrawn'     => (float) Withdrawal::where('user_id', $user->id)->whereIn('status', ['approved', 'completed'])->sum('amount')
                + Earning::debitedFrom($user->id),
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
                // Earned since that settlement and already visible to the
                // client, but not yet banked.
                'accrued'           => $topups->accruedFor($user),
                'effective_balance' => $topups->effectiveBalance($user),
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
        ]);

        $user->update($validated);

        return back()->with('success', 'User updated successfully.');
    }

    /**
     * Account-level controls: standing, verification and the client's own
     * daily top-up rate. Standing is the single control for verification —
     * picking "verified" approves the client's details, "pending" puts them
     * back in the review queue.
     */
    public function updateSettings(Request $request, User $user)
    {
        abort_if($user->role === 'admin', 403);

        $validated = $request->validate([
            'status'              => ['required', Rule::in(User::STATUSES)],
            'verified_name'       => ['nullable', 'string', 'max:255'],
            'tax_id_match'        => ['boolean'],
            'topup_enabled'       => ['boolean'],
            'daily_topup_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $user->update([
            'status'              => $validated['status'],
            'topup_enabled'       => $validated['topup_enabled'] ?? false,
            // An empty override means "follow the platform default".
            'daily_topup_percent' => $validated['daily_topup_percent'] === null || $validated['daily_topup_percent'] === ''
                ? null
                : $validated['daily_topup_percent'],
        ]);

        if ($validated['status'] === 'verified') {
            $user->markVerified(
                $validated['verified_name'] ?? null,
                array_key_exists('tax_id_match', $validated) ? (bool) $validated['tax_id_match'] : null,
            );
        } elseif (in_array($validated['status'], ['pending', 'active'], true)) {
            // Moving off "verified" withdraws the claim; suspending does not,
            // so a blocked client keeps the KYC record already on file.
            $user->clearVerification();
        }

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

        // Settle first so the ledger's before/after figures — and the debit
        // check below — read against a banked balance, not a stale one.
        $topups->settle($user);
        $user->refresh();

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

    /**
     * Delete a client account for good.
     *
     * The database cascades their deposits, withdrawals, earnings, snapshots
     * and document rows, and nulls them out of the rows they only touched (a
     * deposit they approved, a client they referred). Files are not the
     * database's to clean up, so they go here.
     *
     * Guarded twice over: admins are never deletable, and the caller has to
     * echo back the client's username, so a mis-click cannot spend an account.
     */
    public function destroy(Request $request, User $user)
    {
        abort_if($user->role === 'admin', 403);

        $request->validate([
            'confirmation' => ['required', 'string'],
        ]);

        $handle = $user->username ?: $user->email;

        if (trim($request->input('confirmation')) !== $handle) {
            return back()->withErrors([
                'confirmation' => "Type {$handle} exactly to confirm this deletion.",
            ]);
        }

        $name = $user->name;

        DB::transaction(function () use ($user) {
            foreach (UserDocument::where('user_id', $user->id)->get() as $document) {
                Storage::disk('local')->delete($document->path);
            }

            if ($user->avatar && ! str_starts_with($user->avatar, User::AVATAR_PRESET_PREFIX)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $user->delete();
        });

        return redirect()
            ->route('admin.users')
            ->with('success', "{$name}'s account and all of its records were deleted.");
    }

}
