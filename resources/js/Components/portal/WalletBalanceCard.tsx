import { ArrowDownCircle, ArrowUpCircle, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { WalletSummary } from '../../types';
import { coin, money, num } from './format';

interface Props {
    wallet: WalletSummary;
    onDeposit: () => void;
    onWithdraw: () => void;
}

/** How often the accrued-today figure advances. */
const TICK_MS = 2500;

export default function WalletBalanceCard({ wallet, onDeposit, onWithdraw }: Props) {
    const symbol = wallet.base_symbol;
    const [balance, setBalance] = useState(() => num(wallet.balance));
    const [profitToday, setProfitToday] = useState(() => num(wallet.profit_today));

    useEffect(() => {
        setBalance(num(wallet.balance));
        setProfitToday(num(wallet.profit_today));
    }, [wallet.balance, wallet.profit_today]);

    // Both figures advance at the same accrual rate the server quoted.
    useEffect(() => {
        const perTick = (num(wallet.daily) * (TICK_MS / 1000)) / 86400;
        if (perTick <= 0) return;

        const timer = window.setInterval(() => {
            setBalance(current => current + perTick);
            setProfitToday(current => current + perTick);
        }, TICK_MS);

        return () => window.clearInterval(timer);
    }, [wallet.daily]);

    const toBase = (usd: number) => (wallet.base_price > 0 ? usd / wallet.base_price : 0);

    return (
        <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6">
            <p className="mb-3 flex items-center gap-2 text-sm text-[var(--portal-text-soft)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--portal-accent-soft)] text-[var(--portal-accent)]">
                    <Wallet size={15} />
                </span>
                Total Balance
            </p>

            <p className="text-[clamp(1.8rem,4.5vw,2.6rem)] font-bold leading-tight tabular-nums text-[var(--portal-text)]">
                {coin(toBase(balance))} <span className="text-[0.5em] font-semibold">{symbol}</span>
            </p>
            <p className="mt-0.5 text-sm tabular-nums text-[var(--portal-muted)]">{money(balance)}</p>

            {/* Accrual strip */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--portal-pos)] bg-[var(--portal-pos-soft)] px-4 py-3">
                <div className="flex items-center gap-3">
                    <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'var(--portal-surface)', color: 'var(--portal-pos)' }}
                    >
                        <TrendingUp size={15} />
                    </span>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--portal-muted)]">
                            Profit earned today
                        </p>
                        <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--portal-pos)' }}>
                            +{coin(toBase(profitToday))} {symbol}
                        </p>
                        <p className="text-xs tabular-nums text-[var(--portal-muted)]">{money(profitToday)}</p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xs font-medium" style={{ color: 'var(--portal-pos)' }}>
                        {wallet.daily_rate}%/day
                    </p>
                    <p className="text-xs tabular-nums text-[var(--portal-text-soft)]">
                        +{coin(wallet.daily_base)}/day
                    </p>
                    <p className="text-xs tabular-nums text-[var(--portal-muted)]">
                        {money(wallet.daily)}/day
                    </p>
                </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-3">
                    <p className="text-xs text-[var(--portal-muted)]">Deposited</p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums text-[var(--portal-text)]">
                        {coin(wallet.deposited_base)} <span className="text-xs font-normal">{symbol}</span>
                    </p>
                    <p className="text-xs tabular-nums text-[var(--portal-muted)]">{money(wallet.deposited)}</p>
                </div>

                <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-3">
                    <p className="text-xs text-[var(--portal-muted)]">Pending</p>
                    <p
                        className="mt-0.5 text-base font-semibold tabular-nums"
                        style={{
                            color: wallet.pending > 0 ? 'var(--portal-accent)' : 'var(--portal-text)',
                        }}
                    >
                        {coin(wallet.pending_base)} <span className="text-xs font-normal">{symbol}</span>
                    </p>
                    <p className="text-xs tabular-nums text-[var(--portal-muted)]">{money(wallet.pending)}</p>
                </div>
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
