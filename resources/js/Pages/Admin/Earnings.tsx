import { Link, router, useForm } from '@inertiajs/react';
import { CircleDollarSign, Play, TrendingUp, Users } from 'lucide-react';
import DashboardLayout, { Pagination, formatCurrency, formatDateTime } from '../../Components/DashboardLayout';
import type { Earning, PaginatedData } from '../../types';

interface Props {
    earnings: PaginatedData<Earning>;
    filters: { type: string };
    stats: {
        paid_total: number;
        paid_today: number;
        credited_today: number;
        eligible_users: number;
    };
    config: {
        topup_enabled: boolean;
        daily_topup_percent: number;
        topup_min_balance: number;
    };
}

const typeFilters = [
    { value: 'all', label: 'All' },
    { value: 'daily_topup', label: 'Daily top-up' },
    { value: 'manual_credit', label: 'Manual credit' },
    { value: 'manual_debit', label: 'Manual debit' },
];

const typeLabels: Record<string, string> = {
    daily_topup: 'Daily top-up',
    manual_credit: 'Manual credit',
    manual_debit: 'Manual debit',
};

export default function AdminEarnings({ earnings, filters, stats, config }: Props) {
    const runForm = useForm({ force: false });

    function run(force: boolean) {
        const message = force
            ? 'Force a top-up run now? Clients already credited today will be credited again.'
            : 'Run the daily top-up now for every eligible client?';

        if (!window.confirm(message)) return;

        runForm.transform(() => ({ force })).post('/admin/earnings/run', { preserveScroll: true });
    }

    return (
        <DashboardLayout title="Earnings" breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Earnings' }]}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">Earnings</h1>
                        <p className="mt-1 text-sm text-[var(--color-dash-muted)]">
                            Every balance credit the platform has issued, and the controls to issue them now.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => run(false)}
                            disabled={runForm.processing}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-4 text-sm font-semibold text-black disabled:opacity-60"
                        >
                            <Play size={16} />
                            Run top-up now
                        </button>
                        <button
                            onClick={() => run(true)}
                            disabled={runForm.processing}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--color-dash-border)] px-4 text-sm font-medium text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] disabled:opacity-60"
                        >
                            Force run
                        </button>
                    </div>
                </div>

                {!config.topup_enabled && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                        Daily top-up is switched off in{' '}
                        <Link href="/admin/settings" className="underline">settings</Link>. Scheduled runs are skipped until it is re-enabled.
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat label="Paid Today" value={formatCurrency(stats.paid_today)} icon={<TrendingUp size={18} />} />
                    <Stat label="Credited Today" value={`${stats.credited_today} client(s)`} icon={<Users size={18} />} />
                    <Stat label="Paid All Time" value={formatCurrency(stats.paid_total)} icon={<CircleDollarSign size={18} />} />
                    <Stat
                        label="Current Rate"
                        value={`${config.daily_topup_percent}% daily`}
                        icon={<TrendingUp size={18} />}
                        note={`${stats.eligible_users} eligible · min ${formatCurrency(config.topup_min_balance)}`}
                    />
                </div>

                <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)]">
                    <div className="flex flex-wrap gap-2 border-b border-[var(--color-dash-border)] p-4">
                        {typeFilters.map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => router.get('/admin/earnings', { type: filter.value }, { preserveState: true, replace: true })}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                    filters.type === filter.value
                                        ? 'bg-gold/15 text-gold border border-gold/25'
                                        : 'border border-[var(--color-dash-border)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="border-b border-[var(--color-dash-border)] text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">
                                <tr>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Rate</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Balance After</th>
                                    <th className="px-4 py-3">When</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-dash-border)]">
                                {earnings.data.map(earning => (
                                    <tr key={earning.id} className="hover:bg-[var(--color-dash-surface-2)]">
                                        <td className="px-4 py-3">
                                            {earning.user ? (
                                                <Link href={`/admin/users/${earning.user_id}`} className="font-medium text-[var(--color-dash-text)] hover:text-gold">
                                                    {earning.user.name}
                                                </Link>
                                            ) : (
                                                <span className="text-[var(--color-dash-muted)]">Deleted user</span>
                                            )}
                                            {earning.note && <p className="text-xs text-[var(--color-dash-muted)]">{earning.note}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-dash-muted)]">{typeLabels[earning.type] ?? earning.type}</td>
                                        <td className="px-4 py-3 text-[var(--color-dash-muted)]">
                                            {earning.rate ? `${Number(earning.rate)}%` : '—'}
                                        </td>
                                        <td className={`px-4 py-3 font-semibold ${Number(earning.amount) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {Number(earning.amount) < 0 ? '-' : '+'}{formatCurrency(Math.abs(Number(earning.amount)))}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-dash-text)]">{formatCurrency(earning.balance_after)}</td>
                                        <td className="px-4 py-3 text-[var(--color-dash-muted)]">{formatDateTime(earning.created_at)}</td>
                                    </tr>
                                ))}
                                {!earnings.data.length && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--color-dash-muted)]">
                                            No earnings recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination links={earnings.links} />
                </section>
            </div>
        </DashboardLayout>
    );
}

function Stat({ label, value, icon, note }: { label: string; value: string; icon: React.ReactNode; note?: string }) {
    return (
        <div className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">{icon}</div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">{label}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--color-dash-text)]">{value}</p>
            {note && <p className="mt-0.5 text-xs text-[var(--color-dash-muted)]">{note}</p>}
        </div>
    );
}
