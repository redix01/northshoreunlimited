import { useForm, usePage, Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import {
    BadgeCheck,
    Check,
    CheckCircle2,
    Gauge,
    Headphones,
    ShieldCheck,
    Target,
    Timer,
    X as XIcon,
} from 'lucide-react';

import { fadeIn, SiteChrome, SiteFooter, staggerContainer } from '../Components/SiteChrome';

type SharedPageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
};

/* ── Content ─────────────────────────────────────────────────────────────── */

const recognizedBy = [
    'Yale University',
    'Brown University',
    'Forbes',
    'J.P. Morgan',
    'Bank of America',
    'Harvard University',
    'Bloomberg',
    'Citadel',
];

const heroStats = [
    { value: '10,000+', label: 'Active Investors' },
    { value: '250M+', label: 'Volume Traded' },
    { value: '100%', label: 'Funds Secured' },
    { value: '24/7', label: 'Human Support' },
];

const whyUs = [
    {
        title: '24/7 Personalized Support',
        description:
            "Dedicated 1:1 guidance from expert brokers whether you're an individual, company, trust, or self-managed retirement fund",
        icon: <Headphones className="h-5 w-5 text-gold/60" />,
    },
    {
        title: 'Bitcoin-First Approach',
        description:
            'Deep expertise in Bitcoin markets from strategic accumulation to secure custody and seamless liquidation',
        icon: <BadgeCheck className="h-5 w-5 text-gold/60" />,
    },
    {
        title: 'Fully Audited Security',
        description: 'Robust oversight prioritizing the security of your funds and your peace of mind',
        icon: <ShieldCheck className="h-5 w-5 text-gold/60" />,
    },
];

const comparison = [
    { feature: 'Support', others: 'Email-only, 48h response', ours: '24/7 Human Support' },
    { feature: 'Fees', others: 'Hidden fees, spread markups', ours: 'No hidden fees, transparent pricing' },
    { feature: 'Withdrawals', others: 'Complex process, long delays', ours: 'Instant, stress-free withdrawals' },
    { feature: 'Guidance', others: 'Self-service only', ours: 'Personal advisor assigned' },
    { feature: 'Processing', others: '3-5 day delays', ours: 'Same-day transactions' },
];

const tools = [
    {
        title: 'Portfolio Health Check',
        description:
            "Get a comprehensive analysis of your current portfolio's performance, risk exposure, and optimization opportunities.",
    },
    {
        title: 'Inflation Proof Assessment',
        description:
            'Discover if your portfolio is positioned to withstand inflation. Compare your returns against traditional asset classes.',
    },
    {
        title: 'Crypto Experience Questionnaire',
        description:
            'Tell us about your goals and experience level. Receive a curated investment plan tailored to your financial timeline.',
    },
];

const wealthPillars = [
    {
        title: 'Move With No Delays',
        description:
            'A specialized crypto broker offering personalized support and quick transaction processing, giving you full advantage of the markets.',
        icon: <Timer className="h-5 w-5 text-gold/60" />,
    },
    {
        title: 'Tailored for Your Goals',
        description:
            'Take control of your investments with our custom investment plans to reach your financial goals on your timeline, supported by the best experts.',
        icon: <Target className="h-5 w-5 text-gold/60" />,
    },
    {
        title: 'Dependable Investment Protection',
        description:
            'We are dedicated to providing robust oversight through your trading activities, prioritizing the security of your funds and your peace of mind.',
        icon: <Gauge className="h-5 w-5 text-gold/60" />,
    },
];

const reserveStats = [
    { value: '$12.38B', label: 'Total Reserves' },
    { value: '1.046x', label: 'Reserve Ratio' },
    { value: '20', label: 'Assets Covered' },
    { value: 'Feb 2026', label: 'Last Audit' },
];

