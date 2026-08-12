import { useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { Wallet } from '../../types';
import { coin, money, num } from './format';
import Modal from './Modal';

interface Props {
    open: boolean;
    onClose: () => void;
    wallets: Wallet[];
    balance: number;
    basePrice: number;
    baseSymbol: string;
}

export default function WithdrawModal({
    open,
    onClose,
    wallets,
    balance,
    basePrice,
    baseSymbol,
}: Props) {
    const defaultWallet = wallets[0]?.id ? String(wallets[0].id) : '';

    const form = useForm({
        amount: '',
        wallet_id: defaultWallet,
        wallet_address: '',
    });

    useEffect(() => {
        if (!open) return;
        form.reset();
        form.clearErrors();
        form.setData('wallet_id', defaultWallet);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const amount = num(form.data.amount);
    const overBalance = amount > balance;
    const selected = useMemo(
        () => wallets.find(wallet => String(wallet.id) === form.data.wallet_id),
        [wallets, form.data.wallet_id],
    );

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post('/user/withdrawals', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    }

    return (
        <Modal
            open={open}
            title="Withdraw"
            subtitle="Requests are reviewed and processed within 24–48 hours"
            onClose={onClose}
            width="max-w-lg"
        >
            <form onSubmit={submit} className="space-y-4 border-t border-[var(--portal-border)] p-6">
                <div className="flex items-center justify-between rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-3">
                    <span className="text-xs text-[var(--portal-muted)]">Available balance</span>
                    <span className="text-right">
                        <span className="block text-sm font-semibold tabular-nums text-[var(--portal-text)]">
                            {money(balance)}
                        </span>
                        <span className="block text-[10px] tabular-nums text-[var(--portal-muted)]">
                            {coin(basePrice > 0 ? balance / basePrice : 0)} {baseSymbol}
                        </span>
                    </span>
                </div>

                <div>
                    <label htmlFor="withdraw-wallet" className="mb-1.5 block text-sm text-[var(--portal-text-soft)]">
                        Currency &amp; network
                    </label>
                    <select
                        id="withdraw-wallet"
                        value={form.data.wallet_id}
                        onChange={e => form.setData('wallet_id', e.target.value)}
                        className="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3.5 py-2.5 text-sm text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]"
                    >
                        <option value="">Select…</option>
                        {wallets.map(wallet => (
                            <option key={wallet.id} value={wallet.id}>
                                {wallet.currency} · {wallet.network ?? wallet.name}
                            </option>
                        ))}
                    </select>
                    {form.errors.wallet_id && (
                        <p className="mt-1 text-xs text-[var(--portal-neg)]">{form.errors.wallet_id}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="withdraw-address" className="mb-1.5 block text-sm text-[var(--portal-text-soft)]">
                        Destination address
                    </label>
                    <input
                        id="withdraw-address"
                        type="text"
                        value={form.data.wallet_address}
                        onChange={e => form.setData('wallet_address', e.target.value)}
                        placeholder={`Your ${selected?.currency ?? baseSymbol} wallet address`}
                        className="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3.5 py-2.5 font-mono text-xs text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]"
                    />
                    {form.errors.wallet_address && (
                        <p className="mt-1 text-xs text-[var(--portal-neg)]">{form.errors.wallet_address}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="withdraw-amount" className="mb-1.5 block text-sm text-[var(--portal-text-soft)]">
                        Amount (USD)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--portal-muted)]">
                            $
                        </span>
                        <input
                            id="withdraw-amount"
                            type="number"
                            min="10"
                            step="0.01"
                            value={form.data.amount}
                            onChange={e => form.setData('amount', e.target.value)}
                            placeholder="0.00"
                            className={`w-full rounded-xl border bg-[var(--portal-surface-2)] py-3 pl-7 pr-16 text-lg tabular-nums text-[var(--portal-text)] outline-none ${
                                overBalance
                                    ? 'border-[var(--portal-neg)]'
                                    : 'border-[var(--portal-border)] focus:border-[var(--portal-accent)]'
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => form.setData('amount', String(balance))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-[var(--portal-accent-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--portal-accent)]"
                        >
                            MAX
                        </button>
                    </div>
                    <p className="mt-2 flex justify-between text-xs text-[var(--portal-muted)]">
                        <span>Minimum $10.00</span>
                        <span className="tabular-nums">
                            ≈ {coin(basePrice > 0 ? amount / basePrice : 0)} {selected?.currency ?? baseSymbol}
                        </span>
                    </p>
                    {overBalance && (
                        <p className="mt-1 text-xs text-[var(--portal-neg)]">Exceeds your available balance.</p>
                    )}
                    {form.errors.amount && (
                        <p className="mt-1 text-xs text-[var(--portal-neg)]">{form.errors.amount}</p>
                    )}
                </div>

                <p className="flex items-start gap-2 rounded-xl border border-[var(--portal-border)] p-3 text-xs text-[var(--portal-muted)]">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--portal-accent)]" />
                    Check the address and network carefully. Transfers sent to an incorrect address
                    cannot be reversed.
                </p>

                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-[var(--portal-border)] px-4 py-2.5 text-sm text-[var(--portal-text-soft)] transition-colors hover:bg-[var(--portal-surface-2)]"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={
                            form.processing ||
                            overBalance ||
                            amount < 10 ||
                            !form.data.wallet_id ||
                            !form.data.wallet_address
                        }
                        className="flex items-center gap-2 rounded-lg bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ArrowUpRight size={15} />
                        {form.processing ? 'Submitting…' : 'Request withdrawal'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
