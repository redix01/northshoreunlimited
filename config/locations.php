<?php

return [

    /*
    |---------------------------------------------------------------------------
    | Accepted countries
    |---------------------------------------------------------------------------
    | The sign-up country picker is built from this list. Trim it to restrict
    | the jurisdictions the desk will onboard — the server validates against
    | the same keys, so removing an entry closes registration from there.
    */

    'countries' => [
        'US' => 'United States',
        'CA' => 'Canada',
        'GB' => 'United Kingdom',
        'AE' => 'United Arab Emirates',
        'AR' => 'Argentina',
        'AT' => 'Austria',
        'AU' => 'Australia',
        'BE' => 'Belgium',
        'BR' => 'Brazil',
        'CH' => 'Switzerland',
        'CL' => 'Chile',
        'CO' => 'Colombia',
        'CY' => 'Cyprus',
        'CZ' => 'Czechia',
        'DE' => 'Germany',
        'DK' => 'Denmark',
        'EE' => 'Estonia',
        'EG' => 'Egypt',
        'ES' => 'Spain',
        'FI' => 'Finland',
        'FR' => 'France',
        'GH' => 'Ghana',
        'GR' => 'Greece',
        'HK' => 'Hong Kong',
        'HR' => 'Croatia',
        'HU' => 'Hungary',
        'ID' => 'Indonesia',
        'IE' => 'Ireland',
        'IL' => 'Israel',
        'IN' => 'India',
        'IS' => 'Iceland',
        'IT' => 'Italy',
        'JP' => 'Japan',
        'KE' => 'Kenya',
        'KR' => 'South Korea',
        'LT' => 'Lithuania',
        'LU' => 'Luxembourg',
        'LV' => 'Latvia',
        'MA' => 'Morocco',
        'MT' => 'Malta',
        'MX' => 'Mexico',
        'MY' => 'Malaysia',
        'NG' => 'Nigeria',
        'NL' => 'Netherlands',
        'NO' => 'Norway',
        'NZ' => 'New Zealand',
        'PE' => 'Peru',
        'PH' => 'Philippines',
        'PL' => 'Poland',
        'PT' => 'Portugal',
        'RO' => 'Romania',
        'SA' => 'Saudi Arabia',
        'SE' => 'Sweden',
        'SG' => 'Singapore',
        'SI' => 'Slovenia',
        'SK' => 'Slovakia',
        'TH' => 'Thailand',
        'TR' => 'Türkiye',
        'TW' => 'Taiwan',
        'TZ' => 'Tanzania',
        'UA' => 'Ukraine',
        'UG' => 'Uganda',
        'UY' => 'Uruguay',
        'VN' => 'Vietnam',
        'ZA' => 'South Africa',
    ],

    /*
    |---------------------------------------------------------------------------
    | Sub-divisions
    |---------------------------------------------------------------------------
    | Countries listed here get a state/province dropdown; every other country
    | falls back to a free-text region field.
    */

    'subdivisions' => [

        'US' => [
            'AL' => 'Alabama',        'AK' => 'Alaska',         'AZ' => 'Arizona',
            'AR' => 'Arkansas',       'CA' => 'California',     'CO' => 'Colorado',
            'CT' => 'Connecticut',    'DE' => 'Delaware',       'DC' => 'District of Columbia',
            'FL' => 'Florida',        'GA' => 'Georgia',        'HI' => 'Hawaii',
            'ID' => 'Idaho',          'IL' => 'Illinois',       'IN' => 'Indiana',
            'IA' => 'Iowa',           'KS' => 'Kansas',         'KY' => 'Kentucky',
            'LA' => 'Louisiana',      'ME' => 'Maine',          'MD' => 'Maryland',
            'MA' => 'Massachusetts',  'MI' => 'Michigan',       'MN' => 'Minnesota',
            'MS' => 'Mississippi',    'MO' => 'Missouri',       'MT' => 'Montana',
            'NE' => 'Nebraska',       'NV' => 'Nevada',         'NH' => 'New Hampshire',
            'NJ' => 'New Jersey',     'NM' => 'New Mexico',     'NY' => 'New York',
            'NC' => 'North Carolina', 'ND' => 'North Dakota',   'OH' => 'Ohio',
            'OK' => 'Oklahoma',       'OR' => 'Oregon',         'PA' => 'Pennsylvania',
            'RI' => 'Rhode Island',   'SC' => 'South Carolina', 'SD' => 'South Dakota',
            'TN' => 'Tennessee',      'TX' => 'Texas',          'UT' => 'Utah',
            'VT' => 'Vermont',        'VA' => 'Virginia',       'WA' => 'Washington',
            'WV' => 'West Virginia',  'WI' => 'Wisconsin',      'WY' => 'Wyoming',
        ],

        'CA' => [
            'AB' => 'Alberta',              'BC' => 'British Columbia',
            'MB' => 'Manitoba',             'NB' => 'New Brunswick',
            'NL' => 'Newfoundland and Labrador', 'NS' => 'Nova Scotia',
            'NT' => 'Northwest Territories', 'NU' => 'Nunavut',
            'ON' => 'Ontario',              'PE' => 'Prince Edward Island',
            'QC' => 'Quebec',               'SK' => 'Saskatchewan',
            'YT' => 'Yukon',
        ],

        'AU' => [
            'ACT' => 'Australian Capital Territory', 'NSW' => 'New South Wales',
            'NT'  => 'Northern Territory',           'QLD' => 'Queensland',
            'SA'  => 'South Australia',              'TAS' => 'Tasmania',
            'VIC' => 'Victoria',                     'WA'  => 'Western Australia',
        ],

    ],

];
