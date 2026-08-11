<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('status', 20)->default('active')->after('role');
            $table->boolean('topup_enabled')->default(true)->after('balance');
            $table->decimal('daily_topup_percent', 8, 4)->nullable()->after('topup_enabled');
            $table->timestamp('last_topup_at')->nullable()->after('daily_topup_percent');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'topup_enabled', 'daily_topup_percent', 'last_topup_at']);
        });
    }
};
