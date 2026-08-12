import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Clock, Inbox, XCircle } from 'lucide-react';
import type { AccountTransaction } from '../../types';
import { coin, money, truncateMiddle } from './format';

interface Props {
    transactions: AccountTransaction[];
    /** Pass an empty string when the caller renders its own heading. */
    title?: string;
    /** Shows the destination address column — used on the wallet screen. */
    detailed?: boolean;
}

const STATUS: Record<string, { tone: string; icon: typeof Clock }> = {
    pending:    { tone: 'var(--portal-accent)', icon: Clock },
    processing: { tone: 'var(--portal-accent)', icon: Clock },
    approved:   { tone: 'var(--portal-pos)', icon: CheckCircle2 },
    completed:  { tone: 'var(--portal-pos)', icon: CheckCircle2 },
    confirmed:  { tone: 'var(--portal-pos)', icon: CheckCircle2 },
    rejected:   { tone: 'var(--portal-neg)', icon: XCircle },
};

/** Deposits read "confirmed" once approved; withdrawals keep their own wording. */
function statusLabel(transaction: AccountTransaction): string {
    if (transaction.kind === 'deposit' && transaction.status === 'approved') {
        return 'confirmed';
    }

    return transaction.status;
}

export default function TransactionHistory({
    transactions,
    title = 'Transaction History',
    detailed = false,
}: Props) {
    return (
        <section>
            {title && (
                <h2 className="mb-3 text-lg font-semibold text-[var(--portal-text)]">{title}</h2>
            )}

            {transactions.length === 0 ? (
                <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 py-12 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-[var(--portal-muted)] opacity-60" />
                    <p className="text-sm text-[var(--portal-muted)]">
                        No transactions yet. Your first deposit will appear here.
                    </p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {transactions.map(transaction => {
                        const isDeposit = transaction.kind === 'deposit';
                        const label = statusLabel(transaction);
                        const status = STATUS[label] ?? STATUS.pending;
                        const StatusIcon = status.icon;

                        return (
                            <li
                                key={transaction.id}
                                className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 py-4"
                            >
                                <span
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                    style={{
                                        background: isDeposit
                                            ? 'var(--portal-pos-soft)'
                                            : 'var(--portal-accent-soft)',
                                        color: isDeposit ? 'var(--portal-pos)' : 'var(--portal-accent)',
                                    }}
                                >
                                    {isDeposit ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium capitalize text-[var(--portal-text)]">
                                            {transaction.kind}
                                        </span>
                                        <span
                                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium capitalize"
                                            style={{
                                                color: status.tone,
                                                background: `color-mix(in srgb, ${status.tone} 12%, transparent)`,
                                            }}
                                        >
                                            <StatusIcon size={11} />
                                            {label}
                                        </span>
                                    </span>
                                    {detailed && transaction.address && (
                                        <span className="mt-0.5 block font-mono text-xs text-[var(--portal-muted)]">
                                            {truncateMiddle(transaction.address, 16, 8)}
                                        </span>
                                    )}
                                </span>

                                <span className="shrink-0 text-right">
                                    <span
                                        className="block text-sm font-semibold tabular-nums"
                                        style={{
                                            color: isDeposit ? 'var(--portal-pos)' : 'var(--portal-accent)',
                                        }}
                                    >
                                        {isDeposit ? '+' : '-'}
                                        {coin(transaction.amount_base)} {transaction.currency}
                                    </span>
                                    <span className="block text-xs tabular-nums text-[var(--portal-muted)]">
                                        {money(transaction.amount)}
                                    </span>
                                    <span className="block text-xs text-[var(--portal-muted)]">
                                        {new Date(transaction.created_at).toLocaleDateString('en-US')}
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
