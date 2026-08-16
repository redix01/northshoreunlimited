<?php

namespace App\Services;

use App\Models\Earning;
use App\Models\PortfolioSnapshot;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Accrues each client a configured percentage of their balance per day.
 *
 * Growth is a function of elapsed time, not of anyone being logged in: what a
 * client has earned at any instant is `balance × rate × days since the last
 * settlement`. Reads add that unsettled amount on the fly (see
 * `effectiveBalance`), so a dashboard is correct the moment it loads, and the
 * scheduled sweep folds it into the stored balance and writes one ledger row.
 *
 * Settling is therefore idempotent and self-healing: a run credits exactly the
 * period since the last one, so a missed night is picked up by the next run
 * rather than lost, and two runs in a row credit nothing the second time.
 */
class TopupService
{
    /**
     * Ceiling on how much elapsed time one settlement may pay out. Without it,
     * an instance that sat switched off for a year would credit a year of
     * accrual the moment it came back up.
     */
    public const MAX_CATCHUP_DAYS = 30.0;

    /**
     * Settle every client who is owed accrual.
     *
     * Walks the eligible set in chunks by primary key rather than loading all
     * clients: the sweep runs unattended, and its memory use should not grow
     * with the size of the book.
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
        $now = CarbonImmutable::now();

        User::where('role', 'user')
            ->where('status', '!=', 'suspended')
            ->where('topup_enabled', true)
            ->orderBy('id')
            ->chunkById(200, function ($clients) use ($force, $actorId, $now, &$credited, &$skipped, &$total) {
                foreach ($clients as $client) {
                    $amount = $this->settle($client, $actorId, $force, $now);

                    if ($amount === null) {
                        $skipped++;

                        continue;
                    }

                    $credited++;
                    $total += $amount;
                }
            });

        return ['credited' => $credited, 'skipped' => $skipped, 'total' => $total, 'reason' => null];
    }

    /**
     * Credit a single client whatever they have accrued since their last
     * settlement. Returns the amount credited, or null when nothing was owed.
     */
    public function runForUser(User $user, bool $force = false, ?int $actorId = null): ?float
    {
        return $this->settle($user, $actorId, $force);
    }

    /**
     * What the client has earned but not yet been credited, right now. Pure
     * arithmetic on two columns — no writes — so every screen can call it.
     */
    public function accruedFor(User $user, bool $force = false, ?CarbonImmutable $now = null): float
    {
        $rate = $force ? $this->forcedRateFor($user) : $this->activeRateFor($user);

        if ($rate <= 0) {
            return 0.0;
        }

        $days = $this->daysSinceSettlement($user, $now ?? CarbonImmutable::now());

        if ($days <= 0) {
            return 0.0;
        }

        return round($this->capped((float) $user->balance * $rate / 100) * $days, 2);
    }

    /**
     * The balance to show a client: what is banked plus what has accrued since
     * the last settlement. This is why a dashboard opened after a week away
     * already reads the right figure, with no catch-up write on page load.
     */
    public function effectiveBalance(User $user, ?CarbonImmutable $now = null): float
    {
        return round((float) $user->balance + $this->accruedFor($user, false, $now), 2);
    }

    /**
     * Fold the accrued amount into the stored balance and record it.
     *
     * Called by the scheduled sweep, and directly before anything that spends
     * the balance (a withdrawal, an admin adjustment) so those decisions are
     * made against a settled figure rather than a displayed one.
     */
    public function settle(User $user, ?int $actorId = null, bool $force = false, ?CarbonImmutable $now = null): ?float
    {
        $now    = $now ?? CarbonImmutable::now();
        $amount = $this->accruedFor($user, $force, $now);

        // Below a cent there is nothing to book; the accrual keeps running and
        // the next settlement picks it up, since the clock is not reset here.
        if ($amount < 0.01) {
            return null;
        }

        $rate          = $force ? $this->forcedRateFor($user) : $this->activeRateFor($user);
        $balanceBefore = (float) $user->balance;

        DB::transaction(function () use ($user, $amount, $rate, $balanceBefore, $actorId, $now) {
            $user->increment('balance', $amount);
            $user->forceFill(['last_topup_at' => $now])->save();

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
     * Elapsed days since the last settlement, capped so a long outage cannot
     * pay out an unbounded catch-up.
     */
    protected function daysSinceSettlement(User $user, CarbonImmutable $now): float
    {
        $since = $user->last_topup_at ?? $user->created_at;

        if (! $since) {
            return 0.0;
        }

        $elapsed = ($now->getTimestamp() - CarbonImmutable::parse($since)->getTimestamp()) / 86400;

        return max(0.0, min($elapsed, self::MAX_CATCHUP_DAYS));
    }

    /** The rate a forced run pays: ignores the master switch, not eligibility. */
    protected function forcedRateFor(User $user): float
    {
        return $this->isEnrolled($user) ? $user->effectiveTopupPercent() : 0.0;
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

    /**
     * The rate this client will actually be credited at, as a percentage, or
     * zero when no top-up is coming. The client portal quotes this, so what is
     * displayed as daily growth is the figure this service will really pay.
     */
    public function activeRateFor(User $user): float
    {
        if (!Setting::get('topup_enabled') || !$this->isEnrolled($user)) {
            return 0.0;
        }

        return $user->effectiveTopupPercent();
    }

    /**
     * What a run would credit this client right now, honouring the daily cap.
     * Ignores the once-a-day guard: this is the daily rate, not what is left
     * to pay today.
     */
    public function projectedAmountFor(User $user): float
    {
        return $this->capped(round((float) $user->balance * $this->activeRateFor($user) / 100, 2));
    }

    /** Applies the platform's per-client daily ceiling, when one is set. */
    protected function capped(float $amount): float
    {
        $cap = (float) Setting::get('topup_max_daily_amount');

        return $cap > 0 ? min($amount, $cap) : $amount;
    }

    /**
     * Whether this client is in scope for top-ups — every rule the sweep
     * applies except the platform master switch.
     */
    public function isEnrolled(User $user): bool
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

        return true;
    }
}
