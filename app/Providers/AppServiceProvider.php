<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        // Sign-up and sign-in are unauthenticated and create or probe accounts,
        // so both are capped per source address.
        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(6)->by($request->ip()));

        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(10)
            ->by(strtolower((string) $request->input('username')).'|'.$request->ip()));
    }
}
