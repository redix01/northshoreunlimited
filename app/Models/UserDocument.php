<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDocument extends Model
{
    /** Selectable document types, in the order the upload picker lists them. */
    public const TYPES = [
        'tax_return'         => 'Tax Return',
        'bank_statement'     => 'Bank Statement',
        'proof_of_address'   => 'Proof of Address',
        'utility_bill'       => 'Utility Bill',
        'financial_statement' => 'Financial Statement',
        'employment_letter'  => 'Employment Letter',
        'other'              => 'Other',
    ];

    /**
     * Government photo ID accepted for identity verification, separate from
     * the supporting paperwork above: these are uploaded as a front/back pair
     * and are what an admin approves to verify an account.
     */
    public const ID_TYPES = [
        'drivers_license' => "Driver's Licence",
        'state_id'        => 'State ID Card',
        'passport'        => 'Passport',
    ];

    /** A passport is a single page; the others are two-sided. */
    public const SINGLE_SIDED_ID_TYPES = ['passport'];

    protected $fillable = [
        'user_id', 'submission_id', 'type', 'side', 'label', 'path', 'original_name',
        'mime_type', 'size', 'status', 'admin_notes', 'reviewed_by', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'size'        => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? self::ID_TYPES[$this->type] ?? 'Document';
    }

    /** True for the photo-ID pair, false for supporting paperwork. */
    public function isIdentityDocument(): bool
    {
        return array_key_exists($this->type, self::ID_TYPES);
    }

    /** @param  \Illuminate\Database\Eloquent\Builder<UserDocument>  $query */
    public function scopeIdentity($query)
    {
        return $query->whereIn('type', array_keys(self::ID_TYPES));
    }

    /** @param  \Illuminate\Database\Eloquent\Builder<UserDocument>  $query */
    public function scopeSupporting($query)
    {
        return $query->whereNotIn('type', array_keys(self::ID_TYPES));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
