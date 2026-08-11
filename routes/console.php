<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('balance:topup')->dailyAt('00:01')->withoutOverlapping();
Schedule::command('portfolio:snapshot')->dailyAt('00:05');
Schedule::command('queue:work --stop-when-empty')->everyMinute()->withoutOverlapping();
