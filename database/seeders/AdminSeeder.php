<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(AdminUserSeeder::class);

        User::updateOrCreate(
            ['email' => 'dmf24254@gmail.com'],
            [
                'name'              => 'David Martini Fauteux',
                'username'          => 'dmf24254',
                'password'          => Hash::make('Demo@2026!'),
                'role'              => 'user',
                'balance'           => 125000.00,
                'phone'             => '5087637545',
                'address'           => '174 Union Street, New Bedford, MA 02740, United States',
                'employment_status' => 'Self-Employed',
                'occupation'        => 'IT Consultant',
                'source_of_funds'   => 'Employment Income',
                'pep_status'        => false,
                'tax_id'            => '****8554',
                'is_verified'       => true,
                'member_id'         => 'GCC-8CBFDC8A',
            ]
        );

        foreach ([
            ['name' => 'Bitcoin Mainnet', 'currency' => 'BTC', 'network' => 'Bitcoin Mainnet', 'address' => 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'],
            ['name' => 'Ethereum ERC-20', 'currency' => 'ETH', 'network' => 'ERC-20', 'address' => '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'],
            ['name' => 'USDT Tron', 'currency' => 'USDT', 'network' => 'TRC-20', 'address' => 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'],
            ['name' => 'USDC Ethereum', 'currency' => 'USDC', 'network' => 'ERC-20', 'address' => '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'],
        ] as $wallet) {
            Wallet::updateOrCreate(
                ['currency' => $wallet['currency'], 'network' => $wallet['network']],
                $wallet + ['is_active' => true]
            );
        }
    }
}
