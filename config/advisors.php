<?php

/**
 * Consultation desk configuration.
 *
 * Single source of truth for the booking flow: the /schedule page renders from
 * this and the controller validates against it, so the two cannot drift.
 */
return [

    'notification_email' => env('CONSULTATION_EMAIL', 'support@northshoreunlimited.com'),

    'timezone' => 'America/Los_Angeles',
    'timezone_label' => 'Pacific Time (PT)',

    'session_minutes' => 30,

    // How far ahead the calendar lets a client book.
    'booking_window_days' => 90,

    'roster' => [
        'james-jesse' => [
            'name' => 'James Jesse',
            'role' => 'Senior Portfolio Strategist',
            'specialty' => 'BTC Portfolio Management',
        ],
        'michele-cowan' => [
            'name' => 'Michele Cowan',
            'role' => 'Risk Analyst',
            'specialty' => 'Risk Assessment & Diversification',
        ],
        'erin-corbett' => [
            'name' => 'Erin Corbett',
            'role' => 'Estate Planning Advisor',
            'specialty' => 'Estate Planning & Tax Advantages Structuring',
        ],
        'paul-tyler' => [
            'name' => 'Paul Tyler',
            'role' => 'Institutional Advisor',
            'specialty' => 'Corporate & SMSF Accounts',
        ],
    ],

    // Desk hours, in the timezone above. Slots are published as written.
    'slots' => [
        '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
        '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
        '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    ],

];
