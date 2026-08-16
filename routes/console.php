<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Balances accrue continuously and are settled here. The sweep credits exactly
 * the period since each client's last settlement, so it is safe to miss a run
 * (the next one catches up) and safe to run twice (the second credits nothing).
 * Daily keeps the earnings ledger to one row per client per day; screens add
 * the unsettled remainder on the fly, and anything that spends the balance
 * settles on demand first.
 */
Schedule::command('balance:topup')->dailyAt('00:05')->withoutOverlapping();
// After the sweep, so the curve records settled balances rather than the
// figures they had a moment before being credited.
Schedule::command('portfolio:snapshot')->dailyAt('00:10');
Schedule::command('queue:work --stop-when-empty')->everyMinute()->withoutOverlapping();
