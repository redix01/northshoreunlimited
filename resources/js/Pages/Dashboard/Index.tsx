import { Link, usePage } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Clock, Plus, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout, { StatusBadge, formatCurrency, formatDate } from '../../Components/DashboardLayout';
import type { Deposit, PageProps, Withdrawal } from '../../types';

interface Snapshot {
    date: string;
    balance: number;
}

interface Stats {
    total_deposited: number;
    total_withdrawn: number;
    pending_deposits: number;
    pending_withdrawals: number;
}

interface Props extends PageProps {
    dashUser: {
        name: string;
        balance: number;
        is_verified: boolean;
        member_id: string | null;
        created_at: string;
    };
    snapshots: Snapshot[];
    recentDeposits: Deposit[];
    recentWithdrawals: Withdrawal[];
    stats: Stats;
}

function PortfolioChart({ data }: { data: Snapshot[] }) {
    if (data.length < 2) {
        return (
            <div className="flex items-center justify-center h-40 text-[var(--color-dash-muted)] text-sm">
                <TrendingUp size={16} className="mr-2" />
                Chart will appear after first approved deposit
            </div>
        );
    }

    const w = 600, h = 180;
    const pad = { top: 16, right: 16, bottom: 32, left: 64 };

    const values = data.map(d => d.balance);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;

    const xs = (i: number) => pad.left + (i / (data.length - 1)) * (w - pad.left - pad.right);
    const ys = (v: number) => pad.top + (1 - (v - minV) / range) * (h - pad.top - pad.bottom);

    const linePts = data.map((d, i) => `${xs(i)},${ys(d.balance)}`).join(' ');
    const areaPts = `${xs(0)},${h - pad.bottom} ${linePts} ${xs(data.length - 1)},${h - pad.bottom}`;

    const yTicks = [0, 0.5, 1].map(p => ({
        v: minV + p * range,
        y: ys(minV + p * range),
    }));

    const xLabels = [0, Math.floor((data.length - 1) / 2), data.length - 1];

    const change = data[data.length - 1].balance - data[0].balance;
    const changePct = ((change / (data[0].balance || 1)) * 100).toFixed(2);
    const positive = change >= 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[var(--color-dash-muted)]">Portfolio Performance</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${positive ? 'bg-emerald-500/15 text-emerald-700' : 'bg-red-500/15 text-red-600'}`}>
                    {positive ? '+' : ''}{changePct}%
                </span>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 160 }}>
                <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c9a227" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Grid */}
                {yTicks.map(t => (
                    <line key={t.v} x1={pad.left} y1={t.y} x2={w - pad.right} y2={t.y}
                        stroke="rgba(20,17,11,0.10)" strokeDasharray="3 5" />
                ))}
                {/* Area */}
                <polygon points={areaPts} fill="url(#chartGrad)" />
                {/* Line */}
                <polyline points={linePts} fill="none" stroke="#8a6712" strokeWidth="1.8"
                    strokeLinejoin="round" strokeLinecap="round" />
                {/* Last point dot */}
                <circle cx={xs(data.length - 1)} cy={ys(data[data.length - 1].balance)}
                    r="3.5" fill="#8a6712" />
                {/* Y labels */}
                {yTicks.map(t => (
                    <text key={t.v} x={pad.left - 6} y={t.y + 4} textAnchor="end"
                        fontSize="10" fill="#6f6757">
                        {t.v >= 1000 ? `$${(t.v / 1000).toFixed(0)}k` : `$${t.v.toFixed(0)}`}
                    </text>
                ))}
                {/* X labels */}
                {xLabels.map(i => (
                    <text key={i} x={xs(i)} y={h - pad.bottom + 14} textAnchor="middle"
                        fontSize="10" fill="#6f6757">
                        {data[i].date}
                    </text>
                ))}
            </svg>
        </div>
    );
}

