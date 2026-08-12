import { useForm } from '@inertiajs/react';
import { Save, Wallet as WalletIcon } from 'lucide-react';
import DashboardLayout from '../../Components/DashboardLayout';
import type { Wallet } from '../../types';

interface Props {
    wallets: Wallet[];
}

export default function AdminWallets({ wallets }: Props) {
    const createForm = useForm({ name: '', currency: 'USDT', network: '', address: '', is_active: true });

    function createWallet(event: React.FormEvent) {
        event.preventDefault();
        createForm.post('/admin/wallets', {
            preserveScroll: true,
            onSuccess: () => createForm.reset('name', 'network', 'address'),
        });
    }

    return (
        <DashboardLayout title="Wallets" breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Wallets' }]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">Wallet Settings</h1>
                    <p className="mt-1 text-sm text-[var(--color-dash-muted)]">Set deposit wallets users can select from the Wallet page.</p>
                </div>

                <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                    <form onSubmit={createWallet} className="grid gap-3 lg:grid-cols-[1fr_120px_160px_2fr_auto_auto]">
                        <Input label="Name" value={createForm.data.name} onChange={value => createForm.setData('name', value)} error={createForm.errors.name} />
                        <Input label="Currency" value={createForm.data.currency} onChange={value => createForm.setData('currency', value.toUpperCase())} error={createForm.errors.currency} />
                        <Input label="Network" value={createForm.data.network} onChange={value => createForm.setData('network', value)} error={createForm.errors.network} />
                        <Input label="Address" value={createForm.data.address} onChange={value => createForm.setData('address', value)} error={createForm.errors.address} />
                        <label className="mt-6 flex h-10 items-center gap-2 text-sm text-[var(--color-dash-muted)]">
                            <input type="checkbox" checked={createForm.data.is_active} onChange={event => createForm.setData('is_active', event.target.checked)} className="accent-gold" />
                            Active
                        </label>
                        <button disabled={createForm.processing} className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-semibold text-black disabled:opacity-60">
                            <WalletIcon size={16} />
                            Add
                        </button>
                    </form>
                </section>

                <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)]">
                    <div className="divide-y divide-[var(--color-dash-border)]">
                        {wallets.length ? wallets.map(wallet => <WalletRow key={wallet.id} wallet={wallet} />) : (
                            <p className="p-6 text-center text-sm text-[var(--color-dash-muted)]">No wallets configured.</p>
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

function WalletRow({ wallet }: { wallet: Wallet }) {
    const form = useForm({
        name: wallet.name,
        currency: wallet.currency,
        network: wallet.network ?? '',
        address: wallet.address,
        is_active: wallet.is_active,
    });

    function updateWallet(event: React.FormEvent) {
        event.preventDefault();
        form.put(`/admin/wallets/${wallet.id}`, { preserveScroll: true });
    }

    return (
        <form onSubmit={updateWallet} className="grid gap-3 p-4 lg:grid-cols-[1fr_120px_160px_2fr_auto_auto]">
            <Input label="Name" value={form.data.name} onChange={value => form.setData('name', value)} error={form.errors.name} />
            <Input label="Currency" value={form.data.currency} onChange={value => form.setData('currency', value.toUpperCase())} error={form.errors.currency} />
            <Input label="Network" value={form.data.network} onChange={value => form.setData('network', value)} error={form.errors.network} />
            <Input label="Address" value={form.data.address} onChange={value => form.setData('address', value)} error={form.errors.address} />
            <label className="mt-6 flex h-10 items-center gap-2 text-sm text-[var(--color-dash-muted)]">
                <input type="checkbox" checked={form.data.is_active} onChange={event => form.setData('is_active', event.target.checked)} className="accent-gold" />
                Active
            </label>
            <button disabled={form.processing} className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 text-sm font-semibold text-gold-ink disabled:opacity-60">
                <Save size={16} />
                Save
            </button>
        </form>
    );
}

function Input({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--color-dash-muted)]">{label}</span>
            <input
                value={value}
                onChange={event => onChange(event.target.value)}
                className={`h-10 w-full rounded-lg border bg-[var(--color-dash-bg)] px-3 text-sm text-[var(--color-dash-text)] outline-none focus:border-gold/50 ${error ? 'border-red-500/60' : 'border-[var(--color-dash-border)]'}`}
            />
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}
