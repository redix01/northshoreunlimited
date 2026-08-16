import { Link } from '@inertiajs/react';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import type { Verification } from '../../types';
import { shortDate } from './format';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-3 py-2">
            <span className="shrink-0 text-xs text-[var(--portal-muted)]">{label}</span>
            <span className="min-w-0 text-right text-xs font-medium text-[var(--portal-text)]">{children}</span>
        </div>
    );
}

/**
 * The dashboard's read-only view of what compliance confirmed. The profile
 * screen carries the full checklist and the upload form; this is the summary a
 * client sees next to their balance.
 */
export default function IdentityStatusCard({ verification }: { verification: Verification }) {
    const verified = verification.is_verified;

    return (
        <section
            className="rounded-2xl border p-5"
            style={{
                borderColor: verified ? 'var(--portal-pos)' : 'var(--portal-border)',
                background: verified ? 'var(--portal-pos-soft)' : 'var(--portal-surface)',
            }}
        >
            <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0" style={{ color: verified ? 'var(--portal-pos)' : 'var(--portal-accent)' }}>
                    {verified ? <ShieldCheck size={18} /> : <Clock size={18} />}
                </span>
                <div className="min-w-0">
                    <h2
                        className="text-sm font-semibold"
                        style={{ color: verified ? 'var(--portal-pos)' : 'var(--portal-accent)' }}
                    >
                        {verified ? 'Identity Verified' : 'Verification In Progress'}
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--portal-text-soft)]">
                        {verified
                            ? 'These are the details our compliance team confirmed.'
                            : `${verification.progress}% complete — finish verification to enable deposits and withdrawals.`}
                    </p>
                </div>
            </div>

            {verified ? (
                <div className="mt-3 divide-y divide-[var(--portal-border)] border-t border-[var(--portal-border)]">
                    <Row label="Verified name">
                        <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="shrink-0" style={{ color: 'var(--portal-pos)' }} />
                            {verification.verified_name ?? 'Confirmed'}
                        </span>
                    </Row>

                    <Row label="Document">
                        {verification.document_type ?? <span className="text-[var(--portal-muted)]">Not recorded</span>}
                    </Row>

                    <Row label="Tax ID">
                        {verification.tax_id_last4 ? (
                            <span className="inline-flex items-center gap-1.5">
                                {verification.tax_id_verified && (
                                    <CheckCircle2 size={13} className="shrink-0" style={{ color: 'var(--portal-pos)' }} />
                                )}
                                <span className="tabular-nums">•••• {verification.tax_id_last4}</span>
                            </span>
                        ) : (
                            <span className="text-[var(--portal-muted)]">Not provided</span>
                        )}
                    </Row>

                    <Row label="Verified on">
                        {verification.verified_at ? shortDate(verification.verified_at) : '—'}
                    </Row>
                </div>
            ) : (
                <Link
                    href="/user/profile"
                    className="mt-4 block rounded-xl px-4 py-2.5 text-center text-xs font-semibold"
                    style={{ background: 'var(--portal-accent)', color: 'var(--portal-accent-on)' }}
                >
                    {verification.document_type ? 'View verification status' : 'Verify my identity'}
                </Link>
            )}
        </section>
    );
}
