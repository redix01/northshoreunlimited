import { Link, router, useForm } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import DashboardLayout, { StatusBadge, formatCurrency } from '../../Components/DashboardLayout';
import type { AuthUser, PaginatedData } from '../../types';

interface Props {
    users: PaginatedData<AuthUser & { deposits_count: number; withdrawals_count: number }>;
    filters: { search?: string; status: string };
    defaults: { daily_topup_percent: number };
}

const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
];

export default function AdminUsers({ users, filters, defaults }: Props) {
    const searchForm = useForm({ search: filters.search ?? '', status: filters.status ?? 'all' });
    const createForm = useForm({ name: '', username: '', email: '', password: '' });

    function search(event: React.FormEvent) {
        event.preventDefault();
        searchForm.get('/admin/users', { preserveState: true, replace: true });
    }

    function createUser(event: React.FormEvent) {
        event.preventDefault();
        createForm.post('/admin/users', {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    }

    return (
        <DashboardLayout title="Users" breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Users' }]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">Users</h1>
                    <p className="mt-1 text-sm text-[var(--color-dash-muted)]">Create accounts and review client balances.</p>
                </div>

                <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                    <form onSubmit={createUser} className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                        <Input label="Name" value={createForm.data.name} onChange={value => createForm.setData('name', value)} error={createForm.errors.name} />
                        <Input label="Username" value={createForm.data.username} onChange={value => createForm.setData('username', value)} error={createForm.errors.username} />
                        <Input label="Email" type="email" value={createForm.data.email} onChange={value => createForm.setData('email', value)} error={createForm.errors.email} />
                        <Input label="Password" type="password" value={createForm.data.password} onChange={value => createForm.setData('password', value)} error={createForm.errors.password} />
                        <button disabled={createForm.processing} className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-semibold text-black disabled:opacity-60">
                            <Plus size={16} />
                            Create
                        </button>
                    </form>
                </section>

                <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)]">
                    <div className="flex flex-col gap-3 border-b border-[var(--color-dash-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <form onSubmit={search} className="relative w-full max-w-sm">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-dash-muted)]" />
                            <input
                                value={searchForm.data.search}
                                onChange={event => searchForm.setData('search', event.target.value)}
                                placeholder="Search users"
                                className="w-full rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-bg)] py-2 pl-9 pr-3 text-sm text-[var(--color-dash-text)] outline-none focus:border-gold/50"
                            />
                        </form>

                        <div className="flex flex-wrap gap-2">
                            {statusFilters.map(filter => (
                                <button
                                    key={filter.value}
                                    onClick={() => router.get('/admin/users', { search: searchForm.data.search, status: filter.value }, { preserveState: true, replace: true })}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                        (filters.status ?? 'all') === filter.value
                                            ? 'bg-gold/15 text-gold border border-gold/25'
                                            : 'border border-[var(--color-dash-border)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="border-b border-[var(--color-dash-border)] text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">
                                <tr>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Balance</th>
                                    <th className="px-4 py-3">Daily rate</th>
                                    <th className="px-4 py-3">Deposits</th>
                                    <th className="px-4 py-3">Withdrawals</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-dash-border)]">
                                {users.data.map(user => (
                                    <tr key={user.id} className="hover:bg-[var(--color-dash-surface-2)]">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[var(--color-dash-text)]">{user.name}</p>
                                            <p className="text-xs text-[var(--color-dash-muted)]">@{user.username ?? 'no-username'} · {user.email}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={user.status ?? 'active'} />
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gold">{formatCurrency(user.balance)}</td>
                                        <td className="px-4 py-3 text-[var(--color-dash-muted)]">
                                            {user.topup_enabled === false ? (
                                                <span className="text-[var(--color-dash-muted)]">Off</span>
                                            ) : user.daily_topup_percent != null ? (
                                                <span className="text-[var(--color-dash-text)]">{Number(user.daily_topup_percent)}%</span>
                                            ) : (
                                                <span>{defaults.daily_topup_percent}% <span className="text-[10px]">default</span></span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-dash-muted)]">{user.deposits_count}</td>
                                        <td className="px-4 py-3 text-[var(--color-dash-muted)]">{user.withdrawals_count}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/users/${user.id}`} className="text-xs font-medium text-gold hover:text-gold/80">Open</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={users.links} />
                </section>
            </div>
        </DashboardLayout>
    );
}

function Input({ label, value, onChange, error, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--color-dash-muted)]">{label}</span>
            <input
                type={type}
                value={value}
                onChange={event => onChange(event.target.value)}
                className={`h-10 w-full rounded-lg border bg-[var(--color-dash-bg)] px-3 text-sm text-[var(--color-dash-text)] outline-none focus:border-gold/50 ${error ? 'border-red-500/60' : 'border-[var(--color-dash-border)]'}`}
            />
            {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
        </label>
    );
}

function Pagination({ links }: { links: { url: string | null; label: string; active: boolean }[] }) {
    return (
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-dash-border)] p-4">
            {links.map((link, index) => link.url ? (
                <Link
                    key={`${link.label}-${index}`}
                    href={link.url}
                    className={`rounded px-3 py-1 text-xs ${link.active ? 'bg-gold text-black' : 'bg-[var(--color-dash-surface-2)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ) : (
                <span key={`${link.label}-${index}`} className="rounded bg-[var(--color-dash-bg)] px-3 py-1 text-xs text-[var(--color-dash-muted)] opacity-50" dangerouslySetInnerHTML={{ __html: link.label }} />
            ))}
        </div>
    );
}
