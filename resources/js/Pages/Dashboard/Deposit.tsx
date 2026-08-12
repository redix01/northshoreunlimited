import { Head, usePage } from '@inertiajs/react';
import { ArrowDownCircle, ExternalLink, Inbox, Plus } from 'lucide-react';
import { useState } from 'react';
import PortalLayout from '../../Components/PortalLayout';
import DepositModal from '../../Components/portal/DepositModal';
import DepositPanel from '../../Components/portal/DepositPanel';
import Pagination from '../../Components/portal/Pagination';
import { coin, money, shortDate, truncateMiddle } from '../../Components/portal/format';
import type { Deposit, PageProps, PaginatedData, Wallet, WalletSummary } from '../../types';

interface Props extends PageProps {
    deposits: PaginatedData<Deposit>;
    wallet: WalletSummary;
    wallets: Wallet[];
}

const STATUS_TONE: Record<string, string> = {
    pending:  'var(--portal-accent)',
    approved: 'var(--portal-pos)',
    rejected: 'var(--portal-neg)',
};

export default function DepositPage() {
    const { deposits, wallet, wallets } = usePage<Props>().props;
    const [open, setOpen] = useState(false);

    return (
        <PortalLayout active="Markets" onTalkToAdvisor={() => setOpen(true)}>
            <Head title="Deposits" />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-[var(--portal-text)]">Deposits</h1>
                        <p className="mt-0.5 text-sm text-[var(--portal-muted)]">
                            Fund your account and track every request through review.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)]"
                    >
                        <Plus size={15} />
                        New deposit
                    </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 py-4">
                        <p className="text-xs text-[var(--portal-muted)]">Total deposited</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--portal-text)]">
                            {coin(wallet.deposited_base)}{' '}
                            <span className="text-xs font-normal">{wallet.base_symbol}</span>
                        </p>
                        <p className="text-xs tabular-nums text-[var(--portal-muted)]">
                            {money(wallet.deposited)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 py-4">
                        <p className="text-xs text-[var(--portal-muted)]">Awaiting review</p>
                        <p
                            className="mt-1 text-xl font-semibold tabular-nums"
                            style={{
                                color: wallet.pending > 0 ? 'var(--portal-accent)' : 'var(--portal-text)',
                            }}
                        >
                            {coin(wallet.pending_base)}{' '}
                            <span className="text-xs font-normal">{wallet.base_symbol}</span>
                        </p>
                        <p className="text-xs tabular-nums text-[var(--portal-muted)]">
                            {money(wallet.pending)}
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <section className="min-w-0 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] lg:col-span-2">
                        <h2 className="border-b border-[var(--portal-border)] px-5 py-4 text-base font-semibold text-[var(--portal-text)]">
                            Deposit History
                        </h2>

                        {deposits.data.length === 0 ? (
                            <div className="px-5 py-14 text-center">
                                <Inbox size={22} className="mx-auto mb-2 text-[var(--portal-muted)] opacity-60" />
                                <p className="text-sm text-[var(--portal-muted)]">
                                    No deposits yet. Start one above to fund your account.
                                </p>
                            </div>
                        ) : (
                            <>
                                <ul className="divide-y divide-[var(--portal-border)]">
                                    {deposits.data.map(deposit => (
                                        <li key={deposit.id} className="flex items-start gap-3 px-5 py-4">
                                            <span
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                                style={{
                                                    background: 'var(--portal-pos-soft)',
                                                    color: 'var(--portal-pos)',
                                                }}
                                            >
                                                <ArrowDownCircle size={16} />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold tabular-nums text-[var(--portal-text)]">
                                                        {money(deposit.amount)}
                                                    </span>
                                                    <span className="text-xs text-[var(--portal-muted)]">
                                                        {deposit.currency}
                                                    </span>
                                                    <span
                                                        className="rounded px-1.5 py-0.5 text-[11px] font-medium capitalize"
                                                        style={{
                                                            color: STATUS_TONE[deposit.status],
                                                            background: `color-mix(in srgb, ${STATUS_TONE[deposit.status]} 12%, transparent)`,
                                                        }}
                                                    >
                                                        {deposit.status === 'approved' ? 'confirmed' : deposit.status}
                                                    </span>
                                                </div>

                                                <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                                                    {shortDate(deposit.created_at)}
                                                </p>

                                                {deposit.tx_hash && (
                                                    <p className="mt-0.5 font-mono text-[11px] text-[var(--portal-muted)]">
                                                        TX {truncateMiddle(deposit.tx_hash, 14, 8)}
                                                    </p>
                                                )}

                                                {deposit.admin_notes && (
                                                    <p className="mt-0.5 text-xs italic text-[var(--portal-muted)]">
                                                        “{deposit.admin_notes}”
                                                    </p>
                                                )}
                                            </div>

                                            {deposit.proof_path && (
                                                <a
                                                    href={`/storage/${deposit.proof_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex shrink-0 items-center gap-1 text-xs text-[var(--portal-muted)] transition-colors hover:text-[var(--portal-text)]"
                                                >
                                                    <ExternalLink size={12} />
                                                    Proof
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                <Pagination
                                    links={deposits.links}
                                    from={deposits.from}
                                    to={deposits.to}
                                    total={deposits.total}
                                />
                            </>
                        )}
                    </section>

                    <DepositPanel wallets={wallets} />
                </div>
            </div>

            <DepositModal
                open={open}
                onClose={() => setOpen(false)}
                wallets={wallets}
                basePrice={wallet.base_price}
            />
        </PortalLayout>
    );
}
