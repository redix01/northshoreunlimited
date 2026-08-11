<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    /** Groups in the order they are presented in the admin panel. */
    protected const GROUPS = [
        'general'     => ['label' => 'General',      'description' => 'Platform identity and availability.'],
        'topup'       => ['label' => 'Daily Top-up', 'description' => 'How much of a client balance is credited each day.'],
        'deposits'    => ['label' => 'Deposits',     'description' => 'Limits and handling for incoming funds.'],
        'withdrawals' => ['label' => 'Withdrawals',  'description' => 'Limits and handling for outgoing funds.'],
    ];

    public function index()
    {
        $values = Setting::values();

        $groups = [];
        foreach (self::GROUPS as $key => $meta) {
            $fields = [];

            foreach (Setting::DEFINITIONS as $settingKey => $definition) {
                if ($definition['group'] !== $key) {
                    continue;
                }

                $fields[] = [
                    'key'   => $settingKey,
                    'type'  => $definition['type'],
                    'label' => $definition['label'],
                    'help'  => $definition['help'],
                ];
            }

            $groups[] = $meta + ['key' => $key, 'fields' => $fields];
        }

        return Inertia::render('Admin/Settings', [
            'settings' => $values,
            'groups'   => $groups,
            'topup'    => [
                'eligible_users' => User::where('role', 'user')
                    ->where('status', 'active')
                    ->where('topup_enabled', true)
                    ->count(),
                'overridden_users' => User::where('role', 'user')
                    ->whereNotNull('daily_topup_percent')
                    ->count(),
                'last_run_at' => User::where('role', 'user')->max('last_topup_at'),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate($this->rules());

        Setting::putMany($validated);

        return back()->with('success', 'Settings saved.');
    }

    /**
     * Validation rules derived from the setting definitions, so a new setting
     * only has to be declared in one place.
     *
     * @return array<string, array<int, string>>
     */
    protected function rules(): array
    {
        $rules = [];

        foreach (Setting::DEFINITIONS as $key => $definition) {
            $rules[$key] = match ($definition['type']) {
                'bool'   => ['required', 'boolean'],
                'int'    => ['required', 'integer', 'min:0', 'max:100'],
                'float'  => ['required', 'numeric', 'min:0', 'max:100000000'],
                default  => ['required', 'string', 'max:255'],
            };
        }

        // Percentages are capped tighter than plain money amounts.
        $rules['daily_topup_percent']    = ['required', 'numeric', 'min:0', 'max:100'];
        $rules['withdrawal_fee_percent'] = ['required', 'numeric', 'min:0', 'max:100'];
        $rules['support_email']          = ['required', 'email', 'max:255'];

        return $rules;
    }
}
