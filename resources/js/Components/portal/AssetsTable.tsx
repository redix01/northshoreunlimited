import { TrendingDown, TrendingUp } from 'lucide-react';
import type { HoldingAsset } from '../../types';
import { coin, money, price, signedMoney, signedPercent } from './format';

interface Props {
    assets: HoldingAsset[];
    onDeposit: (symbol: string) => void;
    /** Live book value, split across holdings by allocation. */
    liveValue?: number;
}

const SYMBOL_TINT: Record<string, string> = {
    BTC:  '#f7931a',
    ETH:  '#627eea',
    SOL:  '#14f195',
    USDT: '#26a17b',
};

export default function AssetsTable({ assets, onDeposit, liveValue }: Props) {
    return (
        <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
            <header className="flex items-center justify-between border-b border-[var(--portal-border)] px-5 py-4">
                <h2 className="text-base font-semibold text-[var(--portal-text)]">Your Assets</h2>
                <span className="rounded-full bg-[var(--portal-accent-soft)] px-2.5 py-0.5 text-xs text-[var(--portal-accent)]">
                    {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
                </span>
            </header>

            {assets.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-[var(--portal-muted)]">
                    No holdings yet. Your first approved deposit will appear here.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-[var(--portal-muted)]">
                                <th className="px-5 py-3 font-medium">Asset</th>
                                <th className="px-3 py-3 font-medium">Balance</th>
                                <th className="px-3 py-3 font-medium">Price</th>
                                <th className="px-3 py-3 font-medium">Daily Return</th>
                                <th className="px-3 py-3 font-medium">Allocation</th>
                                <th className="px-5 py-3 text-right font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--portal-border)]">
                            {assets.map(asset => {
                                const up = asset.daily_return >= 0;
                                const Trend = up ? TrendingUp : TrendingDown;
                                const tone = up ? 'var(--portal-pos)' : 'var(--portal-neg)';
                                const tint = SYMBOL_TINT[asset.symbol] ?? 'var(--portal-accent)';

                                // Track the ticking hero figure so the two never disagree.
                                const value =
                                    liveValue === undefined
                                        ? asset.value
                                        : (liveValue * asset.allocation) / 100;
                                const amount =
                                    asset.value > 0 ? (asset.amount * value) / asset.value : asset.amount;

                                return (
                                    <tr key={asset.symbol} className="align-middle">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                                                    style={{ background: `${tint}22`, color: tint }}
                                                >
                                                    {asset.symbol.charAt(0)}
                                                </span>
                                                <span>
                                                    <span className="block text-sm font-medium text-[var(--portal-text)]">
                                                        {asset.name}
                                                    </span>
                                                    <span className="block text-xs text-[var(--portal-muted)]">
                                                        {asset.symbol}
                                                    </span>
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-3 py-4">
                                            <span className="block text-sm font-medium tabular-nums text-[var(--portal-text)]">
                                                {coin(amount, 2)} {asset.symbol}
                                            </span>
                                            <span className="block text-xs tabular-nums text-[var(--portal-muted)]">
                                                {money(value)}
                                            </span>
                                            <span
                                                className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                                                style={{ color: 'var(--portal-pos)', background: 'var(--portal-pos-soft)' }}
                                            >
                                                {signedPercent(asset.yield_rate, 1)}/day
                                            </span>
                                        </td>

                                        <td className="px-3 py-4 text-sm tabular-nums text-[var(--portal-text-soft)]">
                                            {price(asset.price)}
                                        </td>

                                        <td className="px-3 py-4">
                                            <span className="flex items-center gap-1 text-sm font-medium tabular-nums" style={{ color: tone }}>
                                                <Trend size={13} />
                                                {signedMoney(asset.daily_return)}
                                            </span>
                                            <span className="block text-[10px] text-[var(--portal-muted)]">
                                                {signedPercent(asset.yield_rate, 1)} managed yield
                                            </span>
                                        </td>

                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--portal-surface-2)]">
                                                    <span
                                                        className="block h-full rounded-full bg-[var(--portal-accent)]"
                                                        style={{ width: `${Math.min(asset.allocation, 100)}%` }}
                                                    />
                                                </span>
                                                <span className="text-xs tabular-nums text-[var(--portal-muted)]">
                                                    {asset.allocation.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => onDeposit(asset.symbol)}
                                                className="rounded-lg border border-[var(--portal-accent)] px-3 py-1.5 text-xs font-medium text-[var(--portal-accent)] transition-colors hover:bg-[var(--portal-accent-soft)]"
                                            >
                                                Deposit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
