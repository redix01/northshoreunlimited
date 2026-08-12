/** Number formatting shared across the client portal. */

const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
});

export function num(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function money(value: unknown): string {
    return usd.format(num(value));
}

export function moneyCompact(value: unknown): string {
    return usdCompact.format(num(value));
}

/** Prefixed with an explicit + / − so gains and losses read at a glance. */
export function signedMoney(value: unknown): string {
    const amount = num(value);
    return `${amount >= 0 ? '+' : '-'}${usd.format(Math.abs(amount))}`;
}

export function signedPercent(value: unknown, digits = 2): string {
    const amount = num(value);
    return `${amount >= 0 ? '+' : ''}${amount.toFixed(digits)}%`;
}

/** Crypto amounts keep eight decimals; prices scale with magnitude. */
export function coin(value: unknown, digits = 8): string {
    return num(value).toFixed(digits);
}

export function price(value: unknown): string {
    const amount = num(value);

    if (amount === 0) return '$0.00';
    if (amount < 1) return `$${amount.toPrecision(4)}`;
    if (amount < 1000) return `$${amount.toFixed(2)}`;

    return usd.format(amount).replace(/\.00$/, '');
}

export function shortDate(value: string): string {
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function dateTime(value: string): string {
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function truncateMiddle(value: string, lead = 12, tail = 6): string {
    if (value.length <= lead + tail + 1) return value;
    return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

/** Tailwind text colour for a signed figure. */
export function trendClass(value: number): string {
    return value >= 0 ? 'text-[var(--portal-pos)]' : 'text-[var(--portal-neg)]';
}
