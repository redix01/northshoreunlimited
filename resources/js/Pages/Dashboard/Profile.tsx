import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    Bell,
    CalendarDays,
    Check,
    Copy,
    Crown,
    KeyRound,
    LogOut,
    Moon,
    Pencil,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import PortalLayout from '../../Components/PortalLayout';
import Avatar from '../../Components/portal/Avatar';
import ChangePasswordModal from '../../Components/portal/ChangePasswordModal';
import DepositModal from '../../Components/portal/DepositModal';
import DocumentsCard from '../../Components/portal/DocumentsCard';
import EditProfileModal from '../../Components/portal/EditProfileModal';
import Toggle from '../../Components/portal/Toggle';
import TransactionHistory from '../../Components/portal/TransactionHistory';
import VerificationCard from '../../Components/portal/VerificationCard';
import WalletBalanceCard from '../../Components/portal/WalletBalanceCard';
import WithdrawModal from '../../Components/portal/WithdrawModal';
import { shortDate } from '../../Components/portal/format';
import { useTheme } from '../../Components/portal/useTheme';
import type {
    AccountTransaction,
    PageProps,
    ProfileUser,
    UserDocumentItem,
    Verification,
    Wallet,
    WalletSummary,
} from '../../types';

interface Props extends PageProps {
    profileUser: ProfileUser;
    verification: Verification;
    documents: UserDocumentItem[];
    wallet: WalletSummary;
    transactions: AccountTransaction[];
    documentTypes: Record<string, string>;
    avatarPresets: Record<string, string>;
    wallets?: Wallet[];
}

function Detail({ label, value, verified }: { label: string; value: string | null; verified?: boolean }) {
    return (
        <div>
            <p className="text-xs text-[var(--portal-muted)]">{label}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-[var(--portal-text)]">
                {value || <span className="font-normal italic text-[var(--portal-muted)]">Not provided</span>}
                {verified && value && <BadgeCheck size={14} className="text-[var(--portal-pos)]" />}
            </p>
        </div>
    );
}

function Badge({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'accent' | 'pos' }) {
    const colour = {
        muted:  'var(--portal-muted)',
        accent: 'var(--portal-accent)',
        pos:    'var(--portal-pos)',
    }[tone];

    return (
        <span
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
            style={{ color: colour, background: `color-mix(in srgb, ${colour} 12%, transparent)` }}
        >
            {children}
        </span>
    );
}

