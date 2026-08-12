import { router, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ExternalLink,
    FileText,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { UserDocumentItem } from '../../types';
import { shortDate } from './format';

interface Props {
    documents: UserDocumentItem[];
    types: Record<string, string>;
}

const MAX_BYTES = 15 * 1024 * 1024;

const STATUS_TONE: Record<string, string> = {
    pending:  'var(--portal-accent)',
    approved: 'var(--portal-pos)',
    rejected: 'var(--portal-neg)',
};

function fileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsCard({ documents, types }: Props) {
    const [collapsed, setCollapsed] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [sizeError, setSizeError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const typeKeys = Object.keys(types);

    const form = useForm<{ type: string; label: string; file: File | null }>({
        type: typeKeys[0] ?? 'other',
        label: '',
        file: null,
    });

    function accept(file: File | null) {
        if (file && file.size > MAX_BYTES) {
            setSizeError('That file is larger than 15MB.');
            return;
        }
        setSizeError(null);
        form.setData('file', file);
    }

    function onDrop(event: React.DragEvent) {
        event.preventDefault();
        setDragging(false);
        accept(event.dataTransfer.files?.[0] ?? null);
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!form.data.file) return;

        form.post('/user/documents', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset('label', 'file');
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    }

    function remove(document: UserDocumentItem) {
        router.delete(`/user/documents/${document.id}`, { preserveScroll: true });
    }

    return (
        <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
            <button
                type="button"
                onClick={() => setCollapsed(c => !c)}
                aria-expanded={!collapsed}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
                <span className="flex items-center gap-2">
                    <FileText size={17} className="text-[var(--portal-accent)]" />
                    <span className="text-base font-semibold text-[var(--portal-text)]">Documents</span>
                    {documents.length > 0 && (
                        <span className="rounded-full bg-[var(--portal-accent-soft)] px-2 py-0.5 text-xs text-[var(--portal-accent)]">
                            {documents.length}
                        </span>
                    )}
                </span>
                <ChevronDown
                    size={17}
                    className={`shrink-0 text-[var(--portal-muted)] transition-transform ${collapsed ? '' : 'rotate-180'}`}
                />
            </button>

            {!collapsed && (
                <div className="px-5 pb-5">
                    <p className="mb-4 text-sm text-[var(--portal-text-soft)]">
                        Upload supporting documents for verification — tax returns, bank statements,
                        proof of address, and more.
                    </p>

                    <form onSubmit={submit}>
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                            <label htmlFor="document-type" className="sr-only">
                                Document type
                            </label>
                            <select
                                id="document-type"
                                value={form.data.type}
                                onChange={e => form.setData('type', e.target.value)}
                                className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3.5 py-2.5 text-sm text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)] sm:w-52"
                            >
                                {Object.entries(types).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="document-label" className="sr-only">
                                Optional label
                            </label>
                            <input
                                id="document-label"
                                type="text"
                                value={form.data.label}
                                onChange={e => form.setData('label', e.target.value)}
                                placeholder="Optional label (e.g. 2025 W-2)"
                                className="flex-1 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3.5 py-2.5 text-sm text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]"
                            />
                        </div>

                        <div
                            onDragOver={e => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                                dragging
                                    ? 'border-[var(--portal-accent)] bg-[var(--portal-accent-soft)]'
                                    : 'border-[var(--portal-border-strong)]'
                            }`}
                        >
                            {form.data.file ? (
                                <div className="flex items-center justify-center gap-2 text-sm text-[var(--portal-text)]">
                                    <FileText size={16} className="text-[var(--portal-accent)]" />
                                    <span className="max-w-[240px] truncate">{form.data.file.name}</span>
                                    <span className="text-xs text-[var(--portal-muted)]">
                                        {fileSize(form.data.file.size)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            accept(null);
                                            if (fileRef.current) fileRef.current.value = '';
                                        }}
                                        aria-label="Remove selected file"
                                        className="rounded p-1 text-[var(--portal-muted)] hover:text-[var(--portal-neg)]"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="w-full"
                                >
                                    <Upload size={20} className="mx-auto mb-2 text-[var(--portal-muted)]" />
                                    <span className="block text-sm text-[var(--portal-text-soft)]">
                                        Click to upload or drag and drop
                                    </span>
                                    <span className="mt-1 block text-xs text-[var(--portal-muted)]">
                                        JPG, PNG, WebP, or PDF (max 15MB)
                                    </span>
                                </button>
                            )}
                        </div>

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={e => accept(e.target.files?.[0] ?? null)}
                            className="hidden"
                        />

                        {(sizeError || form.errors.file) && (
                            <p className="mt-2 text-xs text-[var(--portal-neg)]">
                                {sizeError ?? form.errors.file}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!form.data.file || form.processing}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--portal-accent)] py-3 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <Upload size={15} />
                            {form.processing ? 'Uploading…' : 'Upload Document'}
                        </button>
                    </form>

                    {documents.length === 0 ? (
                        <div className="py-10 text-center">
                            <FileText size={22} className="mx-auto mb-2 text-[var(--portal-muted)] opacity-60" />
                            <p className="text-sm text-[var(--portal-muted)]">No documents uploaded yet</p>
                        </div>
                    ) : (
                        <ul className="mt-5 divide-y divide-[var(--portal-border)] border-t border-[var(--portal-border)]">
                            {documents.map(document => (
                                <li key={document.id} className="flex items-center gap-3 py-3">
                                    <FileText size={16} className="shrink-0 text-[var(--portal-muted)]" />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-[var(--portal-text)]">
                                            {document.label || document.type_label}
                                        </p>
                                        <p className="truncate text-xs text-[var(--portal-muted)]">
                                            {document.type_label} · {fileSize(document.size)} ·{' '}
                                            {shortDate(document.created_at)}
                                        </p>
                                        {document.admin_notes && (
                                            <p className="mt-0.5 text-xs italic text-[var(--portal-muted)]">
                                                “{document.admin_notes}”
                                            </p>
                                        )}
                                    </div>

                                    <span
                                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
                                        style={{
                                            color: STATUS_TONE[document.status],
                                            background: `color-mix(in srgb, ${STATUS_TONE[document.status]} 12%, transparent)`,
                                        }}
                                    >
                                        {document.status}
                                    </span>

                                    <a
                                        href={document.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Open ${document.original_name}`}
                                        className="shrink-0 rounded p-1.5 text-[var(--portal-muted)] transition-colors hover:text-[var(--portal-text)]"
                                    >
                                        <ExternalLink size={14} />
                                    </a>

                                    {document.status === 'pending' && (
                                        <button
                                            type="button"
                                            onClick={() => remove(document)}
                                            aria-label={`Remove ${document.original_name}`}
                                            className="shrink-0 rounded p-1.5 text-[var(--portal-muted)] transition-colors hover:text-[var(--portal-neg)]"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}
