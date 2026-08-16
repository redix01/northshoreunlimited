<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Earning extends Model
{
    /**
     * Ledger rows an admin posted by hand — money moved into or out of the
     * account, as opposed to `daily_topup`, which is accrued yield.
     */
    public const ADJUSTMENT_TYPES = ['manual_credit', 'manual_debit'];

    protected $fillable = [
        'user_id', 'type', 'rate', 'amount', 'balance_before',
        'balance_after', 'note', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'rate'           => 'decimal:4',
            'amount'         => 'decimal:2',
            'balance_before' => 'decimal:2',
            'balance_after'  => 'decimal:2',
        ];
    }

    /** @param  \Illuminate\Database\Eloquent\Builder<Earning>  $query */
    public function scopeAdjustments($query)
    {
        return $query->whereIn('type', self::ADJUSTMENT_TYPES);
    }

    /**
     * Funds an admin credited to this account. The client's "total deposited"
     * counts these alongside their own approved deposits — from the client's
     * side both are money that arrived in the account.
     */
    public static function creditedTo(int $userId): float
    {
        return (float) static::where('user_id', $userId)
            ->adjustments()
            ->where('amount', '>', 0)
            ->sum('amount');
    }

    /** Funds an admin took back out, as a positive figure. */
    public static function debitedFrom(int $userId): float
    {
        return abs((float) static::where('user_id', $userId)
            ->adjustments()
            ->where('amount', '<', 0)
            ->sum('amount'));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