export default function ProfilePage() {
    const {
        profileUser: user,
        verification,
        documents,
        wallet,
        transactions,
        documentTypes,
        avatarPresets,
        wallets = [],
    } = usePage<Props>().props;

    const { theme, setTheme } = useTheme();
    const [editOpen, setEditOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    function copyMemberId() {
        if (!user.member_id) return;
        navigator.clipboard?.writeText(user.member_id);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    }

    function setNotifications(enabled: boolean) {
        router.put(
            '/user/profile/settings',
            { notifications_enabled: enabled },
            { preserveScroll: true },
        );
    }

    return (
        <PortalLayout active="Support" onTalkToAdvisor={() => setDepositOpen(true)}>
            <Head title="Account" />

            <div className="space-y-5">
                {/* Header */}
                <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6">
                    {/* The identity block keeps a floor width so the Edit button
                        wraps onto its own line rather than crowding the name. */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-[260px] flex-1 items-start gap-4">
                            <Avatar
                                url={user.avatar_url}
                                preset={user.avatar_preset}
                                initials={user.initials}
                                presets={avatarPresets}
                                size={88}
                            />

                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl font-bold break-words text-[var(--portal-text)]">
                                    {user.name}
                                </h1>
                                <p className="mt-0.5 truncate text-sm text-[var(--portal-muted)]">
                                    {user.email}
                                </p>

                                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                    <Badge tone="pos">Member</Badge>
                                    {user.is_vip && (
                                        <Badge tone="accent">
                                            <Crown size={11} />
                                            VIP
                                        </Badge>
                                    )}
                                    {user.is_verified && (
                                        <Badge tone="pos">
                                            <ShieldCheck size={11} />
                                            Verified
                                        </Badge>
                                    )}
                                    {user.created_at && (
                                        <Badge>
                                            <CalendarDays size={11} />
                                            Member since{' '}
                                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </Badge>
                                    )}
                                </div>

                                {user.member_id && (
                                    <button
                                        type="button"
                                        onClick={copyMemberId}
                                        className="mt-3 flex items-center gap-2 whitespace-nowrap rounded-lg border border-[var(--portal-border)] px-2.5 py-1 font-mono text-xs text-[var(--portal-text-soft)] transition-colors hover:border-[var(--portal-accent)]"
                                    >
                                        {user.member_id}
                                        {copied ? (
                                            <Check size={12} className="text-[var(--portal-pos)]" />
                                        ) : (
                                            <Copy size={12} className="text-[var(--portal-muted)]" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setEditOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--portal-border-strong)] px-4 py-2 text-sm font-medium text-[var(--portal-text-soft)] transition-colors hover:bg-[var(--portal-surface-2)]"
                        >
                            <Pencil size={14} />
                            Edit Profile
                        </button>
                    </div>
                </section>

                {/* Details + settings */}
                <div className="grid gap-5 lg:grid-cols-2">
                    <section className="min-w-0 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold text-[var(--portal-text)]">Personal Details</h2>
                            <button
                                type="button"
                                onClick={() => setEditOpen(true)}
                                className="flex items-center gap-1.5 rounded-lg border border-[var(--portal-border)] px-2.5 py-1 text-xs text-[var(--portal-text-soft)] transition-colors hover:border-[var(--portal-accent)]"
                            >
                                <Pencil size={12} />
                                Edit
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <Detail label="Full Name" value={user.name} />
                            <Detail label="Email" value={user.email} verified={user.email_verified} />
                            <Detail label="Phone" value={user.phone} />
                            <Detail
                                label="Date of Birth"
                                value={
                                    user.date_of_birth
                                        ? new Date(`${user.date_of_birth}T00:00:00`).toLocaleDateString('en-US', {
                                              month: 'long',
                                              day: 'numeric',
                                              year: 'numeric',
                                          })
                                        : null
                                }
                            />
                            <div className="sm:col-span-2">
                                <Detail label="Address" value={user.address} />
                            </div>
                            <Detail label="Employment Status" value={user.employment_status} />
                            <Detail label="Occupation" value={user.occupation} />
                            <Detail label="Source of Funds" value={user.source_of_funds} />
                            <Detail label="PEP Status" value={user.pep_status ? 'Yes' : 'No'} />
                            <Detail
                                label="Tax ID"
                                value={user.tax_id_last4 ? `•••• ${user.tax_id_last4}` : null}
                            />
                        </div>
                    </section>

                    <section className="min-w-0 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5">
                        <h2 className="mb-4 text-base font-semibold text-[var(--portal-text)]">Settings</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-2 text-sm text-[var(--portal-text-soft)]">
                                    <Moon size={15} className="text-[var(--portal-muted)]" />
                                    Dark Mode
                                </span>
                                <Toggle
                                    label="Dark mode"
                                    checked={theme === 'dark'}
                                    onChange={next => setTheme(next ? 'dark' : 'light')}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-2 text-sm text-[var(--portal-text-soft)]">
                                    <Bell size={15} className="text-[var(--portal-muted)]" />
                                    Notifications
                                </span>
                                <Toggle
                                    label="Notifications"
                                    checked={user.notifications_enabled}
                                    onChange={setNotifications}
                                />
                            </div>

                            <div className="border-t border-[var(--portal-border)] pt-4">
                                <p className="mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--portal-muted)]">
                                    <ShieldCheck size={12} />
                                    Security
                                </p>

                                <div className="flex items-center justify-between gap-4">
                                    <span>
                                        <span className="block text-sm text-[var(--portal-text-soft)]">
                                            Two-Factor Authentication
                                        </span>
                                        <span className="block text-xs text-[var(--portal-muted)]">
                                            Required for all accounts
                                        </span>
                                    </span>
                                    <span
                                        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                                        style={{
                                            color: 'var(--portal-pos)',
                                            background: 'var(--portal-pos-soft)',
                                        }}
                                    >
                                        <Check size={11} />
                                        Always on
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-2 text-sm text-[var(--portal-text-soft)]">
                                        <KeyRound size={15} className="text-[var(--portal-muted)]" />
                                        Change Password
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPasswordOpen(true)}
                                        className="shrink-0 text-sm font-medium text-[var(--portal-accent)] hover:underline"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <VerificationCard verification={verification} />

                <DocumentsCard documents={documents} types={documentTypes} />

                <WalletBalanceCard
                    wallet={wallet}
                    onDeposit={() => setDepositOpen(true)}
                    onWithdraw={() => setWithdrawOpen(true)}
                />

                <TransactionHistory transactions={transactions} />

                {/* Account footer */}
                <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5">
                    <h2 className="mb-3 text-base font-semibold text-[var(--portal-text)]">Account</h2>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--portal-muted)]">
                        {user.created_at && (
                            <span className="flex items-center gap-1.5">
                                <CalendarDays size={12} />
                                Account created {shortDate(user.created_at)}
                            </span>
                        )}
                        {user.updated_at && (
                            <span className="flex items-center gap-1.5">
                                <CalendarDays size={12} />
                                Last updated {shortDate(user.updated_at)}
                            </span>
                        )}
                    </div>

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="mt-4 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                        style={{
                            color: 'var(--portal-neg)',
                            borderColor: 'var(--portal-neg)',
                            background: 'var(--portal-neg-soft)',
                        }}
                    >
                        <LogOut size={15} />
                        Log Out
                    </Link>
                </section>
            </div>

            <EditProfileModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                user={user}
                presets={avatarPresets}
            />

            <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />

            <DepositModal
                open={depositOpen}
                onClose={() => setDepositOpen(false)}
                wallets={wallets}
                basePrice={wallet.base_price}
            />

            <WithdrawModal
                open={withdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                wallets={wallets}
                balance={wallet.balance}
                basePrice={wallet.base_price}
                baseSymbol={wallet.base_symbol}
            />
        </PortalLayout>
    );
}
