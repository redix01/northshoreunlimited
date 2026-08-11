interface Props {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
}

/** Accessible switch styled to the portal accent. */
export default function Toggle({ checked, onChange, label, disabled = false }: Props) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50"
            style={{
                background: checked ? 'var(--portal-accent)' : 'var(--portal-border-strong)',
            }}
        >
            <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]"
                style={{ left: checked ? 22 : 2 }}
            />
        </button>
    );
}
