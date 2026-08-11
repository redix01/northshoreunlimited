import { Link, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Shield, User } from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '../../types';

export default function Login() {
    const { flash } = usePage<PageProps>().props;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <div className="min-h-screen bg-[var(--color-dash-bg)] flex flex-col items-center justify-center px-4">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/20 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6">
                        <img
                            src="/img/logo.png"
                            alt="Northshore Unlimited Capital"
                            width={800}
                            height={211}
                            className="h-11 w-auto"
                        />
                    </Link>
                    <h1 className="text-2xl font-semibold text-[var(--color-dash-text)] mb-1">Sign in to your account</h1>
                    <p className="text-sm text-[var(--color-dash-muted)]">Enter your username and password to access the portal</p>
                </div>

                {/* Card */}
                <div className="bg-[var(--color-dash-surface)] border border-[var(--color-dash-border)] rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5">
                    {flash.success && (
                        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-dash-text)] mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-dash-muted)]" />
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={e => setData('username', e.target.value)}
                                    placeholder="Enter username"
                                    autoComplete="username"
                                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--color-dash-bg)] border text-sm text-[var(--color-dash-text)] placeholder-[var(--color-dash-muted)] focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all ${
                                        errors.username ? 'border-red-500/60' : 'border-[var(--color-dash-border)] focus:border-gold/50'
                                    }`}
                                />
                            </div>
                            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-dash-text)] mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-dash-muted)]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    className={`w-full pl-9 pr-10 py-2.5 rounded-lg bg-[var(--color-dash-bg)] border text-sm text-[var(--color-dash-text)] placeholder-[var(--color-dash-muted)] focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all ${
                                        errors.password ? 'border-red-500/60' : 'border-[var(--color-dash-border)] focus:border-gold/50'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={data.remember}
                                onChange={e => setData('remember', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--color-dash-border)] bg-[var(--color-dash-bg)] accent-gold"
                            />
                            <label htmlFor="remember" className="text-sm text-[var(--color-dash-muted)]">
                                Keep me signed in
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 rounded-lg bg-gold text-black text-sm font-semibold hover:bg-gold/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                        >
                            {processing ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)] transition-colors">
                        ← Return to homepage
                    </Link>
                </div>

                {/* Security note */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-[var(--color-dash-muted)]">
                    <Shield size={11} />
                    <span>256-bit SSL secured connection</span>
                </div>
            </div>
        </div>
    );
}