const testimonialsRowOne = [
    {
        quote: "I'm very impressed with Northshore Unlimited managed account. I'm not tech-savvy so their option to manage my investment made it an easy choice. The sign-up process was straightforward, just sign a few documents.",
        initials: 'MG',
        name: 'Maria Gonzalez',
        role: 'Retired Teacher',
    },
    {
        quote: "I have been considering investing in Crypto for some time. Northshore Unlimited made it easy. I don't have to be the expert and I'm not! Their personalized broker service made it easier for me to become a Bitcoiner. My wife and I are pleased we're now investing in Bitcoin!",
        initials: 'D&',
        name: 'David & Karen Thompson',
        role: 'Small Business Owners',
    },
    {
        quote: 'I decided to roll over my IRA with their managed service. They talked me through how Bitcoin works and it just made sense. I am new to crypto investing, so having someone look out for my investment 24/7 means I don’t need to worry about what price Bitcoin is at today!',
        initials: 'JW',
        name: 'James Whitfield',
        role: 'IRA Investor',
    },
    {
        quote: "As a novice, Northshore Unlimited support team explained in detail how to operate, allowing me to slowly understand and learn about Bitcoin! It's been a good trip so far. Education is a key part with Northshore Unlimited.",
        initials: 'PP',
        name: 'Priya Patel',
        role: 'First-Time Investor',
    },
    {
        quote: 'I would say try their managed accounts and thank me later, where you can earn daily and take out profit hassle free. That means more money for the things you care about.',
        initials: 'DW',
        name: 'DeShawn Williams',
        role: 'Managed Account Client',
    },
];

const testimonialsRowTwo = [
    {
        quote: 'Northshore Unlimited take the time to understand you and your goals, helping you construct a portfolio that fulfills your needs.',
        initials: 'LC',
        name: 'Linda Chen',
        role: 'Retirement Planner',
    },
    {
        quote: 'The technology Northshore Unlimited uses is beyond impressive. It analyzes market trends in ways I could never manage on my own. Knowing my portfolio is optimized around the clock has given me a whole new level of confidence in my retirement planning.',
        initials: 'RC',
        name: 'Robert Crawford',
        role: 'Tech Professional',
    },
    {
        quote: "Northshore Unlimited brokerage account is a top tier retirement platform. I have recommended them to family and friends and it's the only place I would recommend to invest in Bitcoin for your IRA or 401k. Try their managed accounts and thank me later.",
        initials: 'BM',
        name: 'Barbara Mitchell',
        role: 'Roth IRA Client',
    },
    {
        quote: "Great platform, happy I did this. It's going to be a great run for crypto over the next 5 years in my opinion.",
        initials: 'MR',
        name: 'Marcus Rivera',
        role: 'Long-Term Investor',
    },
    {
        quote: "The Best Crypto IRA Platform. I've tried other investment platforms but nothing compares to Northshore Unlimited. Their customer service is the best I've experienced and the growth in my Crypto IRA has exceeded all expectations.",
        initials: 'SH',
        name: 'Sandra Hayes',
        role: 'Crypto IRA Client',
    },
];

const socialPosts = [
    {
        name: 'Susan Park',
        handle: '@susanparkweb3',
        body: 'Just moved my portfolio to @NorthshoreUnltd and the difference is night and day. Personal advisor, instant support, zero hidden fees. This is how crypto brokerage should work.',
        date: 'Jan 15, 2026',
    },
    {
        name: 'Michael Harrison',
        handle: '@mikeharrison_',
        body: "My SMSF needed a reliable crypto broker. Northshore's compliance-first approach and 24/7 human support made it an easy choice. Portfolio is up 34% since switching.",
        date: 'Feb 2, 2026',
    },
];

const mediaLogos = ['Bloomberg', 'CoinDesk', 'Reuters', 'Forbes', 'Bitcoin Magazine', 'The Block'];

const portalActivity = [
    { initial: 'A', text: 'Advisor scheduled ‘Monthly Review Call’', time: 'just now' },
    { initial: 'A', text: 'Alert triggered ‘BTC Price Target Hit’', time: '1m ago' },
    { initial: 'W', text: 'Withdrawal processed ‘$2,500 to Bank’', time: '2m ago' },
    { initial: 'T', text: 'Trade executed ‘BTC Market Buy’', time: '3m ago' },
    { initial: 'D', text: 'Deposit completed ‘$5,000 AUD’', time: '5m ago' },
    { initial: 'A', text: 'Advisor reviewed ‘Weekly BTC Report’', time: '8m ago' },
];

/* ── Bitcoin stack calculator ────────────────────────────────────────────── */

const PERIODS = [
    { key: '3', label: '3Y', years: 3, multiple: 1.62, avgPrice: 62_000 },
    { key: '5', label: '5Y', years: 5, multiple: 2.063, avgPrice: 41_200 },
    { key: '10', label: '10Y', years: 10, multiple: 4.21, avgPrice: 18_500 },
];

const AMOUNTS = [
    { value: 50, label: '$50' },
    { value: 100, label: '$100' },
    { value: 250, label: '$250' },
    { value: 500, label: '$500' },
    { value: 1000, label: '$1K' },
];

