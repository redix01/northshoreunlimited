<?php

namespace App\Services;

use App\Models\Earning;
use App\Models\PortfolioSnapshot;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Credits every eligible client a configured percentage of their balance.
 *
 * The rate comes from the platform default unless the client carries an
 * override; a run is idempotent per calendar day unless forced.
 */
class TopupService
{
    /**
     * Run the top-up for all eligible clients.
     *
     * @return array{credited: int, skipped: int, total: float, reason: ?string}
     */
    public function runForAll(bool $force = false, ?int $actorId = null): array
    {
        if (!$force && !Setting::get('topup_enabled')) {
            return ['credited' => 0, 'skipped' => 0, 'total' => 0.0, 'reason' => 'Daily top-up is disabled in settings.'];
        }

        $credited = 0;
        $skipped = 0;
        $total = 0.0;

        User::where('role', 'user')->cursor()->each(function (User $user) use ($force, $actorId, &$credited, &$skipped, &$total) {
            $amount = $this->runForUser($user, $force, $actorId);

            if ($amount === null) {
                $skipped++;

                return;
            }

            $credited++;
            $total += $amount;
        });

        return ['credited' => $credited, 'skipped' => $skipped, 'total' => $total, 'reason' => null];
    }

    /**
     * Credit a single client. Returns the amount credited, or null when the
     * client was skipped.
     */
    public function runForUser(User $user, bool $force = false, ?int $actorId = null): ?float
    {
        if (!$this->isEligible($user, $force)) {
            return null;
        }

        $rate = $user->effectiveTopupPercent();
        $balanceBefore = (float) $user->balance;
        $amount = round($balanceBefore * $rate / 100, 2);

        $cap = (float) Setting::get('topup_max_daily_amount');
        if ($cap > 0 && $amount > $cap) {
            $amount = $cap;
        }

        if ($amount <= 0) {
            return null;
        }

        DB::transaction(function () use ($user, $amount, $rate, $balanceBefore, $actorId) {
            $user->increment('balance', $amount);
            $user->forceFill(['last_topup_at' => now()])->save();

            $balanceAfter = $balanceBefore + $amount;

            Earning::create([
                'user_id'        => $user->id,
                'type'           => 'daily_topup',
                'rate'           => $rate,
                'amount'         => $amount,
                'balance_before' => $balanceBefore,
                'balance_after'  => $balanceAfter,
                'note'           => sprintf('Daily top-up at %s%%', rtrim(rtrim(number_format($rate, 4, '.', ''), '0'), '.')),
                'created_by'     => $actorId,
            ]);

            PortfolioSnapshot::create([
                'user_id' => $user->id,
                'balance' => $balanceAfter,
            ]);
        });

        return $amount;
    }

    /**
     * Record a manual balance change made by an admin, keeping the earnings
     * ledger and the portfolio chart in step.
     */
    public function recordAdjustment(User $user, float $amount, string $type, ?string $note, ?int $actorId): Earning
    {
        return DB::transaction(function () use ($user, $amount, $type, $note, $actorId) {
            $balanceBefore = (float) $user->balance;

            if ($amount >= 0) {
                $user->increment('balance', $amount);
            } else {
                $user->decrement('balance', abs($amount));
            }

            $balanceAfter = $balanceBefore + $amount;

            $earning = Earning::create([
                'user_id'        => $user->id,
                'type'           => $type,
                'rate'           => null,
                'amount'         => $amount,
                'balance_before' => $balanceBefore,
                'balance_after'  => $balanceAfter,
                'note'           => $note,
                'created_by'     => $actorId,
            ]);

            PortfolioSnapshot::create([
                'user_id' => $user->id,
                'balance' => $balanceAfter,
            ]);

            return $earning;
        });
    }

    protected function isEligible(User $user, bool $force): bool
    {
        if ($user->role !== 'user' || $user->isSuspended() || !$user->topup_enabled) {
            return false;
        }

        if (Setting::get('topup_only_verified') && !$user->is_verified) {
            return false;
        }

        if ((float) $user->balance < (float) Setting::get('topup_min_balance')) {
            return false;
        }

        // One top-up per calendar day, unless an admin explicitly forces it.
        if (!$force && $user->last_topup_at?->isSameDay(now())) {
            return false;
        }

        return true;
    }
}
