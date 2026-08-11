interface Props {
    url?: string | null;
    preset?: string | null;
    initials: string;
    presets: Record<string, string>;
    size?: number;
    className?: string;
}

/**
 * An uploaded photo when there is one, otherwise a monogram on the chosen
 * preset colour — no remote avatar service involved.
 */
export default function Avatar({ url, preset, initials, presets, size = 40, className = '' }: Props) {
    const dimension = { width: size, height: size };

    if (url) {
        return (
            <img
                src={url}
                alt=""
                style={dimension}
                className={`shrink-0 rounded-full object-cover ring-1 ring-[var(--portal-border)] ${className}`}
            />
        );
    }

    const background = (preset && presets[preset]) || 'var(--portal-accent)';

    return (
        <span
            aria-hidden
            style={{
                ...dimension,
                background,
                fontSize: Math.max(size * 0.38, 11),
            }}
            className={`flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide text-white ${className}`}
        >
            {initials || '?'}
        </span>
    );
}
