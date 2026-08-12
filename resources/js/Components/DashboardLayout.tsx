import { Link, usePage } from '@inertiajs/react';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    BadgeCheck,
    ChevronRight,
    ExternalLink,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    Shield,
    TrendingUp,
    User,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '../types';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    exact?: boolean;
}

interface Props {
    children: React.ReactNode;
    title?: string;
    breadcrumb?: { label: string; href?: string }[];
}

const statusColors: Record<string, string> = {
    pending:    'bg-amber-500/15 text-amber-700 border border-amber-500/25',
    approved:   'bg-emerald-500/15 text-emerald-700 border border-emerald-500/25',
    rejected:   'bg-red-500/15 text-red-600 border border-red-500/25',
    processing: 'bg-blue-500/15 text-blue-700 border border-blue-500/25',
    completed:  'bg-emerald-500/15 text-emerald-700 border border-emerald-500/25',
    active:     'bg-emerald-500/15 text-emerald-700 border border-emerald-500/25',
    suspended:  'bg-red-500/15 text-red-600 border border-red-500/25',
};

export function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[status] ?? 'bg-gray-500/15 text-gray-600 border border-gray-500/25'}`}>
            {status}
        </span>
    );
}

export function formatCurrency(amount: number | string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return 'Never';

    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

/** Shared form controls, so the admin screens stay visually consistent. */
export function Input({
    label, value, onChange, error, type = 'text', hint, placeholder, step, min,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    hint?: string;
    placeholder?: string;
    step?: string;
    min?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--color-dash-muted)]">{label}</span>
            <input
                type={type}
                value={value}
                step={step}
                min={min}
                placeholder={placeholder}
                onChange={event => onChange(event.target.value)}
                className={`h-10 w-full rounded-lg border bg-[var(--color-dash-bg)] px-3 text-sm text-[var(--color-dash-text)] outline-none focus:border-gold/50 ${error ? 'border-red-500/60' : 'border-[var(--color-dash-border)]'}`}
            />
            {hint && !error && <span className="mt-1 block text-xs text-[var(--color-dash-muted)]">{hint}</span>}
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

export function Toggle({
    label, checked, onChange, hint,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    hint?: string;
}) {
    return (
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-bg)] px-3 py-2.5">
            <span className="min-w-0">
                <span className="block text-sm text-[var(--color-dash-text)]">{label}</span>
                {hint && <span className="mt-0.5 block text-xs text-[var(--color-dash-muted)]">{hint}</span>}
            </span>
            <span className="relative mt-0.5 inline-flex shrink-0">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={event => onChange(event.target.checked)}
                    className="peer sr-only"
                />
                <span className="h-5 w-9 rounded-full bg-[var(--color-dash-surface-2)] border border-[var(--color-dash-border)] transition peer-checked:bg-gold/80 peer-checked:border-gold" />
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[var(--color-dash-muted)] transition peer-checked:translate-x-4 peer-checked:bg-black" />
            </span>
        </label>
    );
}

export function Pagination({ links }: { links: { url: string | null; label: string; active: boolean }[] }) {
    return (
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-dash-border)] p-4">
            {links.map((link, index) => link.url ? (
                <Link
                    key={`${link.label}-${index}`}
                    href={link.url}
                    className={`rounded px-3 py-1 text-xs ${link.active ? 'bg-gold text-black' : 'bg-[var(--color-dash-surface-2)] text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]'}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ) : (
                <span key={`${link.label}-${index}`} className="rounded bg-[var(--color-dash-bg)] px-3 py-1 text-xs text-[var(--color-dash-muted)] opacity-50" dangerouslySetInnerHTML={{ __html: link.label }} />
            ))}
        </div>
    );
}

function FlashMessages() {
    const { flash } = usePage<PageProps>().props;
    const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

    return (
        <>
            {flash.success && !dismissed.success && (
                <div className="fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 backdrop-blur px-4 py-3 text-sm text-emerald-700 max-w-sm shadow-lg">
                    <span className="flex-1">{flash.success}</span>
                    <button onClick={() => setDismissed(d => ({ ...d, success: true }))} className="shrink-0 opacity-60 hover:opacity-100">
                        <X size={14} />
                    </button>
                </div>
            )}
            {flash.error && !dismissed.error && (
                <div className="fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur px-4 py-3 text-sm text-red-700 max-w-sm shadow-lg">
                    <span className="flex-1">{flash.error}</span>
                    <button onClick={() => setDismissed(d => ({ ...d, error: true }))} className="shrink-0 opacity-60 hover:opacity-100">
                        <X size={14} />
                    </button>
                </div>
            )}
        </>
    );
}

