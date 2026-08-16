import { Link, usePage } from '@inertiajs/react';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Bell,
    CalendarClock,
    ChevronDown,
    LayoutGrid,
    LineChart,
    LogOut,
    Menu,
    Moon,
    Settings,
    Sun,
    User,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PageProps } from '../types';
import { useTheme } from './portal/useTheme';

interface Props {
    children: React.ReactNode;
    /** Highlighted top-nav entry. */
    active?: string;
    /** Rendered in the dock and used by the "Talk to Advisor" button. */
    onTalkToAdvisor?: () => void;
    notifications?: number;
}

const TOP_NAV = [
    { label: 'Dashboard', href: '/user/dashboard' },
    { label: 'Markets', href: '/user/wallet' },
    { label: 'Learn', href: '/company' },
    { label: 'Support', href: '/user/profile' },
];

const DOCK = [
    { label: 'Overview', href: '/user/dashboard', icon: LayoutGrid },
    { label: 'Wallet', href: '/user/wallet', icon: LineChart },
    { label: 'Deposits', href: '/user/deposits', icon: ArrowDownCircle },
    { label: 'Withdrawals', href: '/user/withdrawals', icon: ArrowUpCircle },
    { label: 'About us', href: '/company', icon: Users },
    { label: 'Account', href: '/user/profile', icon: User },
];

