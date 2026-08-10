<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationBooking extends Model
{
    protected $fillable = [
        'advisor_id',
        'advisor_name',
        'scheduled_date',
        'scheduled_time',
        'timezone',
        'full_name',
        'email',
        'phone',
        'topic',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
    ];
}
