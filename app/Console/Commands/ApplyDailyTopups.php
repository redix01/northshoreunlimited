<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\TopupService;
use Illuminate\Console\Command;

class ApplyDailyTopups extends Command
{
    protected $signature = 'balance:topup
                            {--user= : Only run for this user id}
                            {--force : Ignore the master switch and the once-per-day guard}';

    protected $description = 'Credit each eligible client their daily percentage top-up';

    public function handle(TopupService $topups): int
    {
        $force = (bool) $this->option('force');

        if ($userId = $this->option('user')) {
            $user = User::find($userId);

            if (!$user) {
                $this->error("No user with id {$userId}.");

                return self::FAILURE;
            }

            $amount = $topups->runForUser($user, $force);

            $amount === null
                ? $this->warn("{$user->name} was skipped (not eligible today).")
                : $this->info("Credited {$user->name} " . number_format($amount, 2) . '.');

            return self::SUCCESS;
        }

        $result = $topups->runForAll($force);

        if ($result['reason']) {
            $this->warn($result['reason']);

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Daily top-up complete: %d credited, %d skipped, %s total.',
            $result['credited'],
            $result['skipped'],
            number_format($result['total'], 2),
        ));

        return self::SUCCESS;
    }
}
