import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChartRange, SeriesPoint } from '../../types';
import { dateTime, money, num, signedMoney, signedPercent } from './format';

interface Props {
    series: Partial<Record<ChartRange, SeriesPoint[]>>;
    ranges: ChartRange[];
    /** Live value that replaces the final point so the curve tracks the hero. */
    liveValue?: number;
}

const PAD = { top: 24, right: 92, bottom: 30, left: 12 };
const HEIGHT = 320;

/** Round tick values that land on human numbers rather than raw fractions. */
function niceTicks(min: number, max: number, count = 6): number[] {
    const span = max - min;
    if (span <= 0) return [min];

    const magnitude = Math.pow(10, Math.floor(Math.log10(span / count)));
    const normalised = span / count / magnitude;
    const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude;

    const ticks: number[] = [];
    for (let value = Math.ceil(min / step) * step; value <= max; value += step) {
        ticks.push(value);
    }

    return ticks;
}

function axisLabel(value: number): string {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(2);
}

export default function PortfolioChart({ series, ranges, liveValue }: Props) {
    const gradientId = useId();
    const wrapRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(880);
    const [range, setRange] = useState<ChartRange>(ranges.includes('1M') ? '1M' : ranges[0]);
    const [hover, setHover] = useState<number | null>(null);

    useEffect(() => {
        const element = wrapRef.current;
        if (!element) return;

        const observer = new ResizeObserver(([entry]) => {
            setWidth(Math.max(entry.contentRect.width, 320));
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const points = useMemo(() => {
        const raw = series[range] ?? [];
        if (raw.length === 0 || liveValue === undefined) return raw;

        // Keep the tail of the curve pinned to the ticking hero balance.
        return raw.map((point, index) =>
            index === raw.length - 1 ? { ...point, value: liveValue } : point,
        );
    }, [series, range, liveValue]);

    const geometry = useMemo(() => {
        if (points.length < 2) return null;

        const values = points.map(point => num(point.value));
        const rawMin = Math.min(...values);
        const rawMax = Math.max(...values);
        const padding = (rawMax - rawMin || Math.abs(rawMax) * 0.05 || 1) * 0.08;
        const min = rawMin - padding;
        const max = rawMax + padding;

        const plotWidth = width - PAD.left - PAD.right;
        const plotHeight = HEIGHT - PAD.top - PAD.bottom;

        const x = (index: number) => PAD.left + (index / (points.length - 1)) * plotWidth;
        const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * plotHeight;

        const line = points.map((point, index) => `${x(index)},${y(num(point.value))}`).join(' ');

        return {
            x,
            y,
            min,
            max,
            line,
            area: `${PAD.left},${HEIGHT - PAD.bottom} ${line} ${x(points.length - 1)},${HEIGHT - PAD.bottom}`,
            ticks: niceTicks(min, max),
            plotWidth,
        };
    }, [points, width]);

    const first = num(points[0]?.value);
    const last = num(points[points.length - 1]?.value);
    const change = last - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;
    const up = change >= 0;
    const stroke = up ? 'var(--portal-accent)' : 'var(--portal-neg)';

    const xLabelIndexes = useMemo(() => {
        if (points.length < 2) return [];

        const wanted = Math.min(6, points.length);
        return Array.from({ length: wanted }, (_, i) =>
            Math.round((i / (wanted - 1)) * (points.length - 1)),
        );
    }, [points.length]);

    function onMove(event: React.MouseEvent<SVGSVGElement>) {
        if (!geometry || points.length < 2) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const offset = event.clientX - bounds.left - PAD.left;
        const index = Math.round((offset / geometry.plotWidth) * (points.length - 1));

        setHover(Math.min(Math.max(index, 0), points.length - 1));
    }

    const hovered = hover !== null ? points[hover] : null;

    return (
        <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-[var(--portal-text)]">Portfolio Performance</h2>
                    <p className="mt-0.5 text-xs text-[var(--portal-muted)]">Total value over time</p>
                </div>

                <div className="flex items-center gap-1 rounded-lg bg-[var(--portal-surface-2)] p-0.5">
                    {ranges.map(key => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                setRange(key);
                                setHover(null);
                            }}
                            aria-pressed={range === key}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                range === key
                                    ? 'bg-[var(--portal-accent)] text-[var(--portal-accent-on)]'
                                    : 'text-[var(--portal-muted)] hover:text-[var(--portal-text)]'
                            }`}
                        >
                            {key}
                        </button>
                    ))}
                </div>
            </div>

            {points.length < 2 ? (
                <div className="flex h-[240px] items-center justify-center text-sm text-[var(--portal-muted)]">
                    Performance history appears once your first deposit is approved.
                </div>
            ) : (
                <>
                    <div className="mb-3 flex flex-wrap items-baseline gap-3">
                        <span className="text-2xl font-semibold tabular-nums text-[var(--portal-text)]">
                            {money(last)}
                        </span>
                        <span
                            className="rounded px-1.5 py-0.5 text-xs font-medium"
                            style={{
                                color: up ? 'var(--portal-pos)' : 'var(--portal-neg)',
                                background: up ? 'var(--portal-pos-soft)' : 'var(--portal-neg-soft)',
                            }}
                        >
                            {signedMoney(change)} ({signedPercent(changePercent)})
                        </span>
                        <span className="text-xs text-[var(--portal-muted)]">over {range}</span>
                    </div>

                    <div ref={wrapRef} className="relative w-full">
                        <svg
                            width={width}
                            height={HEIGHT}
                            className="block w-full touch-none"
                            onMouseMove={onMove}
                            onMouseLeave={() => setHover(null)}
                            role="img"
                            aria-label={`Portfolio value over ${range}, ${money(last)}, ${signedPercent(changePercent)}`}
                        >
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
                                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {geometry!.ticks.map(tick => (
                                <g key={tick}>
                                    <line
                                        x1={PAD.left}
                                        x2={width - PAD.right}
                                        y1={geometry!.y(tick)}
                                        y2={geometry!.y(tick)}
                                        stroke="var(--portal-border)"
                                        strokeDasharray="2 6"
                                    />
                                    <text
                                        x={width - PAD.right + 10}
                                        y={geometry!.y(tick) + 4}
                                        fontSize="11"
                                        fill="var(--portal-muted)"
                                        className="tabular-nums"
                                    >
                                        {axisLabel(tick)}
                                    </text>
                                </g>
                            ))}

                            <polygon points={geometry!.area} fill={`url(#${gradientId})`} />
                            <polyline
                                points={geometry!.line}
                                fill="none"
                                stroke={stroke}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {xLabelIndexes.map(index => (
                                <text
                                    key={index}
                                    x={geometry!.x(index)}
                                    y={HEIGHT - PAD.bottom + 18}
                                    fontSize="11"
                                    fill="var(--portal-muted)"
                                    textAnchor={
                                        index === 0
                                            ? 'start'
                                            : index === points.length - 1
                                              ? 'end'
                                              : 'middle'
                                    }
                                >
                                    {points[index].label}
                                </text>
                            ))}

                            {/* Latest value, pinned to the right axis. */}
                            <g>
                                <rect
                                    x={width - PAD.right + 4}
                                    y={geometry!.y(last) - 9}
                                    width={PAD.right - 8}
                                    height="18"
                                    rx="3"
                                    fill={stroke}
                                />
                                <text
                                    x={width - PAD.right + 10}
                                    y={geometry!.y(last) + 4}
                                    fontSize="11"
                                    fontWeight="600"
                                    fill="var(--portal-accent-on)"
                                    className="tabular-nums"
                                >
                                    {axisLabel(last)}
                                </text>
                            </g>

                            <circle cx={geometry!.x(points.length - 1)} cy={geometry!.y(last)} r="4" fill={stroke} />

                            {hovered && (
                                <g>
                                    <line
                                        x1={geometry!.x(hover!)}
                                        x2={geometry!.x(hover!)}
                                        y1={PAD.top}
                                        y2={HEIGHT - PAD.bottom}
                                        stroke="var(--portal-border-strong)"
                                        strokeDasharray="3 4"
                                    />
                                    <circle
                                        cx={geometry!.x(hover!)}
                                        cy={geometry!.y(num(hovered.value))}
                                        r="4.5"
                                        fill="var(--portal-surface)"
                                        stroke={stroke}
                                        strokeWidth="2"
                                    />
                                </g>
                            )}
                        </svg>

                        {hovered && (
                            <div
                                className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] px-3 py-2 text-xs shadow-[var(--portal-shadow)]"
                                style={{
                                    left: Math.min(
                                        Math.max(geometry!.x(hover!), 70),
                                        width - PAD.right - 10,
                                    ),
                                }}
                            >
                                <p className="font-semibold tabular-nums text-[var(--portal-text)]">
                                    {money(hovered.value)}
                                </p>
                                <p className="mt-0.5 text-[var(--portal-muted)]">{dateTime(hovered.at)}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