export default function DashboardLayout({ children, title, breadcrumb }: Props) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user!;
    const isAdmin = user.role === 'admin';
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isAdminSection = currentPath.startsWith('/admin');

    const userNav: NavItem[] = [
        { label: 'Dashboard',   href: '/user/dashboard',     icon: <LayoutDashboard size={18} />, exact: true },
        { label: 'Wallet',      href: '/user/wallet',        icon: <Wallet size={18} /> },
        { label: 'Profile',     href: '/user/profile',       icon: <User size={18} /> },
    ];

    const adminNav: NavItem[] = [
        { label: 'Dashboard',   href: '/admin/dashboard',    icon: <LayoutDashboard size={18} />, exact: true },
        { label: 'Users',       href: '/admin/users',        icon: <Users size={18} /> },
        { label: 'Deposits',    href: '/admin/deposits',     icon: <ArrowDownCircle size={18} /> },
        { label: 'Withdrawals', href: '/admin/withdrawals',  icon: <ArrowUpCircle size={18} /> },
        { label: 'Verifications', href: '/admin/verifications', icon: <BadgeCheck size={18} /> },
        { label: 'Earnings',    href: '/admin/earnings',     icon: <TrendingUp size={18} /> },
        { label: 'Wallets',     href: '/admin/wallets',      icon: <Wallet size={18} /> },
        { label: 'Settings',    href: '/admin/settings',     icon: <Settings size={18} /> },
    ];

    const nav = isAdminSection ? adminNav : userNav;

    const isActive = (item: NavItem) =>
        item.exact ? currentPath === item.href : currentPath.startsWith(item.href);

    const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
        <nav className={`flex flex-col h-full ${mobile ? '' : ''}`}>
            {/* Logo */}
            <div className="px-5 pt-6 pb-4 border-b border-[var(--color-dash-border)]">
                <Link href="/" className="block">
                    <img
                        src="/img/logo.png"
                        alt="Northshore Unlimited Capital"
                        width={800}
                        height={211}
                        className="h-8 w-auto"
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--color-dash-muted)] leading-none">
                        {isAdminSection ? 'Admin Panel' : 'Client Portal'}
                    </p>
                </Link>
            </div>

            {/* Nav items */}
            <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {isAdminSection && (
                    <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-[var(--color-dash-muted)] font-medium">Management</p>
                )}
                {nav.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive(item)
                                ? 'bg-gold/10 text-gold-ink border border-gold/20'
                                : 'text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] hover:bg-[var(--color-dash-surface-2)]'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                        {isActive(item) && <ChevronRight size={14} className="ml-auto" />}
                    </Link>
                ))}

                {isAdminSection && (
                    <div className="pt-5">
                        <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-[var(--color-dash-muted)] font-medium">Preview</p>
                        {/* A plain anchor rather than an Inertia Link: this opens
                            its own tab, so the admin panel stays where it is. */}
                        <a
                            href="/user/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] hover:bg-[var(--color-dash-surface-2)] transition-all"
                        >
                            <User size={18} />
                            User Dashboard
                            <ExternalLink size={13} className="ml-auto opacity-70" />
                        </a>
                    </div>
                )}
            </div>

            {/* User section */}
            <div className="px-3 pb-4 border-t border-[var(--color-dash-border)] pt-3">
                {isAdminSection ? (
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] hover:bg-[var(--color-dash-surface-2)] transition-all"
                    >
                        <Shield size={18} />
                        View Site
                    </Link>
                ) : (
                    <Link
                        href="/user/profile"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] hover:bg-[var(--color-dash-surface-2)] transition-all"
                    >
                        <Settings size={18} />
                        Settings
                    </Link>
                )}
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-dash-muted)] hover:text-red-600 hover:bg-red-500/10 transition-all mt-0.5"
                >
                    <LogOut size={18} />
                    Sign Out
                </Link>

                {/* User info */}
                <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--color-dash-surface-2)] border border-[var(--color-dash-border)]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold-ink font-semibold text-sm shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--color-dash-text)] truncate">{user.name}</p>
                            <p className="text-[10px] text-[var(--color-dash-muted)] truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );

    return (
        <div className="min-h-screen bg-[var(--color-dash-bg)] text-[var(--color-dash-text)]">
            <FlashMessages />

            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-56 lg:flex-col bg-[var(--color-dash-sidebar)] border-r border-[var(--color-dash-border)]">
                <Sidebar />
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-40 flex">
                    <div
                        className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="relative flex flex-col w-64 bg-[var(--color-dash-sidebar)] border-r border-[var(--color-dash-border)] z-50">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute top-4 right-4 text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]"
                        >
                            <X size={20} />
                        </button>
                        <Sidebar mobile />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="lg:pl-56 flex flex-col min-h-screen">
                {/* Top header */}
                <header className="sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 h-14 bg-[var(--color-dash-sidebar)]/80 backdrop-blur border-b border-[var(--color-dash-border)]">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] p-1"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
                        {breadcrumb?.map((crumb, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                {i > 0 && <ChevronRight size={14} className="text-[var(--color-dash-muted)] shrink-0" />}
                                {crumb.href ? (
                                    <Link href={crumb.href} className="text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] transition-colors truncate">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-[var(--color-dash-text)] font-medium truncate">{crumb.label}</span>
                                )}
                            </div>
                        )) ?? <span className="text-[var(--color-dash-text)] font-medium">{title}</span>}
                    </div>

                    {/* Header right */}
                    <div className="flex items-center gap-3 shrink-0">
                        {!isAdminSection && (
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-dash-surface-2)] border border-[var(--color-dash-border)] text-xs">
                                <span className="text-[var(--color-dash-muted)]">Balance</span>
                                <span className="text-gold-ink font-semibold">{formatCurrency(user.balance)}</span>
                            </div>
                        )}
                        {isAdminSection && (
                            <span className="px-2 py-0.5 rounded text-xs bg-gold/15 text-gold-ink border border-gold/25 font-medium">
                                Admin
                            </span>
                        )}
                        <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold-ink font-semibold text-xs">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6">
                    {children}
                </main>
            </div>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--color-dash-sidebar)] border-t border-[var(--color-dash-border)] flex">
                {nav.slice(0, 5).map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                            isActive(item) ? 'text-gold-ink' : 'text-[var(--color-dash-muted)]'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
