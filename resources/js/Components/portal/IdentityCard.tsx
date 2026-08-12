import { useForm } from '@inertiajs/react';
import { BadgeCheck, Clock, IdCard, ShieldAlert, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { shortDate } from './format';

export interface IdentitySubmission {
    status: 'pending' | 'approved' | 'rejected';
    type_label: string;
    admin_notes: string | null;
    submitted_at: string;
    reviewed_at: string | null;
}

interface Props {
    types: Record<string, string>;
    /** Types that are a single page, so no back is asked for. */
    singleSided: string[];
    submission: IdentitySubmission | null;
    isVerified: boolean;
}

const MAX_BYTES = 15 * 1024 * 1024;

export default function IdentityCard({ types, singleSided, submission, isVerified }: Props) {
    const typeKeys = Object.keys(types);
    const [sizeError, setSizeError] = useState<string | null>(null);
    const frontRef = useRef<HTMLInputElement>(null);
    const backRef = useRef<HTMLInputElement>(null);

    const form = useForm<{ type: string; front: File | null; back: File | null }>({
        type: typeKeys[0] ?? 'drivers_license',
        front: null,
        back: null,
    });

    const needsBack = !singleSided.includes(form.data.type);

    function accept(side: 'front' | 'back', file: File | null) {
        if (file && file.size > MAX_BYTES) {
            setSizeError('That file is larger than 15MB.');
            return;
        }
        setSizeError(null);
        form.setData(side, file);
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post('/user/identity', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                if (frontRef.current) frontRef.current.value = '';
                if (backRef.current) backRef.current.value = '';
            },
        });
    }

    // Verified accounts have nothing left to do here.
    if (isVerified) {
        return (
            <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5">
                <div className="flex items-start gap-3">
                    <BadgeCheck size={20} style={{ color: 'var(--portal-pos)' }} className="mt-0.5 shrink-0" />
                    <div>
                        <h2 className="text-base font-semibold text-[var(--portal-text)]">Identity Verified</h2>
                        <p className="mt-1 text-sm text-[var(--portal-muted)]">
                            {submission?.type_label
                                ? `Your ${submission.type_label.toLowerCase()} has been approved.`
                                : 'Your identity document has been approved.'}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
            <header className="flex items-center gap-2 border-b border-[var(--portal-border)] px-5 py-4">
                <IdCard size={18} className="text-[var(--portal-accent)]" />
                <h2 className="text-base font-semibold text-[var(--portal-text)]">Identity Verification</h2>
            </header>

            <div className="space-y-4 p-5">
                {submission?.status === 'pending' && (
                    <Banner tone="var(--portal-accent)" icon={<Clock size={16} />}>
                        <strong className="font-medium">{submission.type_label}</strong> submitted{' '}
                        {shortDate(submission.submitted_at)} and awaiting review. Uploading again replaces it.
                    </Banner>
                )}

                {submission?.status === 'rejected' && (
                    <Banner tone="var(--portal-neg)" icon={<ShieldAlert size={16} />}>
                        Your {submission.type_label.toLowerCase()} was not accepted
                        {submission.admin_notes ? `: ${submission.admin_notes}` : '.'} Please upload a new one.
                    </Banner>
                )}

                <p className="text-sm text-[var(--portal-muted)]">
                    Upload an unexpired, government-issued photo ID. Make sure the whole document is visible and the
                    text is legible.
                </p>

                <form onSubmit={submit} className="space-y-4">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-[var(--portal-muted)]">Document type</span>
                        <select
                            value={form.data.type}
                            onChange={event => form.setData('type', event.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-bg)] px-3 text-sm text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]"
                        >
                            {Object.entries(types).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        {form.errors.type && <span className="mt-1 block text-xs" style={{ color: 'var(--portal-neg)' }}>{form.errors.type}</span>}
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FilePicker
                            label="Front"
                            required
                            inputRef={frontRef}
                            file={form.data.front}
                            error={form.errors.front}
                            onPick={file => accept('front', file)}
                        />
                        {needsBack ? (
                            <FilePicker
                                label="Back"
                                required
                                inputRef={backRef}
                                file={form.data.back}
                                error={form.errors.back}
                                onPick={file => accept('back', file)}
                            />
                        ) : (
                            <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--portal-border)] px-4 py-6 text-center text-xs text-[var(--portal-muted)]">
                                A passport only needs its photo page.
                            </div>
                        )}
                    </div>

                    {sizeError && <p className="text-xs" style={{ color: 'var(--portal-neg)' }}>{sizeError}</p>}

                    <button
                        type="submit"
                        disabled={form.processing || !form.data.front || (needsBack && !form.data.back)}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 text-sm font-semibold text-black disabled:opacity-50 sm:w-auto"
                    >
                        <Upload size={16} />
                        {form.processing ? 'Uploading…' : 'Submit for verification'}
                    </button>
                </form>
            </div>
        </section>
    );
}

function Banner({ tone, icon, children }: { tone: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div
            className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
            style={{ color: tone, background: `color-mix(in srgb, ${tone} 10%, transparent)` }}
        >
            <span className="mt-0.5 shrink-0">{icon}</span>
            <span>{children}</span>
        </div>
    );
}

function FilePicker({
    label, required, file, error, onPick, inputRef,
}: {
    label: string;
    required?: boolean;
    file: File | null;
    error?: string;
    onPick: (file: File | null) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
}) {
    return (
        <div>
            <span className="mb-1.5 block text-xs font-medium text-[var(--portal-muted)]">
                {label}{required && ' *'}
            </span>

            {file ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-bg)] px-3 py-3">
                    <span className="truncate text-xs text-[var(--portal-text)]">{file.name}</span>
                    <button
                        type="button"
                        onClick={() => { onPick(null); if (inputRef.current) inputRef.current.value = ''; }}
                        className="shrink-0 text-[var(--portal-muted)] hover:text-[var(--portal-text)]"
                        aria-label={`Remove ${label.toLowerCase()} image`}
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-[var(--portal-border)] px-4 py-6 text-center transition hover:border-[var(--portal-accent)]"
                >
                    <Upload size={16} className="text-[var(--portal-muted)]" />
                    <span className="text-xs text-[var(--portal-muted)]">Upload {label.toLowerCase()}</span>
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={event => onPick(event.target.files?.[0] ?? null)}
            />

            {error && <span className="mt-1 block text-xs" style={{ color: 'var(--portal-neg)' }}>{error}</span>}
        </div>
    );
}
