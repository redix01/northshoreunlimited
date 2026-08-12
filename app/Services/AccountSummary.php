<?php

namespace App\Services;

use App\Models\Deposit;
use App\Models\User;
use App\Models\UserDocument;
use App\Models\Withdrawal;
use Carbon\CarbonImmutable;

/**
 * Account-level figures shared by the wallet and profile screens: the balance
 * card, the unified transaction feed, and the verification checklist.
 */
class AccountSummary
{
    private float $rate;

    /** The amount tonight's top-up run will credit this client. */
    private float $daily;

    public function __construct(private User $user, private MarketData $market, ?TopupService $topups = null)
    {
        $topups = $topups ?? app(TopupService::class);

        // Quoted from the top-up settings, so the wallet card and the nightly
        // run never disagree about what the client earns.
        $this->rate  = $topups->activeRateFor($user);
        $this->daily = $topups->projectedAmountFor($user);
    }

    /** Balance card: totals in the settlement asset plus the accrual rate. */
    public function wallet(): array
    {
        $price     = $this->basePrice();
        $balance   = (float) $this->user->balance;
        $deposited = $this->sum(Deposit::class, ['approved']);
        $pending   = $this->sum(Deposit::class, ['pending']);
        $daily     = $this->daily;

        return [
            'base_symbol'    => config('markets.base', 'BTC'),
            'base_price'     => $price,

            'balance'        => round($balance, 2),
            'balance_base'   => $this->toBase($balance),

            'deposited'      => round($deposited, 2),
            'deposited_base' => $this->toBase($deposited),

            'pending'        => round($pending, 2),
            'pending_base'   => $this->toBase($pending),

            'withdrawn'      => round($this->sum(Withdrawal::class, ['approved', 'completed']), 2),

            // Accrual rate, and how much of today's accrual has been earned so
            // far. The client ticks the latter forward from this figure.
            'daily_rate'     => round($this->rate, 2),
            'daily'          => round($daily, 2),
            'daily_base'     => $this->toBase($daily),
            'profit_today'   => round($daily * $this->fractionOfDayElapsed(), 2),
            'profit_today_base' => $this->toBase($daily * $this->fractionOfDayElapsed()),
        ];
    }

    /** Deposits and withdrawals merged into one reverse-chronological feed. */
    public function transactions(int $limit = 20): array
    {
        $price = $this->basePrice();

        $deposits = Deposit::where('user_id', $this->user->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => $this->transaction($row, 'deposit', $price));

        $withdrawals = Withdrawal::where('user_id', $this->user->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => $this->transaction($row, 'withdrawal', $price));

        return $deposits->concat($withdrawals)
            ->sortByDesc('created_at')
            ->take($limit)
            ->values()
            ->all();
    }

    /** Verification checklist, progress, and the confirmed identity details. */
    /**
     * The client's most recent photo-ID submission, or null when they have
     * never sent one. Drives the identity card on the profile screen.
     */
    public function identitySubmission(): ?array
    {
        $document = UserDocument::identity()
            ->where('user_id', $this->user->id)
            ->orderByDesc('created_at')
            ->first();

        return $document ? [
            'status'       => $document->status,
            'type_label'   => $document->type_label,
            'admin_notes'  => $document->admin_notes,
            'submitted_at' => $document->created_at->toIso8601String(),
            'reviewed_at'  => optional($document->reviewed_at)->toIso8601String(),
        ] : null;
    }

    public function verification(): array
    {
        $user = $this->user;

        $steps = [
            [
                'key'   => 'personal',
                'label' => 'Personal information',
                'done'  => (bool) ($user->phone && $user->formattedAddress() && $user->date_of_birth),
            ],
            [
                'key'   => 'document',
                'label' => 'ID document uploaded',
                'done'  => (bool) $user->id_document_type,
            ],
            [
                'key'   => 'tax_id',
                'label' => 'Tax ID (last 4)',
                'done'  => (bool) $user->tax_id,
            ],
            [
                'key'   => 'name_match',
                'label' => 'Name verification',
                'done'  => (bool) $user->name_match_confirmed,
            ],
            [
                'key'   => 'identity',
                'label' => 'Identity verified',
                'done'  => (bool) $user->is_verified,
            ],
        ];

        $done = count(array_filter($steps, fn ($step) => $step['done']));

        return [
            'is_verified'    => (bool) $user->is_verified,
            'steps'          => $steps,
            'progress'       => (int) round($done / max(count($steps), 1) * 100),
            'document_type'  => $user->id_document_type,
            'tax_id_last4'   => $user->tax_id ? substr(preg_replace('/\D/', '', $user->tax_id), -4) : null,
            'verified_at'    => optional($user->verified_at)->toIso8601String(),
            'name_match'     => (bool) $user->name_match_confirmed,
        ];
    }

    /** Uploaded supporting documents, newest first. */
    /** Supporting paperwork only — photo ID has its own card and review flow. */
    public function documents(): array
    {
        return UserDocument::supporting()
            ->where('user_id', $this->user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($doc) => [
                'id'            => $doc->id,
                'type'          => $doc->type,
                'type_label'    => $doc->type_label,
                'label'         => $doc->label,
                'original_name' => $doc->original_name,
                'size'          => $doc->size,
                'status'        => $doc->status,
                'admin_notes'   => $doc->admin_notes,
                'url'           => '/user/documents/'.$doc->id,
                'created_at'    => $doc->created_at->toIso8601String(),
            ])
            ->all();
    }

    private function transaction(object $row, string $kind, float $price): array
    {
        $amount = (float) $row->amount;

        return [
            'id'         => $kind.'-'.$row->id,
            'kind'       => $kind,
            'amount'     => round($amount, 2),
            'amount_base' => $price > 0 ? round($amount / $price, 8) : 0.0,
            'currency'   => $row->currency,
            'status'     => $row->status,
            'address'    => $row->wallet_address,
            'created_at' => $row->created_at->toIso8601String(),
        ];
    }

    private function sum(string $model, array $statuses): float
    {
        return (float) $model::where('user_id', $this->user->id)
            ->whereIn('status', $statuses)
            ->sum('amount');
    }

    private function fractionOfDayElapsed(): float
    {
        $now = CarbonImmutable::now();

        return ($now->getTimestamp() - $now->startOfDay()->getTimestamp()) / 86400;
    }

    private function basePrice(): float
    {
        $price = $this->market->priceOf(config('markets.base', 'BTC'));

        return $price > 0 ? $price : 1.0;
    }

    private function toBase(float $usd): float
    {
        return round($usd / $this->basePrice(), 8);
    }
}
