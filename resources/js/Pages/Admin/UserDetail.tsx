import { Link, useForm } from '@inertiajs/react';
import { DollarSign } from 'lucide-react';
import DashboardLayout, { formatCurrency, formatDate, StatusBadge } from '../../Components/DashboardLayout';
import type { AuthUser, Deposit, Withdrawal } from '../../types';

interface Props {
    profileUser: AuthUser & {
        employment_status?: string | null;
        occupation?: string | null;
        source_of_funds?: string | null;
        pep_status?: boolean;
        tax_id?: string | null;
    };
    deposits: Deposit[];
    withdrawals: Withdrawal[];
    stats: {
        total_deposited: number;
        total_withdrawn: number;
        pending_deposits: number;
        pending_withdrawals: number;
    };
}

export default function AdminUserDetail({ profileUser, deposits, withdrawals, stats }: Props) {
    const profileForm = useForm({
        name: profileUser.name,
        phone: profileUser.phone ?? '',
        address: profileUser.address ?? '',
        employment_status: profileUser.employment_status ?? '',
        occupation: profileUser.occupation ?? '',
        source_of_funds: profileUser.source_of_funds ?? '',
        pep_status: Boolean(profileUser.pep_status),
        is_verified: Boolean(profileUser.is_verified),
    });
    const fundsForm = useForm({ amount: '', notes: '' });

    function updateProfile(event: React.FormEvent) {
        event.preventDefault();
        profileForm.put(`/admin/users/${profileUser.id}`, { preserveScroll: true });
    }

    function addFunds(event: React.FormEvent) {
        event.preventDefault();
        fundsForm.post(`/admin/users/${profileUser.id}/add-funds`, {
            preserveScroll: true,
            onSuccess: () => fundsForm.reset(),
        });
    }

    return (
        <DashboardLayout title={profileUser.name} breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Users', href: '/admin/users' }, { label: profileUser.name }]}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">{profileUser.name}</h1>
                        <p className="mt-1 text-sm text-[var(--color-dash-muted)]">@{profileUser.username ?? 'no-username'} · {profileUser.email}</p>
                    </div>
                    <Link href="/admin/users" className="text-sm font-medium text-gold-ink hover:text-gold-ink/80">Back to users</Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat label="Balance" value={formatCurrency(profileUser.balance)} />
                    <Stat label="Total Deposited" value={formatCurrency(stats.total_deposited)} />
                    <Stat label="Total Withdrawn" value={formatCurrency(stats.total_withdrawn)} />
                    <Stat label="Pending Requests" value={`${stats.pending_deposits + stats.pending_withdrawals}`} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                    <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                        <h2 className="mb-4 text-sm font-semibold text-[var(--color-dash-text)]">Profile</h2>
                        <form onSubmit={updateProfile} className="grid gap-4 sm:grid-cols-2">
                            <Input label="Name" value={profileForm.data.name} onChange={value => profileForm.setData('name', value)} error={profileForm.errors.name} />
                            <Input label="Phone" value={profileForm.data.phone} onChange={value => profileForm.setData('phone', value)} error={profileForm.errors.phone} />
                            <Input label="Employment" value={profileForm.data.employment_status} onChange={value => profileForm.setData('employment_status', value)} error={profileForm.errors.employment_status} />
                            <Input label="Occupation" value={profileForm.data.occupation} onChange={value => profileForm.setData('occupation', value)} error={profileForm.errors.occupation} />
                            <Input label="Source of Funds" value={profileForm.data.source_of_funds} onChange={value => profileForm.setData('source_of_funds', value)} error={profileForm.errors.source_of_funds} />
                            <label className="flex items-center gap-2 pt-6 text-sm text-[var(--color-dash-muted)]">
                                <input type="checkbox" checked={profileForm.data.is_verified} onChange={event => profileForm.setData('is_verified', event.target.checked)} className="accent-gold" />
                                Verified
                            </label>
                            <label className="flex items-center gap-2 text-sm text-[var(--color-dash-muted)] sm:col-span-2">
                                <input type="checkbox" checked={profileForm.data.pep_status} onChange={event => profileForm.setData('pep_status', event.target.checked)} className="accent-gold" />
                                Politically exposed person
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="mb-1.5 block text-xs font-medium text-[var(--color-dash-muted)]">Address</span>
                                <textarea value={profileForm.data.address} onChange={event => profileForm.setData('address', event.target.value)} rows={3} className="w-full rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-bg)] px-3 py-2 text-sm text-[var(--color-dash-text)] outline-none focus:border-gold/50" />
                            </label>
                            <div className="sm:col-span-2">
                                <button disabled={profileForm.processing} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">Save profile</button>
                            </div>
                        </form>
                    </section>

                    <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-dash-text)]"><DollarSign size={16} /> Add Funds</h2>
                        <form onSubmit={addFunds} className="space-y-4">
                            <Input label="Amount" type="number" value={fundsForm.data.amount} onChange={value => fundsForm.setData('amount', value)} error={fundsForm.errors.amount} />
                            <Input label="Notes" value={fundsForm.data.notes} onChange={value => fundsForm.setData('notes', value)} error={fundsForm.errors.notes} />
                            <button disabled={fundsForm.processing} className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">Credit account</button>
                        </form>
                    </section>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <History title="Recent Deposits" rows={deposits.map(item => ({ id: item.id, amount: item.amount, status: item.status, date: item.created_at }))} />
                    <History title="Recent Withdrawals" rows={withdrawals.map(item => ({ id: item.id, amount: item.amount, status: item.status, date: item.created_at }))} />
                </div>
            </div>
        </DashboardLayout>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-dash-text)]">{value}</p>
        </div>
    );
}

function Input({ label, value, onChange, error, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--color-dash-muted)]">{label}</span>
            <input type={type} value={value} onChange={event => onChange(event.target.value)} className={`h-10 w-full rounded-lg border bg-[var(--color-dash-bg)] px-3 text-sm text-[var(--color-dash-text)] outline-none focus:border-gold/50 ${error ? 'border-red-500/60' : 'border-[var(--color-dash-border)]'}`} />
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

function History({ title, rows }: { title: string; rows: { id: number; amount: string; status: string; date: string }[] }) {
    return (
        <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-dash-text)]">{title}</h2>
            <div className="space-y-2">
                {rows.length ? rows.map(row => (
                    <div key={row.id} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface-2)] px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-[var(--color-dash-text)]">{formatCurrency(row.amount)}</p>
                            <p className="text-xs text-[var(--color-dash-muted)]">{formatDate(row.date)}</p>
                        </div>
                        <StatusBadge status={row.status} />
                    </div>
                )) : <p className="rounded-lg border border-dashed border-[var(--color-dash-border)] px-4 py-6 text-center text-sm text-[var(--color-dash-muted)]">No history yet.</p>}
            </div>
        </section>
    );
}
