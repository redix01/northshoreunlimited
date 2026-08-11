import { useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from './Modal';

interface Props {
    open: boolean;
    onClose: () => void;
}

const INPUT =
    'w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3.5 py-2.5 pr-10 text-sm text-[var(--portal-text)] outline-none focus:border-[var(--portal-accent)]';

function PasswordField({
    id,
    label,
    value,
    onChange,
    error,
    autoComplete,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    autoComplete: string;
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm text-[var(--portal-text-soft)]">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    autoComplete={autoComplete}
                    onChange={e => onChange(e.target.value)}
                    className={INPUT}
                />
                <button
                    type="button"
                    onClick={() => setVisible(v => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--portal-muted)] transition-colors hover:text-[var(--portal-text)]"
                >
                    {visible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
            {error && <p className="mt-1 text-xs text-[var(--portal-neg)]">{error}</p>}
        </div>
    );
}

export default function ChangePasswordModal({ open, onClose }: Props) {
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (!open) return;
        form.reset();
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.put('/user/profile/password', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    }

    const tooShort = form.data.password.length > 0 && form.data.password.length < 8;
    const mismatch =
        form.data.password_confirmation.length > 0 &&
        form.data.password !== form.data.password_confirmation;

    return (
        <Modal
            open={open}
            title="Change Password"
            subtitle="You will stay signed in on this device"
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-4 border-t border-[var(--portal-border)] p-6">
                <PasswordField
                    id="current-password"
                    label="Current password"
                    autoComplete="current-password"
                    value={form.data.current_password}
                    onChange={v => form.setData('current_password', v)}
                    error={form.errors.current_password}
                />
                <PasswordField
                    id="new-password"
                    label="New password"
                    autoComplete="new-password"
                    value={form.data.password}
                    onChange={v => form.setData('password', v)}
                    error={form.errors.password ?? (tooShort ? 'Use at least 8 characters.' : undefined)}
                />
                <PasswordField
                    id="confirm-password"
                    label="Confirm new password"
                    autoComplete="new-password"
                    value={form.data.password_confirmation}
                    onChange={v => form.setData('password_confirmation', v)}
                    error={mismatch ? 'Passwords do not match.' : undefined}
                />

                <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2.5 text-sm text-[var(--portal-text-soft)] transition-colors hover:bg-[var(--portal-surface-2)]"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={
                            form.processing ||
                            tooShort ||
                            mismatch ||
                            !form.data.current_password ||
                            !form.data.password
                        }
                        className="rounded-lg bg-[var(--portal-accent)] px-5 py-2.5 text-sm font-medium text-[var(--portal-accent-on)] transition-colors hover:bg-[var(--portal-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {form.processing ? 'Saving…' : 'Update password'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
