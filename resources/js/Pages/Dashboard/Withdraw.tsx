import { Head, usePage } from '@inertiajs/react';
import { ArrowUpCircle, Inbox, Plus } from 'lucide-react';
import { useState } from 'react';
import PortalLayout from '../../Components/PortalLayout';
import Pagination from '../../Components/portal/Pagination';
import WithdrawModal from '../../Components/portal/WithdrawModal';
import { coin, money, shortDate, truncateMiddle } from '../../Components/portal/format';
import type { PageProps, PaginatedData, Wallet, WalletSummary, Withdrawal } from '../../types';

interface Props extends PageProps {
    withdrawals: PaginatedData<Withdrawal>;
    wallet: WalletSummary;
    wallets: Wallet[];
    balance: number;
}

const STATUS_TONE: Record<string, string> = {
    pending:    'var(--portal-accent)',
    processing: 'var(--portal-accent)',
    approved:   'var(--portal-pos)',
    completed:  'var(--portal-pos)',
    rejected:   'var(--portal-neg)',
};

export default function WithdrawPage() {
    const { withdrawals, wallet, wallets, balance } = usePage<Props>().props;
    const [open, setOpen] = useState(false);

    const pending = withdrawals.data.filter(row => row.status === 'pending').length;

    return (
        <PortalLayout active="Markets" onTalkToAdvisor={() => setOpen(true)}>
            <Head title="Withdrawals" />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-[var(--portal-text)]">Withdrawals</h1>
                        <p className="mt-0.5 text-sm text-[var(--portal-muted)]">
                            Requests are reviewed and processed within 24–48 hours.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)]"
                    >
                        <Plus size={15} />
                        New withdrawal
                    </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 py-4">
                        <p className="text-xs text-[var(--portal-muted)]">Available balance</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--portal-text)]">
                            {coin(wallet.balance_base)}{' '}
                            <span className="text-xs font-normal">{wallet.base_symbol}</span>
                        </p>
                        <p className="text-xs tabular-nums text-[var(--portal-muted)]">{money(balance)}</p>
                    </div>

                    <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 py-4">
                        <p className="text-xs text-[var(--portal-muted)]">Total withdrawn</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--portal-text)]">
                            {money(wallet.withdrawn)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 py-4">
                        <p className="text-xs text-[var(--portal-muted)]">In review</p>
                        <p
                            className="mt-1 text-xl font-semibold tabular-nums"
                            style={{ color: pending ? 'var(--portal-accent)' : 'var(--portal-text)' }}
                        >
                            {pending}
                        </p>
                        <p className="text-xs text-[var(--portal-muted)]">Limit of 3 at a time</p>
                    </div>
                </div>

                <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
                    <h2 className="border-b border-[var(--portal-border)] px-5 py-4 text-base font-semibold text-[var(--portal-text)]">
                        Withdrawal History
                    </h2>

                    {withdrawals.data.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <Inbox size={22} className="mx-auto mb-2 text-[var(--portal-muted)] opacity-60" />
                            <p className="text-sm text-[var(--portal-muted)]">No withdrawals yet.</p>
                        </div>
                    ) : (
                        <>
                            <ul className="divide-y divide-[var(--portal-border)]">
                                {withdrawals.data.map(row => (
                                    <li key={row.id} className="flex items-start gap-3 px-5 py-4">
                                        <span
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                            style={{
                                                background: 'var(--portal-accent-soft)',
                                                color: 'var(--portal-accent)',
                                            }}
                                        >
                                            <ArrowUpCircle size={16} />
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold tabular-nums text-[var(--portal-text)]">
                                                    {money(row.amount)}
                                                </span>
                                                <span className="text-xs text-[var(--portal-muted)]">
                                                    {row.currency}
                                                    {row.network ? ` · ${row.network}` : ''}
                                                </span>
                                                <span
                                                    className="rounded px-1.5 py-0.5 text-[11px] font-medium capitalize"
                                                    style={{
                                                        color: STATUS_TONE[row.status],
                                                        background: `color-mix(in srgb, ${STATUS_TONE[row.status]} 12%, transparent)`,
                                                    }}
                                                >
                                                    {row.status}
                                                </span>
                                            </div>

                                            <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                                                {shortDate(row.created_at)}
                                            </p>
                                            <p className="mt-0.5 font-mono text-[11px] text-[var(--portal-muted)]">
                                                → {truncateMiddle(row.wallet_address, 16, 8)}
                                            </p>

                                            {row.admin_notes && (
                                                <p className="mt-0.5 text-xs italic text-[var(--portal-muted)]">
                                                    “{row.admin_notes}”
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <Pagination
                                links={withdrawals.links}
                                from={withdrawals.from}
                                to={withdrawals.to}
                                total={withdrawals.total}
                            />
                        </>
                    )}
                </section>
            </div>

            <WithdrawModal
                open={open}
                onClose={() => setOpen(false)}
                wallets={wallets}
                balance={balance}
                basePrice={wallet.base_price}
                baseSymbol={wallet.base_symbol}
            />
        </PortalLayout>
    );
}
