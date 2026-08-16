<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\TopupService;
use Illuminate\Console\Command;

class ApplyDailyTopups extends Command
{
    protected $signature = 'balance:topup
                            {--user= : Only settle this user id}
                            {--force : Ignore the platform master switch}';

    protected $description = 'Settle the accrual each eligible client has earned since their last top-up';

    public function handle(TopupService $topups): int
    {
        $force = (bool) $this->option('force');

        if ($userId = $this->option('user')) {
            $user = User::find($userId);

            if (!$user) {
                $this->error("No user with id {$userId}.");

                return self::FAILURE;
            }

            $amount = $topups->settle($user, null, $force);

            $amount === null
                ? $this->warn("{$user->name} had nothing to settle.")
                : $this->info("Credited {$user->name} " . number_format($amount, 2) . '.');

            return self::SUCCESS;
        }

        $result = $topups->runForAll($force);

        if ($result['reason']) {
            $this->warn($result['reason']);

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Top-up settlement complete: %d credited, %d skipped, %s total.',
            $result['credited'],
            $result['skipped'],
            number_format($result['total'], 2),
        ));

        return self::SUCCESS;
    }
}
