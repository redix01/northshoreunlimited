import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Inbox } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PortalLayout from '../../Components/PortalLayout';
import AssetsTable from '../../Components/portal/AssetsTable';
import BalanceHero from '../../Components/portal/BalanceHero';
import BalanceStrip from '../../Components/portal/BalanceStrip';
import DepositModal from '../../Components/portal/DepositModal';
import DepositPanel from '../../Components/portal/DepositPanel';
import IdentityStatusCard from '../../Components/portal/IdentityStatusCard';
import MarketTicker from '../../Components/portal/MarketTicker';
import PortfolioChart from '../../Components/portal/PortfolioChart';
import WithdrawModal from '../../Components/portal/WithdrawModal';
import { money, num, shortDate } from '../../Components/portal/format';
import type {
    ChartRange,
    DashboardUser,
    Deposit,
    HoldingAsset,
    PageProps,
    PortfolioHighlights,
    PortfolioSeries,
    PortfolioSummary,
    Quote,
    Verification,
    Wallet,
    Withdrawal,
} from '../../types';

interface Props extends PageProps {
    dashUser: DashboardUser;
    verification: Verification;
    summary: PortfolioSummary;
    highlights: PortfolioHighlights;
    assets: HoldingAsset[];
    series: PortfolioSeries;
    ranges: ChartRange[];
    quotes: Quote[];
    wallets: Wallet[];
    recentDeposits: Deposit[];
    recentWithdrawals: Withdrawal[];
    stats: {
        total_deposited: number;
        total_withdrawn: number;
        pending_deposits: number;
        pending_withdrawals: number;
    };
}

/** How often the displayed balance advances along the accrual rate. */
const TICK_MS = 2500;

const STATUS_TONE: Record<string, string> = {
    pending:    'var(--portal-accent)',
    processing: 'var(--portal-accent)',
    approved:   'var(--portal-pos)',
    completed:  'var(--portal-pos)',
    rejected:   'var(--portal-neg)',
};

function StatusPill({ status }: { status: string }) {
    const tone = STATUS_TONE[status] ?? 'var(--portal-muted)';

    return (
        <span
            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
            style={{ color: tone, background: `color-mix(in srgb, ${tone} 12%, transparent)` }}
        >
            {status}
        </span>
    );
}

