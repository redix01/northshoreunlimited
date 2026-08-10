import { useForm, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowUpCircle } from 'lucide-react';
import DashboardLayout, { StatusBadge, formatCurrency, formatDate } from '../../Components/DashboardLayout';
import type { PageProps, PaginatedData, Wallet, Withdrawal } from '../../types';

interface Props extends PageProps {
    withdrawals: PaginatedData<Withdrawal>;
    wallets: Wallet[];
    balance: number;
}

export default function WithdrawPage() {
    const { withdrawals, wallets, balance } = usePage<Props>().props;
    const defaultWalletId = wallets[0]?.id ? String(wallets[0].id) : '';

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        wallet_id: defaultWalletId,
        wallet_address: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/user/withdrawals', { onSuccess: () => reset() });
    }

    const insufficientBalance = data.amount && parseFloat(data.amount) > balance;

    return (
        <DashboardLayout
            title="Withdrawals"
            breadcrumb={[
                { label: 'Dashboard', href: '/user/dashboard' },
                { label: 'Withdrawals' },
            ]}
        >
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Withdrawal form */}
                <div className="xl:col-span-2">
                    <div className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)]">
                        <div className="px-5 py-4 border-b border-[var(--color-dash-border)]">
                            <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">Request Withdrawal</h2>
                            <p className="text-xs text-[var(--color-dash-muted)] mt-0.5">Processed within 24–48 hours</p>
                        </div>

                        <form onSubmit={submit} className="p-5 space-y-4">
                            {/* Balance display */}
                            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--color-dash-bg)] border border-[var(--color-dash-border)]">
                                <span className="text-xs text-[var(--color-dash-muted)]">Available Balance</span>
                                <span className="text-sm font-bold text-gold-ink">{formatCurrency(balance)}</span>
                            </div>

                            {/* Wallet */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-dash-text)] mb-2">
                                    Wallet
                                </label>
                                <select
                                    value={data.wallet_id}
                                    onChange={e => setData('wallet_id', e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-lg bg-[var(--color-dash-bg)] border text-sm text-[var(--color-dash-text)] focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 ${
                                        errors.wallet_id ? 'border-red-500/60' : 'border-[var(--color-dash-border)]'
                                    }`}
                                >
                                    <option value="">Select wallet…</option>
                                    {wallets.map(wallet => (
                                        <option key={wallet.id} value={wallet.id}>{wallet.currency} · {wallet.network ?? wallet.name}</option>
                                    ))}
                                </select>
                                {errors.wallet_id && <p className="mt-1 text-xs text-red-600">{errors.wallet_id}</p>}
                            </div>

                            {/* Wallet address */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-dash-text)] mb-1.5">
                                    Destination Wallet Address
                                </label>
                                <input
                                    type="text"
                                    value={data.wallet_address}
                                    onChange={e => setData('wallet_address', e.target.value)}
                                    placeholder="Enter your wallet address"
                                    className={`w-full px-3 py-2.5 rounded-lg bg-[var(--color-dash-bg)] border text-sm text-[var(--color-dash-text)] placeholder-[var(--color-dash-muted)] focus:outline-none focus:ring-2 focus:ring-gold/40 font-mono transition-all ${
                                        errors.wallet_address ? 'border-red-500/60' : 'border-[var(--color-dash-border)] focus:border-gold/50'
                                    }`}
                                />
                                {errors.wallet_address && <p className="mt-1 text-xs text-red-600">{errors.wallet_address}</p>}
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-dash-text)] mb-1.5">
                                    Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-dash-muted)] text-sm">$</span>
                                    <input
                                        type="number"
                                        min="10"
                                        max={balance}
                                        step="0.01"
                                        value={data.amount}
                                        onChange={e => setData('amount', e.target.value)}
                                        placeholder="0.00"
                                        className={`w-full pl-7 pr-16 py-2.5 rounded-lg bg-[var(--color-dash-bg)] border text-sm text-[var(--color-dash-text)] placeholder-[var(--color-dash-muted)] focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all ${
                                            errors.amount || insufficientBalance ? 'border-red-500/60' : 'border-[var(--color-dash-border)] focus:border-gold/50'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setData('amount', String(balance))}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gold-ink bg-gold/10 hover:bg-gold/20 px-1.5 py-0.5 rounded transition-all"
                                    >
                                        MAX
                                    </button>
                                </div>
                                {insufficientBalance && (
                                    <p className="mt-1 text-xs text-red-600">Exceeds available balance</p>
                                )}
                                {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
                            </div>

                            {/* Warning */}
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800">
                                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                                <span>Double-check your wallet address and network. Incorrect submissions cannot be reversed.</span>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !!insufficientBalance || !data.wallet_address || !data.amount || !data.wallet_id}
                                className="w-full py-2.5 rounded-lg bg-gold text-black text-sm font-semibold hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowUpCircle size={15} />
                                {processing ? 'Submitting…' : 'Request Withdrawal'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History */}
                <div className="xl:col-span-3">
                    <div className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)]">
                        <div className="px-5 py-4 border-b border-[var(--color-dash-border)]">
                            <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">Withdrawal History</h2>
                        </div>

                        {withdrawals.data.length === 0 ? (
                            <div className="px-5 py-12 text-center text-[var(--color-dash-muted)] text-sm">
                                No withdrawals yet.
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-[var(--color-dash-border)]">
                                    {withdrawals.data.map(w => (
                                        <div key={w.id} className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-semibold text-[var(--color-dash-text)]">
                                                            {formatCurrency(w.amount)}
                                                        </span>
                                                        <span className="text-xs text-[var(--color-dash-muted)]">{w.currency}</span>
                                                        {w.network && (
                                                            <span className="text-xs text-[var(--color-dash-muted)]">· {w.network}</span>
                                                        )}
                                                        <StatusBadge status={w.status} />
                                                    </div>
                                                    <p className="text-xs text-[var(--color-dash-muted)] mt-1">{formatDate(w.created_at)}</p>
                                                    <p className="text-[10px] font-mono text-[var(--color-dash-muted)] mt-1 truncate max-w-xs">
                                                        → {w.wallet_address}
                                                    </p>
                                                </div>
                                                {w.admin_notes && (
                                                    <p className="text-[10px] text-[var(--color-dash-muted)] italic max-w-[150px] text-right shrink-0">
                                                        "{w.admin_notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {withdrawals.last_page > 1 && (
                                    <div className="px-5 py-3 border-t border-[var(--color-dash-border)] flex items-center justify-between text-xs text-[var(--color-dash-muted)]">
                                        <span>Showing {withdrawals.from}–{withdrawals.to} of {withdrawals.total}</span>
                                        <div className="flex gap-1">
                                            {withdrawals.links.slice(1, -1).map(link => (
                                                <a
                                                    key={link.label}
                                                    href={link.url ?? '#'}
                                                    className={`px-2.5 py-1 rounded transition-all ${
                                                        link.active
                                                            ? 'bg-gold text-black font-semibold'
                                                            : 'bg-[var(--color-dash-surface-2)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
