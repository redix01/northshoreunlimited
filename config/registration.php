<?php

return [

    /*
    |---------------------------------------------------------------------------
    | Open registration
    |---------------------------------------------------------------------------
    | With this off, /register returns 404 and accounts are created by an admin
    | only — the behaviour the portal had before self-service sign-up.
    */

    'enabled' => env('REGISTRATION_ENABLED', true),

    /** Minimum age, checked against the supplied date of birth. */
    'minimum_age' => (int) env('REGISTRATION_MINIMUM_AGE', 18),

    /** Prefix for generated member IDs, which double as referral codes. */
    'member_id_prefix' => env('MEMBER_ID_PREFIX', 'GCC'),

    /*
    |---------------------------------------------------------------------------
    | Sign-up promotion
    |---------------------------------------------------------------------------
    | Marketing copy for the banner above the form. This is display only — no
    | balance is credited at sign-up. Set `enabled` to false to hide the banner.
    */

    'promotion' => [
        'enabled'  => env('REGISTRATION_PROMO_ENABLED', true),
        'headline' => env('REGISTRATION_PROMO_HEADLINE', 'Get up to $2,000 instant bonus on sign up'),
        'subtext'  => env('REGISTRATION_PROMO_SUBTEXT', 'No deposit required to get started'),
    ],

    /*
    |---------------------------------------------------------------------------
    | Hero panel
    |---------------------------------------------------------------------------
    | Drop an image at the given path to fill the left-hand panel. When the
    | file is absent the panel falls back to the brand gradient.
    */

    'hero' => [
        'image'    => env('REGISTRATION_HERO_IMAGE', '/img/register-hero.jpg'),
        'headline' => "The Best Way to Own",
        'accent'   => "the World's Scarcest Asset.",
        'subtext'  => 'Start accumulating Bitcoin now with expert-guided custody and reporting.',
    ],

];
