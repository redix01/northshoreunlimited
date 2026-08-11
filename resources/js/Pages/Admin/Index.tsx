import { Link } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, Users, Wallet } from 'lucide-react';
import DashboardLayout, { formatCurrency, formatDate, formatDateTime, StatusBadge } from '../../Components/DashboardLayout';
import type { AuthUser, Deposit, Withdrawal } from '../../types';

interface Props {
    stats: {
        total_users: number;
        active_users: number;
        suspended_users: number;
        total_balance: number;
        pending_deposits: number;
        pending_withdrawals: number;
        total_deposited: number;
        total_withdrawn: number;
        earnings_paid: number;
        earnings_today: number;
        credited_today: number;
    };
    pendingDeposits: Deposit[];
    pendingWithdrawals: Withdrawal[];
    recentUsers: AuthUser[];
    system: {
        maintenance_mode: boolean;
        topup_enabled: boolean;
        daily_topup_percent: number;
        deposits_enabled: boolean;
        withdrawals_enabled: boolean;
        last_topup_at: string | null;
    };
}

export default function AdminIndex({ stats, pendingDeposits, pendingWithdrawals, recentUsers, system }: Props) {
    return (
        <DashboardLayout title="Admin Dashboard" breadcrumb={[{ label: 'Admin' }]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-[var(--color-dash-muted)]">Monitor users, balances, and pending activity.</p>
                </div>

                {system.maintenance_mode && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                        Maintenance mode is on — the client portal is closed. Turn it off in{' '}
                        <Link href="/admin/settings" className="underline">settings</Link>.
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total Users"
                        value={stats.total_users.toLocaleString()}
                        note={`${stats.active_users} active · ${stats.suspended_users} suspended`}
                        icon={<Users size={18} />}
                        href="/admin/users"
                    />
                    <StatCard label="Client Balance" value={formatCurrency(stats.total_balance)} icon={<Wallet size={18} />} />
                    <StatCard label="Pending Deposits" value={stats.pending_deposits.toLocaleString()} icon={<ArrowDownCircle size={18} />} href="/admin/deposits" />
                    <StatCard label="Pending Withdrawals" value={stats.pending_withdrawals.toLocaleString()} icon={<ArrowUpCircle size={18} />} href="/admin/withdrawals" />
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard
                            label="Paid Today"
                            value={formatCurrency(stats.earnings_today)}
                            note={`${stats.credited_today} client(s) credited`}
                            icon={<TrendingUp size={18} />}
                            href="/admin/earnings"
                        />
                        <StatCard label="Top-ups All Time" value={formatCurrency(stats.earnings_paid)} icon={<TrendingUp size={18} />} href="/admin/earnings" />
                        <StatCard
                            label="Daily Rate"
                            value={`${system.daily_topup_percent}%`}
                            note={system.topup_enabled ? 'Runs nightly at 00:01' : 'Top-ups disabled'}
                            icon={<TrendingUp size={18} />}
                            href="/admin/settings"
                        />
                    </div>

                    <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">System Status</h2>
                            <Link href="/admin/settings" className="text-xs font-medium text-gold hover:text-gold/80">Settings</Link>
                        </div>
                        <div className="space-y-2">
                            <StatusRow label="Client portal" on={!system.maintenance_mode} onLabel="Online" offLabel="Maintenance" />
                            <StatusRow label="Daily top-up" on={system.topup_enabled} onLabel="Enabled" offLabel="Disabled" />
                            <StatusRow label="Deposits" on={system.deposits_enabled} onLabel="Accepting" offLabel="Closed" />
                            <StatusRow label="Withdrawals" on={system.withdrawals_enabled} onLabel="Accepting" offLabel="Closed" />
                            <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface-2)] px-4 py-2.5">
                                <span className="text-sm text-[var(--color-dash-muted)]">Last top-up run</span>
                                <span className="text-xs text-[var(--color-dash-text)]">{formatDateTime(system.last_topup_at)}</span>
                            </div>
                        </div>
                    </section>
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
                            <span className="shrink-0 text-sm font-semibold text-gold">{formatCurrency(user.balance)}</span>
                        </Link>
                    )) : <EmptyState message="No users yet." />}
                </ActivityPanel>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ label, value, icon, href, note }: { label: string; value: string; icon: React.ReactNode; href?: string; note?: string }) {
    const content = (
        <div className="h-full rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4 transition hover:border-gold/30">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">{icon}</div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-dash-text)]">{value}</p>
            {note && <p className="mt-0.5 text-xs text-[var(--color-dash-muted)]">{note}</p>}
        </div>
    );

    return href ? <Link href={href} className="block h-full">{content}</Link> : content;
}

function StatusRow({ label, on, onLabel, offLabel }: { label: string; on: boolean; onLabel: string; offLabel: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface-2)] px-4 py-2.5">
            <span className="text-sm text-[var(--color-dash-muted)]">{label}</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${on ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {on ? onLabel : offLabel}
            </span>
        </div>
    );
}

function ActivityPanel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
    return (
        <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">{title}</h2>
                <Link href={href} className="text-xs font-medium text-gold hover:text-gold/80">View all</Link>
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
