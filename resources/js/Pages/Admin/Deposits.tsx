import { Link, router } from '@inertiajs/react';
import DashboardLayout, { formatCurrency, formatDate, StatusBadge } from '../../Components/DashboardLayout';
import type { Deposit, PaginatedData, StatusVariant } from '../../types';

interface Props {
    deposits: PaginatedData<Deposit>;
    filters: { status: StatusVariant | 'all' };
}

const statusOptions = ['pending', 'approved', 'rejected', 'all'] as const;

export default function AdminDeposits({ deposits, filters }: Props) {
    return (
        <DashboardLayout title="Deposits" breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Deposits' }]}>
            <div className="space-y-6">
                <PageHeader title="Deposits" description="Review deposit requests and credit approved funds." />
                <StatusTabs baseUrl="/admin/deposits" active={filters.status} />
                <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="border-b border-[var(--color-dash-border)] text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">
                                <tr>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Wallet</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-dash-border)]">
                                {deposits.data.map(deposit => (
                                    <tr key={deposit.id} className="align-top hover:bg-[var(--color-dash-surface-2)]">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[var(--color-dash-text)]">{deposit.user?.name ?? 'Unknown user'}</p>
                                            <p className="text-xs text-[var(--color-dash-muted)]">{deposit.user?.email ?? '-'}</p>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gold-ink">{formatCurrency(deposit.amount)}</td>
                                        <td className="max-w-[220px] px-4 py-3 text-xs text-[var(--color-dash-muted)]">
                                            <p className="truncate">{deposit.wallet_address ?? '-'}</p>
                                            {deposit.tx_hash && <p className="mt-1 truncate">TX: {deposit.tx_hash}</p>}
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={deposit.status} /></td>
                                        <td className="px-4 py-3 text-[var(--color-dash-muted)]">{formatDate(deposit.created_at)}</td>
                                        <td className="px-4 py-3">
                                            {deposit.status === 'pending' ? <DecisionActions approveUrl={`/admin/deposits/${deposit.id}/approve`} rejectUrl={`/admin/deposits/${deposit.id}/reject`} /> : <span className="text-xs text-[var(--color-dash-muted)]">Processed</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!deposits.data.length && <EmptyTable message="No deposits found." />}
                    <Pagination links={deposits.links} />
                </section>
            </div>
        </DashboardLayout>
    );
}

function PageHeader({ title, description }: { title: string; description: string }) {
    return (
        <div>
            <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">{title}</h1>
            <p className="mt-1 text-sm text-[var(--color-dash-muted)]">{description}</p>
        </div>
    );
}

function StatusTabs({ baseUrl, active }: { baseUrl: string; active: string }) {
    return (
        <div className="flex flex-wrap gap-2">
            {statusOptions.map(status => (
                <button
                    key={status}
                    onClick={() => router.get(baseUrl, { status }, { preserveState: true, replace: true })}
                    className={`rounded-lg px-3 py-2 text-sm capitalize ${active === status ? 'bg-gold text-black' : 'bg-[var(--color-dash-surface)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'}`}
                >
                    {status}
                </button>
            ))}
        </div>
    );
}

function DecisionActions({ approveUrl, rejectUrl }: { approveUrl: string; rejectUrl: string }) {
    function reject() {
        const notes = window.prompt('Enter rejection reason');
        if (!notes?.trim()) {
            return;
        }
        router.post(rejectUrl, { notes }, { preserveScroll: true });
    }

    return (
        <div className="flex flex-wrap gap-2">
            <button onClick={() => router.post(approveUrl, {}, { preserveScroll: true })} className="rounded bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/25">
                Approve
            </button>
            <button onClick={reject} className="rounded bg-red-500/15 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-500/25">
                Reject
            </button>
        </div>
    );
}

function EmptyTable({ message }: { message: string }) {
    return <p className="border-t border-[var(--color-dash-border)] p-6 text-center text-sm text-[var(--color-dash-muted)]">{message}</p>;
}

function Pagination({ links }: { links: { url: string | null; label: string; active: boolean }[] }) {
    return (
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-dash-border)] p-4">
            {links.map((link, index) => link.url ? (
                <Link key={`${link.label}-${index}`} href={link.url} className={`rounded px-3 py-1 text-xs ${link.active ? 'bg-gold text-black' : 'bg-[var(--color-dash-surface-2)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
            ) : (
                <span key={`${link.label}-${index}`} className="rounded bg-[var(--color-dash-bg)] px-3 py-1 text-xs text-[var(--color-dash-muted)] opacity-50" dangerouslySetInnerHTML={{ __html: link.label }} />
            ))}
        </div>
    );
}
