import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Props {
    open: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
}

/** Centered dialog with backdrop, escape-to-close and body scroll lock. */
export default function Modal({ open, title, subtitle, onClose, children, width = 'max-w-md' }: Props) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function onKey(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        panelRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-[#1c1a15]/45 backdrop-blur-[2px]"
                onClick={onClose}
                aria-hidden
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                className={`relative w-full ${width} max-h-[88vh] overflow-y-auto rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[var(--portal-shadow)] outline-none`}
            >
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--portal-text)]">{title}</h2>
                        {subtitle && (
                            <p className="mt-0.5 text-xs text-[var(--portal-muted)]">{subtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="-mr-1 shrink-0 rounded-lg p-1.5 text-[var(--portal-muted)] transition-colors hover:bg-[var(--portal-surface-2)] hover:text-[var(--portal-text)]"
                    >
                        <X size={18} />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}