function BitcoinTradingViewChart() {
    const widgetConfig = encodeURIComponent(JSON.stringify({
        autosize: true,
        symbol: 'BITSTAMP:BTCUSD',
        interval: '60',
        timezone: 'Etc/UTC',
        theme: 'light',
        style: '1',
        locale: 'en',
        hide_top_toolbar: true,
        hide_legend: false,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        support_host: 'https://www.tradingview.com',
    }));

    return (
        <div className="h-full min-h-[220px] overflow-hidden rounded-2xl border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)]">
            <iframe
                title="Bitcoin price chart"
                src={`https://s.tradingview.com/widgetembed/?frameElementId=btc-chart&symbol=BITSTAMP%3ABTCUSD&interval=60&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=ffffff&studies=[]&theme=light&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&widgetbar=%7B%22details%22%3Afalse%2C%22watchlist%22%3Afalse%2C%22news%22%3Afalse%2C%22datawindow%22%3Afalse%2C%22watchlist_settings%22%3A%7B%22default_symbols%22%3A[]%7D%7D&overrides=%7B%7D&studies_overrides=%7B%7D&settings=${widgetConfig}`}
                className="h-full min-h-[220px] w-full border-0"
                loading="lazy"
            />
        </div>
    );
}

function formatSignedCurrency(amount: number) {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const sign = safeAmount >= 0 ? '+' : '-';
    return `${sign}${formatCurrency(Math.abs(safeAmount))}`;
}

