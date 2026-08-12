import { Check } from 'lucide-react';

interface Props {
    steps: string[];
    /** Zero-based index of the step being shown. */
    current: number;
    onJump: (index: number) => void;
}

export default function Stepper({ steps, current, onJump }: Props) {
    return (
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {steps.map((label, index) => {
                const done = index < current;
                const active = index === current;

                return (
                    <li key={label} className="flex items-center gap-3">
                        {index > 0 && (
                            <span
                                aria-hidden
                                className="hidden h-px w-6 sm:block"
                                style={{
                                    background: done || active ? 'var(--color-gold)' : 'transparent',
                                }}
                            />
                        )}

                        <button
                            type="button"
                            // Only completed steps are reachable by click; jumping
                            // forward would skip the per-step validation.
                            disabled={!done}
                            onClick={() => onJump(index)}
                            aria-current={active ? 'step' : undefined}
                            className={`flex items-center gap-2 ${done ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <span
                                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors"
                                style={
                                    done
                                        ? { background: 'var(--color-gold)', color: '#fff' }
                                        : active
                                          ? {
                                                background: 'color-mix(in srgb, var(--color-gold) 18%, transparent)',
                                                color: 'var(--color-gold-ink)',
                                                boxShadow: '0 0 0 1px var(--color-gold)',
                                            }
                                          : {
                                                background: 'transparent',
                                                color: 'var(--color-dash-muted)',
                                            }
                                }
                            >
                                {done ? <Check size={15} strokeWidth={3} /> : index + 1}
                            </span>

                            <span
                                className={`text-sm ${
                                    done || active
                                        ? 'font-medium text-[var(--color-gold-ink)]'
                                        : 'text-[var(--color-dash-muted)]'
                                }`}
                            >
                                {label}
                            </span>
                        </button>
                    </li>
                );
            })}
        </ol>
    );
}
