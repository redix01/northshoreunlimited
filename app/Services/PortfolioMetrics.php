<?php

namespace App\Services;

use App\Models\Deposit;
use App\Models\Earning;
use App\Models\PortfolioSnapshot;
use App\Models\User;
use App\Models\Withdrawal;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Derives every figure shown on the client dashboard from three inputs: the
 * balance an admin manages, the client's approved deposits/withdrawals, and
 * the daily top-up this account is actually enrolled in.
 *
 *   daily change    = the amount tonight's top-up run will credit
 *   weekly change   = daily change x 7
 *   all-time change = balance - deposits + withdrawals
 *
 * The rate comes from TopupService rather than a separate config value, so the
 * growth quoted here is the growth the client will really be paid — zero when
 * top-ups are switched off or the account is not eligible for them.
 */
class PortfolioMetrics
{
    /** Point counts and step sizes for each selectable chart range. */
    private const RANGES = [
        '1D'  => ['points' => 24, 'hours' => 1],
        '1W'  => ['points' => 28, 'hours' => 6],
        '1M'  => ['points' => 30, 'hours' => 24],
        '3M'  => ['points' => 45, 'hours' => 48],
        '1Y'  => ['points' => 52, 'hours' => 24 * 7],
        'ALL' => ['points' => 60, 'hours' => null],
    ];

    private float $balance;

    private float $deposited;

    private float $withdrawn;

    private float $rate;

    private CarbonImmutable $now;

    private CarbonImmutable $opened;

    /** @var Collection<int, array{at: CarbonImmutable, value: float}> */
    private Collection $snapshots;

    /** The amount tonight's run will credit; drives every growth figure here. */
    private float $daily;

    public function __construct(private User $user, private MarketData $market, ?TopupService $topups = null)
    {
        $topups = $topups ?? app(TopupService::class);

        $this->now     = CarbonImmutable::now();
        // Banked balance plus accrual earned since the last settlement, so the
        // figure is right whether the client last logged in a minute or a
        // month ago — the growth is in the clock, not in the page being open.
        $this->balance = $topups->effectiveBalance($user, $this->now);
        $this->rate    = $topups->activeRateFor($user) / 100;
        $this->daily   = $topups->projectedAmountFor($user);

        // Deposits the client made, plus anything an admin credited by hand —
        // both are money that landed in the account.
        $this->deposited = (float) Deposit::where('user_id', $user->id)
            ->where('status', 'approved')
            ->sum('amount')
            + Earning::creditedTo($user->id);

        $this->withdrawn = (float) Withdrawal::where('user_id', $user->id)
            ->whereIn('status', ['approved', 'completed'])
            ->sum('amount')
            + Earning::debitedFrom($user->id);

        $this->snapshots = PortfolioSnapshot::where('user_id', $user->id)
            ->orderBy('created_at')
            ->get(['balance', 'created_at'])
            ->map(fn ($snapshot) => [
                'at'    => CarbonImmutable::parse($snapshot->created_at),
                'value' => (float) $snapshot->balance,
            ]);

        $this->opened = $user->created_at
            ? CarbonImmutable::parse($user->created_at)
            : $this->now->subDays(30);
    }

    /** Headline balance card: total value, BTC equivalent, and period changes. */
    public function summary(): array
    {
        $basePrice = $this->basePrice();
        $daily     = $this->dailyChange();

        return [
            'base_symbol'      => config('markets.base', 'BTC'),
            'base_price'       => $basePrice,
            'daily_yield_rate' => $this->rate,

            'total_value'      => round($this->balance, 2),
            'total_value_base' => $this->toBase($this->balance),

            'deposited'        => round($this->deposited, 2),
            'deposited_base'   => $this->toBase($this->deposited),
            'withdrawn'        => round($this->withdrawn, 2),
            'withdrawn_base'   => $this->toBase($this->withdrawn),
            'available'        => round($this->balance, 2),
            'available_base'   => $this->toBase($this->balance),

            'daily'            => $this->change($daily, $this->balance),
            'weekly'           => $this->change($daily * 7, $this->balance),
            'all_time'         => $this->change(
                $this->balance - $this->deposited + $this->withdrawn,
                $this->deposited,
            ),

            // The 24h badge quotes the top-up rate itself rather than a share of book.
            'headline'         => [
                'value'   => round($daily, 2),
                'percent' => round($this->rate * 100, 2),
            ],
        ];
    }

    /** Small tiles beside the balance: asset count, yield, best/worst mover. */
    public function highlights(): array
    {
        $assets = $this->assets();
        $moves  = collect($assets)->sortBy('change');
        $daily  = $this->dailyChange();

        return [
            'assets'      => count($assets),
            'daily_yield' => $this->balance > 0 ? round($daily / $this->balance * 100, 2) : 0.0,
            'best'        => $moves->last() ? [
                'symbol'  => $moves->last()['symbol'],
                'change'  => $moves->last()['change'],
            ] : null,
            'worst'       => $moves->first() ? [
                'symbol'  => $moves->first()['symbol'],
                'change'  => $moves->first()['change'],
            ] : null,
        ];
    }

