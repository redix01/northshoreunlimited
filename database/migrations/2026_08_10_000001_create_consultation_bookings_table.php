<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultation_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('advisor_id');
            $table->string('advisor_name');
            $table->date('scheduled_date');
            // Stored as the literal slot label ("2:00 PM") plus its timezone rather
            // than a UTC timestamp: slots are published in the desk's local time and
            // the desk confirms each booking by hand.
            $table->string('scheduled_time');
            $table->string('timezone')->default('America/Los_Angeles');
            $table->string('full_name');
            $table->string('email');
            $table->string('phone');
            $table->text('topic')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['scheduled_date', 'scheduled_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_bookings');
    }
};
