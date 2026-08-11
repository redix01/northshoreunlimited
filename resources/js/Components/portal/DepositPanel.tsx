import { CheckCircle2, Copy, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Wallet } from '../../types';

interface Props {
    wallets: Wallet[];
}

/** Address refresh window, mirroring the desk's rotation policy. */
const WINDOW_SECONDS = 15 * 60;

export default function DepositPanel({ wallets }: Props) {
    const [walletId, setWalletId] = useState(() => (wallets[0]?.id ? String(wallets[0].id) : ''));
    const [copied, setCopied] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(WINDOW_SECONDS);

    const wallet = wallets.find(item => String(item.id) === walletId) ?? null;

    useEffect(() => {
        setSecondsLeft(WINDOW_SECONDS);
        const timer = window.setInterval(
            () => setSecondsLeft(value => (value <= 1 ? WINDOW_SECONDS : value - 1)),
            1000,
        );

        return () => window.clearInterval(timer);
    }, [walletId]);

    function copyAddress() {
        if (!wallet) return;
        navigator.clipboard?.writeText(wallet.address);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    }

    return (
        <section className="min-w-0 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5">
            <h2 className="mb-3 text-base font-semibold text-[var(--portal-text)]">Deposit</h2>

            {!wallet ? (
                <p className="py-8 text-center text-sm text-[var(--portal-muted)]">
                    No deposit wallets are configured yet. Please contact support.
                </p>
            ) : (
                <>
                    <label htmlFor="deposit-panel-wallet" className="sr-only">
                        Deposit currency
                    </label>
                    <select
                        id="deposit-panel-wallet"
                        value={walletId}
                        onChange={e => setWalletId(e.target.value)}
                        className="mb-4 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3.5 py-2.5 text-sm text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]"
                    >
                        {wallets.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} · {item.currency}
                                {item.network ? ` (${item.network})` : ''}
                            </option>
                        ))}
                    </select>

                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wallet.address)}`}
                        alt={`QR code for the ${wallet.currency} deposit address`}
                        className="mx-auto mb-4 h-44 w-44 rounded-xl bg-white p-2"
                    />

                    <p className="mb-1.5 text-[10px] uppercase tracking-wider text-[var(--portal-muted)]">
                        Deposit address
                    </p>
                    <div className="flex items-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 py-2.5">
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--portal-text)]">
                            {wallet.address}
                        </span>
                        <button
                            type="button"
                            onClick={copyAddress}
                            aria-label="Copy deposit address"
                            className="shrink-0 rounded-lg p-1 text-[var(--portal-accent)] transition-colors hover:bg-[var(--portal-accent-soft)]"
                        >
                            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        </button>
                    </div>

                    <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--portal-muted)]">
                        <RefreshCw size={12} />
                        Address refreshes in {Math.floor(secondsLeft / 60)}:
                        {String(secondsLeft % 60).padStart(2, '0')} minutes
                    </p>

                    <p className="mt-3 text-[11px] leading-relaxed text-[var(--portal-muted)]">
                        Send only {wallet.currency}
                        {wallet.network ? ` on the ${wallet.network} network` : ''}. Deposits are
                        credited after network confirmation and desk review.
                    </p>
                </>
            )}
        </section>
    );
}