export default function DashboardIndex() {
    const {
        dashUser,
        verification,
        summary,
        highlights,
        assets,
        series,
        ranges,
        quotes,
        wallets,
        recentDeposits,
        recentWithdrawals,
        stats,
    } = usePage<Props>().props;

    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [depositCurrency, setDepositCurrency] = useState<string | null>(null);
    const [liveValue, setLiveValue] = useState(() => num(summary.total_value));

    // Reset whenever the server sends a new balance (deposit approved, etc.).
    useEffect(() => {
        setLiveValue(num(summary.total_value));
    }, [summary.total_value]);

    /*
     * The daily yield accrues continuously; between page loads we advance the
     * displayed figure at that rate rather than inventing movement. The server
     * value remains the source of truth on every refresh.
     */
    useEffect(() => {
        const perTick = (num(summary.daily.value) * (TICK_MS / 1000)) / 86400;
        if (perTick <= 0) return;

        const timer = window.setInterval(() => {
            setLiveValue(current => current + perTick);
        }, TICK_MS);

        return () => window.clearInterval(timer);
    }, [summary.daily.value]);

    const openDeposit = useCallback((currency?: string) => {
        setDepositCurrency(currency ?? null);
        setDepositOpen(true);
    }, []);

    const activity = useMemo(
        () =>
            [
                ...recentDeposits.map(item => ({ ...item, kind: 'deposit' as const })),
                ...recentWithdrawals.map(item => ({ ...item, kind: 'withdrawal' as const })),
            ]
                .sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                )
                .slice(0, 8),
        [recentDeposits, recentWithdrawals],
    );

    return (
        <PortalLayout
            active="Dashboard"
            notifications={stats.pending_deposits + stats.pending_withdrawals}
            onTalkToAdvisor={() => openDeposit()}
        >
            <Head title="Dashboard" />

            <div className="space-y-5">
                <BalanceHero
                    summary={summary}
                    highlights={highlights}
                    liveValue={liveValue}
                    isVerified={dashUser.is_verified}
                    memberId={dashUser.member_id}
                    onDeposit={() => openDeposit()}
                    onWithdraw={() => setWithdrawOpen(true)}
                />

                <BalanceStrip
                    summary={summary}
                    liveValue={liveValue}
                    onDeposit={() => openDeposit()}
                    onWithdraw={() => setWithdrawOpen(true)}
                />

                <MarketTicker quotes={quotes} />

                <PortfolioChart series={series} ranges={ranges} liveValue={liveValue} />

                {/* min-w-0: without it the assets table's min-width pushes the
                    whole grid past the viewport instead of scrolling in place. */}
                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="min-w-0 space-y-5 lg:col-span-2">
                        <AssetsTable
                            assets={assets}
                            liveValue={liveValue}
                            onDeposit={symbol => openDeposit(symbol)}
                        />

                        <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
                            <header className="flex items-center justify-between border-b border-[var(--portal-border)] px-5 py-4">
                                <h2 className="text-base font-semibold text-[var(--portal-text)]">
                                    Recent Activity
                                </h2>
                                <Link
                                    href="/user/wallet"
                                    className="text-xs text-[var(--portal-accent)] hover:underline"
                                >
                                    View all
                                </Link>
                            </header>

                            {activity.length === 0 ? (
                                <p className="px-5 py-12 text-center text-sm text-[var(--portal-muted)]">
                                    <Inbox size={20} className="mx-auto mb-2 opacity-50" />
                                    No transactions yet. Make your first deposit to get started.
                                </p>
                            ) : (
                                <ul className="divide-y divide-[var(--portal-border)]">
                                    {activity.map(item => {
                                        const isDeposit = item.kind === 'deposit';

                                        return (
                                            <li
                                                key={`${item.kind}-${item.id}`}
                                                className="flex items-center gap-3 px-5 py-3.5"
                                            >
                                                <span
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                                    style={{
                                                        background: isDeposit
                                                            ? 'var(--portal-pos-soft)'
                                                            : 'var(--portal-accent-soft)',
                                                        color: isDeposit
                                                            ? 'var(--portal-pos)'
                                                            : 'var(--portal-accent)',
                                                    }}
                                                >
                                                    {isDeposit ? (
                                                        <ArrowDownCircle size={15} />
                                                    ) : (
                                                        <ArrowUpCircle size={15} />
                                                    )}
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium capitalize text-[var(--portal-text)]">
                                                        {item.kind} · {item.currency}
                                                    </span>
                                                    <span className="block text-xs text-[var(--portal-muted)]">
                                                        {shortDate(item.created_at)}
                                                    </span>
                                                </span>

                                                <span className="shrink-0 text-right">
                                                    <span
                                                        className="block text-sm font-semibold tabular-nums"
                                                        style={{
                                                            color: isDeposit
                                                                ? 'var(--portal-pos)'
                                                                : 'var(--portal-accent)',
                                                        }}
                                                    >
                                                        {isDeposit ? '+' : '-'}
                                                        {money(item.amount)}
                                                    </span>
                                                    <StatusPill status={item.status} />
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>
                    </div>

                    <div className="space-y-5">
                        <IdentityStatusCard verification={verification} />
                        <DepositPanel wallets={wallets} />
                    </div>
                </div>
            </div>

            <DepositModal
                open={depositOpen}
                onClose={() => setDepositOpen(false)}
                wallets={wallets}
                basePrice={summary.base_price}
                initialCurrency={depositCurrency}
            />

            <WithdrawModal
                open={withdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                wallets={wallets}
                balance={num(summary.available)}
                basePrice={summary.base_price}
                baseSymbol={summary.base_symbol}
            />
        </PortalLayout>
    );
}
