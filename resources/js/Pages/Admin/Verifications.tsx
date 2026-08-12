import { Link, router, useForm } from '@inertiajs/react';
import { BadgeCheck, ExternalLink, IdCard, ShieldX } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout, { StatusBadge, formatDateTime } from '../../Components/DashboardLayout';
import type { AuthUser } from '../../types';

interface SubmissionFile {
    id: number;
    side: 'front' | 'back';
    name: string;
    mime: string;
    url: string;
}

interface Submission {
    submission_id: string | null;
    user: AuthUser & { date_of_birth?: string | null };
    type: string;
    type_label: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes: string | null;
    submitted_at: string;
    reviewed_at: string | null;
    files: SubmissionFile[];
}

interface Props {
    submissions: Submission[];
    filters: { status: string };
    counts: { pending: number; approved: number; rejected: number };
}

const statusFilters = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
];

export default function AdminVerifications({ submissions, filters, counts }: Props) {
    return (
        <DashboardLayout title="Verifications" breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Verifications' }]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">Identity Verifications</h1>
                    <p className="mt-1 text-sm text-[var(--color-dash-muted)]">
                        Review the photo ID a client submitted. Approving marks the account verified.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Stat label="Awaiting Review" value={counts.pending} tone="text-amber-600" />
                    <Stat label="Approved" value={counts.approved} tone="text-emerald-700" />
                    <Stat label="Rejected" value={counts.rejected} tone="text-red-600" />
                </div>

                <div className="flex flex-wrap gap-2">
                    {statusFilters.map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => router.get('/admin/verifications', { status: filter.value }, { preserveState: true, replace: true })}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                filters.status === filter.value
                                    ? 'bg-gold/15 text-gold-ink border border-gold/25'
                                    : 'border border-[var(--color-dash-border)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {submissions.length ? (
                    <div className="space-y-4">
                        {submissions.map(submission => (
                            <SubmissionCard key={submission.submission_id ?? submission.files[0]?.id} submission={submission} />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-lg border border-dashed border-[var(--color-dash-border)] px-4 py-12 text-center text-sm text-[var(--color-dash-muted)]">
                        Nothing to review here.
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
}

function SubmissionCard({ submission }: { submission: Submission }) {
    const [rejecting, setRejecting] = useState(false);
    const approveForm = useForm({ notes: '' });
    const rejectForm = useForm({ notes: '' });

    const pending = submission.status === 'pending';

    function approve() {
        if (!window.confirm(`Verify ${submission.user.name}? This marks the account as identity-verified.`)) return;

        approveForm.post(`/admin/verifications/${submission.user.id}/approve`, { preserveScroll: true });
    }

    function reject(event: React.FormEvent) {
        event.preventDefault();
        rejectForm.post(`/admin/verifications/${submission.user.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => { rejectForm.reset(); setRejecting(false); },
        });
    }

    return (
        <section className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
            <div className="flex flex-col gap-3 border-b border-[var(--color-dash-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/users/${submission.user.id}`} className="text-sm font-semibold text-[var(--color-dash-text)] hover:text-gold-ink">
                            {submission.user.name}
                        </Link>
                        <StatusBadge status={submission.status} />
                        {submission.user.is_verified && (
                            <span className="inline-flex items-center gap-1 rounded border border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700">
                                <BadgeCheck size={12} /> Verified
                            </span>
                        )}
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--color-dash-muted)]">
                        {submission.user.email} · {submission.user.member_id ?? 'no member ID'}
                    </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                    <p className="flex items-center gap-1.5 text-sm text-[var(--color-dash-text)] sm:justify-end">
                        <IdCard size={14} /> {submission.type_label}
                    </p>
                    <p className="text-xs text-[var(--color-dash-muted)]">Submitted {formatDateTime(submission.submitted_at)}</p>
                </div>
            </div>

            <div className="grid gap-3 py-4 sm:grid-cols-2">
                {submission.files.map(file => (
                    <DocumentPreview key={file.id} file={file} />
                ))}
            </div>

            {submission.admin_notes && (
                <p className="mb-3 rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface-2)] px-3 py-2 text-xs text-[var(--color-dash-muted)]">
                    Note: {submission.admin_notes}
                </p>
            )}

            {pending ? (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={approve}
                            disabled={approveForm.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                        >
                            <BadgeCheck size={16} />
                            Approve &amp; verify
                        </button>
                        <button
                            onClick={() => setRejecting(!rejecting)}
                            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-dash-border)] px-4 py-2 text-sm font-medium text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]"
                        >
                            <ShieldX size={16} />
                            Reject
                        </button>
                    </div>

                    {rejecting && (
                        <form onSubmit={reject} className="flex flex-col gap-2 sm:flex-row">
                            <input
                                value={rejectForm.data.notes}
                                onChange={event => rejectForm.setData('notes', event.target.value)}
                                placeholder="Reason shown to the client (required)"
                                className={`h-10 flex-1 rounded-lg border bg-[var(--color-dash-bg)] px-3 text-sm text-[var(--color-dash-text)] outline-none focus:border-gold/50 ${
                                    rejectForm.errors.notes ? 'border-red-500/60' : 'border-[var(--color-dash-border)]'
                                }`}
                            />
                            <button
                                disabled={rejectForm.processing}
                                className="h-10 shrink-0 rounded-lg border border-red-500/40 px-4 text-sm font-medium text-red-600 disabled:opacity-60"
                            >
                                Confirm rejection
                            </button>
                        </form>
                    )}
                </div>
            ) : (
                <p className="text-xs text-[var(--color-dash-muted)]">
                    Reviewed {formatDateTime(submission.reviewed_at)}
                </p>
            )}
        </section>
    );
}

function DocumentPreview({ file }: { file: SubmissionFile }) {
    const isImage = file.mime.startsWith('image/');

    return (
        <div className="overflow-hidden rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface-2)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-dash-border)] px-3 py-2">
                <span className="text-xs font-medium capitalize text-[var(--color-dash-text)]">{file.side}</span>
                <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gold-ink hover:underline"
                >
                    Full size <ExternalLink size={11} />
                </a>
            </div>

            {isImage ? (
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={file.url} alt={`${file.side} of the document`} className="max-h-64 w-full bg-black/5 object-contain" />
                </a>
            ) : (
                <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-32 items-center justify-center text-sm text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]"
                >
                    Open {file.name}
                </a>
            )}
        </div>
    );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
    return (
        <div className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
        </div>
    );
}
