import { CheckCircle2, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import type { Verification } from '../../types';
import { shortDate } from './format';

function Detail({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-3">
            <p className="text-[11px] text-[var(--portal-muted)]">{label}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--portal-text)]">
                {icon}
                {children}
            </p>
        </div>
    );
}

export default function VerificationCard({ verification }: { verification: Verification }) {
    const { is_verified: verified, steps, progress } = verification;
    const tone = verified ? 'var(--portal-pos)' : 'var(--portal-accent)';

    return (
        <section
            className="rounded-2xl border p-5"
            style={{
                borderColor: verified ? 'var(--portal-pos)' : 'var(--portal-border)',
                background: verified ? 'var(--portal-pos-soft)' : 'var(--portal-surface)',
            }}
        >
            <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0" style={{ color: tone }}>
                    {verified ? <ShieldCheck size={20} /> : <Clock size={20} />}
                </span>
                <div>
                    <h2 className="text-base font-semibold" style={{ color: tone }}>
                        {verified ? 'Identity Verified' : 'Verification In Progress'}
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--portal-text-soft)]">
                        {verified
                            ? 'Your identity has been verified — deposits and withdrawals are enabled.'
                            : 'Complete the steps below to enable deposits and withdrawals.'}
                    </p>
                </div>
            </div>

            <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-[var(--portal-text-soft)]">Verification Progress</span>
                    <span className="font-semibold tabular-nums" style={{ color: tone }}>
                        {progress}%
                    </span>
                </div>
                <div
                    className="h-2 w-full overflow-hidden rounded-full bg-[var(--portal-surface-2)]"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Verification progress"
                >
                    <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${progress}%`, background: tone }}
                    />
                </div>
            </div>

            <ul className="mt-4 space-y-2">
                {steps.map(step => (
                    <li key={step.key} className="flex items-center gap-2 text-sm">
                        <CheckCircle2
                            size={15}
                            className="shrink-0"
                            style={{ color: step.done ? tone : 'var(--portal-muted)' }}
                        />
                        <span
                            className={
                                step.done
                                    ? 'text-[var(--portal-muted)] line-through'
                                    : 'text-[var(--portal-text)]'
                            }
                        >
                            {step.label}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Detail label="Document Type" icon={<CreditCard size={14} className="text-[var(--portal-muted)]" />}>
                    {verification.document_type ?? (
                        <span className="text-[var(--portal-muted)]">Not provided</span>
                    )}
                </Detail>

                <Detail label="Tax ID (Last 4)">
                    {verification.tax_id_last4 ? (
                        <span className="tabular-nums">•••• {verification.tax_id_last4}</span>
                    ) : (
                        <span className="text-[var(--portal-muted)]">Not provided</span>
                    )}
                </Detail>

                <Detail label="Verified On" icon={<Clock size={14} className="text-[var(--portal-muted)]" />}>
                    {verification.verified_at ? (
                        shortDate(verification.verified_at)
                    ) : (
                        <span className="text-[var(--portal-muted)]">Pending</span>
                    )}
                </Detail>

                <Detail label="Name Match">
                    {verification.name_match ? (
                        <span className="flex items-center gap-1" style={{ color: 'var(--portal-pos)' }}>
                            <CheckCircle2 size={14} />
                            Confirmed
                        </span>
                    ) : (
                        <span className="text-[var(--portal-muted)]">Awaiting review</span>
                    )}
                </Detail>
            </div>
        </section>
    );
}
