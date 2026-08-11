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

    protected $fillable = [
        'user_id', 'type', 'label', 'path', 'original_name',
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
        return self::TYPES[$this->type] ?? 'Document';
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
