<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'username', 'email', 'password', 'role', 'status', 'balance',
        'topup_enabled', 'daily_topup_percent', 'last_topup_at',
        'phone', 'address', 'date_of_birth', 'employment_status',
        'occupation', 'source_of_funds', 'pep_status', 'tax_id',
        'is_verified', 'avatar', 'member_id',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'pep_status' => 'boolean',
            'is_verified' => 'boolean',
            'topup_enabled' => 'boolean',
            'balance' => 'decimal:2',
            'daily_topup_percent' => 'decimal:4',
            'date_of_birth' => 'date',
            'last_topup_at' => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    /**
     * The daily top-up rate that actually applies to this account: the
     * per-client override when one is set, otherwise the platform default.
     */
    public function effectiveTopupPercent(): float
    {
        return $this->daily_topup_percent !== null
            ? (float) $this->daily_topup_percent
            : (float) Setting::get('daily_topup_percent');
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(Withdrawal::class);
    }

    public function portfolioSnapshots(): HasMany
    {
        return $this->hasMany(PortfolioSnapshot::class);
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(Earning::class);
    }
}
