<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortfolioSnapshot;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->input('status', 'pending');

        $withdrawals = Withdrawal::with('user')
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Withdrawals', [
            'withdrawals' => $withdrawals,
            'filters'     => ['status' => $status],
        ]);
    }

    public function approve(Request $request, Withdrawal $withdrawal)
    {
        if ($withdrawal->status !== 'pending') {
            return back()->withErrors(['error' => 'This withdrawal has already been processed.']);
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $debit = $withdrawal->totalDebit();

        if ((float) $withdrawal->user->balance < $debit) {
            return back()->withErrors(['error' => 'User has insufficient balance to process this withdrawal.']);
        }

        $withdrawal->update([
            'status'      => 'approved',
            'admin_notes' => $validated['notes'] ?? null,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        $withdrawal->user->decrement('balance', $debit);

        PortfolioSnapshot::create([
            'user_id' => $withdrawal->user_id,
            'balance' => $withdrawal->user->fresh()->balance,
        ]);

        return back()->with('success', (float) $withdrawal->fee > 0
            ? 'Withdrawal approved. $' . number_format($debit, 2) . ' deducted including a $' . number_format((float) $withdrawal->fee, 2) . ' fee.'
            : 'Withdrawal approved and balance deducted.');
    }

    public function reject(Request $request, Withdrawal $withdrawal)
    {
        if ($withdrawal->status !== 'pending') {
            return back()->withErrors(['error' => 'This withdrawal has already been processed.']);
        }

        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:255'],
        ]);

        $withdrawal->update([
            'status'      => 'rejected',
            'admin_notes' => $validated['notes'],
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Withdrawal request rejected.');
    }
}
