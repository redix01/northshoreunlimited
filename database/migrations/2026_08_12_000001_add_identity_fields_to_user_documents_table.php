<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_documents', function (Blueprint $table) {
            // Photo ID is uploaded as a pair, so the two files that make up one
            // submission share a submission_id and differ by side.
            $table->uuid('submission_id')->nullable()->after('user_id');
            $table->string('side', 10)->nullable()->after('type');

            $table->index('submission_id');
        });
    }

    public function down(): void
    {
        Schema::table('user_documents', function (Blueprint $table) {
            $table->dropIndex(['submission_id']);
            $table->dropColumn(['submission_id', 'side']);
        });
    }
};
