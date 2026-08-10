import { useForm, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Copy, ExternalLink, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DashboardLayout, { StatusBadge, formatCurrency, formatDate } from '../../Components/DashboardLayout';
import type { Deposit, PageProps, PaginatedData, Wallet } from '../../types';

interface Props extends PageProps {
    deposits: PaginatedData<Deposit>;
    wallets: Wallet[];
}

const CURRENCY_ICONS: Record<string, string> = {
    USDT: '₮', USDC: '₵', ETH: 'Ξ', BTC: '₿',
};

export default function DepositPage() {
    const { deposits, wallets } = usePage<Props>().props;
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [copied, setCopied] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(900);
    const fileRef = useRef<HTMLInputElement>(null);
    const defaultWalletId = wallets[0]?.id ? String(wallets[0].id) : '';

    const { data, setData, post, processing, errors, reset } = useForm<{
        amount: string;
        wallet_id: string;
        tx_hash: string;
        proof: File | null;
    }>({
        amount: '',
        wallet_id: defaultWalletId,
        tx_hash: '',
        proof: null,
    });

    const selectedWallet = wallets.find(wallet => String(wallet.id) === data.wallet_id);

    useEffect(() => {
        if (step !== 2) {
            return;
        }
        setSecondsLeft(900);
        const timer = window.setInterval(() => setSecondsLeft(value => Math.max(value - 1, 0)), 1000);
        return () => window.clearInterval(timer);
    }, [step, data.wallet_id]);

    function copyAddress() {
        if (!selectedWallet) {
            return;
        }
        navigator.clipboard.writeText(selectedWallet.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('proof', file);
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/user/deposits', {
            forceFormData: true,
            onSuccess: () => { reset(); setStep(1); setPreviewUrl(null); },
        });
    }

    return (
        <DashboardLayout
            title="Deposits"
            breadcrumb={[
                { label: 'Dashboard', href: '/user/dashboard' },
                { label: 'Deposits' },
            ]}
        >
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Deposit form */}
                <div className="xl:col-span-2">
                    <div className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)] overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--color-dash-border)]">
                            <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">New Deposit</h2>
                            <p className="text-xs text-[var(--color-dash-muted)] mt-0.5">Fund your account with cryptocurrency</p>
                        </div>

                        {/* Step indicator */}
                        <div className="flex px-5 py-3 gap-2 border-b border-[var(--color-dash-border)]">
                            {([1, 2, 3] as const).map(s => (
                                <div key={s} className="flex items-center gap-1.5 flex-1">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        step >= s ? 'bg-gold text-black' : 'bg-[var(--color-dash-surface-2)] text-[var(--color-dash-muted)]'
                                    }`}>
                                        {s}
                                    </div>
                                    <span className={`text-xs hidden sm:inline ${step === s ? 'text-[var(--color-dash-text)]' : 'text-[var(--color-dash-muted)]'}`}>
                                        {s === 1 ? 'Select' : s === 2 ? 'Send' : 'Confirm'}
                                    </span>
                                    {s < 3 && <div className="flex-1 h-px bg-[var(--color-dash-border)]" />}
                                </div>
                            ))}
                        </div>

                        <div className="p-5">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-dash-text)] mb-2">
                                            Select Wallet
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {wallets.map(wallet => (
                                                <button
                                                    key={wallet.id}
                                                    type="button"
                                                    onClick={() => setData('wallet_id', String(wallet.id))}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                                        data.wallet_id === String(wallet.id)
                                                            ? 'border-gold/60 bg-gold/10 text-gold-ink'
                                                            : 'border-[var(--color-dash-border)] text-[var(--color-dash-muted)] hover:border-[var(--color-dash-border)]/80 hover:text-[var(--color-dash-text)]'
                                                    }`}
                                                >
                                                    <span className="text-base">{CURRENCY_ICONS[wallet.currency] ?? '¤'}</span>
                                                    <span className="min-w-0 text-left">
                                                        <span className="block truncate">{wallet.currency}</span>
                                                        <span className="block truncate text-[10px] opacity-70">{wallet.network ?? wallet.name}</span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.wallet_id && <p className="mt-1 text-xs text-red-600">{errors.wallet_id}</p>}
                                        {!wallets.length && <p className="mt-2 text-xs text-amber-700">No deposit wallets are available. Please contact support.</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-dash-text)] mb-1.5">
                                            Amount (USD equivalent)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-dash-muted)] text-sm">$</span>
                                            <input
                                                type="number"
                                                min="10"
                                                step="0.01"
                                                value={data.amount}
                                                onChange={e => setData('amount', e.target.value)}
                                                placeholder="0.00"
                                                className={`w-full pl-7 pr-4 py-2.5 rounded-lg bg-[var(--color-dash-bg)] border text-sm text-[var(--color-dash-text)] placeholder-[var(--color-dash-muted)] focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all ${
                                                    errors.amount ? 'border-red-500/60' : 'border-[var(--color-dash-border)] focus:border-gold/50'
                                                }`}
                                            />
                                        </div>
                                        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
                                        <p className="mt-1 text-[10px] text-[var(--color-dash-muted)]">Minimum deposit: $10.00</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!data.amount || parseFloat(data.amount) < 10 || !data.wallet_id) return;
                                            setStep(2);
                                        }}
                                        disabled={!data.amount || parseFloat(data.amount) < 10 || !data.wallet_id}
                                        className="w-full py-2.5 rounded-lg bg-gold text-black text-sm font-semibold hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Continue →
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-[var(--color-dash-bg)] border border-[var(--color-dash-border)] p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-[var(--color-dash-muted)]">Send {selectedWallet?.currency} to this address</span>
                                            <span className="text-xs text-[var(--color-dash-muted)]">{selectedWallet?.network ?? selectedWallet?.name}</span>
                                        </div>
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(selectedWallet?.address ?? '')}`}
                                            alt="Deposit wallet QR code"
                                            className="mx-auto mb-3 h-40 w-40 rounded-lg bg-white p-2"
                                        />
                                        <div className="flex items-start gap-2">
                                            <p className="flex-1 text-xs font-mono text-[var(--color-dash-text)] break-all leading-relaxed">
                                                {selectedWallet?.address}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={copyAddress}
                                                className="shrink-0 p-1.5 rounded bg-gold/10 hover:bg-gold/20 text-gold-ink transition-all"
                                            >
                                                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <span>Only send {selectedWallet?.currency} on the selected network. Sending other coins may result in permanent loss.</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--color-dash-muted)]">Amount to send</span>
                                        <span className="font-semibold text-gold-ink">${parseFloat(data.amount).toLocaleString()}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-amber-800">
                                        <span>Deposit window</span>
                                        <span className="font-semibold">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="flex-1 py-2.5 rounded-lg bg-[var(--color-dash-surface-2)] text-sm text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] border border-[var(--color-dash-border)] transition-all"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="flex-1 py-2.5 rounded-lg bg-gold text-black text-sm font-semibold hover:bg-gold/90 transition-all"
                                        >
                                            I've Sent →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-dash-text)] mb-1.5">
                                            Transaction Hash (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.tx_hash}
                                            onChange={e => setData('tx_hash', e.target.value)}
                                            placeholder="0x..."
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-dash-bg)] border border-[var(--color-dash-border)] text-sm text-[var(--color-dash-text)] placeholder-[var(--color-dash-muted)] focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-dash-text)] mb-1.5">
                                            Upload Payment Proof
                                        </label>
                                        <div
                                            onClick={() => fileRef.current?.click()}
                                            className="relative border-2 border-dashed border-[var(--color-dash-border)] hover:border-gold/40 rounded-lg p-6 text-center cursor-pointer transition-all"
                                        >
                                            {previewUrl ? (
                                                <div className="relative">
                                                    <img src={previewUrl} alt="proof" className="max-h-32 mx-auto rounded object-contain" />
                                                    <button
                                                        type="button"
                                                        onClick={e => { e.stopPropagation(); setData('proof', null); setPreviewUrl(null); }}
                                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload size={20} className="mx-auto mb-2 text-[var(--color-dash-muted)]" />
                                                    <p className="text-xs text-[var(--color-dash-muted)]">
                                                        Click to upload screenshot or receipt
                                                    </p>
                                                    <p className="text-[10px] text-[var(--color-dash-muted)] mt-1">JPG, PNG or PDF · Max 5MB</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,application/pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        {errors.proof && <p className="mt-1 text-xs text-red-600">{errors.proof}</p>}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="flex-1 py-2.5 rounded-lg bg-[var(--color-dash-surface-2)] text-sm text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] border border-[var(--color-dash-border)] transition-all"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 py-2.5 rounded-lg bg-gold text-black text-sm font-semibold hover:bg-gold/90 disabled:opacity-60 transition-all"
                                        >
                                            {processing ? 'Submitting…' : 'Submit Deposit'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="xl:col-span-3">
                    <div className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)]">
                        <div className="px-5 py-4 border-b border-[var(--color-dash-border)]">
                            <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">Deposit History</h2>
                        </div>

                        {deposits.data.length === 0 ? (
                            <div className="px-5 py-12 text-center text-[var(--color-dash-muted)] text-sm">
                                No deposits yet. Make your first deposit above.
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-[var(--color-dash-border)]">
                                    {deposits.data.map(deposit => (
                                        <div key={deposit.id} className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-semibold text-[var(--color-dash-text)]">
                                                            {formatCurrency(deposit.amount)}
                                                        </span>
                                                        <span className="text-xs text-[var(--color-dash-muted)]">{deposit.currency}</span>
                                                        <StatusBadge status={deposit.status} />
                                                    </div>
                                                    <p className="text-xs text-[var(--color-dash-muted)] mt-1">{formatDate(deposit.created_at)}</p>
                                                    {deposit.tx_hash && (
                                                        <p className="text-[10px] font-mono text-[var(--color-dash-muted)] mt-1 truncate max-w-xs">
                                                            TX: {deposit.tx_hash}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 flex flex-col items-end gap-1.5">
                                                    {deposit.proof_path && (
                                                        <a
                                                            href={`/storage/${deposit.proof_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-[10px] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] transition-colors"
                                                        >
                                                            <ExternalLink size={11} />
                                                            Proof
                                                        </a>
                                                    )}
                                                    {deposit.admin_notes && (
                                                        <p className="text-[10px] text-[var(--color-dash-muted)] italic max-w-[150px] text-right">
                                                            "{deposit.admin_notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {deposits.last_page > 1 && (
                                    <div className="px-5 py-3 border-t border-[var(--color-dash-border)] flex items-center justify-between text-xs text-[var(--color-dash-muted)]">
                                        <span>Showing {deposits.from}–{deposits.to} of {deposits.total}</span>
                                        <div className="flex gap-1">
                                            {deposits.links.slice(1, -1).map(link => (
                                                <a
                                                    key={link.label}
                                                    href={link.url ?? '#'}
                                                    className={`px-2.5 py-1 rounded transition-all ${
                                                        link.active
                                                            ? 'bg-gold text-black font-semibold'
                                                            : 'bg-[var(--color-dash-surface-2)] hover:bg-[var(--color-dash-border)] text-[var(--color-dash-muted)]'
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
