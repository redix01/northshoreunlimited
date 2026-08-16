<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // The legal name compliance matched against the approved photo ID.
            // Kept separate from `name` so a later profile edit cannot rewrite
            // what was actually verified.
            $table->string('verified_name')->nullable()->after('name_match_confirmed');
            $table->timestamp('tax_id_verified_at')->nullable()->after('verified_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['verified_name', 'tax_id_verified_at']);
        });
    }
};