function FlashToasts() {
    const { flash } = usePage<PageProps>().props;
    const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

    // A fresh flash message must resurface even if the last one was dismissed.
    useEffect(() => {
        setDismissed({});
    }, [flash.success, flash.error]);

    const toasts = [
        flash.success && !dismissed.success
            ? { key: 'success', text: flash.success, tone: 'pos' as const }
            : null,
        flash.error && !dismissed.error
            ? { key: 'error', text: flash.error, tone: 'neg' as const }
            : null,
    ].filter(Boolean) as { key: string; text: string; tone: 'pos' | 'neg' }[];

    if (!toasts.length) return null;

    return (
        <div className="fixed right-4 top-20 z-[80] flex w-full max-w-sm flex-col gap-2">
            {toasts.map(toast => (
                <div
                    key={toast.key}
                    role="status"
                    className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[var(--portal-shadow)]"
                    style={{
                        borderColor: `var(--portal-${toast.tone})`,
                        background: `var(--portal-${toast.tone}-soft)`,
                        color: `var(--portal-${toast.tone})`,
                    }}
                >
                    <span className="flex-1">{toast.text}</span>
                    <button
                        type="button"
                        onClick={() => setDismissed(d => ({ ...d, [toast.key]: true }))}
                        aria-label="Dismiss notification"
                        className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}

function AccountMenu({ name, email }: { name: string; email: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function onClickAway(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        }

        document.addEventListener('mousedown', onClickAway);
        return () => document.removeEventListener('mousedown', onClickAway);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[var(--portal-surface-2)]"
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--portal-accent-soft)] text-xs font-semibold text-[var(--portal-accent)]">
                    {name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[92px] truncate text-sm text-[var(--portal-text-soft)] sm:inline">
                    {name}
                </span>
                <ChevronDown size={14} className="text-[var(--portal-muted)]" />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[var(--portal-shadow)]">
                    <div className="border-b border-[var(--portal-border)] px-4 py-3">
                        <p className="truncate text-sm font-medium text-[var(--portal-text)]">{name}</p>
                        <p className="truncate text-xs text-[var(--portal-muted)]">{email}</p>
                    </div>
                    <Link
                        href="/user/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--portal-text-soft)] transition-colors hover:bg-[var(--portal-surface-2)]"
                    >
                        <Settings size={15} />
                        Account settings
                    </Link>
                    <Link
                        href="/user/wallet"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--portal-text-soft)] transition-colors hover:bg-[var(--portal-surface-2)]"
                    >
                        <Wallet size={15} />
                        Transactions
                    </Link>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-2.5 border-t border-[var(--portal-border)] px-4 py-2.5 text-left text-sm text-[var(--portal-neg)] transition-colors hover:bg-[var(--portal-neg-soft)]"
                    >
                        <LogOut size={15} />
                        Sign out
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function PortalLayout({
    children,
    active = 'Dashboard',
    onTalkToAdvisor,
    notifications = 0,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user!;
    const { theme, toggle } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);

    const path = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div data-portal className="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)]">
            <FlashToasts />

            <header className="sticky top-0 z-50 border-b border-[var(--portal-border)] bg-[var(--portal-surface)]/90 backdrop-blur">
                <div className="mx-auto flex h-[68px] max-w-[1160px] items-center gap-6 px-4 sm:px-6">
                    <Link
                        href="/user/dashboard"
                        className="flex shrink-0 items-center"
                        aria-label="Northshore Unlimited Capital — dashboard"
                    >
                        <img
                            src="/img/logo.png"
                            alt="Northshore Unlimited Capital"
                            width={800}
                            height={211}
                            className="brand-logo h-8 w-auto sm:h-9"
                        />
                    </Link>

                    <nav className="hidden flex-1 items-center justify-center gap-7 md:flex">
                        {TOP_NAV.map(item => {
                            const isActive = item.label === active;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`relative py-1 text-sm transition-colors ${
                                        isActive
                                            ? 'font-medium text-[var(--portal-accent)]'
                                            : 'text-[var(--portal-text-soft)] hover:text-[var(--portal-text)]'
                                    }`}
                                >
                                    {item.label}
                                    {isActive && (
                                        <span className="absolute -bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[var(--portal-accent)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="ml-auto flex items-center gap-2 md:ml-0">
                        <button
                            type="button"
                            aria-label={`Notifications${notifications ? `, ${notifications} unread` : ''}`}
                            className="hidden items-center gap-1.5 rounded-full border border-[var(--portal-border)] px-3 py-1.5 text-xs text-[var(--portal-muted)] transition-colors hover:text-[var(--portal-text)] sm:flex"
                        >
                            <Bell size={14} />
                            {notifications}
                        </button>

                        <button
                            type="button"
                            onClick={onTalkToAdvisor}
                            className="hidden items-center gap-2 rounded-lg bg-[var(--portal-accent)] px-3.5 py-2 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)] sm:flex"
                        >
                            <CalendarClock size={15} />
                            Talk to Advisor
                        </button>

                        <AccountMenu name={user.name} email={user.email} />

                        <button
                            type="button"
                            onClick={toggle}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                            className="rounded-lg border border-[var(--portal-border)] p-2 text-[var(--portal-muted)] transition-colors hover:text-[var(--portal-text)]"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setMenuOpen(o => !o)}
                            aria-label="Open menu"
                            className="rounded-lg border border-[var(--portal-border)] p-2 text-[var(--portal-muted)] md:hidden"
                        >
                            {menuOpen ? <X size={16} /> : <Menu size={16} />}
                        </button>
                    </div>
                </div>

                {menuOpen && (
                    <nav className="border-t border-[var(--portal-border)] px-4 py-3 md:hidden">
                        {TOP_NAV.map(item => (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                    item.label === active
                                        ? 'bg-[var(--portal-accent-soft)] font-medium text-[var(--portal-accent)]'
                                        : 'text-[var(--portal-text-soft)] hover:bg-[var(--portal-surface-2)]'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                onTalkToAdvisor?.();
                            }}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--portal-accent)] px-3.5 py-2.5 text-sm font-medium text-[var(--portal-accent-on)]"
                        >
                            <CalendarClock size={15} />
                            Talk to Advisor
                        </button>
                    </nav>
                )}
            </header>

            <main className="mx-auto max-w-[1160px] px-4 pb-32 pt-6 sm:px-6">{children}</main>

            {/* Floating dock */}
            <nav
                aria-label="Portal sections"
                className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)]/95 p-1.5 shadow-[var(--portal-shadow)] backdrop-blur"
            >
                {DOCK.map(item => {
                    const Icon = item.icon;
                    const isActive = path === item.href;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            title={item.label}
                            aria-label={item.label}
                            className={`relative rounded-xl p-2.5 transition-colors ${
                                isActive
                                    ? 'bg-[var(--portal-accent-soft)] text-[var(--portal-accent)]'
                                    : 'text-[var(--portal-muted)] hover:bg-[var(--portal-surface-2)] hover:text-[var(--portal-text)]'
                            }`}
                        >
                            <Icon size={18} />
                            {isActive && (
                                <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--portal-accent)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
