<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Structured address. `address` is kept in sync as the composed
            // one-line form so the admin screens keep reading a single field.
            $table->string('address_line1')->nullable()->after('address');
            $table->string('city')->nullable()->after('address_line1');
            $table->string('state')->nullable()->after('city');
            $table->string('postal_code', 32)->nullable()->after('state');
            $table->string('country')->nullable()->after('postal_code');

            $table->string('id_document_type')->nullable()->after('is_verified');
            $table->timestamp('verified_at')->nullable()->after('id_document_type');
            $table->boolean('name_match_confirmed')->default(false)->after('verified_at');

            $table->boolean('is_vip')->default(false)->after('role');
            $table->boolean('notifications_enabled')->default(true)->after('is_vip');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'address_line1', 'city', 'state', 'postal_code', 'country',
                'id_document_type', 'verified_at', 'name_match_confirmed',
                'is_vip', 'notifications_enabled',
            ]);
        });
    }
};