const FREQUENCIES = [
    { key: 'daily', label: 'Daily', perYear: 365, noun: 'day' },
    { key: 'weekly', label: 'Weekly', perYear: 52, noun: 'week' },
    { key: 'monthly', label: 'Monthly', perYear: 12, noun: 'month' },
];

const currency = (value: number) =>
    `$${Math.round(value).toLocaleString('en-US')}`;

const compactCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${Math.round(value)}`;
};

function ToggleGroup<T extends string | number>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: { key: string; label: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <div>
            <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                {label}
            </span>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        key={option.key}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`rounded-sm border px-4 py-2 text-xs font-medium transition ${
                            option.value === value
                                ? 'border-gold/40 bg-gold/10 text-gold'
                                : 'border-elegant-border text-white/50 hover:border-white/25 hover:text-white/80'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function StackCalculator() {
    const [periodKey, setPeriodKey] = useState('5');
    const [amount, setAmount] = useState(500);
    const [frequencyKey, setFrequencyKey] = useState('weekly');

    const period = PERIODS.find((item) => item.key === periodKey) ?? PERIODS[1];
    const frequency = FREQUENCIES.find((item) => item.key === frequencyKey) ?? FREQUENCIES[1];

    const model = useMemo(() => {
        const contributions = period.years * frequency.perYear;
        const invested = amount * contributions;
        const value = invested * period.multiple;
        const btc = invested / period.avgPrice;
        const returnPct = (value / invested - 1) * 100;

        const steps = 48;
        const points = Array.from({ length: steps + 1 }, (_, index) => {
            const t = index / steps;
            const investedAt = invested * t;
            const valueAt = investedAt * (1 + (period.multiple - 1) * Math.pow(t, 1.6));
            return { t, investedAt, valueAt };
        });

        const now = new Date();
        const dates = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const date = new Date(now);
            date.setMonth(date.getMonth() - Math.round(period.years * 12 * (1 - fraction)));
            return date
                .toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                .replace(' ', " '");
        });

        const max = value * 1.23;
        const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => compactCurrency(max * fraction));

        return { invested, value, btc, returnPct, points, dates, ticks, max };
    }, [amount, frequency, period]);

    const width = 800;
    const height = 240;
    const toX = (t: number) => t * width;
    const toY = (value: number) => height - (value / model.max) * height;

    const valueLine = model.points.map((p) => `${toX(p.t).toFixed(1)},${toY(p.valueAt).toFixed(1)}`).join(' ');
    const investedLine = model.points
        .map((p) => `${toX(p.t).toFixed(1)},${toY(p.investedAt).toFixed(1)}`)
        .join(' ');

    return (
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-8">
                <ToggleGroup
                    label="Time Period"
                    value={periodKey}
                    onChange={setPeriodKey}
                    options={PERIODS.map((item) => ({ key: item.key, label: item.label, value: item.key }))}
                />
                <ToggleGroup
                    label="Amount"
                    value={amount}
                    onChange={setAmount}
                    options={AMOUNTS.map((item) => ({
                        key: String(item.value),
                        label: item.label,
                        value: item.value,
                    }))}
                />
                <ToggleGroup
                    label="Frequency"
                    value={frequencyKey}
                    onChange={setFrequencyKey}
                    options={FREQUENCIES.map((item) => ({ key: item.key, label: item.label, value: item.key }))}
                />

                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-elegant-border bg-elegant-border">
                    <div className="bg-elegant-card p-6">
                        <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/30">
                            Total Invested
                        </span>
                        <p className="font-serif text-2xl italic text-white">{currency(model.invested)}</p>
                    </div>
                    <div className="bg-elegant-card p-6">
                        <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/30">
                            Portfolio Value
                        </span>
                        <p className="font-serif text-2xl italic text-white">{currency(model.value)}</p>
                    </div>
                    <div className="bg-elegant-card p-6">
                        <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/30">
                            Return
                        </span>
                        <p className="font-serif text-2xl italic text-gold">+{model.returnPct.toFixed(1)}%</p>
                    </div>
                    <div className="bg-elegant-card p-6">
                        <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/30">
                            BTC Accumulated
                        </span>
                        <p className="font-serif text-2xl italic text-white">{model.btc.toFixed(4)}</p>
                    </div>
                </div>

                <p className="text-sm leading-relaxed text-white/50">
                    Over the last {period.years} years, saving {currency(amount)} in Bitcoin every {frequency.noun}{' '}
                    has turned {currency(model.invested)} into {currency(model.value)}.
                </p>
            </div>

            <div className="rounded-xl border border-elegant-border bg-elegant-card p-6 md:p-10">
                <div className="flex gap-6">
                    <div className="flex flex-col justify-between py-1 text-right text-[10px] uppercase tracking-widest text-white/25">
                        {[...model.ticks].reverse().map((tick, index) => (
                            <span key={`${tick}-${index}`}>{tick}</span>
                        ))}
                    </div>

                    <div className="min-w-0 flex-1">
                        <svg
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="none"
                            className="h-56 w-full md:h-64"
                            role="img"
                            aria-label="Modelled portfolio value against amount invested"
                        >
                            <defs>
                                <linearGradient id="stack-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#d4af37" stopOpacity="0.28" />
                                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                                <line
                                    key={fraction}
                                    x1="0"
                                    x2={width}
                                    y1={height * fraction}
                                    y2={height * fraction}
                                    stroke="rgba(255,255,255,0.06)"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ))}
                            <polygon points={`0,${height} ${valueLine} ${width},${height}`} fill="url(#stack-fill)" />
                            <polyline
                                points={investedLine}
                                fill="none"
                                stroke="rgba(255,255,255,0.35)"
                                strokeWidth="1.5"
                                strokeDasharray="5 5"
                                vectorEffect="non-scaling-stroke"
                            />
                            <polyline
                                points={valueLine}
                                fill="none"
                                stroke="#d4af37"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>

                        <div className="mt-4 flex justify-between text-[10px] uppercase tracking-widest text-white/25">
                            {model.dates.map((date, index) => (
                                <span key={`${date}-${index}`}>{date}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-8 border-t border-elegant-border pt-6 text-[11px] uppercase tracking-[0.2em] text-white/40">
                    <span className="flex items-center gap-3">
                        <span className="h-0.5 w-6 bg-gold" />
                        Portfolio Value
                    </span>
                    <span className="flex items-center gap-3">
                        <span className="h-0.5 w-6 border-t border-dashed border-white/40" />
                        Amount Invested
                    </span>
                </div>

                <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-white/20">
                    Illustrative projection only. Not a forecast or an offer.
                </p>
            </div>
        </div>
    );
}

function TestimonialCard({
    quote,
    initials,
    name,
    role,
}: {
    quote: string;
    initials: string;
    name: string;
    role: string;
}) {
    return (
        <figure className="flex w-[340px] shrink-0 flex-col justify-between rounded-xl border border-elegant-border bg-elegant-card p-8 md:w-[400px]">
            <blockquote className="text-sm leading-relaxed text-white/60">&ldquo;{quote}&rdquo;</blockquote>
            <figcaption className="mt-8 flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-elegant-border bg-white/5 text-[11px] font-semibold tracking-wider text-gold">
                    {initials}
                </span>
                <span>
                    <span className="block text-sm font-medium text-white">{name}</span>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-white/30">{role}</span>
                </span>
            </figcaption>
        </figure>
    );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function HomePage() {
    const { flash } = usePage<SharedPageProps>().props;
    const form = useForm({
        full_name: '',
        email: '',
        jurisdiction: '',
        estimated_btc_volume: '',
        transaction_context: '',
        consent: false,
    });

    const submitted = form.wasSuccessful || Boolean(flash?.success);
    const inputClass =
        'w-full border-b border-elegant-border bg-transparent py-4 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-gold';

    return (
        <SiteChrome>
            <main className="pt-20 xl:pt-24">
                {/* Hero */}
                <section id="hero" className="mx-auto max-w-7xl px-6 pt-16 md:px-12 md:pt-24">
                    <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                        <motion.div initial="initial" animate="animate" variants={staggerContainer}>
                            <motion.div
                                variants={fadeIn}
                                className="mb-6 inline-flex items-center gap-2 rounded-full border border-elegant-border px-4 py-1.5"
                            >
                                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                                    Institutional-Grade BTC Brokerage
                                </span>
                            </motion.div>
                            <motion.h2
                                variants={fadeIn}
                                className="font-serif text-5xl font-normal leading-[1.1] italic text-white md:text-6xl"
                            >
                                Your Capital, <br /> Our Expertise.
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-8 max-w-lg text-lg leading-relaxed text-white/60">
                                The best way to accumulate your share of the world&rsquo;s scarcest asset
                                &lsquo;Bitcoin&rsquo;.
                            </motion.p>
                            <motion.div variants={fadeIn} className="mt-12 flex flex-wrap gap-5">
                                <a
                                    href="#contact"
                                    className="rounded-sm bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200"
                                >
                                    Start Investing
                                </a>
                                <a
                                    href="#contact"
                                    className="rounded-sm border border-elegant-border bg-transparent px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/5"
                                >
                                    Talk to an Advisor
                                </a>
                            </motion.div>
                            <motion.div
                                variants={fadeIn}
                                className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.2em] text-white/30"
                            >
                                <span>+10,000 investors trust Northshore</span>
                                <span className="hidden h-3 w-px bg-white/10 sm:block" />
                                <span className="text-gold">$2,000 bonus &mdash; no deposit required</span>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                        >
                            <div className="flex flex-col justify-between rounded-xl border border-elegant-border bg-elegant-card p-8 text-white sm:col-span-2">
                                <div>
                                    <span className="mb-4 block text-[10px] uppercase tracking-[0.2em] text-white/30">
                                        Active Operations
                                    </span>
                                    <div className="mb-2 font-sans text-xl font-medium">
                                        Personalized Bitcoin Brokerage
                                    </div>
                                    <p className="text-sm leading-relaxed text-white/50">
                                        Dedicated 1:1 guidance from expert brokers, from strategic accumulation to
                                        secure custody and seamless liquidation.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center gap-3 text-[12px] font-medium text-gold">
                                    <div className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_#D4AF37]" />
                                    Desk Status: Accepting Inquiries
                                </div>
                            </div>
                            <div className="rounded-xl border border-elegant-border bg-elegant-card p-8 text-white">
                                <span className="mb-4 block text-[10px] uppercase tracking-[0.2em] text-white/30">
                                    Verification
                                </span>
                                <div className="mb-2 font-sans text-lg font-medium">Fully Audited</div>
                                <p className="text-xs leading-relaxed text-white/50">
                                    Robust oversight prioritizing the security of your funds and your peace of mind.
                                </p>
                            </div>
                            <div className="rounded-xl border border-elegant-border bg-elegant-card p-8 text-white transition-colors hover:border-gold/30">
                                <span className="mb-4 block text-[10px] uppercase tracking-[0.2em] text-white/30">
                                    Velocity
                                </span>
                                <div className="mb-2 font-sans text-lg font-medium">Same-Day Settlement</div>
                                <p className="text-xs leading-relaxed text-white/50">
                                    Instant, stress-free withdrawals with no hidden fees or spread markups.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <div className="mt-24">
                        <p className="mb-8 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/25">
                            Recognized By
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                            {recognizedBy.map((name) => (
                                <span
                                    key={name}
                                    className="text-sm font-medium uppercase tracking-[0.15em] text-white/25 transition hover:text-white/50"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats band */}
                <section className="mt-24 border-y border-elegant-border">
                    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-elegant-border md:grid-cols-4">
                        {heroStats.map((stat) => (
                            <div key={stat.label} className="bg-elegant-bg px-6 py-14 text-center">
                                <p className="mb-3 font-serif text-4xl italic text-white">{stat.value}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Why investors choose us */}
                <section id="why-us" className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                    <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <h3 className="max-w-2xl font-serif text-4xl italic text-white">
                            Why Investors Choose Northshore
                        </h3>
                        <a
                            href="#contact"
                            className="w-fit rounded-sm border border-elegant-border px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/5"
                        >
                            Create your account
                        </a>
                    </div>

                    <div className="grid gap-16 md:grid-cols-3">
                        {whyUs.map((item) => (
                            <div key={item.title} className="group">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-elegant-border bg-elegant-card transition-colors group-hover:border-gold/30">
                                    {item.icon}
                                </div>
                                <h4 className="mb-4 text-lg font-medium text-white">{item.title}</h4>
                                <p className="text-sm leading-relaxed text-white/50">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Comparison */}
                <section id="comparison" className="mx-auto max-w-7xl border-t border-elegant-border px-6 py-24 md:px-12">
                    <div className="mb-14 max-w-3xl">
                        <h3 className="mb-4 font-serif text-4xl italic text-white">Trade BTC With Expert Guidance</h3>
                        <p className="text-lg text-white/40">Every step of the way</p>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-elegant-border">
                        <table className="w-full min-w-[640px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-elegant-border bg-elegant-card">
                                    <th className="px-8 py-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                                        Feature
                                    </th>
                                    <th className="px-8 py-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                                        Other Brokers
                                    </th>
                                    <th className="px-8 py-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
                                        Northshore
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparison.map((row) => (
                                    <tr key={row.feature} className="border-b border-elegant-border last:border-b-0">
                                        <td className="px-8 py-6 text-sm font-medium text-white">{row.feature}</td>
                                        <td className="px-8 py-6 text-sm text-white/40">
                                            <span className="flex items-center gap-3">
                                                <XIcon className="h-4 w-4 shrink-0 text-white/20" />
                                                {row.others}
                                            </span>
                                        </td>
                                        <td className="bg-white/[0.02] px-8 py-6 text-sm text-white/80">
                                            <span className="flex items-center gap-3">
                                                <Check className="h-4 w-4 shrink-0 text-gold" />
                                                {row.ours}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-12">
                        <a
                            href="#contact"
                            className="inline-block rounded-sm bg-white px-10 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-neutral-200"
                        >
                            Schedule a Consultation
                        </a>
                    </div>
                </section>

                {/* Free tools */}
                <section id="tools" className="border-y border-elegant-border bg-white/[0.01]">
                    <div className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
                            Free Tools
                        </p>
                        <h3 className="mb-4 font-serif text-4xl italic text-white">Assess Your Portfolio</h3>
                        <p className="mb-16 text-lg text-white/40">Use our free tools to understand where you stand</p>

                        <div className="grid gap-8 md:grid-cols-3">
                            {tools.map((tool, index) => (
                                <div
                                    key={tool.title}
                                    className="rounded-xl border border-elegant-border bg-elegant-card p-10 transition-colors hover:border-gold/20"
                                >
                                    <span className="mb-8 flex h-10 w-10 items-center justify-center rounded-full border border-elegant-border font-serif text-lg italic text-gold">
                                        {index + 1}
                                    </span>
                                    <h4 className="mb-4 text-lg font-medium text-white">{tool.title}</h4>
                                    <p className="text-sm leading-relaxed text-white/50">{tool.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Calculator */}
                <section id="calculator" className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                    <div className="mb-16 max-w-3xl">
                        <h3 className="mb-4 font-serif text-4xl italic text-white">Build Your Bitcoin Stack</h3>
                        <p className="text-lg text-white/40">
                            Steadily convert your dollars into Bitcoin. See how consistent investing compounds your
                            wealth over time.
                        </p>
                    </div>
                    <StackCalculator />
                </section>

                {/* Wealth management */}
                <section id="wealth" className="mx-auto max-w-7xl border-t border-elegant-border px-6 py-24 md:px-12">
                    <div className="mb-16 max-w-3xl">
                        <h3 className="mb-6 font-serif text-4xl italic text-white">
                            Where Custom Wealth Management Feels Effortless
                        </h3>
                        <p className="text-lg leading-relaxed text-white/40">
                            Your legacy deserves a personal touch. Discover how Northshore&rsquo;s customized asset
                            management can protect and grow your capital for the years ahead.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {wealthPillars.map((pillar) => (
                            <div
                                key={pillar.title}
                                className="group rounded-xl border border-elegant-border bg-elegant-card p-10 transition-colors hover:border-gold/20"
                            >
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-elegant-border transition-colors group-hover:border-gold/30">
                                    {pillar.icon}
                                </div>
                                <h4 className="mb-4 text-lg font-medium text-white">{pillar.title}</h4>
                                <p className="text-sm leading-relaxed text-white/50">{pillar.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Proof of reserves */}
                <section
                    id="proof-of-reserves"
                    className="border-y border-elegant-border bg-white/[0.01]"
                >
                    <div className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
                            Proof of Reserves
                        </p>
                        <h3 className="mb-8 max-w-3xl font-serif text-4xl italic leading-[1.15] text-white">
                            Every Dollar Accounted For. <br /> Verified On-Chain.
                        </h3>
                        <p className="mb-16 max-w-2xl text-lg leading-relaxed text-white/40">
                            All assets on Northshore are backed 1:1 and beyond &mdash; audited quarterly by an
                            independent third-party accounting firm, cryptographically proven, and verifiable by
                            anyone.
                        </p>

                        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-elegant-border bg-elegant-border md:grid-cols-4">
                            {reserveStats.map((stat) => (
                                <div key={stat.label} className="bg-elegant-card px-8 py-12 text-center">
                                    <p className="mb-3 font-serif text-3xl italic text-white">{stat.value}</p>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12">
                            <a
                                href="#contact"
                                className="inline-block rounded-sm border border-elegant-border px-10 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/5"
                            >
                                Verify Our Reserves
                            </a>
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section id="testimonials" className="py-24">
                    <div className="mx-auto mb-16 max-w-7xl px-6 md:px-12">
                        <h3 className="mb-4 font-serif text-4xl italic text-white">What Our Clients Say</h3>
                        <p className="text-lg text-white/40">
                            Real stories from investors who trust Northshore with their capital.
                        </p>
                    </div>

                    <div className="marquee-viewport marquee-fade space-y-6 overflow-hidden">
                        <div className="marquee-track flex w-max gap-6">
                            {[...testimonialsRowOne, ...testimonialsRowOne].map((item, index) => (
                                <TestimonialCard key={`${item.name}-${index}`} {...item} />
                            ))}
                        </div>
                        <div className="marquee-track-reverse flex w-max gap-6">
                            {[...testimonialsRowTwo, ...testimonialsRowTwo].map((item, index) => (
                                <TestimonialCard key={`${item.name}-${index}`} {...item} />
                            ))}
                        </div>
                    </div>

                    <div className="mx-auto mt-16 max-w-7xl px-6 md:px-12">
                        <div className="grid gap-6 md:grid-cols-2">
                            {socialPosts.map((post) => (
                                <div
                                    key={post.handle}
                                    className="rounded-xl border border-elegant-border bg-elegant-card p-8"
                                >
                                    <div className="mb-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white">{post.name}</p>
                                            <p className="text-[11px] tracking-wider text-white/30">{post.handle}</p>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                                            {post.date}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-white/60">{post.body}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 border-t border-elegant-border pt-12">
                            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                                {mediaLogos.map((logo) => (
                                    <span
                                        key={logo}
                                        className="text-sm font-medium uppercase tracking-[0.15em] text-white/25 transition hover:text-white/50"
                                    >
                                        {logo}
                                    </span>
                                ))}
                            </div>
                            <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/20">
                                Featured and trusted across global financial media
                            </p>
                        </div>
                    </div>
                </section>

                {/* Client portal */}
                <section id="portal" className="border-t border-elegant-border">
                    <div className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
                            <div>
                                <h3 className="mb-6 font-serif text-4xl italic text-white">Your Client Portal</h3>
                                <p className="mb-10 max-w-md text-lg leading-relaxed text-white/40">
                                    A simple interface to effortlessly track your assets
                                </p>
                                <Link
                                    href="/portal"
                                    className="inline-block rounded-sm bg-white px-10 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-neutral-200"
                                >
                                    Open the Portal
                                </Link>
                            </div>

                            <div className="min-w-0 rounded-xl border border-elegant-border bg-elegant-card p-4 md:p-6">
                                <ul className="divide-y divide-elegant-border">
                                    {portalActivity.map((item, index) => (
                                        <li
                                            key={`${item.text}-${index}`}
                                            className="flex items-center gap-4 px-4 py-5"
                                        >
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-elegant-border bg-white/5 text-[11px] font-semibold text-gold">
                                                {item.initial}
                                            </span>
                                            <span className="min-w-0 flex-1 truncate text-sm text-white/70">
                                                {item.text}
                                            </span>
                                            <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/25">
                                                {item.time}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact / trade request */}
                <section id="contact" className="border-t border-elegant-border">
                    <div className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                        <div className="grid gap-16 lg:grid-cols-[1.5fr_1fr]">
                            <div>
                                <h3 className="mb-6 font-serif text-4xl italic text-white">Talk to an Advisor</h3>
                                <p className="mb-12 max-w-lg text-sm leading-relaxed text-white/50">
                                    No pressure, no obligations. Tell us about your goals and a dedicated broker will
                                    be in touch to walk you through your options.
                                </p>
                                {!submitted ? (
                                    <form
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            form.post('/trade-request', { preserveScroll: true });
                                        }}
                                        className="grid gap-6"
                                    >
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <div>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Full Name"
                                                    value={form.data.full_name}
                                                    onChange={(event) => form.setData('full_name', event.target.value)}
                                                    className={inputClass}
                                                />
                                                {form.errors.full_name && (
                                                    <p className="mt-2 text-xs text-red-400">{form.errors.full_name}</p>
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    required
                                                    type="email"
                                                    placeholder="Email Address"
                                                    value={form.data.email}
                                                    onChange={(event) => form.setData('email', event.target.value)}
                                                    className={inputClass}
                                                />
                                                {form.errors.email && (
                                                    <p className="mt-2 text-xs text-red-400">{form.errors.email}</p>
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Jurisdiction / Country"
                                                    value={form.data.jurisdiction}
                                                    onChange={(event) =>
                                                        form.setData('jurisdiction', event.target.value)
                                                    }
                                                    className={inputClass}
                                                />
                                                {form.errors.jurisdiction && (
                                                    <p className="mt-2 text-xs text-red-400">
                                                        {form.errors.jurisdiction}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Estimated BTC Volume"
                                                    value={form.data.estimated_btc_volume}
                                                    onChange={(event) =>
                                                        form.setData('estimated_btc_volume', event.target.value)
                                                    }
                                                    className={inputClass}
                                                />
                                                {form.errors.estimated_btc_volume && (
                                                    <p className="mt-2 text-xs text-red-400">
                                                        {form.errors.estimated_btc_volume}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <textarea
                                                rows={4}
                                                placeholder="Tell us about your goals..."
                                                value={form.data.transaction_context}
                                                onChange={(event) =>
                                                    form.setData('transaction_context', event.target.value)
                                                }
                                                className={`${inputClass} resize-none`}
                                            />
                                            {form.errors.transaction_context && (
                                                <p className="mt-2 text-xs text-red-400">
                                                    {form.errors.transaction_context}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-4 py-4">
                                            <input
                                                required
                                                id="consent"
                                                type="checkbox"
                                                checked={form.data.consent}
                                                onChange={(event) => form.setData('consent', event.target.checked)}
                                                className="mt-1 h-3.5 w-3.5 rounded-sm border-elegant-border bg-transparent text-gold focus:ring-0"
                                            />
                                            <label
                                                htmlFor="consent"
                                                className="cursor-pointer select-none text-[10px] uppercase tracking-wider text-white/30"
                                            >
                                                Confirmed: AML vetting per protocol.
                                            </label>
                                        </div>
                                        {form.errors.consent && (
                                            <p className="-mt-2 text-xs text-red-400">{form.errors.consent}</p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={form.processing}
                                            className="w-fit rounded-sm bg-white px-12 py-5 text-xs font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {form.processing ? 'Sending...' : 'Schedule a Consultation'}
                                        </button>
                                    </form>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="rounded-lg border border-gold/20 bg-gold/5 py-16 text-center"
                                    >
                                        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-gold" />
                                        <h4 className="mb-2 text-xl text-white">Request Received</h4>
                                        <p className="text-sm text-white/50">
                                            An advisor will reach out to you shortly.
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            <div className="space-y-8">
                                <div className="rounded-xl border border-elegant-border bg-elegant-card p-10">
                                    <h4 className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-white/30">
                                        We&rsquo;d Love to Hear From You
                                    </h4>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between gap-4 text-xs">
                                            <span className="text-white/40">EMAIL</span>
                                            <span className="font-medium text-white/80">trades@northshore.com</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 text-xs">
                                            <span className="text-white/40">HOURS</span>
                                            <span className="text-right font-medium text-white/80">
                                                Mon &ndash; Fri, 9:00 AM &ndash; 5:00 PM
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 text-xs">
                                            <span className="text-white/40">SERVICE STATUS</span>
                                            <span className="font-medium tracking-widest text-gold">&bull; ONLINE</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 text-xs">
                                            <span className="text-white/40">SLA WINDOW</span>
                                            <span className="font-medium text-white/80">SAME-DAY SETTLEMENT</span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    id="affiliates"
                                    className="rounded-xl border border-elegant-border bg-white/[0.01] p-10"
                                >
                                    <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
                                        Become an Affiliate
                                    </h4>
                                    <p className="text-sm leading-relaxed text-white/50">
                                        Introduce clients to a broker that puts people first. Get in touch to learn
                                        about our affiliate and referral programme.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing CTA */}
                <section id="cta" className="border-t border-elegant-border">
                    <div className="mx-auto max-w-7xl px-6 py-28 text-center md:px-12">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
                            Get Started
                        </p>
                        <h3 className="mx-auto mb-8 max-w-3xl font-serif text-4xl italic leading-[1.15] text-white md:text-5xl">
                            Ready to Grow Your Capital <br /> With Northshore?
                        </h3>
                        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-white/40">
                            At Northshore Unlimited, we believe every financial strategy needs a Bitcoin plan. Every
                            Bitcoin strategy needs a financial plan. Get in touch today to learn about this dominant
                            digital monetary network.
                        </p>
                        <div className="flex flex-wrap justify-center gap-5">
                            <a
                                href="#contact"
                                className="rounded-sm bg-white px-10 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-neutral-200"
                            >
                                Start Investing Today
                            </a>
                            <a
                                href="#contact"
                                className="rounded-sm border border-elegant-border px-10 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/5"
                            >
                                Talk to an Advisor
                            </a>
                        </div>
                        <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-white/25">
                            Get up to $2,000 bonus on sign up &mdash; no deposit required.
                        </p>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </SiteChrome>
    );
}
