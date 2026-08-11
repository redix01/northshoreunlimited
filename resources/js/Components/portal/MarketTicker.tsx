import { TrendingDown, TrendingUp } from 'lucide-react';
import type { Quote } from '../../types';
import { price, signedPercent } from './format';

const SYMBOL_TINT: Record<string, string> = {
    BTC:  '#f7931a',
    ETH:  '#627eea',
    SOL:  '#14f195',
    ADA:  '#0033ad',
    USDT: '#26a17b',
    BNB:  '#f3ba2f',
    XRP:  '#23292f',
};

function Row({ quote }: { quote: Quote }) {
    const up = quote.change >= 0;
    const Icon = up ? TrendingUp : TrendingDown;
    const tone = up ? 'var(--portal-pos)' : 'var(--portal-neg)';

    return (
        <div className="flex shrink-0 items-center gap-2 px-4 py-2.5 text-xs">
            <Icon size={13} style={{ color: tone }} />
            <span style={{ color: tone }}>{signedPercent(quote.change)}</span>
            <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                    color: SYMBOL_TINT[quote.symbol] ?? 'var(--portal-muted)',
                    background: `${SYMBOL_TINT[quote.symbol] ?? '#888'}1f`,
                }}
            >
                {quote.symbol}
            </span>
            <span className="font-medium text-[var(--portal-text)]">{quote.name}</span>
            <span className="text-[var(--portal-text-soft)]">{price(quote.price)}</span>
        </div>
    );
}

/**
 * Continuously scrolling price strip. The list is rendered twice so the
 * -50% marquee translation loops without a visible seam.
 */
export default function MarketTicker({ quotes }: { quotes: Quote[] }) {
    if (!quotes.length) return null;

    return (
        <div className="overflow-hidden rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
            <div className="flex w-max animate-marquee">
                {[0, 1].map(copy => (
                    <div key={copy} className="flex" aria-hidden={copy === 1}>
                        {quotes.map(quote => (
                            <Row key={`${copy}-${quote.symbol}`} quote={quote} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