function safeNumber(value: number | string | null | undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export default function DashboardIndex() {
    const { dashUser, snapshots, recentDeposits, recentWithdrawals, stats } =
        usePage<Props>().props;
    const baseBalance = safeNumber(dashUser.balance);
    const [liveBalance, setLiveBalance] = useState(baseBalance);
    const [lastMove, setLastMove] = useState(0);

    useEffect(() => {
        setLiveBalance(baseBalance);
    }, [baseBalance]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setLiveBalance(current => {
                const isUpMove = Math.random() < 0.72;
                const movementRate = isUpMove
                    ? 0.0006 + Math.random() * 0.0028
                    : -(0.0004 + Math.random() * 0.0015);
                const movement = Math.max(current, 1) * movementRate;
                setLastMove(movement);

                return Math.max(current + movement, 0);
            });
        }, 2600);

        return () => window.clearInterval(interval);
    }, []);

    const liveChange = safeNumber(liveBalance) - baseBalance;
    const liveChangePct = baseBalance > 0 ? (liveChange / baseBalance) * 100 : 0;
    const liveTrendPositive = liveChange >= 0;
    const liveMetrics = useMemo(() => {
        const dayChange = liveChange;
        const weekChange = liveBalance * 0.018 + liveChange * 0.35;
        const allTimeChange = liveBalance * 0.64 + Math.max(liveChange, 0);

        return [
            { label: '24h', value: dayChange, pct: liveChangePct },
            { label: 'Weekly', value: weekChange, pct: 1.8 + liveChangePct * 0.35 },
            { label: 'All-time', value: allTimeChange, pct: 64 + Math.max(liveChangePct, 0) },
        ];
    }, [liveBalance, liveChange, liveChangePct]);

    const allActivity = [
        ...recentDeposits.map(d => ({ ...d, type: 'deposit' as const })),
        ...recentWithdrawals.map(w => ({ ...w, type: 'withdrawal' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

    return (
        <DashboardLayout
            title="Overview"
            breadcrumb={[{ label: 'Dashboard', href: '/user/dashboard' }, { label: 'Overview' }]}
        >
            {/* Welcome + Balance hero */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Balance card */}
                <div className="lg:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-[#f6eecd] border border-gold/30 p-6">
                    <div className="absolute inset-0 opacity-60">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/30 rounded-full blur-2xl" />
                    </div>
                    <div className="relative">
                        <p className="text-xs text-[var(--color-dash-muted)] uppercase tracking-wider mb-1">Total Portfolio Value</p>
                        <p className="text-3xl font-bold text-[var(--color-dash-text)] mb-1 tabular-nums">
                            {formatCurrency(liveBalance)}
                        </p>
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className={liveTrendPositive ? 'text-emerald-700' : 'text-red-600'}>
                                {formatSignedCurrency(liveChange)} ({liveTrendPositive ? '+' : ''}{liveChangePct.toFixed(2)}%)
                            </span>
                            <span className="text-[var(--color-dash-muted)]">live</span>
                            <span className={`h-1.5 w-1.5 rounded-full ${lastMove >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`} />
                        </div>
                        <div className="mb-3 space-y-1.5 rounded-lg border border-gold/25 bg-white/70 px-3 py-2">
                            {liveMetrics.map(metric => (
                                <div key={metric.label} className="flex items-center justify-between gap-3 text-[11px]">
                                    <span className="text-[var(--color-dash-muted)]">{metric.label}</span>
                                    <span className={metric.value >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                                        {formatSignedCurrency(metric.value)} ({metric.value >= 0 ? '+' : ''}{metric.pct.toFixed(2)}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-[var(--color-dash-muted)]">
                            {dashUser.is_verified ? (
                                <span className="text-emerald-700">● Verified Account</span>
                            ) : (
                                <span className="text-amber-700">● Pending Verification</span>
                            )}
                        </p>
                        {dashUser.member_id && (
                            <p className="mt-3 text-[10px] font-mono text-[var(--color-dash-muted)] bg-white/70 px-2 py-1 rounded w-fit">
                                {dashUser.member_id}
                            </p>
                        )}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <Link
                                href="/user/deposits"
                                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gold text-black text-xs font-semibold hover:bg-gold/90 transition-all"
                            >
                                <ArrowDownCircle size={14} />
                                Deposit
                            </Link>
                            <Link
                                href="/user/withdrawals"
                                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white text-[var(--color-dash-text)] text-xs font-medium hover:bg-white/70 border border-gold/30 transition-all"
                            >
                                <ArrowUpCircle size={14} />
                                Withdraw
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <BitcoinTradingViewChart />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        {
                            label: 'Total Deposited',
                            value: formatCurrency(stats.total_deposited),
                            icon: <ArrowDownCircle size={18} className="text-emerald-700" />,
                            sub: stats.pending_deposits > 0 ? `${stats.pending_deposits} pending` : 'All confirmed',
                            color: 'text-emerald-700',
                        },
                        {
                            label: 'Total Withdrawn',
                            value: formatCurrency(stats.total_withdrawn),
                            icon: <ArrowUpCircle size={18} className="text-blue-700" />,
                            sub: stats.pending_withdrawals > 0 ? `${stats.pending_withdrawals} pending` : 'All processed',
                            color: 'text-blue-700',
                        },
                        {
                            label: 'Pending Deposits',
                            value: stats.pending_deposits,
                            icon: <Clock size={18} className="text-amber-700" />,
                            sub: 'Awaiting review',
                            color: 'text-amber-700',
                        },
                        {
                            label: 'Pending Withdrawals',
                            value: stats.pending_withdrawals,
                            icon: <Clock size={18} className="text-purple-700" />,
                            sub: 'Awaiting processing',
                            color: 'text-purple-700',
                        },
                    ].map(stat => (
                        <div
                            key={stat.label}
                            className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)] p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-[var(--color-dash-muted)]">{stat.label}</p>
                                {stat.icon}
                            </div>
                            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-[10px] text-[var(--color-dash-muted)] mt-1">{stat.sub}</p>
                        </div>
                    ))}
            </div>

            {/* Portfolio Chart */}
            <div className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)] p-5 mb-6">
                <h2 className="text-sm font-semibold text-[var(--color-dash-text)] mb-4">Portfolio Chart</h2>
                <PortfolioChart data={snapshots} />
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-dash-border)]">
                    <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">Recent Activity</h2>
                    <Link href="/user/wallet" className="text-xs text-gold-ink hover:text-gold-ink/80 transition-colors">
                        View all
                    </Link>
                </div>

                {allActivity.length === 0 ? (
                    <div className="px-5 py-10 text-center text-[var(--color-dash-muted)] text-sm">
                        <Plus size={20} className="mx-auto mb-2 opacity-50" />
                        No transactions yet. Make your first deposit to get started.
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--color-dash-border)]">
                        {allActivity.map(item => (
                            <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 px-5 py-3.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    item.type === 'deposit'
                                        ? 'bg-emerald-500/15'
                                        : 'bg-blue-500/15'
                                }`}>
                                    {item.type === 'deposit'
                                        ? <ArrowDownCircle size={15} className="text-emerald-700" />
                                        : <ArrowUpCircle size={15} className="text-blue-700" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--color-dash-text)] font-medium capitalize">
                                        {item.type} · {item.currency}
                                    </p>
                                    <p className="text-xs text-[var(--color-dash-muted)]">{formatDate(item.created_at)}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-sm font-semibold ${item.type === 'deposit' ? 'text-emerald-700' : 'text-blue-700'}`}>
                                        {item.type === 'deposit' ? '+' : '-'}{formatCurrency(item.amount)}
                                    </p>
                                    <StatusBadge status={item.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
