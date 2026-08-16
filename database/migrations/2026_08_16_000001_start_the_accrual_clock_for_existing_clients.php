<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Balances now accrue from `last_topup_at` forward. Accounts that never had a
 * top-up would otherwise accrue from their creation date, so the first sweep
 * after this deploy would hand a long-standing client the catch-up ceiling in
 * one go. Start their clock now instead.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'user')
            ->whereNull('last_topup_at')
            ->update(['last_topup_at' => now()]);
    }

    public function down(): void
    {
        // Nothing to undo: the column keeps whatever the sweep has since written.
    }
};
