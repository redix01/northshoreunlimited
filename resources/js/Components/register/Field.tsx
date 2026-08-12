import { X } from 'lucide-react';

interface Props {
    id: string;
    label: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}

/** Label, control slot, and the inline error shown beneath it. */
export default function Field({ id, label, error, children, className = '' }: Props) {
    return (
        <div className={className}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--color-dash-text)]">
                {label}
            </label>
            {children}
            {error && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
                    <X size={14} strokeWidth={3} className="shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}

/** Shared control styling, so inputs and selects stay in step. */
export function controlClass(hasError?: boolean, withIcon = true): string {
    return [
        'w-full rounded-xl border bg-white py-3 pr-4 text-[15px] text-[var(--color-dash-text)]',
        'placeholder-[var(--color-dash-muted)] transition-colors focus:outline-none',
        withIcon ? 'pl-11' : 'pl-4',
        hasError
            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
            : 'border-[var(--color-dash-border)] focus:border-gold focus:ring-2 focus:ring-gold/20',
    ].join(' ');
}

/** Absolutely-positioned leading icon for a control. */
export function FieldIcon({ children, tinted = false }: { children: React.ReactNode; tinted?: boolean }) {
    return (
        <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: tinted ? 'var(--color-gold)' : 'var(--color-dash-muted)' }}
        >
            {children}
        </span>
    );
}
