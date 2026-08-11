import { useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Bitcoin,
    CheckCircle2,
    Copy,
    CreditCard,
    Upload,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Wallet } from '../../types';
import { coin, money, num } from './format';
import Modal from './Modal';

type Tab = 'card' | 'send' | 'broker';

interface Props {
    open: boolean;
    onClose: () => void;
    wallets: Wallet[];
    basePrice: number;
    /** Pre-selects a currency when opened from an asset row. */
    initialCurrency?: string | null;
}

const TABS: { key: Tab; label: string; icon: typeof CreditCard }[] = [
    { key: 'card',   label: 'Card/Bank',  icon: CreditCard },
    { key: 'send',   label: 'Send BTC',   icon: Bitcoin },
    { key: 'broker', label: 'P2P Broker', icon: UserRound },
];

const CURRENCIES = [
    { symbol: 'BTC',  name: 'Bitcoin' },
    { symbol: 'ETH',  name: 'Ethereum' },
    { symbol: 'SOL',  name: 'Solana' },
    { symbol: 'USDT', name: 'Tether' },
];

const PROVIDERS = [
    {
        name: 'MoonPay',
        badge: 'Recommended',
        blurb: 'Credit card, debit card, Apple Pay, or bank transfer',
        href: 'https://www.moonpay.com/buy/btc',
    },
    {
        name: 'Coinbase',
        badge: null,
        blurb: 'Best if you already have a Coinbase account',
        href: 'https://www.coinbase.com/price/bitcoin',
    },
];

function StepDots({ step, total }: { step: number; total: number }) {
    return (
        <div className="flex gap-1.5">
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className="h-1 w-6 rounded-full transition-colors"
                    style={{
                        background:
                            i < step ? 'var(--portal-accent)' : 'var(--portal-border-strong)',
                    }}
                />
            ))}
        </div>
    );
}

