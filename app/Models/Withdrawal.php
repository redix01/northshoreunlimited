<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends Model
{
    protected $fillable = [
        'user_id', 'amount', 'fee', 'currency', 'wallet_address', 'network',
        'status', 'admin_notes', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'fee' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    /** What actually leaves the client balance: the request plus any fee. */
    public function totalDebit(): float
    {
        return (float) $this->amount + (float) $this->fee;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
