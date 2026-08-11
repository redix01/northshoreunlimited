import { Link, router } from '@inertiajs/react';
import DashboardLayout, { formatCurrency, formatDate, StatusBadge } from '../../Components/DashboardLayout';
import type { PaginatedData, StatusVariant, Withdrawal } from '../../types';

interface Props {
    withdrawals: PaginatedData<Withdrawal>;
    filters: { status: StatusVariant | 'all' };
}

const statusOptions = ['pending', 'approved', 'processing', 'completed', 'rejected', 'all'] as const;

export default function AdminWithdrawals({ withdrawals, filters }: Props) {
    return (
        <DashboardLayout title="Withdrawals" breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Withdrawals' }]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">Withdrawals</h1>
                    <p className="mt-1 text-sm text-[var(--color-dash-muted)]">Review withdrawal requests and deduct approved funds.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {statusOptions.map(status => (
                        <button
                            key={status}
                            onClick={() => router.get('/admin/withdrawals', { status }, { preserveState: true, replace: true })}
                            className={`rounded-lg px-3 py-2 text-sm capitalize ${filters.status === status ? 'bg-gold text-black' : 'bg-[var(--color-dash-surface)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="border-b border-[var(--color-dash-border)] text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">
                                <tr>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Destination</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-dash-border)]">
                                {withdrawals.data.map(withdrawal => (
                                    <tr key={withdrawal.id} className="align-top hover:bg-[var(--color-dash-surface-2)]">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[var(--color-dash-text)]">{withdrawal.user?.name ?? 'Unknown user'}</p>
                                            <p className="text-xs text-[var(--color-dash-muted)]">{withdrawal.user?.email ?? '-'}</p>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gold-ink">{formatCurrency(withdrawal.amount)}</td>
                                        <td className="max-w-[260px] px-4 py-3 text-xs text-[var(--color-dash-muted)]">
                                            <p className="truncate">{withdrawal.wallet_address}</p>
                                            <p className="mt-1">{withdrawal.network ?? withdrawal.currency}</p>
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={withdrawal.status} /></td>
                                        <td className="px-4 py-3 text-[var(--color-dash-muted)]">{formatDate(withdrawal.created_at)}</td>
                                        <td className="px-4 py-3">
                                            {withdrawal.status === 'pending' ? <DecisionActions approveUrl={`/admin/withdrawals/${withdrawal.id}/approve`} rejectUrl={`/admin/withdrawals/${withdrawal.id}/reject`} /> : <span className="text-xs text-[var(--color-dash-muted)]">Processed</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!withdrawals.data.length && <p className="border-t border-[var(--color-dash-border)] p-6 text-center text-sm text-[var(--color-dash-muted)]">No withdrawals found.</p>}
                    <Pagination links={withdrawals.links} />
                </section>
            </div>
        </DashboardLayout>
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
