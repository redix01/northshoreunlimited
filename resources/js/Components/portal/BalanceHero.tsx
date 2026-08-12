import {
    ArrowDownCircle,
    ArrowUpCircle,
    BarChart2,
    TrendingDown,
    TrendingUp,
    Zap,
} from 'lucide-react';
import type { PortfolioHighlights, PortfolioSummary } from '../../types';
import { money, signedMoney, signedPercent } from './format';

interface Props {
    summary: PortfolioSummary;
    highlights: PortfolioHighlights;
    liveValue: number;
    isVerified: boolean;
    memberId: string | null;
    onDeposit: () => void;
    onWithdraw: () => void;
}

function Tile({
    icon,
    value,
    label,
    tone,
}: {
    icon: React.ReactNode;
    value: string;
    label: string;
    tone?: string;
}) {
    return (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 py-2.5 text-center">
            <span className="mb-1 flex justify-center text-[var(--portal-muted)]">{icon}</span>
            <p className="text-sm font-semibold tabular-nums" style={{ color: tone ?? 'var(--portal-text)' }}>
                {value}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--portal-muted)]">{label}</p>
        </div>
    );
}

export default function BalanceHero({
    summary,
    highlights,
    liveValue,
    isVerified,
    memberId,
    onDeposit,
    onWithdraw,
}: Props) {
    const headlineUp = summary.headline.value >= 0;
    const rows = [
        { label: 'Daily', change: summary.daily },
        { label: 'Weekly', change: summary.weekly },
        { label: 'All-time', change: summary.all_time },
    ];

    return (
        <section className="relative overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6 shadow-[var(--portal-shadow)]">
            {/* Accent rail, echoing the brand mark. */}
            <span className="absolute inset-y-0 left-0 w-1 bg-[var(--portal-accent)]" aria-hidden />
            <span
                className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-[0.07]"
                style={{ background: 'var(--portal-accent)' }}
                aria-hidden
            />

            <div className="relative flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--portal-muted)]">
                        Total Portfolio Value
                    </p>
                    <p className="mt-1 text-[clamp(1.9rem,5vw,3rem)] font-bold leading-tight tabular-nums text-[var(--portal-text)]">
                        {money(liveValue)}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium tabular-nums"
                            style={{
                                color: headlineUp ? 'var(--portal-pos)' : 'var(--portal-neg)',
                                background: headlineUp ? 'var(--portal-pos-soft)' : 'var(--portal-neg-soft)',
                            }}
                        >
                            {headlineUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {signedMoney(summary.headline.value)} ({signedPercent(summary.headline.percent)})
                        </span>
                        <span className="text-xs text-[var(--portal-muted)]">24h</span>
                    </div>

                    <dl className="mt-3 space-y-1 text-sm">
                        {rows.map(row => (
                            <div key={row.label} className="flex items-baseline gap-2">
                                <dt className="text-[var(--portal-text-soft)]">{row.label}:</dt>
                                <dd
                                    className="font-medium tabular-nums"
                                    style={{
                                        color:
                                            row.change.value >= 0
                                                ? 'var(--portal-pos)'
                                                : 'var(--portal-neg)',
                                    }}
                                >
                                    {signedMoney(row.change.value)}{' '}
                                    <span className="text-xs text-[var(--portal-muted)]">
                                        ({signedPercent(row.change.percent)})
                                    </span>
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <p className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span
                            style={{ color: isVerified ? 'var(--portal-pos)' : 'var(--portal-accent)' }}
                        >
                            ● {isVerified ? 'Verified account' : 'Pending verification'}
                        </span>
                        {memberId && (
                            <span className="rounded bg-[var(--portal-surface-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--portal-muted)]">
                                {memberId}
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-4">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onDeposit}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--portal-accent)] px-4 py-2 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)]"
                        >
                            <ArrowDownCircle size={15} />
                            Deposit
                        </button>
                        <button
                            type="button"
                            onClick={onWithdraw}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--portal-border-strong)] px-4 py-2 text-sm font-medium text-[var(--portal-text-soft)] transition-colors hover:bg-[var(--portal-surface-2)]"
                        >
                            <ArrowUpCircle size={15} />
                            Withdraw
                        </button>
                    </div>

                    <div className="grid w-full min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-4">
                        <Tile
                            icon={<BarChart2 size={14} />}
                            value={String(highlights.assets)}
                            label="Assets"
                        />
                        <Tile
                            icon={<Zap size={14} />}
                            value={signedPercent(highlights.daily_yield)}
                            label="Daily yield"
                            tone="var(--portal-pos)"
                        />
                        <Tile
                            icon={<TrendingUp size={14} />}
                            value={highlights.best ? signedPercent(highlights.best.change, 1) : '—'}
                            label={highlights.best ? `Best · ${highlights.best.symbol}` : 'Best'}
                            tone={
                                highlights.best && highlights.best.change < 0
                                    ? 'var(--portal-neg)'
                                    : 'var(--portal-pos)'
                            }
                        />
                        <Tile
                            icon={<TrendingDown size={14} />}
                            value={highlights.worst ? signedPercent(highlights.worst.change, 1) : '—'}
                            label={highlights.worst ? `Worst · ${highlights.worst.symbol}` : 'Worst'}
                            tone={
                                highlights.worst && highlights.worst.change < 0
                                    ? 'var(--portal-neg)'
                                    : 'var(--portal-pos)'
                            }
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
