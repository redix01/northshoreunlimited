<?php

namespace Tests\Feature;

use App\Models\Deposit;
use App\Models\PortfolioSnapshot;
use App\Models\Setting;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Withdrawal;
use App\Services\MarketData;
use App\Services\PortfolioMetrics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Pin prices so the assertions do not depend on the upstream feed.
        // Growth shown to a client is whatever the top-up run will credit, so
        // the rate is pinned through the settings rather than through config.
        Setting::put('daily_topup_percent', 1.5);

        config([
            'markets.live'             => false,
            'markets.base'             => 'BTC',
            'markets.assets'           => [
                ['symbol' => 'BTC', 'name' => 'Bitcoin',  'id' => 'bitcoin',  'price' => 66400.00, 'change' => 0.0],
                ['symbol' => 'ETH', 'name' => 'Ethereum', 'id' => 'ethereum', 'price' => 1872.00,  'change' => -2.90],
            ],
        ]);
    }

    private function client(float $balance = 26316751.09, float $deposited = 4050400.00): User
    {
        $user = User::create([
            'name'     => 'David Martin',
            'username' => 'dmartin',
            'email'    => 'client@example.test',
            'password' => 'password',
            'role'     => 'user',
            'balance'  => $balance,
        ]);

        if ($deposited > 0) {
            Deposit::create([
                'user_id'  => $user->id,
                'amount'   => $deposited,
                'currency' => 'BTC',
                'status'   => 'approved',
            ]);
        }

        return $user->fresh();
    }

    private function metrics(User $user): PortfolioMetrics
    {
        return new PortfolioMetrics($user, app(MarketData::class));
    }

    public function test_the_dashboard_renders_for_a_signed_in_client(): void
    {
        $user = $this->client();

        $this->actingAs($user)
            ->get('/user/dashboard')
            ->assertOk();
    }

    public function test_guests_are_redirected_away_from_the_dashboard(): void
    {
        $this->get('/user/dashboard')->assertRedirect('/login');
    }

    public function test_period_changes_derive_from_the_balance_and_the_daily_topup(): void
    {
        $summary = $this->metrics($this->client())->summary();

        // 26,316,751.09 balance x 1.5% a day — the amount the nightly top-up
        // run credits, so the quoted growth matches what is actually paid.
        $this->assertSame(394751.27, $summary['daily']['value']);
        $this->assertSame(2763258.89, $summary['weekly']['value']);

        // Balance less principal, expressed against what was paid in.
        $this->assertSame(22266351.09, $summary['all_time']['value']);
        $this->assertSame(549.73, $summary['all_time']['percent']);

        // The 24h badge quotes the top-up rate itself.
        $this->assertSame(1.5, $summary['headline']['percent']);
    }

    public function test_balances_are_denominated_in_the_base_asset(): void
    {
        $summary = $this->metrics($this->client())->summary();

        $this->assertSame(66400.0, $summary['base_price']);
        $this->assertSame(61.0, $summary['deposited_base']);
        $this->assertSame(0.0, $summary['withdrawn_base']);
        $this->assertSame(396.3366128, $summary['available_base']);
    }

    public function test_funds_an_admin_credits_count_as_deposited(): void
    {
        $user   = $this->client(balance: 5000.00, deposited: 0);
        $topups = app(\App\Services\TopupService::class);

        $topups->recordAdjustment($user, 5000.00, 'manual_credit', 'Opening credit', null);
        // Yield is not a deposit, however it reached the balance.
        \App\Models\Earning::create([
            'user_id' => $user->id, 'type' => 'daily_topup', 'rate' => 1.5, 'amount' => 75.00,
            'balance_before' => 5000.00, 'balance_after' => 5075.00,
        ]);

        $summary = $this->metrics($user->fresh())->summary();

        $this->assertSame(5000.0, $summary['deposited']);
        $this->assertSame(0.0, $summary['withdrawn']);
    }

    public function test_funds_an_admin_debits_count_as_withdrawn(): void
    {
        $user   = $this->client(balance: 10000.00, deposited: 10000.00);
        $topups = app(\App\Services\TopupService::class);

        $topups->recordAdjustment($user, -2500.00, 'manual_debit', 'Correction', null);

        $summary = $this->metrics($user->fresh())->summary();

        $this->assertSame(10000.0, $summary['deposited']);
        $this->assertSame(2500.0, $summary['withdrawn']);
    }

    public function test_the_wallet_card_and_the_dashboard_agree_on_deposits(): void
    {
        $user = $this->client(balance: 5000.00, deposited: 1000.00);
        app(\App\Services\TopupService::class)->recordAdjustment($user, 4000.00, 'manual_credit', null, null);

        $summary = $this->metrics($user->fresh())->summary();
        $wallet  = (new \App\Services\AccountSummary($user->fresh(), app(MarketData::class)))->wallet();

        $this->assertSame(5000.0, $summary['deposited']);
        $this->assertSame($summary['deposited'], $wallet['deposited']);
    }

    public function test_withdrawals_count_toward_the_all_time_figure(): void
    {
        $user = $this->client();

        Withdrawal::create([
            'user_id'        => $user->id,
            'amount'         => 500000.00,
            'currency'       => 'BTC',
            'wallet_address' => 'bc1qexample',
            'status'         => 'completed',
        ]);

        $summary = $this->metrics($user->fresh())->summary();

        $this->assertSame(500000.0, $summary['withdrawn']);
        $this->assertSame(22766351.09, $summary['all_time']['value']);
    }

    public function test_every_range_ends_on_the_current_balance(): void
    {
        $user = $this->client();

        foreach (range(30, 1) as $daysAgo) {
            PortfolioSnapshot::create([
                'user_id' => $user->id,
                'balance' => 26316751.09 - 182268 * $daysAgo,
            ])->forceFill([
                'created_at' => now()->subDays($daysAgo),
                'updated_at' => now()->subDays($daysAgo),
            ])->save();
        }

        $metrics = $this->metrics($user->fresh());

        foreach ($metrics->series() as $range => $points) {
            $this->assertGreaterThan(1, count($points), "$range should be plottable");
            $this->assertSame(
                26316751.09,
                end($points)['value'],
                "$range should end on the live balance",
            );
        }
    }

    public function test_the_curve_never_reads_below_the_client_principal(): void
    {
        $metrics = $this->metrics($this->client());

        foreach ($metrics->series() as $range => $points) {
            foreach ($points as $point) {
                $this->assertGreaterThanOrEqual(
                    4050400.00,
                    $point['value'],
                    "$range dipped below the deposited principal",
                );
            }
        }
    }

    public function test_an_empty_account_reports_no_holdings(): void
    {
        $metrics = $this->metrics($this->client(balance: 0, deposited: 0));

        $this->assertSame([], $metrics->assets());
        $this->assertSame(0.0, $metrics->summary()['all_time']['percent']);
        $this->assertSame(0, $metrics->highlights()['assets']);
    }

    public function test_a_broker_request_is_recorded_and_returns_to_the_dashboard(): void
    {
        $user = $this->client();

        $this->actingAs($user)
            ->from('/user/dashboard')
            ->post('/user/broker-requests', ['amount' => '25000'])
            ->assertRedirect('/user/dashboard')
            ->assertSessionHas('success');

        $this->assertDatabaseHas('trade_requests', [
            'email'                => 'client@example.test',
            'estimated_btc_volume' => '25000.00',
        ]);
    }

    public function test_a_deposit_submitted_from_the_dashboard_returns_to_it(): void
    {
        $user   = $this->client();
        $wallet = Wallet::create([
            'name'      => 'Bitcoin',
            'currency'  => 'BTC',
            'network'   => 'Bitcoin',
            'address'   => 'bc1qexample',
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->from('/user/dashboard')
            ->post('/user/deposits', ['amount' => '25000', 'wallet_id' => $wallet->id])
            ->assertRedirect('/user/dashboard');

        $this->assertDatabaseHas('deposits', [
            'user_id' => $user->id,
            'status'  => 'pending',
        ]);
    }

    public function test_the_market_feed_falls_back_to_configured_prices(): void
    {
        $quotes = app(MarketData::class)->quotes();

        $this->assertCount(2, $quotes);
        $this->assertSame('BTC', $quotes[0]['symbol']);
        $this->assertFalse($quotes[0]['live']);
        $this->assertSame(66400.0, $quotes[0]['price']);
    }
}
