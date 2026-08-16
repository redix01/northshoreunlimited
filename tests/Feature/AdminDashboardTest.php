<?php

namespace Tests\Feature;

use App\Models\Deposit;
use App\Models\Earning;
use App\Models\Setting;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Withdrawal;
use App\Services\AccountSummary;
use App\Services\MarketData;
use App\Services\PortfolioMetrics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): User
    {
        return User::create([
            'name' => 'Admin', 'username' => 'admin', 'email' => 'admin@example.com',
            'password' => 'password', 'role' => 'admin',
        ]);
    }

    protected function client(array $attributes = []): User
    {
        // fresh(): status and topup_enabled come from column defaults, which an
        // unsaved-side model would not carry.
        return User::create(array_merge([
            'name' => 'Client', 'username' => 'client', 'email' => 'client@example.com',
            'password' => 'password', 'role' => 'user', 'balance' => 1000,
        ], $attributes))->fresh();
    }

    public function test_admin_pages_are_reachable(): void
    {
        $admin = $this->admin();
        $this->client();

        foreach (['/admin/dashboard', '/admin/users', '/admin/deposits', '/admin/withdrawals', '/admin/earnings', '/admin/settings'] as $url) {
            $this->actingAs($admin)->get($url)->assertOk();
        }
    }

    /**
     * Walks every write route in the admin group straight off the router, so a
     * controller method that goes missing — or a URL the UI posts to that no
     * longer exists — fails here rather than as a 404 in someone's face.
     */
    public function test_every_admin_action_route_resolves(): void
    {
        $admin  = $this->admin();
        $client = $this->client();

        $wallet = Wallet::create([
            'name' => 'USDT', 'currency' => 'USDT', 'network' => 'TRC-20',
            'address' => 'T123', 'is_active' => true,
        ]);
        $deposit = Deposit::create([
            'user_id' => $client->id, 'amount' => 100, 'currency' => 'USDT', 'status' => 'pending',
        ]);
        $withdrawal = Withdrawal::create([
            'user_id' => $client->id, 'amount' => 100, 'currency' => 'USDT',
            'wallet_address' => 'T999', 'status' => 'pending',
        ]);

        $bindings = [
            'user'       => $client->id,
            'wallet'     => $wallet->id,
            'deposit'    => $deposit->id,
            'withdrawal' => $withdrawal->id,
        ];

        $checked = 0;

        foreach (app('router')->getRoutes() as $route) {
            if (!str_starts_with($route->uri(), 'admin')) {
                continue;
            }

            $writes = array_values(array_intersect($route->methods(), ['POST', 'PUT', 'PATCH', 'DELETE']));
            if (!$writes) {
                continue;
            }

            $uri = preg_replace_callback(
                '/\{(\w+)\??\}/',
                fn ($match) => $bindings[$match[1]] ?? 1,
                $route->uri(),
            );

            $method   = $writes[0];
            $response = $this->actingAs($admin)->call($method, "/{$uri}");
            $status   = $response->getStatusCode();

            $this->assertNotSame(404, $status, "{$method} /{$uri} is not routed");
            $this->assertNotSame(405, $status, "{$method} /{$uri} rejects its own verb");
            $this->assertLessThan(500, $status, "{$method} /{$uri} blew up with {$status}");

            $checked++;
        }

        // Guards the loop itself: a matcher that silently matches nothing
        // would otherwise let this test pass while checking zero routes.
        $this->assertGreaterThanOrEqual(12, $checked);
    }

    public function test_clients_cannot_reach_the_admin_panel(): void
    {
        $this->actingAs($this->client())->get('/admin/settings')->assertForbidden();
    }

    public function test_settings_can_be_saved_and_are_read_back(): void
    {
        $payload = collect(Setting::DEFINITIONS)
            ->map(fn ($definition) => $definition['default'])
            ->all();

        $payload['daily_topup_percent'] = 2.5;
        $payload['deposit_min'] = 50;

        $this->actingAs($this->admin())
            ->put('/admin/settings', $payload)
            ->assertRedirect();

        $this->assertSame(2.5, Setting::get('daily_topup_percent'));
        $this->assertSame(50.0, Setting::get('deposit_min'));
    }

    public function test_a_full_day_of_accrual_credits_the_configured_percentage(): void
    {
        $client = $this->client(['balance' => 2000]);

        $this->travel(1)->days();
        $this->artisan('balance:topup')->assertSuccessful();

        $client->refresh();
        $this->assertSame('2030.00', $client->balance);          // 1.5% of 2000
        $this->assertSame(1, Earning::where('user_id', $client->id)->count());

        // Immediately re-running settles nothing: the clock, not the calendar,
        // decides what is owed.
        $this->artisan('balance:topup')->assertSuccessful();

        $this->assertSame('2030.00', $client->fresh()->balance);
        $this->assertSame(1, Earning::where('user_id', $client->id)->count());
    }

    public function test_accrual_is_proportional_to_the_time_elapsed(): void
    {
        $client = $this->client(['balance' => 2000]);

        $this->travel(12)->hours();
        $this->artisan('balance:topup')->assertSuccessful();

        // Half a day at 1.5% is 0.75%.
        $this->assertSame('2015.00', $client->fresh()->balance);
    }

    public function test_a_missed_run_is_caught_up_rather_than_lost(): void
    {
        $client = $this->client(['balance' => 1000]);

        // Three days pass with the scheduler down.
        $this->travel(3)->days();
        $this->artisan('balance:topup')->assertSuccessful();

        // 3 × 1.5% of 1000, credited in one settlement.
        $this->assertSame('1045.00', $client->fresh()->balance);
        $this->assertSame(1, Earning::where('user_id', $client->id)->count());
    }

    public function test_a_long_outage_cannot_pay_out_more_than_the_catch_up_ceiling(): void
    {
        $client = $this->client(['balance' => 1000]);

        $this->travel(400)->days();
        $this->artisan('balance:topup')->assertSuccessful();

        // Capped at 30 days: 30 × 1.5% of 1000 = 450.
        $this->assertSame('1450.00', $client->fresh()->balance);
    }

    public function test_the_balance_a_client_sees_grows_without_anyone_signing_in(): void
    {
        $client  = $this->client(['balance' => 1000]);
        $topups  = app(\App\Services\TopupService::class);
        $opening = $topups->effectiveBalance($client);

        $this->travel(6)->hours();

        // No request, no settlement — only time has passed.
        $this->assertSame(1000.0, $opening);
        $this->assertSame(1003.75, $topups->effectiveBalance($client->fresh()));
        $this->assertSame('1000.00', $client->fresh()->balance);
    }

    public function test_per_client_rate_overrides_the_platform_default(): void
    {
        $client = $this->client(['balance' => 1000, 'daily_topup_percent' => 5]);

        $this->travel(1)->days();
        $this->artisan('balance:topup')->assertSuccessful();

        $this->assertSame('1050.00', $client->fresh()->balance);
    }

    public function test_disabled_or_suspended_clients_are_skipped(): void
    {
        $disabled = $this->client(['username' => 'disabled', 'email' => 'disabled@example.com', 'topup_enabled' => false]);
        $suspended = $this->client(['username' => 'suspended', 'email' => 'suspended@example.com', 'status' => 'suspended']);

        $this->artisan('balance:topup')->assertSuccessful();

        $this->assertSame('1000.00', $disabled->fresh()->balance);
        $this->assertSame('1000.00', $suspended->fresh()->balance);
    }

    public function test_balances_below_the_minimum_are_skipped(): void
    {
        Setting::put('topup_min_balance', 500);
        $client = $this->client(['balance' => 100]);

        $this->artisan('balance:topup')->assertSuccessful();

        $this->assertSame('100.00', $client->fresh()->balance);
    }

    public function test_admin_can_trigger_a_topup_run_from_the_panel(): void
    {
        $client = $this->client(['balance' => 1000]);
        $this->travel(1)->days();

        $this->actingAs($this->admin())
            ->post('/admin/earnings/run', ['force' => false])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame('1015.00', $client->fresh()->balance);
    }

    public function test_a_topup_run_is_refused_while_topups_are_disabled(): void
    {
        Setting::put('topup_enabled', false);
        $client = $this->client(['balance' => 1000]);

        $this->actingAs($this->admin())
            ->post('/admin/earnings/run', ['force' => false])
            ->assertSessionHasErrors('error');

        $this->assertSame('1000.00', $client->fresh()->balance);
    }

    public function test_deposits_are_credited_immediately_when_auto_approve_is_on(): void
    {
        Setting::put('deposit_auto_approve', true);

        $client = $this->client(['balance' => 1000]);
        $wallet = \App\Models\Wallet::create(['name' => 'USDT', 'currency' => 'USDT', 'network' => 'TRC-20', 'address' => 'T123', 'is_active' => true]);

        $this->actingAs($client)
            ->post('/user/deposits', ['amount' => 250, 'wallet_id' => $wallet->id])
            ->assertRedirect();

        $this->assertSame('1250.00', $client->fresh()->balance);
        $this->assertSame('approved', \App\Models\Deposit::where('user_id', $client->id)->firstOrFail()->status);
    }

    public function test_the_portal_quotes_the_rate_the_topup_run_actually_pays(): void
    {
        Setting::put('daily_topup_percent', 2);
        $client = $this->client(['balance' => 1000]);

        $summary = (new PortfolioMetrics($client, app(MarketData::class)))->summary();

        // Quoted growth …
        $this->assertSame(2.0, $summary['headline']['percent']);
        $this->assertSame(20.0, $summary['daily']['value']);

        // … is exactly what a day of accrual credits.
        $this->travel(1)->days();
        $this->artisan('balance:topup')->assertSuccessful();
        $this->assertSame('1020.00', $client->fresh()->balance);
    }

    public function test_the_portal_quotes_a_per_client_rate_override(): void
    {
        Setting::put('daily_topup_percent', 2);
        $client = $this->client(['balance' => 1000, 'daily_topup_percent' => 7]);

        $summary = (new PortfolioMetrics($client, app(MarketData::class)))->summary();

        $this->assertSame(7.0, $summary['headline']['percent']);
        $this->assertSame(70.0, $summary['daily']['value']);
    }

    public function test_the_portal_quotes_no_growth_when_topups_will_not_run(): void
    {
        Setting::put('topup_enabled', false);
        $client = $this->client(['balance' => 1000]);

        $summary = (new PortfolioMetrics($client, app(MarketData::class)))->summary();

        $this->assertSame(0.0, $summary['headline']['percent']);
        $this->assertSame(0.0, $summary['daily']['value']);
    }

    public function test_an_excluded_client_is_not_shown_growth_they_will_not_receive(): void
    {
        $client = $this->client(['balance' => 1000, 'topup_enabled' => false]);

        $wallet = (new AccountSummary($client, app(MarketData::class)))->wallet();

        $this->assertSame(0.0, $wallet['daily_rate']);
        $this->assertSame(0.0, $wallet['daily']);
        $this->assertSame(0.0, $wallet['profit_today']);
    }

    public function test_the_daily_cap_limits_the_quoted_growth_too(): void
    {
        Setting::put('daily_topup_percent', 10);
        Setting::put('topup_max_daily_amount', 25);
        $client = $this->client(['balance' => 1000]);

        $summary = (new PortfolioMetrics($client, app(MarketData::class)))->summary();

        // 10% of 1000 is 100, but the cap pays 25 — so 25 is what is shown.
        $this->assertSame(25.0, $summary['daily']['value']);

        $this->travel(1)->days();
        $this->artisan('balance:topup')->assertSuccessful();
        $this->assertSame('1025.00', $client->fresh()->balance);
    }

    public function test_admin_can_credit_and_debit_a_client_balance(): void
    {
        $admin = $this->admin();
        $client = $this->client(['balance' => 1000]);

        $this->actingAs($admin)
            ->post("/admin/users/{$client->id}/adjust-balance", ['direction' => 'credit', 'amount' => 250, 'notes' => 'Bonus'])
            ->assertRedirect();
        $this->assertSame('1250.00', $client->fresh()->balance);

        $this->actingAs($admin)
            ->post("/admin/users/{$client->id}/adjust-balance", ['direction' => 'debit', 'amount' => 50, 'notes' => 'Correction'])
            ->assertRedirect();
        $this->assertSame('1200.00', $client->fresh()->balance);

        $this->assertSame(2, Earning::where('user_id', $client->id)->count());
    }

    public function test_a_debit_larger_than_the_balance_is_rejected(): void
    {
        $client = $this->client(['balance' => 100]);

        $this->actingAs($this->admin())
            ->post("/admin/users/{$client->id}/adjust-balance", ['direction' => 'debit', 'amount' => 500])
            ->assertSessionHasErrors('amount');

        $this->assertSame('100.00', $client->fresh()->balance);
    }

    public function test_admin_can_suspend_a_client_and_suspension_blocks_login(): void
    {
        $client = $this->client();

        $this->actingAs($this->admin())
            ->put("/admin/users/{$client->id}/settings", [
                'status' => 'suspended', 'is_verified' => true, 'topup_enabled' => true, 'daily_topup_percent' => null,
            ])
            ->assertRedirect();

        $this->assertSame('suspended', $client->fresh()->status);

        Auth::logout();

        $this->post('/login', ['username' => 'client', 'password' => 'password'])
            ->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_maintenance_mode_closes_the_client_portal_but_not_the_admin_panel(): void
    {
        Setting::put('maintenance_mode', true);

        $this->actingAs($this->client())->get('/user/dashboard')->assertStatus(503);
        $this->actingAs($this->admin())->get('/admin/dashboard')->assertOk();
    }

    public function test_deposit_limits_and_the_deposit_switch_are_enforced(): void
    {
        Setting::put('deposit_min', 100);
        $client = $this->client();
        $wallet = \App\Models\Wallet::create(['name' => 'USDT', 'currency' => 'USDT', 'network' => 'TRC-20', 'address' => 'T123', 'is_active' => true]);

        $this->actingAs($client)
            ->post('/user/deposits', ['amount' => 50, 'wallet_id' => $wallet->id])
            ->assertSessionHasErrors('amount');

        Setting::put('deposits_enabled', false);

        $this->actingAs($client)
            ->post('/user/deposits', ['amount' => 500, 'wallet_id' => $wallet->id])
            ->assertSessionHasErrors('amount');
    }

    public function test_withdrawal_fee_is_charged_on_top_of_the_requested_amount(): void
    {
        Setting::put('withdrawal_fee_percent', 2);

        $client = $this->client(['balance' => 1000]);
        $wallet = \App\Models\Wallet::create(['name' => 'USDT', 'currency' => 'USDT', 'network' => 'TRC-20', 'address' => 'T123', 'is_active' => true]);

        $this->actingAs($client)->post('/user/withdrawals', [
            'amount' => 100, 'wallet_id' => $wallet->id, 'wallet_address' => 'T999',
        ])->assertRedirect();

        $withdrawal = Withdrawal::where('user_id', $client->id)->firstOrFail();
        $this->assertSame('2.00', $withdrawal->fee);

        $this->actingAs($this->admin())
            ->post("/admin/withdrawals/{$withdrawal->id}/approve", [])
            ->assertRedirect();

        $this->assertSame('898.00', $client->fresh()->balance);   // 1000 - 100 - 2
    }
}
