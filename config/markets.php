<?php

return [

    /*
    |---------------------------------------------------------------------------
    | Live price feed
    |---------------------------------------------------------------------------
    | When enabled the dashboard pulls spot prices from the public CoinGecko
    | endpoint. Every failure falls back to the static prices below, so the
    | dashboard renders identically with no outbound network access.
    */

    'live'     => env('MARKETS_LIVE', true),
    'endpoint' => env('MARKETS_ENDPOINT', 'https://api.coingecko.com/api/v3/simple/price'),
    'timeout'  => (float) env('MARKETS_TIMEOUT', 2.5),
    'ttl'      => (int) env('MARKETS_TTL', 120),

    /*
    |---------------------------------------------------------------------------
    | Tracked assets
    |---------------------------------------------------------------------------
    | `id` is the CoinGecko identifier. `price` / `change` are the fallback
    | values used when the feed is unavailable.
    */

    'assets' => [
        ['symbol' => 'BTC',  'name' => 'Bitcoin',  'id' => 'bitcoin',      'price' => 66400.00, 'change' => 0.0],
        ['symbol' => 'ETH',  'name' => 'Ethereum', 'id' => 'ethereum',     'price' => 1872.00,  'change' => -2.90],
        ['symbol' => 'SOL',  'name' => 'Solana',   'id' => 'solana',       'price' => 137.90,   'change' => -1.85],
        ['symbol' => 'ADA',  'name' => 'Cardano',  'id' => 'cardano',      'price' => 0.7191,   'change' => 2.58],
        ['symbol' => 'USDT', 'name' => 'Tether',   'id' => 'tether',       'price' => 0.9970,   'change' => -0.55],
        ['symbol' => 'BNB',  'name' => 'BNB',      'id' => 'binancecoin',  'price' => 604.20,   'change' => 0.42],
        ['symbol' => 'XRP',  'name' => 'XRP',      'id' => 'ripple',       'price' => 2.1400,   'change' => 1.16],
    ],

    /*
    |---------------------------------------------------------------------------
    | Base settlement asset
    |---------------------------------------------------------------------------
    | Balances on the dashboard are denominated in this asset.
    */

    'base' => 'BTC',

    /*
    |---------------------------------------------------------------------------
    | Managed yield
    |---------------------------------------------------------------------------
    | Daily return applied to a client's deposited principal. Drives the daily
    | / weekly figures on the balance hero and the portfolio performance curve.
    */

    'daily_yield_rate' => (float) env('PORTFOLIO_DAILY_YIELD', 0.045),

];
