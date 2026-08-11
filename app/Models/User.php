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
        'name', 'username', 'email', 'password', 'role', 'balance',
        'phone', 'address', 'address_line1', 'city', 'state', 'postal_code',
        'country', 'date_of_birth', 'employment_status', 'occupation',
        'source_of_funds', 'pep_status', 'tax_id', 'is_verified', 'avatar',
        'member_id', 'id_document_type', 'verified_at', 'name_match_confirmed',
        'is_vip', 'notifications_enabled', 'referred_by', 'terms_accepted_at',
    ];

    protected $hidden = ['password', 'remember_token'];

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
            'balance'               => 'decimal:2',
            'date_of_birth'         => 'date',
            'verified_at'           => 'datetime',
            'terms_accepted_at'     => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
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
