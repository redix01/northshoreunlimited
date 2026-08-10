import { useForm, usePage } from '@inertiajs/react';
import { Calendar, CheckCircle, Edit2, Eye, EyeOff, Lock, Mail, MapPin, Phone, Shield, User } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '../../Components/DashboardLayout';
import type { PageProps } from '../../types';

interface FullUser {
    id: number;
    name: string;
    email: string;
    role: string;
    balance: number;
    phone: string | null;
    address: string | null;
    date_of_birth: string | null;
    employment_status: string | null;
    occupation: string | null;
    source_of_funds: string | null;
    pep_status: boolean;
    tax_id: string | null;
    is_verified: boolean;
    member_id: string | null;
    created_at: string;
}

interface Props extends PageProps {
    profileUser: FullUser;
}

function InfoRow({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-dash-muted)] font-medium">{label}</span>
            <div className="flex items-center gap-1.5">
                {icon && <span className="text-[var(--color-dash-muted)]">{icon}</span>}
                <span className="text-sm text-[var(--color-dash-text)]">{value || <span className="italic text-[var(--color-dash-muted)]">Not provided</span>}</span>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { profileUser } = usePage<Props>().props;
    const [editMode, setEditMode] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const profileForm = useForm({
        name: profileUser.name,
        phone: profileUser.phone ?? '',
        address: profileUser.address ?? '',
        date_of_birth: profileUser.date_of_birth ?? '',
        employment_status: profileUser.employment_status ?? '',
        occupation: profileUser.occupation ?? '',
        source_of_funds: profileUser.source_of_funds ?? '',
    });

    const pwForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function submitProfile(e: React.FormEvent) {
        e.preventDefault();
        profileForm.put('/user/profile', {
            onSuccess: () => setEditMode(false),
        });
    }

    function submitPassword(e: React.FormEvent) {
        e.preventDefault();
        pwForm.put('/user/profile/password', {
            onSuccess: () => { pwForm.reset(); setShowPasswordForm(false); },
        });
    }

    return (
        <DashboardLayout
            title="Profile"
            breadcrumb={[
                { label: 'Dashboard', href: '/user/dashboard' },
                { label: 'Profile' },
            ]}
        >
            <div className="max-w-2xl mx-auto space-y-5">
                {/* Profile Header */}
                <div className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)] p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold/30 flex items-center justify-center text-gold-ink text-2xl font-bold shrink-0">
                            {profileUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg font-semibold text-[var(--color-dash-text)]">{profileUser.name}</h1>
                                <span className="px-2 py-0.5 rounded text-[10px] bg-gold/15 text-gold-ink border border-gold/25 font-medium uppercase tracking-wide">
                                    VIP
                                </span>
                                {profileUser.is_verified && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-700 border border-emerald-500/25 font-medium">
                                        <CheckCircle size={10} />
                                        Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-[var(--color-dash-muted)] mt-0.5">{profileUser.email}</p>
                            {profileUser.member_id && (
                                <p className="text-xs font-mono text-[var(--color-dash-muted)] mt-1 bg-[var(--color-dash-surface-2)] px-2 py-0.5 rounded w-fit">
                                    {profileUser.member_id}
                                </p>
                            )}
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-[10px] text-[var(--color-dash-muted)]">Member since</p>
                            <p className="text-xs text-[var(--color-dash-text)] font-medium">{profileUser.created_at}</p>
                        </div>
                    </div>

                    {/* Verification status */}
                    {profileUser.is_verified && (
                        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700">
                            <Shield size={14} className="shrink-0" />
                            <span>Your identity has been verified — deposits and withdrawals are enabled.</span>
                        </div>
                    )}
                </div>

                {/* Personal Details */}
                <div className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)]">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-dash-border)]">
                        <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">Personal Details</h2>
                        <button
                            onClick={() => setEditMode(v => !v)}
                            className="flex items-center gap-1.5 text-xs text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] transition-colors"
                        >
                            <Edit2 size={13} />
                            {editMode ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    {editMode ? (
                        <form onSubmit={submitProfile} className="p-5 space-y-4">
                            {[
                                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
                                { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555 000 0000' },
                                { key: 'address', label: 'Address', type: 'text', placeholder: '123 Main St, City, State ZIP' },
                                { key: 'date_of_birth', label: 'Date of Birth', type: 'date', placeholder: '' },
                                { key: 'employment_status', label: 'Employment Status', type: 'text', placeholder: 'Self-Employed, Employed, Retired…' },
                                { key: 'occupation', label: 'Occupation', type: 'text', placeholder: 'Your occupation' },
                                { key: 'source_of_funds', label: 'Source of Funds', type: 'text', placeholder: 'Employment Income, Investment…' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="block text-xs font-medium text-[var(--color-dash-text)] mb-1.5">{field.label}</label>
                                    <input
                                        type={field.type}
                                        value={(profileForm.data as Record<string, string>)[field.key]}
                                        onChange={e => profileForm.setData(field.key as keyof typeof profileForm.data, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-dash-bg)] border border-[var(--color-dash-border)] text-sm text-[var(--color-dash-text)] placeholder-[var(--color-dash-muted)] focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all"
                                    />
                                    {(profileForm.errors as Record<string, string>)[field.key] && (
                                        <p className="mt-1 text-xs text-red-600">{(profileForm.errors as Record<string, string>)[field.key]}</p>
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 py-2.5 rounded-lg bg-[var(--color-dash-surface-2)] text-sm text-[var(--color-dash-muted)] border border-[var(--color-dash-border)] hover:text-[var(--color-dash-text)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="flex-1 py-2.5 rounded-lg bg-gold text-black text-sm font-semibold hover:bg-gold/90 disabled:opacity-60 transition-all"
                                >
                                    {profileForm.processing ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <InfoRow label="Full Name" value={profileUser.name} icon={<User size={13} />} />
                            <InfoRow label="Email" value={profileUser.email} icon={<Mail size={13} />} />
                            <InfoRow label="Phone" value={profileUser.phone} icon={<Phone size={13} />} />
                            <InfoRow label="Date of Birth" value={profileUser.date_of_birth} icon={<Calendar size={13} />} />
                            <InfoRow
                                label="Address"
                                value={profileUser.address}
                                icon={<MapPin size={13} />}
                            />
                            <InfoRow label="Employment Status" value={profileUser.employment_status} />
                            <InfoRow label="Occupation" value={profileUser.occupation} />
                            <InfoRow label="Source of Funds" value={profileUser.source_of_funds} />
                            <InfoRow label="PEP Status" value={profileUser.pep_status ? 'Yes' : 'No'} />
                            <InfoRow label="Tax ID" value={profileUser.tax_id} />
                        </div>
                    )}
                </div>

                {/* Security */}
                <div className="rounded-2xl bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)]">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-dash-border)]">
                        <div className="flex items-center gap-2">
                            <Lock size={15} className="text-[var(--color-dash-muted)]" />
                            <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">Security</h2>
                        </div>
                        <button
                            onClick={() => setShowPasswordForm(v => !v)}
                            className="text-xs text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] transition-colors"
                        >
                            {showPasswordForm ? 'Cancel' : 'Change Password'}
                        </button>
                    </div>

                    {showPasswordForm ? (
                        <form onSubmit={submitPassword} className="p-5 space-y-4">
                            {[
                                { key: 'current_password', label: 'Current Password', show: showCurrentPw, toggle: () => setShowCurrentPw(v => !v) },
                                { key: 'password', label: 'New Password', show: showNewPw, toggle: () => setShowNewPw(v => !v) },
                                { key: 'password_confirmation', label: 'Confirm New Password', show: showNewPw, toggle: () => setShowNewPw(v => !v) },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="block text-xs font-medium text-[var(--color-dash-text)] mb-1.5">{field.label}</label>
                                    <div className="relative">
                                        <input
                                            type={field.show ? 'text' : 'password'}
                                            value={(pwForm.data as Record<string, string>)[field.key]}
                                            onChange={e => pwForm.setData(field.key as keyof typeof pwForm.data, e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pr-9 px-3 py-2.5 rounded-lg bg-[var(--color-dash-bg)] border border-[var(--color-dash-border)] text-sm text-[var(--color-dash-text)] placeholder-[var(--color-dash-muted)] focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={field.toggle}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]"
                                        >
                                            {field.show ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    {(pwForm.errors as Record<string, string>)[field.key] && (
                                        <p className="mt-1 text-xs text-red-600">{(pwForm.errors as Record<string, string>)[field.key]}</p>
                                    )}
                                </div>
                            ))}

                            <button
                                type="submit"
                                disabled={pwForm.processing}
                                className="w-full py-2.5 rounded-lg bg-gold text-black text-sm font-semibold hover:bg-gold/90 disabled:opacity-60 transition-all"
                            >
                                {pwForm.processing ? 'Updating…' : 'Update Password'}
                            </button>
                        </form>
                    ) : (
                        <div className="px-5 py-4 text-sm text-[var(--color-dash-muted)]">
                            Password last changed: secure and up to date.
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
