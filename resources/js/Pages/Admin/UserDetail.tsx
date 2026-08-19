import { Link, useForm } from '@inertiajs/react';
import { KeyRound, Play, SlidersHorizontal, Trash2, TrendingUp, TriangleAlert, Wallet } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout, {
    Input,
    StatusBadge,
    Toggle,
    formatCurrency,
    formatDate,
    formatDateTime,
} from '../../Components/DashboardLayout';
import type { AccountStatus, AuthUser, Deposit, Earning, Withdrawal } from '../../types';

interface Props {
    profileUser: AuthUser & {
        employment_status?: string | null;
        occupation?: string | null;
        source_of_funds?: string | null;
        pep_status?: boolean;
        tax_id?: string | null;
        verified_name?: string | null;
        verified_at?: string | null;
        name_match_confirmed?: boolean;
        tax_id_verified_at?: string | null;
        id_document_type?: string | null;
    };
    deposits: Deposit[];
    withdrawals: Withdrawal[];
    earnings: Earning[];
    stats: {
        total_deposited: number;
        total_withdrawn: number;
        total_earned: number;
        pending_deposits: number;
        pending_withdrawals: number;
    };
    topup: {
        default_percent: number;
        effective_percent: number;
        platform_enabled: boolean;
        projected_amount: number;
        last_topup_at: string | null;
        /** Earned since the last settlement — the client already sees it. */
        accrued: number;
        effective_balance: number;
    };
}

/** What each standing means, shown under the picker as it changes. */
const STATUS_HINTS: Record<string, string> = {
    active:    'Signed up and trading, with no identity check on file.',
    pending:   'An ID is with compliance — the client is not verified yet.',
    verified:  'Identity approved. The client sees these details on their dashboard.',
    suspended: 'Suspended clients cannot sign in and never receive top-ups.',
};

