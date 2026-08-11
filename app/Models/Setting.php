<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'group'];

    public const CACHE_KEY = 'settings.all';

    /**
     * The canonical definition of every platform setting.
     *
     * Anything not listed here cannot be written from the admin panel, so the
     * settings UI and the validation rules stay in sync with one source.
     */
    public const DEFINITIONS = [
        // ── General ──────────────────────────────────────────────────────
        'site_name' => [
            'type' => 'string', 'group' => 'general', 'default' => 'Northshore Unlimited',
            'label' => 'Platform name', 'help' => 'Shown to clients across the portal.',
        ],
        'support_email' => [
            'type' => 'string', 'group' => 'general', 'default' => 'support@northshoreunlimited.com',
            'label' => 'Support email', 'help' => 'Where clients are told to send queries.',
        ],
        'maintenance_mode' => [
            'type' => 'bool', 'group' => 'general', 'default' => false,
            'label' => 'Maintenance mode', 'help' => 'Blocks the client portal. Admins keep full access.',
        ],
        'maintenance_message' => [
            'type' => 'string', 'group' => 'general', 'default' => 'The portal is temporarily unavailable for scheduled maintenance.',
            'label' => 'Maintenance message', 'help' => 'Shown to clients while maintenance mode is on.',
        ],

        // ── Daily top-up ─────────────────────────────────────────────────
        'topup_enabled' => [
            'type' => 'bool', 'group' => 'topup', 'default' => true,
            'label' => 'Daily top-up enabled', 'help' => 'Master switch for the scheduled daily balance top-up.',
        ],
        'daily_topup_percent' => [
            'type' => 'float', 'group' => 'topup', 'default' => 1.5,
            'label' => 'Default daily top-up (%)', 'help' => 'Percent of each client balance credited daily. Individual clients can override this.',
        ],
        'topup_min_balance' => [
            'type' => 'float', 'group' => 'topup', 'default' => 100,
            'label' => 'Minimum balance to earn', 'help' => 'Balances below this amount are skipped.',
        ],
        'topup_max_daily_amount' => [
            'type' => 'float', 'group' => 'topup', 'default' => 0,
            'label' => 'Daily cap per client', 'help' => 'Largest single top-up a client can receive. 0 means no cap.',
        ],
        'topup_only_verified' => [
            'type' => 'bool', 'group' => 'topup', 'default' => false,
            'label' => 'Verified clients only', 'help' => 'Skip clients who have not completed verification.',
        ],

        // ── Deposits ─────────────────────────────────────────────────────
        'deposits_enabled' => [
            'type' => 'bool', 'group' => 'deposits', 'default' => true,
            'label' => 'Deposits enabled', 'help' => 'Turn off to stop accepting new deposit requests.',
        ],
        'deposit_min' => [
            'type' => 'float', 'group' => 'deposits', 'default' => 10,
            'label' => 'Minimum deposit', 'help' => 'Smallest deposit a client may submit.',
        ],
        'deposit_max' => [
            'type' => 'float', 'group' => 'deposits', 'default' => 1000000,
            'label' => 'Maximum deposit', 'help' => 'Largest deposit a client may submit.',
        ],
        'deposit_auto_approve' => [
            'type' => 'bool', 'group' => 'deposits', 'default' => false,
            'label' => 'Auto-approve deposits', 'help' => 'Credit deposits immediately instead of queuing them for review.',
        ],

        // ── Withdrawals ──────────────────────────────────────────────────
        'withdrawals_enabled' => [
            'type' => 'bool', 'group' => 'withdrawals', 'default' => true,
            'label' => 'Withdrawals enabled', 'help' => 'Turn off to stop accepting new withdrawal requests.',
        ],
        'withdrawal_min' => [
            'type' => 'float', 'group' => 'withdrawals', 'default' => 10,
            'label' => 'Minimum withdrawal', 'help' => 'Smallest withdrawal a client may request.',
        ],
        'withdrawal_max' => [
            'type' => 'float', 'group' => 'withdrawals', 'default' => 1000000,
            'label' => 'Maximum withdrawal', 'help' => 'Largest withdrawal a client may request.',
        ],
        'withdrawal_fee_percent' => [
            'type' => 'float', 'group' => 'withdrawals', 'default' => 0,
            'label' => 'Withdrawal fee (%)', 'help' => 'Charged on top of the requested amount when a withdrawal is approved.',
        ],
        'withdrawal_max_pending' => [
            'type' => 'int', 'group' => 'withdrawals', 'default' => 3,
            'label' => 'Max pending requests', 'help' => 'How many withdrawals a client may have awaiting review at once.',
        ],
        'withdrawal_require_verified' => [
            'type' => 'bool', 'group' => 'withdrawals', 'default' => false,
            'label' => 'Require verified account', 'help' => 'Only verified clients may request withdrawals.',
        ],
    ];

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::CACHE_KEY));
    }

    /**
     * Every setting, stored values merged over the defaults, correctly typed.
     *
     * @return array<string, mixed>
     */
    public static function values(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            $stored = static::query()->pluck('value', 'key');

            $values = [];
            foreach (self::DEFINITIONS as $key => $definition) {
                $values[$key] = $stored->has($key)
                    ? self::cast($stored[$key], $definition['type'])
                    : $definition['default'];
            }

            return $values;
        });
    }

    public static function get(string $key, mixed $fallback = null): mixed
    {
        return self::values()[$key] ?? $fallback ?? (self::DEFINITIONS[$key]['default'] ?? null);
    }

    public static function put(string $key, mixed $value): void
    {
        if (!isset(self::DEFINITIONS[$key])) {
            return;
        }

        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value,
                'type'  => self::DEFINITIONS[$key]['type'],
                'group' => self::DEFINITIONS[$key]['group'],
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public static function putMany(array $values): void
    {
        foreach ($values as $key => $value) {
            self::put($key, $value);
        }

        Cache::forget(self::CACHE_KEY);
    }

    protected static function cast(?string $value, string $type): mixed
    {
        return match ($type) {
            'bool'  => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'int'   => (int) $value,
            'float' => (float) $value,
            default => (string) $value,
        };
    }
}
