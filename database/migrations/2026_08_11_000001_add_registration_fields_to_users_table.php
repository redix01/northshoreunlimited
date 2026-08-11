<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Who referred this client, resolved from the member ID typed at
            // sign-up. Nulled rather than cascaded so removing a referrer never
            // deletes the people they introduced.
            $table->foreignId('referred_by')->nullable()->after('member_id')
                ->constrained('users')->nullOnDelete();

            $table->timestamp('terms_accepted_at')->nullable()->after('referred_by');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referred_by');
            $table->dropColumn('terms_accepted_at');
        });
    }
};
