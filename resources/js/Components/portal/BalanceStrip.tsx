import { ArrowDownCircle, ArrowUpCircle, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { PortfolioSummary } from '../../types';
import { coin, money } from './format';

interface Props {
    summary: PortfolioSummary;
    liveValue: number;
    onDeposit: () => void;
    onWithdraw: () => void;
}

/** Deposited / withdrawn / available, denominated in the settlement asset. */
export default function BalanceStrip({ summary, liveValue, onDeposit, onWithdraw }: Props) {
    const symbol = summary.base_symbol;
    const liveBase = summary.base_price > 0 ? liveValue / summary.base_price : 0;

    const cells = [
        {
            label: 'Total deposited',
            amount: summary.deposited_base,
            usd: summary.deposited,
            icon: <TrendingUp size={14} />,
            tone: 'var(--portal-pos)',
        },
        {
            label: 'Total withdrawn',
            amount: summary.withdrawn_base,
            usd: summary.withdrawn,
            icon: <TrendingDown size={14} />,
            tone: 'var(--portal-accent)',
        },
        {
            label: 'Available balance',
            amount: liveBase,
            usd: liveValue,
            icon: <Wallet size={14} />,
            tone: 'var(--portal-text)',
        },
    ];

    return (
        <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5">
            <div className="grid gap-3 sm:grid-cols-3">
                {cells.map(cell => (
                    <div
                        key={cell.label}
                        className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-5 text-center"
                    >
                        <span className="mb-2 flex justify-center" style={{ color: cell.tone }}>
                            {cell.icon}
                        </span>
                        <p className="text-lg font-semibold tabular-nums" style={{ color: cell.tone }}>
                            {coin(cell.amount)}{' '}
                            <span className="text-xs font-normal text-[var(--portal-muted)]">{symbol}</span>
                        </p>
                        <p className="mt-0.5 text-xs tabular-nums text-[var(--portal-muted)]">
                            {money(cell.usd)}
                        </p>
                        <p className="mt-1.5 text-[10px] uppercase tracking-wider text-[var(--portal-muted)]">
                            {cell.label}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={onDeposit}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[var(--portal-accent)] py-3.5 text-sm font-semibold text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)]"
                >
                    <ArrowDownCircle size={17} />
                    Deposit
                </button>
                <button
                    type="button"
                    onClick={onWithdraw}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface-2)] py-3.5 text-sm font-semibold text-[var(--portal-text-soft)] transition-colors hover:bg-[var(--portal-bg-2)]"
                >
                    <ArrowUpCircle size={17} />
                    Withdraw
                </button>
            </div>
        </section>
    );
}