export default function AdminUserDetail({ profileUser, deposits, withdrawals, earnings, stats, topup }: Props) {
    const profileForm = useForm({
        name: profileUser.name,
        phone: profileUser.phone ?? '',
        address: profileUser.address ?? '',
        employment_status: profileUser.employment_status ?? '',
        occupation: profileUser.occupation ?? '',
        source_of_funds: profileUser.source_of_funds ?? '',
        pep_status: Boolean(profileUser.pep_status),
    });

    const settingsForm = useForm({
        // account_status is the reconciled value, so the picker always opens on
        // the standing that is actually true right now.
        status: profileUser.account_status ?? profileUser.status ?? 'active',
        verified_name: profileUser.verified_name ?? profileUser.name,
        tax_id_match: Boolean(profileUser.tax_id_verified_at),
        topup_enabled: profileUser.topup_enabled ?? true,
        daily_topup_percent: profileUser.daily_topup_percent != null ? String(Number(profileUser.daily_topup_percent)) : '',
    });

    const balanceForm = useForm({ direction: 'credit', amount: '', notes: '' });
    const passwordForm = useForm({ password: '', password_confirmation: '' });
    const topupForm = useForm({ force: false });
    const deleteForm = useForm({ confirmation: '' });
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    /** What the admin has to type to confirm — the client's own handle. */
    const deleteHandle = profileUser.username ?? profileUser.email;

    const overrideActive = settingsForm.data.daily_topup_percent !== '';
    const previewPercent = overrideActive ? Number(settingsForm.data.daily_topup_percent) : topup.default_percent;
    const previewAmount = (Number(profileUser.balance) * previewPercent) / 100;

    function updateProfile(event: React.FormEvent) {
        event.preventDefault();
        profileForm.put(`/admin/users/${profileUser.id}`, { preserveScroll: true });
    }

    function updateSettings(event: React.FormEvent) {
        event.preventDefault();
        settingsForm.put(`/admin/users/${profileUser.id}/settings`, { preserveScroll: true });
    }

    function adjustBalance(event: React.FormEvent) {
        event.preventDefault();
        balanceForm.post(`/admin/users/${profileUser.id}/adjust-balance`, {
            preserveScroll: true,
            onSuccess: () => balanceForm.reset('amount', 'notes'),
        });
    }

    function resetPassword(event: React.FormEvent) {
        event.preventDefault();
        passwordForm.put(`/admin/users/${profileUser.id}/password`, {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    }

    function deleteAccount(event: React.FormEvent) {
        event.preventDefault();
        // Posts rather than DELETEs: the route accepts both, and POST is the
        // verb least likely to be filtered between the browser and Laravel.
        deleteForm.post(`/admin/users/${profileUser.id}`, { preserveScroll: true });
    }

    function runTopup() {
        if (!window.confirm(`Credit ${profileUser.name} their daily top-up now?`)) return;

        topupForm.post(`/admin/users/${profileUser.id}/topup`, { preserveScroll: true });
    }

    return (
        <DashboardLayout
            title={profileUser.name}
            breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Users', href: '/admin/users' }, { label: profileUser.name }]}
        >
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">{profileUser.name}</h1>
                            <StatusBadge status={profileUser.account_status ?? profileUser.status ?? 'active'} />
                            {profileUser.is_verified && profileUser.verified_name && (
                                <span className="rounded border border-gold/25 bg-gold/10 px-2 py-0.5 text-xs text-gold-ink">
                                    Verified as {profileUser.verified_name}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-dash-muted)]">@{profileUser.username ?? 'no-username'} · {profileUser.email}</p>
                    </div>
                    <Link href="/admin/users" className="text-sm font-medium text-gold-ink hover:text-gold-ink/80">Back to users</Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Stat
                        label="Balance"
                        value={formatCurrency(topup.effective_balance)}
                        note={topup.accrued > 0 ? `${formatCurrency(profileUser.balance)} banked + ${formatCurrency(topup.accrued)} accrued` : undefined}
                    />
                    <Stat label="Total Deposited" value={formatCurrency(stats.total_deposited)} />
                    <Stat label="Total Withdrawn" value={formatCurrency(stats.total_withdrawn)} />
                    <Stat label="Top-ups Earned" value={formatCurrency(stats.total_earned)} />
                    <Stat label="Pending Requests" value={`${stats.pending_deposits + stats.pending_withdrawals}`} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                    {/* ── Account settings ─────────────────────────────── */}
                    <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--color-dash-text)]">
                            <SlidersHorizontal size={16} /> Account Settings
                        </h2>
                        <p className="mb-4 text-xs text-[var(--color-dash-muted)]">
                            Standing, verification, and this client's daily top-up rate.
                        </p>

                        <form onSubmit={updateSettings} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-medium text-[var(--color-dash-muted)]">Account status</span>
                                    <select
                                        value={settingsForm.data.status}
                                        onChange={event => settingsForm.setData('status', event.target.value as AccountStatus)}
                                        className="h-10 w-full rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-bg)] px-3 text-sm text-[var(--color-dash-text)] outline-none focus:border-gold/50"
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending">Pending review</option>
                                        <option value="verified">Verified</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                    <span className="mt-1 block text-xs text-[var(--color-dash-muted)]">
                                        {STATUS_HINTS[settingsForm.data.status] ?? STATUS_HINTS.active}
                                    </span>
                                </label>

                                <Input
                                    label="Daily top-up override (%)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder={`Default ${topup.default_percent}%`}
                                    hint={overrideActive ? 'This client uses a custom rate.' : 'Empty means the platform default applies.'}
                                    error={settingsForm.errors.daily_topup_percent}
                                    value={settingsForm.data.daily_topup_percent}
                                    onChange={value => settingsForm.setData('daily_topup_percent', value)}
                                />
                            </div>

                            {/* Approving the client's details lives with the
                                status: picking Verified is what confirms them. */}
                            {settingsForm.data.status === 'verified' && (
                                <div className="grid gap-4 rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-bg)] p-3 sm:grid-cols-2">
                                    <Input
                                        label="Verified name"
                                        hint="Shown to the client under Name Match."
                                        error={settingsForm.errors.verified_name}
                                        value={settingsForm.data.verified_name}
                                        onChange={value => settingsForm.setData('verified_name', value)}
                                    />
                                    <Toggle
                                        label="Tax ID confirmed"
                                        hint={
                                            profileUser.tax_id
                                                ? `Matches the ID on file (•••• ${String(profileUser.tax_id).slice(-4)}).`
                                                : 'This client has not supplied a tax ID.'
                                        }
                                        checked={settingsForm.data.tax_id_match}
                                        onChange={checked => settingsForm.setData('tax_id_match', checked)}
                                    />
                                </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Toggle
                                    label="Daily top-up enabled"
                                    hint="Turn off to exclude this client from top-up runs."
                                    checked={settingsForm.data.topup_enabled}
                                    onChange={checked => settingsForm.setData('topup_enabled', checked)}
                                />
                            </div>

                            {/* What the client currently sees on their dashboard. */}
                            {profileUser.is_verified && (
                                <div className="grid gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs text-[var(--color-dash-text)] sm:grid-cols-2">
                                    <p>Verified name: <span className="font-medium">{profileUser.verified_name ?? profileUser.name}</span></p>
                                    <p>Document: <span className="font-medium">{profileUser.id_document_type ?? 'Not recorded'}</span></p>
                                    <p>Verified on: <span className="font-medium">{formatDateTime(profileUser.verified_at ?? null)}</span></p>
                                    <p>Tax ID: <span className="font-medium">{profileUser.tax_id_verified_at ? 'Confirmed' : 'Not confirmed'}</span></p>
                                </div>
                            )}

                            <div className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-bg)] px-3 py-2.5 text-xs text-[var(--color-dash-muted)]">
                                <p>
                                    At {previewPercent}% of {formatCurrency(profileUser.balance)}, the next top-up is{' '}
                                    <span className="font-semibold text-gold">{formatCurrency(previewAmount)}</span>.
                                </p>
                                <p className="mt-1">Last credited: {formatDateTime(topup.last_topup_at)}</p>
                                {!topup.platform_enabled && (
                                    <p className="mt-1 text-amber-400">Top-ups are switched off platform-wide in settings.</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button disabled={settingsForm.processing} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
                                    Save settings
                                </button>
                                <button
                                    type="button"
                                    onClick={runTopup}
                                    disabled={topupForm.processing}
                                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-dash-border)] px-4 py-2 text-sm font-medium text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] disabled:opacity-60"
                                >
                                    <Play size={14} />
                                    Top up now
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* ── Balance + password ───────────────────────────── */}
                    <div className="space-y-6">
                        <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-dash-text)]">
                                <Wallet size={16} /> Adjust Balance
                            </h2>
                            <form onSubmit={adjustBalance} className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {(['credit', 'debit'] as const).map(direction => (
                                        <button
                                            key={direction}
                                            type="button"
                                            onClick={() => balanceForm.setData('direction', direction)}
                                            className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                                                balanceForm.data.direction === direction
                                                    ? 'border-gold/40 bg-gold/10 text-gold'
                                                    : 'border-[var(--color-dash-border)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'
                                            }`}
                                        >
                                            {direction}
                                        </button>
                                    ))}
                                </div>
                                <Input
                                    label="Amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={balanceForm.data.amount}
                                    onChange={value => balanceForm.setData('amount', value)}
                                    error={balanceForm.errors.amount}
                                />
                                <Input
                                    label="Notes"
                                    value={balanceForm.data.notes}
                                    onChange={value => balanceForm.setData('notes', value)}
                                    error={balanceForm.errors.notes}
                                    hint="Recorded against the client's ledger."
                                />
                                <button disabled={balanceForm.processing} className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
                                    {balanceForm.data.direction === 'credit' ? 'Credit account' : 'Debit account'}
                                </button>
                            </form>
                        </section>

                        <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-dash-text)]">
                                <KeyRound size={16} /> Reset Password
                            </h2>
                            <form onSubmit={resetPassword} className="space-y-4">
                                <Input
                                    label="New password"
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={value => passwordForm.setData('password', value)}
                                    error={passwordForm.errors.password}
                                />
                                <Input
                                    label="Confirm password"
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={value => passwordForm.setData('password_confirmation', value)}
                                />
                                <button disabled={passwordForm.processing} className="w-full rounded-lg border border-[var(--color-dash-border)] px-4 py-2 text-sm font-medium text-[var(--color-dash-text)] hover:border-gold/40 disabled:opacity-60">
                                    Set new password
                                </button>
                            </form>
                        </section>
                    </div>
                </div>

                {/* ── Profile ──────────────────────────────────────────── */}
                <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                    <h2 className="mb-4 text-sm font-semibold text-[var(--color-dash-text)]">Profile</h2>
                    <form onSubmit={updateProfile} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <Input label="Name" value={profileForm.data.name} onChange={value => profileForm.setData('name', value)} error={profileForm.errors.name} />
                        <Input label="Phone" value={profileForm.data.phone} onChange={value => profileForm.setData('phone', value)} error={profileForm.errors.phone} />
                        <Input label="Employment" value={profileForm.data.employment_status} onChange={value => profileForm.setData('employment_status', value)} error={profileForm.errors.employment_status} />
                        <Input label="Occupation" value={profileForm.data.occupation} onChange={value => profileForm.setData('occupation', value)} error={profileForm.errors.occupation} />
                        <Input label="Source of Funds" value={profileForm.data.source_of_funds} onChange={value => profileForm.setData('source_of_funds', value)} error={profileForm.errors.source_of_funds} />
                        <label className="flex items-center gap-2 pt-6 text-sm text-[var(--color-dash-muted)]">
                            <input type="checkbox" checked={profileForm.data.pep_status} onChange={event => profileForm.setData('pep_status', event.target.checked)} className="accent-gold" />
                            Politically exposed person
                        </label>
                        <label className="block sm:col-span-2 xl:col-span-3">
                            <span className="mb-1.5 block text-xs font-medium text-[var(--color-dash-muted)]">Address</span>
                            <textarea
                                value={profileForm.data.address}
                                onChange={event => profileForm.setData('address', event.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-bg)] px-3 py-2 text-sm text-[var(--color-dash-text)] outline-none focus:border-gold/50"
                            />
                        </label>
                        <div className="sm:col-span-2 xl:col-span-3">
                            <button disabled={profileForm.processing} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">Save profile</button>
                        </div>
                    </form>
                </section>

                {/* ── Ledgers ──────────────────────────────────────────── */}
                <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-dash-text)]">
                        <TrendingUp size={16} /> Balance Activity
                    </h2>
                    <div className="space-y-2">
                        {earnings.length ? earnings.map(earning => (
                            <div key={earning.id} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface-2)] px-4 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm text-[var(--color-dash-text)]">{earning.note ?? earning.type}</p>
                                    <p className="text-xs text-[var(--color-dash-muted)]">{formatDateTime(earning.created_at)}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className={`text-sm font-semibold ${Number(earning.amount) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {Number(earning.amount) < 0 ? '-' : '+'}{formatCurrency(Math.abs(Number(earning.amount)))}
                                    </p>
                                    <p className="text-xs text-[var(--color-dash-muted)]">{formatCurrency(earning.balance_after)}</p>
                                </div>
                            </div>
                        )) : <Empty message="No balance activity yet." />}
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                    <History title="Recent Deposits" rows={deposits.map(item => ({ id: item.id, amount: item.amount, status: item.status, date: item.created_at }))} />
                    <History title="Recent Withdrawals" rows={withdrawals.map(item => ({ id: item.id, amount: item.amount, status: item.status, date: item.created_at }))} />
                </div>

                {/* ── Danger zone ──────────────────────────────────────── */}
                <section className="rounded-lg border border-red-500/30 bg-red-500/[0.04] p-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-red-600">
                        <TriangleAlert size={16} /> Delete Account
                    </h2>
                    <p className="mt-1 text-xs text-[var(--color-dash-muted)]">
                        Removes {profileUser.name} along with every deposit, withdrawal, earning and
                        uploaded document. This cannot be undone — suspend the account instead if you
                        only need to block access.
                    </p>

                    {confirmingDelete ? (
                        <form onSubmit={deleteAccount} className="mt-4 max-w-md space-y-3">
                            <Input
                                label={`Type ${deleteHandle} to confirm`}
                                value={deleteForm.data.confirmation}
                                onChange={value => deleteForm.setData('confirmation', value)}
                                error={deleteForm.errors.confirmation}
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    disabled={deleteForm.processing || deleteForm.data.confirmation.trim() !== deleteHandle}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    <Trash2 size={15} />
                                    {deleteForm.processing ? 'Deleting…' : 'Delete permanently'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setConfirmingDelete(false); deleteForm.reset(); deleteForm.clearErrors(); }}
                                    className="rounded-lg border border-[var(--color-dash-border)] px-4 py-2 text-sm font-medium text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirmingDelete(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10"
                        >
                            <Trash2 size={15} />
                            Delete this account
                        </button>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">{label}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--color-dash-text)]">{value}</p>
            {note && <p className="mt-1 text-[11px] text-[var(--color-dash-muted)]">{note}</p>}
        </div>
    );
}

function Empty({ message }: { message: string }) {
    return <p className="rounded-lg border border-dashed border-[var(--color-dash-border)] px-4 py-6 text-center text-sm text-[var(--color-dash-muted)]">{message}</p>;
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
                )) : <Empty message="No history yet." />}
            </div>
        </section>
    );
}
