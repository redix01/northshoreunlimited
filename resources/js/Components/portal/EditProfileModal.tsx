import { useForm } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ProfileUser } from '../../types';
import Avatar from './Avatar';
import Modal from './Modal';

interface Props {
    open: boolean;
    onClose: () => void;
    user: ProfileUser;
    presets: Record<string, string>;
}

const SOURCES_OF_FUNDS = [
    'Employment / Salary',
    'Business Income',
    'Investments',
    'Inheritance',
    'Sale of Property',
    'Savings',
    'Other',
];

const EMPLOYMENT_STATUSES = [
    'Employed',
    'Self-Employed',
    'Retired',
    'Student',
    'Unemployed',
    'Other',
];

function Field({
    id,
    label,
    hint,
    children,
    error,
}: {
    id: string;
    label: string;
    hint?: string;
    children: React.ReactNode;
    error?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm text-[var(--portal-text-soft)]">
                {label}
                {hint && <span className="ml-1 text-[var(--portal-muted)]">{hint}</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-[var(--portal-neg)]">{error}</p>}
        </div>
    );
}

const INPUT =
    'w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3.5 py-2.5 text-sm text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]';

/**
 * Values entered before this list existed (or set by an admin) must survive a
 * round-trip — without this the select would blank them out on save.
 */
function withCurrent(options: string[], current: string | null): string[] {
    return current && !options.includes(current) ? [current, ...options] : options;
}

export default function EditProfileModal({ open, onClose, user, presets }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const form = useForm<{
        name: string;
        phone: string;
        address_line1: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
        date_of_birth: string;
        source_of_funds: string;
        employment_status: string;
        occupation: string;
        tax_id: string;
        pep_status: boolean;
        avatar_preset: string;
        avatar: File | null;
    }>({
        name: user.name,
        phone: user.phone ?? '',
        address_line1: user.address_line1 ?? '',
        city: user.city ?? '',
        state: user.state ?? '',
        postal_code: user.postal_code ?? '',
        country: user.country ?? '',
        date_of_birth: user.date_of_birth ?? '',
        source_of_funds: user.source_of_funds ?? '',
        employment_status: user.employment_status ?? '',
        occupation: user.occupation ?? '',
        tax_id: '',
        pep_status: user.pep_status,
        avatar_preset: user.avatar_preset ?? '',
        avatar: null,
    });

    // Re-seed from the server record every time the dialog is opened.
    useEffect(() => {
        if (!open) return;
        form.clearErrors();
        form.setDefaults();
        form.reset();
        setPreview(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function pickAvatar(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        form.setData('avatar', file);
        setPreview(file ? URL.createObjectURL(file) : null);
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post('/user/profile', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setPreview(null);
                onClose();
            },
        });
    }

    return (
        <Modal open={open} title="Edit Profile" onClose={onClose} width="max-w-lg">
            <form
                onSubmit={submit}
                className="space-y-5 border-t border-[var(--portal-border)] p-6"
                encType="multipart/form-data"
            >
                {/* Avatar */}
                <div>
                    <p className="mb-2 text-sm font-medium text-[var(--portal-text)]">Profile Picture</p>
                    <div className="flex items-center gap-4">
                        <Avatar
                            url={preview ?? user.avatar_url}
                            preset={form.data.avatar_preset}
                            initials={user.initials}
                            presets={presets}
                            size={56}
                        />
                        <div className="min-w-0">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-1.5 text-sm font-medium text-[var(--portal-accent)] hover:underline"
                            >
                                <Upload size={14} />
                                Change avatar
                            </button>
                            <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                                Choose a preset or upload your own
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(presets).map(([key, colour]) => (
                            <button
                                key={key}
                                type="button"
                                aria-label={`${key} avatar`}
                                aria-pressed={form.data.avatar_preset === key && !form.data.avatar}
                                onClick={() => {
                                    form.setData('avatar_preset', key);
                                    form.setData('avatar', null);
                                    setPreview(null);
                                }}
                                style={{ background: colour }}
                                className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-[var(--portal-surface)] transition-shadow ${
                                    form.data.avatar_preset === key && !form.data.avatar
                                        ? 'ring-2 ring-[var(--portal-accent)]'
                                        : ''
                                }`}
                            />
                        ))}
                    </div>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={pickAvatar}
                        className="hidden"
                    />
                    {form.errors.avatar && (
                        <p className="mt-1 text-xs text-[var(--portal-neg)]">{form.errors.avatar}</p>
                    )}
                </div>

                <Field id="profile-name" label="Display Name" error={form.errors.name}>
                    <input
                        id="profile-name"
                        type="text"
                        value={form.data.name}
                        onChange={e => form.setData('name', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field id="profile-phone" label="Phone Number" error={form.errors.phone}>
                    <input
                        id="profile-phone"
                        type="tel"
                        value={form.data.phone}
                        onChange={e => form.setData('phone', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field id="profile-dob" label="Date of Birth" error={form.errors.date_of_birth}>
                    <input
                        id="profile-dob"
                        type="date"
                        value={form.data.date_of_birth}
                        onChange={e => form.setData('date_of_birth', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <div>
                    <label htmlFor="profile-street" className="mb-1.5 block text-sm text-[var(--portal-text-soft)]">
                        Address
                    </label>
                    <div className="space-y-2">
                        <input
                            id="profile-street"
                            type="text"
                            placeholder="Street address"
                            value={form.data.address_line1}
                            onChange={e => form.setData('address_line1', e.target.value)}
                            className={INPUT}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                aria-label="City"
                                placeholder="City"
                                value={form.data.city}
                                onChange={e => form.setData('city', e.target.value)}
                                className={INPUT}
                            />
                            <input
                                type="text"
                                aria-label="State or region"
                                placeholder="State"
                                value={form.data.state}
                                onChange={e => form.setData('state', e.target.value)}
                                className={INPUT}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                aria-label="Postal code"
                                placeholder="ZIP"
                                value={form.data.postal_code}
                                onChange={e => form.setData('postal_code', e.target.value)}
                                className={INPUT}
                            />
                            <input
                                type="text"
                                aria-label="Country"
                                placeholder="Country"
                                value={form.data.country}
                                onChange={e => form.setData('country', e.target.value)}
                                className={INPUT}
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-[var(--portal-border)] pt-4">
                    <p className="mb-3 text-sm font-medium text-[var(--portal-text)]">Compliance Information</p>

                    <div className="space-y-4">
                        <Field id="profile-funds" label="Source of Funds" error={form.errors.source_of_funds}>
                            <select
                                id="profile-funds"
                                value={form.data.source_of_funds}
                                onChange={e => form.setData('source_of_funds', e.target.value)}
                                className={INPUT}
                            >
                                <option value="">Select…</option>
                                {withCurrent(SOURCES_OF_FUNDS, user.source_of_funds).map(option => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field id="profile-employment" label="Employment Status" error={form.errors.employment_status}>
                            <select
                                id="profile-employment"
                                value={form.data.employment_status}
                                onChange={e => form.setData('employment_status', e.target.value)}
                                className={INPUT}
                            >
                                <option value="">Select…</option>
                                {withCurrent(EMPLOYMENT_STATUSES, user.employment_status).map(option => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field id="profile-occupation" label="Occupation" error={form.errors.occupation}>
                            <input
                                id="profile-occupation"
                                type="text"
                                value={form.data.occupation}
                                onChange={e => form.setData('occupation', e.target.value)}
                                className={INPUT}
                            />
                        </Field>

                        <Field
                            id="profile-tax"
                            label="Tax ID / SSN"
                            hint="(last 4 digits)"
                            error={form.errors.tax_id}
                        >
                            <input
                                id="profile-tax"
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                autoComplete="off"
                                placeholder={user.tax_id_last4 ? `•••• ${user.tax_id_last4}` : '0000'}
                                value={form.data.tax_id}
                                onChange={e => form.setData('tax_id', e.target.value.replace(/\D/g, ''))}
                                className={INPUT}
                            />
                            <p className="mt-1 text-[11px] text-[var(--portal-muted)]">
                                Only the last four digits are collected. Leave blank to keep the
                                digits already on file.
                            </p>
                        </Field>

                        <label className="flex items-center gap-2 text-sm text-[var(--portal-text-soft)]">
                            <input
                                type="checkbox"
                                checked={form.data.pep_status}
                                onChange={e => form.setData('pep_status', e.target.checked)}
                                className="h-4 w-4 accent-[var(--portal-accent)]"
                            />
                            I am a Politically Exposed Person (PEP)
                        </label>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[var(--portal-border)] pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2.5 text-sm text-[var(--portal-text-soft)] transition-colors hover:bg-[var(--portal-surface-2)]"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-lg bg-[var(--portal-accent)] px-5 py-2.5 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)] disabled:opacity-60"
                    >
                        {form.processing ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