export default function DepositModal({ open, onClose, wallets, basePrice, initialCurrency }: Props) {
    const [tab, setTab] = useState<Tab>('card');
    const [step, setStep] = useState(1);
    const [currency, setCurrency] = useState('BTC');
    const [copied, setCopied] = useState(false);
    const [brokerSent, setBrokerSent] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const available = useMemo(
        () => new Set(wallets.map(wallet => wallet.currency.toUpperCase())),
        [wallets],
    );

    const wallet = useMemo(
        () => wallets.find(item => item.currency.toUpperCase() === currency) ?? null,
        [wallets, currency],
    );

    const deposit = useForm<{ amount: string; wallet_id: string; tx_hash: string; proof: File | null }>({
        amount: '',
        wallet_id: '',
        tx_hash: '',
        proof: null,
    });

    const broker = useForm({ amount: '', note: '' });

    // Reset to a clean state each time the dialog is opened.
    useEffect(() => {
        if (!open) return;

        const preselect = initialCurrency?.toUpperCase();
        setTab('card');
        setStep(1);
        setCurrency(preselect && available.has(preselect) ? preselect : 'BTC');
        setBrokerSent(false);
        setCopied(false);
        setPreview(null);
        deposit.reset();
        deposit.clearErrors();
        broker.reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialCurrency]);

    const amount = num(deposit.data.amount);
    const amountInCoin = basePrice > 0 ? amount / basePrice : 0;

    function copyAddress() {
        if (!wallet) return;
        navigator.clipboard?.writeText(wallet.address);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    }

    function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        deposit.setData('proof', file);
        setPreview(file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    }

    function submitDeposit(event: React.FormEvent) {
        event.preventDefault();

        // Enter inside an earlier step advances the wizard rather than posting.
        if (step < 4) {
            setStep(step + 1);
            return;
        }

        // Resolved at submit time rather than mirrored into form state, so a
        // reset between openings can never leave it stale or blank.
        deposit.transform(data => ({ ...data, wallet_id: wallet ? String(wallet.id) : '' }));

        deposit.post('/user/deposits', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                deposit.reset();
                setPreview(null);
                onClose();
            },
        });
    }

    function submitBroker(event: React.FormEvent) {
        event.preventDefault();
        broker.post('/user/broker-requests', {
            preserveScroll: true,
            onSuccess: () => setBrokerSent(true),
        });
    }

    const title = tab === 'send' ? `Deposit — Step ${step} of 4` : 'Deposit';

    return (
        <Modal open={open} title={title} onClose={onClose} width="max-w-lg">
            {/* Tabs */}
            <div className="flex border-y border-[var(--portal-border)]">
                {TABS.map(item => {
                    const Icon = item.icon;
                    const isActive = tab === item.key;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                                setTab(item.key);
                                setStep(1);
                            }}
                            aria-pressed={isActive}
                            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-medium transition-colors ${
                                isActive
                                    ? 'border-[var(--portal-accent)] bg-[var(--portal-accent-soft)] text-[var(--portal-accent)]'
                                    : 'border-transparent text-[var(--portal-muted)] hover:text-[var(--portal-text)]'
                            }`}
                        >
                            <Icon size={14} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <div className="p-6">
                {/* ── Card / Bank ─────────────────────────────────────────── */}
                {tab === 'card' && (
                    <div>
                        <h3 className="text-center text-base font-semibold text-[var(--portal-text)]">
                            Buy Bitcoin Instantly
                        </h3>
                        <p className="mb-5 mt-0.5 text-center text-sm text-[var(--portal-muted)]">
                            Choose a payment provider
                        </p>

                        <div className="space-y-3">
                            {PROVIDERS.map(provider => (
                                <a
                                    key={provider.name}
                                    href={provider.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 rounded-xl border border-[var(--portal-border)] px-4 py-3.5 transition-colors hover:border-[var(--portal-accent)] hover:bg-[var(--portal-accent-soft)]"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className="text-base font-semibold text-[var(--portal-text)]">
                                                {provider.name}
                                            </span>
                                            {provider.badge && (
                                                <span className="rounded bg-[var(--portal-accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--portal-accent)]">
                                                    {provider.badge}
                                                </span>
                                            )}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-[var(--portal-muted)]">
                                            {provider.blurb}
                                        </span>
                                    </span>
                                    <ArrowRight size={16} className="shrink-0 text-[var(--portal-muted)]" />
                                </a>
                            ))}
                        </div>

                        <p className="mt-4 text-center text-xs text-[var(--portal-muted)]">
                            Already have a Coinbase account? Use Coinbase. Otherwise MoonPay is
                            recommended. Both open in a new tab — send the purchased BTC to your
                            deposit address afterwards.
                        </p>
                    </div>
                )}

                {/* ── Send BTC (4 steps) ──────────────────────────────────── */}
                {tab === 'send' && (
                    <form onSubmit={submitDeposit} className="space-y-5">
                        <StepDots step={step} total={4} />

                        {step === 1 && (
                            <div>
                                <p className="mb-3 text-sm text-[var(--portal-text-soft)]">
                                    Select currency to deposit
                                </p>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {CURRENCIES.map(item => {
                                        const enabled = available.has(item.symbol);
                                        const selected = currency === item.symbol;

                                        return (
                                            <button
                                                key={item.symbol}
                                                type="button"
                                                disabled={!enabled}
                                                onClick={() => setCurrency(item.symbol)}
                                                className={`relative rounded-xl border px-3.5 py-3 text-left transition-colors ${
                                                    selected
                                                        ? 'border-[var(--portal-accent)] bg-[var(--portal-accent-soft)]'
                                                        : 'border-[var(--portal-border)] hover:border-[var(--portal-border-strong)]'
                                                } ${enabled ? '' : 'cursor-not-allowed opacity-45'}`}
                                            >
                                                <span className="block text-sm font-semibold text-[var(--portal-text)]">
                                                    {item.symbol}
                                                </span>
                                                <span className="block text-xs text-[var(--portal-muted)]">
                                                    {item.name}
                                                </span>
                                                {!enabled && (
                                                    <span className="absolute right-2.5 top-2.5 text-[10px] text-[var(--portal-muted)]">
                                                        Soon
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {!wallets.length && (
                                    <p className="mt-3 text-xs text-[var(--portal-neg)]">
                                        No deposit wallets are configured. Please contact support.
                                    </p>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <label
                                    htmlFor="deposit-amount"
                                    className="mb-1.5 block text-sm text-[var(--portal-text-soft)]"
                                >
                                    Amount to deposit (USD)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--portal-muted)]">
                                        $
                                    </span>
                                    <input
                                        id="deposit-amount"
                                        type="number"
                                        min="10"
                                        step="0.01"
                                        autoFocus
                                        value={deposit.data.amount}
                                        onChange={e => deposit.setData('amount', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] py-3 pl-7 pr-4 text-lg tabular-nums text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]"
                                    />
                                </div>
                                <p className="mt-2 flex justify-between text-xs text-[var(--portal-muted)]">
                                    <span>Minimum $10.00</span>
                                    <span className="tabular-nums">
                                        ≈ {coin(amountInCoin)} {currency}
                                    </span>
                                </p>
                                {deposit.errors.amount && (
                                    <p className="mt-1 text-xs text-[var(--portal-neg)]">{deposit.errors.amount}</p>
                                )}
                            </div>
                        )}

                        {step === 3 && wallet && (
                            <div className="space-y-3">
                                <p className="text-sm text-[var(--portal-text-soft)]">
                                    Send exactly{' '}
                                    <span className="font-semibold tabular-nums text-[var(--portal-text)]">
                                        {coin(amountInCoin)} {wallet.currency}
                                    </span>{' '}
                                    to this address
                                </p>

                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(wallet.address)}`}
                                    alt={`QR code for the ${wallet.currency} deposit address`}
                                    className="mx-auto h-44 w-44 rounded-xl bg-white p-2"
                                />

                                <div className="flex items-start gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-3">
                                    <p className="flex-1 break-all font-mono text-xs leading-relaxed text-[var(--portal-text)]">
                                        {wallet.address}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={copyAddress}
                                        aria-label="Copy deposit address"
                                        className="shrink-0 rounded-lg bg-[var(--portal-accent-soft)] p-1.5 text-[var(--portal-accent)]"
                                    >
                                        {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>

                                <p className="flex items-start gap-2 rounded-xl border border-[var(--portal-border)] p-3 text-xs text-[var(--portal-muted)]">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--portal-accent)]" />
                                    Send only {wallet.currency}
                                    {wallet.network ? ` on ${wallet.network}` : ''}. Other assets or
                                    networks cannot be recovered.
                                </p>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-3 text-sm">
                                    <span className="text-[var(--portal-muted)]">Declared amount</span>
                                    <span className="font-semibold tabular-nums text-[var(--portal-text)]">
                                        {money(amount)}
                                    </span>
                                </div>

                                <div>
                                    <label
                                        htmlFor="deposit-tx"
                                        className="mb-1.5 block text-sm text-[var(--portal-text-soft)]"
                                    >
                                        Transaction hash <span className="text-[var(--portal-muted)]">(optional)</span>
                                    </label>
                                    <input
                                        id="deposit-tx"
                                        type="text"
                                        value={deposit.data.tx_hash}
                                        onChange={e => deposit.setData('tx_hash', e.target.value)}
                                        placeholder="e.g. 3a1f…"
                                        className="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3.5 py-2.5 font-mono text-xs text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]"
                                    />
                                </div>

                                <div>
                                    <span className="mb-1.5 block text-sm text-[var(--portal-text-soft)]">
                                        Payment proof <span className="text-[var(--portal-muted)]">(optional)</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="w-full rounded-xl border border-dashed border-[var(--portal-border-strong)] p-5 text-center transition-colors hover:border-[var(--portal-accent)]"
                                    >
                                        {preview ? (
                                            <span className="relative block">
                                                <img src={preview} alt="Selected proof" className="mx-auto max-h-28 rounded-lg" />
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        deposit.setData('proof', null);
                                                        setPreview(null);
                                                    }}
                                                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--portal-neg)] text-white"
                                                >
                                                    <X size={11} />
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="block text-xs text-[var(--portal-muted)]">
                                                <Upload size={18} className="mx-auto mb-1.5" />
                                                {deposit.data.proof?.name ?? 'Click to upload a screenshot or receipt'}
                                                <span className="mt-1 block text-[10px]">JPG, PNG, WEBP or PDF · max 5MB</span>
                                            </span>
                                        )}
                                    </button>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        onChange={pickFile}
                                        className="hidden"
                                    />
                                    {deposit.errors.proof && (
                                        <p className="mt-1 text-xs text-[var(--portal-neg)]">{deposit.errors.proof}</p>
                                    )}
                                </div>

                                {deposit.errors.wallet_id && (
                                    <p className="text-xs text-[var(--portal-neg)]">{deposit.errors.wallet_id}</p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
                                className="rounded-lg border border-[var(--portal-border)] px-4 py-2.5 text-sm text-[var(--portal-text-soft)] transition-colors hover:bg-[var(--portal-surface-2)]"
                            >
                                {step === 1 ? 'Cancel' : 'Back'}
                            </button>

                            {step < 4 ? (
                                <button
                                    type="button"
                                    disabled={
                                        (step === 1 && !wallet) ||
                                        (step === 2 && amount < 10) ||
                                        (step === 3 && !wallet)
                                    }
                                    onClick={() => setStep(step + 1)}
                                    className="flex items-center gap-2 rounded-lg bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {step === 3 ? "I've sent it" : 'Continue'}
                                    <ArrowRight size={15} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={deposit.processing}
                                    className="rounded-lg bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)] disabled:opacity-60"
                                >
                                    {deposit.processing ? 'Submitting…' : 'Submit deposit'}
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* ── P2P Broker ──────────────────────────────────────────── */}
                {tab === 'broker' && (
                    brokerSent ? (
                        <div className="py-4 text-center">
                            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--portal-pos-soft)]">
                                <CheckCircle2 size={24} className="text-[var(--portal-pos)]" />
                            </span>
                            <h3 className="text-base font-semibold text-[var(--portal-text)]">Request Submitted</h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--portal-muted)]">
                                Our support team will reach out within 24 hours to connect you with
                                a broker. Check your email for a confirmation.
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-5 rounded-lg bg-[var(--portal-accent)] px-5 py-2.5 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)]"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submitBroker} className="space-y-4 text-center">
                            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--portal-accent-soft)]">
                                <UserRound size={22} className="text-[var(--portal-accent)]" />
                            </span>
                            <div>
                                <h3 className="text-base font-semibold text-[var(--portal-text)]">
                                    P2P Broker Deposit
                                </h3>
                                <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--portal-muted)]">
                                    Request our recommended P2P broker for payment instructions to
                                    deposit Bitcoin instantly.
                                </p>
                            </div>

                            <div className="text-left">
                                <label
                                    htmlFor="broker-amount"
                                    className="mb-1.5 block text-xs text-[var(--portal-text-soft)]"
                                >
                                    Approximate amount <span className="text-[var(--portal-muted)]">(optional)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--portal-muted)]">
                                        $
                                    </span>
                                    <input
                                        id="broker-amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={broker.data.amount}
                                        onChange={e => broker.setData('amount', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] py-2.5 pl-7 pr-4 text-sm tabular-nums text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]"
                                    />
                                </div>
                                {broker.errors.amount && (
                                    <p className="mt-1 text-xs text-[var(--portal-neg)]">{broker.errors.amount}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={broker.processing}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--portal-accent)] px-4 py-3 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)] disabled:opacity-60"
                            >
                                <UserRound size={16} />
                                {broker.processing ? 'Submitting…' : 'Request Broker'}
                            </button>

                            <p className="text-xs text-[var(--portal-muted)]">
                                Ideal if you prefer guided, personal assistance with your deposit.
                            </p>
                        </form>
                    )
                )}
            </div>
        </Modal>
    );
}
