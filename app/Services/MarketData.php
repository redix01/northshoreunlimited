<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Spot prices for the assets listed in config/markets.php.
 *
 * The result is cached — including the fallback — so a dashboard load never
 * waits on the upstream feed more than once per TTL window.
 */
class MarketData
{
    public function quotes(): array
    {
        return Cache::remember('markets.quotes', config('markets.ttl', 120), fn () => $this->fetch());
    }

    public function priceOf(string $symbol): float
    {
        foreach ($this->quotes() as $quote) {
            if ($quote['symbol'] === strtoupper($symbol)) {
                return (float) $quote['price'];
            }
        }

        return 0.0;
    }

    public function quoteOf(string $symbol): ?array
    {
        foreach ($this->quotes() as $quote) {
            if ($quote['symbol'] === strtoupper($symbol)) {
                return $quote;
            }
        }

        return null;
    }

    private function fetch(): array
    {
        $assets   = config('markets.assets', []);
        $fallback = array_map(fn ($asset) => [
            'symbol' => $asset['symbol'],
            'name'   => $asset['name'],
            'price'  => (float) $asset['price'],
            'change' => (float) $asset['change'],
            'live'   => false,
        ], $assets);

        if (! config('markets.live')) {
            return $fallback;
        }

        try {
            $response = Http::timeout(config('markets.timeout', 2.5))
                ->acceptJson()
                ->get(config('markets.endpoint'), [
                    'ids'                 => implode(',', array_column($assets, 'id')),
                    'vs_currencies'       => 'usd',
                    'include_24hr_change' => 'true',
                ]);

            if (! $response->successful()) {
                return $fallback;
            }

            $payload = $response->json();
        } catch (\Throwable $e) {
            Log::debug('Market feed unavailable, using fallback prices: '.$e->getMessage());

            return $fallback;
        }

        return array_map(function ($asset) use ($payload) {
            $quote = $payload[$asset['id']] ?? null;

            return [
                'symbol' => $asset['symbol'],
                'name'   => $asset['name'],
                'price'  => (float) ($quote['usd'] ?? $asset['price']),
                'change' => round((float) ($quote['usd_24h_change'] ?? $asset['change']), 2),
                'live'   => $quote !== null,
            ];
        }, $assets);
    }
}
