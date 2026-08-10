import { Link } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Users, Wallet } from 'lucide-react';
import DashboardLayout, { formatCurrency, formatDate, StatusBadge } from '../../Components/DashboardLayout';
import type { AuthUser, Deposit, Withdrawal } from '../../types';

interface Props {
    stats: {
        total_users: number;
        total_balance: number;
        pending_deposits: number;
        pending_withdrawals: number;
        total_deposited: number;
        total_withdrawn: number;
    };
    pendingDeposits: Deposit[];
    pendingWithdrawals: Withdrawal[];
    recentUsers: AuthUser[];
}

export default function AdminIndex({ stats, pendingDeposits, pendingWithdrawals, recentUsers }: Props) {
    return (
        <DashboardLayout title="Admin Dashboard" breadcrumb={[{ label: 'Admin' }]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-[var(--color-dash-muted)]">Monitor users, balances, and pending activity.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Total Users" value={stats.total_users.toLocaleString()} icon={<Users size={18} />} />
                    <StatCard label="Client Balance" value={formatCurrency(stats.total_balance)} icon={<Wallet size={18} />} />
                    <StatCard label="Pending Deposits" value={stats.pending_deposits.toLocaleString()} icon={<ArrowDownCircle size={18} />} href="/admin/deposits" />
                    <StatCard label="Pending Withdrawals" value={stats.pending_withdrawals.toLocaleString()} icon={<ArrowUpCircle size={18} />} href="/admin/withdrawals" />
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <ActivityPanel title="Pending Deposits" href="/admin/deposits">
                        {pendingDeposits.length ? pendingDeposits.map(deposit => (
                            <ActivityRow
                                key={deposit.id}
                                name={deposit.user?.name ?? 'Unknown user'}
                                meta={formatDate(deposit.created_at)}
                                amount={formatCurrency(deposit.amount)}
                                status={deposit.status}
                            />
                        )) : <EmptyState message="No pending deposits." />}
                    </ActivityPanel>

                    <ActivityPanel title="Pending Withdrawals" href="/admin/withdrawals">
                        {pendingWithdrawals.length ? pendingWithdrawals.map(withdrawal => (
                            <ActivityRow
                                key={withdrawal.id}
                                name={withdrawal.user?.name ?? 'Unknown user'}
                                meta={formatDate(withdrawal.created_at)}
                                amount={formatCurrency(withdrawal.amount)}
                                status={withdrawal.status}
                            />
                        )) : <EmptyState message="No pending withdrawals." />}
                    </ActivityPanel>
                </div>

                <ActivityPanel title="Recent Users" href="/admin/users">
                    {recentUsers.length ? recentUsers.map(user => (
                        <Link
                            key={user.id}
                            href={`/admin/users/${user.id}`}
                            className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface-2)] px-4 py-3 transition hover:border-gold/40"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[var(--color-dash-text)]">{user.name}</p>
                                <p className="truncate text-xs text-[var(--color-dash-muted)]">@{user.username ?? 'no-username'} · {user.email}</p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold text-gold-ink">{formatCurrency(user.balance)}</span>
                        </Link>
                    )) : <EmptyState message="No users yet." />}
                </ActivityPanel>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ label, value, icon, href }: { label: string; value: string; icon: React.ReactNode; href?: string }) {
    const content = (
        <div className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4 transition hover:border-gold/30">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold-ink">{icon}</div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-dash-text)]">{value}</p>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function ActivityPanel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
    return (
        <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">{title}</h2>
                <Link href={href} className="text-xs font-medium text-gold-ink hover:text-gold-ink/80">View all</Link>
            </div>
            <div className="space-y-2">{children}</div>
        </section>
    );
}

function ActivityRow({ name, meta, amount, status }: { name: string; meta: string; amount: string; status: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface-2)] px-4 py-3">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-dash-text)]">{name}</p>
                <p className="text-xs text-[var(--color-dash-muted)]">{meta}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-[var(--color-dash-text)]">{amount}</span>
                <StatusBadge status={status} />
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return <p className="rounded-lg border border-dashed border-[var(--color-dash-border)] px-4 py-6 text-center text-sm text-[var(--color-dash-muted)]">{message}</p>;
}