    /** Holdings table. The book is settled entirely in the base asset. */
    public function assets(): array
    {
        if ($this->balance <= 0) {
            return [];
        }

        $symbol = config('markets.base', 'BTC');
        $quote  = $this->market->quoteOf($symbol);
        $price  = $this->basePrice();

        return [[
            'symbol'       => $symbol,
            'name'         => $quote['name'] ?? $symbol,
            'amount'       => $this->toBase($this->balance),
            'price'        => round($price, 2),
            'change'       => (float) ($quote['change'] ?? 0.0),
            'value'        => round($this->balance, 2),
            'daily_return' => round($this->dailyChange(), 2),
            'yield_rate'   => round($this->rate * 100, 2),
            'allocation'   => 100.0,
        ]];
    }

    /** Portfolio performance curve, one series per selectable range. */
    public function series(): array
    {
        $series = [];

        foreach (self::RANGES as $key => $range) {
            $series[$key] = $this->buildSeries($key, $range);
        }

        return $series;
    }

    public function ranges(): array
    {
        return array_keys(self::RANGES);
    }

    private function buildSeries(string $key, array $range): array
    {
        $points = $range['points'];

        $start = $key === 'ALL'
            ? $this->opened->min($this->now->subDays(7))
            : $this->now->subSeconds((int) round($range['hours'] * 3600 * ($points - 1)));

        // Never plot from before the account existed, but always leave a
        // window wide enough to draw — including for a brand new account.
        $start = $start->max($this->opened)->min($this->now->subHour());

        $span = $this->now->getTimestamp() - $start->getTimestamp();

        // Driven by the span actually plotted, not by the range key: a 1Y view
        // of a three-month-old account would otherwise repeat month labels.
        $format = match (true) {
            $span <= 2 * 86400   => 'H:i',
            $span <= 180 * 86400 => 'M j',
            default              => "M 'y",
        };

        $out = [];
        for ($i = 0; $i < $points; $i++) {
            // Anchored on `now` rather than on `start`, so the final point
            // always lands on the present and reads the live balance.
            $at = $this->now->subSeconds((int) round($span * ($points - 1 - $i) / ($points - 1)));

            $out[] = [
                'at'    => $at->toIso8601String(),
                'label' => $at->format($format),
                'value' => round($this->valueAt($at), 2),
            ];
        }

        return $out;
    }

    /**
     * Balance at a moment in time: interpolated between recorded snapshots,
     * and extrapolated along the yield line outside of them. The floor is the
     * client's principal — the book never reads below what was paid in.
     */
    private function valueAt(CarbonImmutable $at): float
    {
        $daily = $this->dailyChange();
        $floor = min($this->deposited, $this->balance);

        if ($this->snapshots->isEmpty()) {
            $days = $this->daysBetween($at, $this->now);

            return max($this->balance - $daily * $days, $floor);
        }

        $first = $this->snapshots->first();
        $last  = $this->snapshots->last();

        if ($at->lessThanOrEqualTo($first['at'])) {
            return max($first['value'] - $daily * $this->daysBetween($at, $first['at']), $floor);
        }

        if ($at->greaterThanOrEqualTo($last['at'])) {
            // The live balance is authoritative for "now"; ramp toward it.
            $span = $this->daysBetween($last['at'], $this->now);
            $into = $this->daysBetween($last['at'], $at);
            $drift = $this->balance - $last['value'];

            return $span > 0
                ? $last['value'] + $drift * min($into / $span, 1.0)
                : $this->balance;
        }

        $previous = $first;
        foreach ($this->snapshots as $snapshot) {
            if ($snapshot['at']->greaterThan($at)) {
                $span = $this->daysBetween($previous['at'], $snapshot['at']);
                $into = $this->daysBetween($previous['at'], $at);
                $ratio = $span > 0 ? $into / $span : 0.0;

                return $previous['value'] + ($snapshot['value'] - $previous['value']) * $ratio;
            }
            $previous = $snapshot;
        }

        return $this->balance;
    }

    private function dailyChange(): float
    {
        return $this->daily;
    }

    private function daysBetween(CarbonImmutable $from, CarbonImmutable $to): float
    {
        return max(($to->getTimestamp() - $from->getTimestamp()) / 86400, 0.0);
    }

    private function basePrice(): float
    {
        $price = $this->market->priceOf(config('markets.base', 'BTC'));

        return $price > 0 ? $price : 1.0;
    }

    private function toBase(float $usd): float
    {
        return round($usd / $this->basePrice(), 8);
    }

    /** @return array{value: float, percent: float} */
    private function change(float $value, float $against): array
    {
        return [
            'value'   => round($value, 2),
            'percent' => $against > 0 ? round($value / $against * 100, 2) : 0.0,
        ];
    }
}
