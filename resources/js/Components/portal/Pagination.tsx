import { Link } from '@inertiajs/react';

interface Props {
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null;
    to: number | null;
    total: number;
}

export default function Pagination({ links, from, to, total }: Props) {
    // Laravel wraps the page links with "Previous" / "Next" entries.
    const pages = links.slice(1, -1);

    if (pages.length <= 1) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-border)] px-5 py-3 text-xs text-[var(--portal-muted)]">
            <span>
                Showing {from ?? 0}–{to ?? 0} of {total}
            </span>

            <div className="flex flex-wrap gap-1">
                {pages.map((link, index) =>
                    link.url ? (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            preserveScroll
                            aria-current={link.active ? 'page' : undefined}
                            className={`rounded px-2.5 py-1 transition-colors ${
                                link.active
                                    ? 'bg-[var(--portal-accent)] font-semibold text-[var(--portal-accent-on)]'
                                    : 'bg-[var(--portal-surface-2)] hover:text-[var(--portal-text)]'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={`${link.label}-${index}`}
                            className="rounded px-2.5 py-1 opacity-40"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </div>
        </div>
    );
}
