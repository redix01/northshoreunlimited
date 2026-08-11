import { useForm } from '@inertiajs/react';
import { AlertTriangle, Percent, Save, Users } from 'lucide-react';
import DashboardLayout, { Input, Toggle, formatDateTime } from '../../Components/DashboardLayout';
import type { SettingGroup, SettingValue } from '../../types';

interface Props {
    settings: Record<string, SettingValue>;
    groups: SettingGroup[];
    topup: {
        eligible_users: number;
        overridden_users: number;
        last_run_at: string | null;
    };
}

export default function AdminSettings({ settings, groups, topup }: Props) {
    const form = useForm<Record<string, SettingValue>>({ ...settings });

    function save(event: React.FormEvent) {
        event.preventDefault();
        form.put('/admin/settings', { preserveScroll: true });
    }

    const dailyPercent = Number(form.data.daily_topup_percent ?? 0);

    return (
        <DashboardLayout title="Settings" breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Settings' }]}>
            <form onSubmit={save} className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[var(--color-dash-text)]">System Settings</h1>
                        <p className="mt-1 text-sm text-[var(--color-dash-muted)]">
                            Platform-wide rules. Individual clients can override the top-up rate from their profile.
                        </p>
                    </div>
                    <button
                        disabled={form.processing}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-semibold text-black disabled:opacity-60"
                    >
                        <Save size={16} />
                        {form.processing ? 'Saving…' : 'Save settings'}
                    </button>
                </div>

                {form.data.maintenance_mode === true && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span>Maintenance mode is on. Clients cannot reach the portal until it is switched off — administrators are unaffected.</span>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                    <Summary
                        icon={<Percent size={18} />}
                        label="Default daily top-up"
                        value={`${dailyPercent}%`}
                        note={form.data.topup_enabled ? 'Applied nightly at 00:01' : 'Currently disabled'}
                    />
                    <Summary
                        icon={<Users size={18} />}
                        label="Clients on the default rate"
                        value={`${topup.eligible_users - topup.overridden_users}`}
                        note={`${topup.overridden_users} with a custom rate`}
                    />
                    <Summary
                        icon={<Percent size={18} />}
                        label="Last top-up run"
                        value={topup.last_run_at ? formatDateTime(topup.last_run_at) : 'Never'}
                        note="Most recent credit across all clients"
                    />
                </div>

                {groups.map(group => (
                    <section key={group.key} className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
                        <div className="mb-4">
                            <h2 className="text-sm font-semibold text-[var(--color-dash-text)]">{group.label}</h2>
                            <p className="mt-0.5 text-xs text-[var(--color-dash-muted)]">{group.description}</p>
                        </div>

                        <div className="grid items-start gap-4 sm:grid-cols-2">
                            {group.fields.map(field => field.type === 'bool' ? (
                                <Toggle
                                    key={field.key}
                                    label={field.label}
                                    hint={field.help}
                                    checked={Boolean(form.data[field.key])}
                                    onChange={checked => form.setData(field.key, checked)}
                                />
                            ) : (
                                <Input
                                    key={field.key}
                                    label={field.label}
                                    hint={field.help}
                                    error={form.errors[field.key]}
                                    type={field.type === 'string' ? 'text' : 'number'}
                                    step={field.type === 'float' ? '0.01' : field.type === 'int' ? '1' : undefined}
                                    min={field.type === 'string' ? undefined : '0'}
                                    value={String(form.data[field.key] ?? '')}
                                    onChange={value => form.setData(field.key, value)}
                                />
                            ))}
                        </div>
                    </section>
                ))}

                <div className="flex justify-end">
                    <button
                        disabled={form.processing}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-semibold text-black disabled:opacity-60"
                    >
                        <Save size={16} />
                        {form.processing ? 'Saving…' : 'Save settings'}
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}

function Summary({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
    return (
        <div className="rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">{icon}</div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-dash-muted)]">{label}</p>
            <p className="mt-1 truncate text-lg font-semibold text-[var(--color-dash-text)]">{value}</p>
            <p className="mt-0.5 text-xs text-[var(--color-dash-muted)]">{note}</p>
        </div>
    );
}
