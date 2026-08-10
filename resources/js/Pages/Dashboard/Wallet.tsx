import { Link, usePage } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Plus, WalletCards } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout, { formatCurrency, formatDate, StatusBadge } from '../../Components/DashboardLayout';
import type { Deposit, PageProps, PaginatedData, Withdrawal } from '../../types';

interface Props extends PageProps {
    deposits: PaginatedData<Deposit>;
    withdrawals: PaginatedData<Withdrawal>;
    balance: number;
}

export default function WalletPage() {
    const { deposits, withdrawals, balance } = usePage<Props>().props;
    const initialTab = new URLSearchParams(window.location.search).get('tab') === 'withdraw' ? 'withdraw' : 'deposit';
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>(initialTab);

    return (
        <DashboardLayout title="Wallet" breadcrumb={[{ label: 'Dashboard', href: '/user/dashboard' }, { label: 'Wallet' }]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">Wallet</h1>
                    <p className="mt-1 text-sm text-[var(--color-dash-muted)]">Review transaction history and start a new deposit or withdrawal.</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(220px,320px)_1fr]">
                    <div className="relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-white to-[#f6eecd] p-5">
                        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/25 blur-2xl" />
                        <div className="relative flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">Available Balance</p>
                                <p className="mt-2 text-2xl font-bold text-[var(--color-dash-text)]">{formatCurrency(balance)}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold-ink">
                                <WalletCards size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Link href="/user/deposits" className="group flex min-h-24 items-center justify-between gap-4 rounded-xl border border-gold/30 bg-gold px-5 py-4 text-black shadow-lg shadow-gold/10 transition hover:-translate-y-0.5 hover:bg-gold/90">
                            <span>
                                <span className="block text-sm font-bold">New Deposit</span>
                                <span className="mt-1 block text-xs font-medium text-black/65">Fund your wallet</span>
                            </span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 transition group-hover:bg-black/15">
                                <Plus size={18} />
                            </span>
                        </Link>
                        <Link href="/user/withdrawals" className="group flex min-h-24 items-center justify-between gap-4 rounded-xl border border-gold/25 bg-[var(--color-dash-surface)] px-5 py-4 text-[var(--color-dash-text)] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-[var(--color-dash-surface-2)]">
                            <span>
                                <span className="block text-sm font-bold">New Withdrawal</span>
                                <span className="mt-1 block text-xs font-medium text-[var(--color-dash-muted)]">Request a payout</span>
                            </span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold-ink transition group-hover:bg-gold/15">
                                <ArrowUpCircle size={18} />
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">Transaction History</h2>
                        <p className="mt-1 text-xs text-[var(--color-dash-muted)]">Switch between deposit and withdrawal records.</p>
                    </div>
                    <div className="flex rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-1 sm:w-80">
                        <TabButton active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')} icon={<ArrowDownCircle size={16} />} label="Deposits" />
                        <TabButton active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')} icon={<ArrowUpCircle size={16} />} label="Withdrawals" />
                    </div>
                </div>

                {activeTab === 'deposit' ? (
                    <History
                        title="Deposit History"
                        emptyMessage="No deposits yet."
                        rows={deposits.data.map(item => ({
                            id: item.id,
                            amount: item.amount,
                            currency: item.currency,
                            status: item.status,
                            date: item.created_at,
                            detail: item.wallet_address ?? '',
                        }))}
                        links={deposits.links}
                    />
                ) : (
                    <History
                        title="Withdrawal History"
                        emptyMessage="No withdrawals yet."
                        rows={withdrawals.data.map(item => ({
                            id: item.id,
                            amount: item.amount,
                            currency: item.currency,
                            status: item.status,
                            date: item.created_at,
                            detail: item.wallet_address,
                        }))}
                        links={withdrawals.links}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button onClick={onClick} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${active ? 'bg-gold text-black' : 'text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'}`}>
            {icon}
            {label}
        </button>
    );
}

function History({
    title,
    emptyMessage,
    rows,
    links,
}: {
    title: string;
    emptyMessage: string;
    rows: { id: number; amount: string; currency: string; status: string; date: string; detail: string }[];
    links: { url: string | null; label: string; active: boolean }[];
}) {
    return (
        <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)]">
            <h2 className="border-b border-[var(--color-dash-border)] px-4 py-3 text-sm font-semibold text-[var(--color-dash-text)]">{title}</h2>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-[var(--color-dash-border)] text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">
                        <tr>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Wallet</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-dash-border)]">
                        {rows.map(row => (
                            <tr key={row.id} className="hover:bg-[var(--color-dash-surface-2)]">
                                <td className="px-4 py-3 font-semibold text-[var(--color-dash-text)]">
                                    {formatCurrency(row.amount)} <span className="text-xs font-normal text-[var(--color-dash-muted)]">{row.currency}</span>
                                </td>
                                <td className="max-w-[280px] truncate px-4 py-3 font-mono text-xs text-[var(--color-dash-muted)]">{row.detail || '-'}</td>
                                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                                <td className="px-4 py-3 text-[var(--color-dash-muted)]">{formatDate(row.date)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!rows.length && <p className="border-t border-[var(--color-dash-border)] p-6 text-center text-sm text-[var(--color-dash-muted)]">{emptyMessage}</p>}
            <div className="flex flex-wrap gap-2 border-t border-[var(--color-dash-border)] p-3">
                {links.filter(link => link.url).map((link, index) => (
                    <Link key={`${link.label}-${index}`} href={link.url ?? '#'} preserveScroll className={`rounded px-2.5 py-1 text-xs ${link.active ? 'bg-gold text-black' : 'bg-[var(--color-dash-surface-2)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
            </div>
        </section>
    );
}
