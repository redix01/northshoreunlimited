<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Creates (or refreshes) the administrator account.
 *
 * Run on its own with:  php artisan db:seed --class=AdminUserSeeder
 *
 * Credentials come from ADMIN_EMAIL / ADMIN_USERNAME / ADMIN_PASSWORD in the
 * environment. When no password is configured a strong one is generated and
 * printed once — an existing admin keeps its current password unless
 * ADMIN_PASSWORD is set, so re-seeding never silently locks anyone out.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email    = env('ADMIN_EMAIL', 'admin@northshoreunlimited.com');
        $username = env('ADMIN_USERNAME', 'admin');
        $name     = env('ADMIN_NAME', 'Administrator');
        $password = env('ADMIN_PASSWORD');

        $existing = User::where('email', $email)->first();

        // Only touch the password when one is configured, or when creating anew.
        $generated = null;
        if (!$password && !$existing) {
            $generated = Str::password(16, symbols: false);
            $password = $generated;
        }

        $attributes = [
            'name'          => $name,
            'username'      => $username,
            'role'          => 'admin',
            'status'        => 'active',
            'is_verified'   => true,
            'topup_enabled' => false,
            'member_id'     => $existing?->member_id ?? 'ADMIN-001',
        ];

        if ($password) {
            $attributes['password'] = $password;
        }

        $admin = User::updateOrCreate(['email' => $email], $attributes);

        $this->report($admin, $generated, (bool) $password);
    }

    protected function report(User $admin, ?string $generated, bool $passwordSet): void
    {
        if (!$this->command) {
            return;
        }

        $this->command->newLine();
        $this->command->info('Administrator account ready:');
        $this->command->table(
            ['Field', 'Value'],
            [
                ['Name', $admin->name],
                ['Username', $admin->username],
                ['Email', $admin->email],
                ['Password', $generated ?? ($passwordSet ? '(set from ADMIN_PASSWORD)' : '(unchanged)')],
                ['Role', $admin->role],
                ['Member ID', $admin->member_id],
                ['Sign in at', rtrim(config('app.url'), '/') . '/login'],
            ],
        );

        if ($generated) {
            $this->command->warn('This generated password is shown once. Store it now, or set ADMIN_PASSWORD and re-run.');
        }
    }
}
