<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /** Avatar values with this prefix name a built-in preset, not an upload. */
    public const AVATAR_PRESET_PREFIX = 'preset:';

    /**
     * Account standing, in the order the admin picker lists it. `pending` means
     * an ID is with compliance, `verified` that compliance approved it.
     */
    public const STATUSES = ['active', 'pending', 'verified', 'suspended'];

    /** Monogram presets offered in the profile editor. */
    public const AVATAR_PRESETS = [
        'slate'   => '#4b5563',
        'gold'    => '#8a7318',
        'forest'  => '#15803d',
        'ocean'   => '#1d4ed8',
        'plum'    => '#7e22ce',
        'clay'    => '#b45309',
    ];

    protected $fillable = [
        'name', 'username', 'email', 'password', 'role', 'status', 'balance',
        'topup_enabled', 'daily_topup_percent', 'last_topup_at',
        'phone', 'address', 'address_line1', 'city', 'state', 'postal_code',
        'country', 'date_of_birth', 'employment_status', 'occupation',
        'source_of_funds', 'pep_status', 'tax_id', 'is_verified', 'avatar',
        'member_id', 'id_document_type', 'verified_at', 'name_match_confirmed',
        'verified_name', 'tax_id_verified_at',
        'is_vip', 'notifications_enabled', 'referred_by', 'terms_accepted_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    /** Admin screens read the reconciled standing, never the raw column. */
    protected $appends = ['account_status'];

    protected function casts(): array
    {
        return [
            'email_verified_at'     => 'datetime',
            'password'              => 'hashed',
            'pep_status'            => 'boolean',
            'is_verified'           => 'boolean',
            'is_vip'                => 'boolean',
            'notifications_enabled' => 'boolean',
            'name_match_confirmed'  => 'boolean',
            'topup_enabled'         => 'boolean',
            'balance'               => 'decimal:2',
            'daily_topup_percent'   => 'decimal:4',
            'date_of_birth'         => 'date',
            'verified_at'           => 'datetime',
            'tax_id_verified_at'    => 'datetime',
            'terms_accepted_at'     => 'datetime',
            'last_topup_at'         => 'datetime',
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
     * The standing the admin screens display. The stored column and the KYC
     * flag are reconciled here so the picker can never show "Verified" for an
     * account that is not, or hide a verification that was granted elsewhere.
     */
    public function accountStatus(): string
    {
        if ($this->status === 'suspended') {
            return 'suspended';
        }

        if ($this->is_verified) {
            return 'verified';
        }

        // Stored as verified but the flag is off: the account is back in the queue.
        return $this->status === 'verified' ? 'pending' : ($this->status ?: 'active');
    }

    public function getAccountStatusAttribute(): string
    {
        return $this->accountStatus();
    }

    /** Last four digits of the tax ID — the only part ever shown. */
    public function taxIdLast4(): ?string
    {
        return $this->tax_id ? substr(preg_replace('/\D/', '', $this->tax_id), -4) : null;
    }

    /** The name matched against the photo ID, once compliance confirmed it. */
    public function verifiedName(): ?string
    {
        return $this->name_match_confirmed ? ($this->verified_name ?: $this->name) : null;
    }

    /**
     * Stamp the account verified and record what was matched. Passing null for
     * $taxIdMatches leaves any existing tax-ID confirmation alone, so saving
     * unrelated account settings never quietly revokes it.
     */
    public function markVerified(?string $verifiedName = null, ?bool $taxIdMatches = null): void
    {
        $attributes = [
            'is_verified'          => true,
            'verified_at'          => $this->verified_at ?? now(),
            'name_match_confirmed' => true,
            'verified_name'        => trim((string) $verifiedName) ?: ($this->verified_name ?: $this->name),
        ];

        if ($taxIdMatches !== null) {
            $attributes['tax_id_verified_at'] = $taxIdMatches && $this->tax_id ? now() : null;
        }

        // A suspended account keeps its standing; verification is separate.
        if (! $this->isSuspended()) {
            $attributes['status'] = 'verified';
        }

        $this->forceFill($attributes)->save();
    }

    /**
     * Undo verification, e.g. when an admin puts the account back in review.
     * Standing is left to the caller, which knows whether the client is going
     * back to the queue or simply being un-verified.
     */
    public function clearVerification(): void
    {
        $this->forceFill([
            'is_verified'          => false,
            'verified_at'          => null,
            'name_match_confirmed' => false,
            'verified_name'        => null,
            'tax_id_verified_at'   => null,
        ])->save();
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

    /** One-line address built from the structured parts, falling back to the free-text column. */
    public function formattedAddress(): ?string
    {
        $parts = array_filter([
            $this->address_line1,
            $this->city,
            trim(implode(' ', array_filter([$this->state, $this->postal_code]))),
            $this->country,
        ]);

        return $parts ? implode(', ', $parts) : ($this->address ?: null);
    }

    /** Public URL for the avatar, or null when it is a preset / unset. */
    public function avatarUrl(): ?string
    {
        if (! $this->avatar || str_starts_with($this->avatar, self::AVATAR_PRESET_PREFIX)) {
            return null;
        }

        return Storage::disk('public')->url($this->avatar);
    }

    /** Preset key when the avatar is a preset, otherwise null. */
    public function avatarPreset(): ?string
    {
        if (! $this->avatar || ! str_starts_with($this->avatar, self::AVATAR_PRESET_PREFIX)) {
            return null;
        }

        $key = substr($this->avatar, strlen(self::AVATAR_PRESET_PREFIX));

        return array_key_exists($key, self::AVATAR_PRESETS) ? $key : null;
    }

    public function initials(): string
    {
        preg_match_all('/\b\w/u', $this->name ?? '', $matches);

        return strtoupper(implode('', array_slice($matches[0] ?? ['?'], 0, 2)));
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

    public function documents(): HasMany
    {
        return $this->hasMany(UserDocument::class);
    }

    /** The client whose member ID was entered as a referral code at sign-up. */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(User::class, 'referred_by');
    }
}
