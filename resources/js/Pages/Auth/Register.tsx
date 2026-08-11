import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BadgeDollarSign,
    Calendar,
    Eye,
    EyeOff,
    Lock,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Shield,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Field, { FieldIcon, controlClass } from '../../Components/register/Field';
import Stepper from '../../Components/register/Stepper';
import type { PageProps } from '../../types';

interface Props extends PageProps {
    countries: Record<string, string>;
    subdivisions: Record<string, Record<string, string>>;
    promotion: { enabled: boolean; headline: string; subtext: string };
    hero: { image: string; headline: string; accent: string; subtext: string };
    minimumAge: number;
}

type Data = {
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone: string;
    country: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    referral_code: string;
    terms: boolean;
};

const STEPS = ['Account', 'Personal', 'Address', 'Review'];

const TITLES = [
    { title: 'Set Up Your Account', subtitle: 'Create your login credentials' },
    { title: 'Personal Details', subtitle: 'Tell us a bit about yourself' },
    { title: 'Your Address', subtitle: 'Where are you located?' },
    { title: 'Review & Confirm', subtitle: 'Check your details before we open the account' },
];

/** Which step owns each field, so a server error can send us back to it. */
const STEP_FIELDS: (keyof Data)[][] = [
    ['email', 'password', 'password_confirmation'],
    ['first_name', 'last_name', 'date_of_birth', 'phone'],
    ['country', 'street', 'city', 'state', 'postal_code'],
    ['referral_code', 'terms'],
];

function yearsSince(date: string): number {
    const born = new Date(date);
    if (Number.isNaN(born.getTime())) return NaN;

    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    const monthDelta = now.getMonth() - born.getMonth();

    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) age--;

    return age;
}

/** Mirrors the server rules so problems surface before the round-trip. */
function validate(data: Data, minimumAge: number): Partial<Record<keyof Data, string>> {
    const errors: Partial<Record<keyof Data, string>> = {};

    if (!data.email.trim()) errors.email = 'Email address required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = 'Enter a valid email address';

    if (!data.password) errors.password = 'Password required';
    else if (data.password.length < 8) errors.password = 'Password must be at least 8 characters';

    if (!data.password_confirmation) errors.password_confirmation = 'Please re-enter your password';
    else if (data.password !== data.password_confirmation)
        errors.password_confirmation = 'Passwords do not match';

    if (data.first_name.trim().length < 2) errors.first_name = 'First name required (min 2 chars)';
    if (data.last_name.trim().length < 2) errors.last_name = 'Last name required (min 2 chars)';

    if (!data.date_of_birth) errors.date_of_birth = 'Date of birth required';
    else {
        const age = yearsSince(data.date_of_birth);
        if (Number.isNaN(age)) errors.date_of_birth = 'Enter a valid date';
        else if (age < minimumAge) errors.date_of_birth = `You must be at least ${minimumAge} years old`;
    }

    if (data.phone.replace(/\D/g, '').length < 6) errors.phone = 'Phone number required';

    if (!data.country) errors.country = 'Country required';
    if (!data.street.trim()) errors.street = 'Street address required';
    if (!data.city.trim()) errors.city = 'City required';
    if (!data.state.trim()) errors.state = 'State or region required';
    if (!data.postal_code.trim()) errors.postal_code = 'ZIP / postal code required';

    if (!data.terms) errors.terms = 'Please accept the Terms of Service and Privacy Policy';

    return errors;
}

function SummaryCard({
    title,
    onEdit,
    rows,
}: {
    title: string;
    onEdit: () => void;
    rows: [string, string][];
}) {
    return (
        <div className="rounded-xl border border-[var(--color-dash-border)] bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-dash-text)]">
                    {title}
                </h3>
                <button
                    type="button"
                    onClick={onEdit}
                    className="flex shrink-0 items-center gap-1 text-sm text-[var(--color-gold-ink)] hover:underline"
                >
                    <Pencil size={13} />
                    Edit
                </button>
            </div>

            <dl className="space-y-1">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4">
                        <dt className="shrink-0 text-sm text-[var(--color-dash-muted)]">{label}</dt>
                        <dd className="min-w-0 truncate text-sm font-medium text-[var(--color-dash-text)]">
                            {value || '—'}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default function Register() {
    const { countries, subdivisions, promotion, hero, minimumAge } = usePage<Props>().props;

    const [step, setStep] = useState(0);
    const [touched, setTouched] = useState<Partial<Record<keyof Data, boolean>>>({});
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<Data>({
        email: '',
        password: '',
        password_confirmation: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        phone: '',
        country: 'US',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        referral_code: '',
        terms: false,
    });

    const clientErrors = useMemo(
        () => validate(form.data, minimumAge),
        [form.data, minimumAge],
    );

    const states = subdivisions[form.data.country];

    // Selecting a country with its own list invalidates a region typed for another.
    useEffect(() => {
        if (states && form.data.state && !states[form.data.state]) {
            form.setData('state', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.data.country]);

    /*
     * The whole form posts at the end, so a rejection can concern a field from
     * any step — an already-registered email, most often. Jump back to the
     * earliest step that holds one rather than stranding the user on Review.
     */
    useEffect(() => {
        const failed = Object.keys(form.errors) as (keyof Data)[];
        if (!failed.length) return;

        const earliest = STEP_FIELDS.findIndex(fields => fields.some(f => failed.includes(f)));
        if (earliest >= 0 && earliest !== step) setStep(earliest);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.errors]);

    /** Server errors win; client errors only appear once a field has been touched. */
    function errorFor(field: keyof Data): string | undefined {
        return (form.errors as Partial<Record<keyof Data, string>>)[field]
            ?? (touched[field] ? clientErrors[field] : undefined);
    }

    // The functional overload keeps this generic over the whole shape; the
    // keyed overload cannot express `Data[K]` for a union-typed form.
    function set<K extends keyof Data>(field: K, value: Data[K]) {
        form.setData(current => ({ ...current, [field]: value }));
        form.clearErrors(field);
    }

    function markTouched(fields: (keyof Data)[]) {
        setTouched(current => ({
            ...current,
            ...Object.fromEntries(fields.map(f => [f, true])),
        }));
    }

    function next() {
        const fields = STEP_FIELDS[step];
        markTouched(fields);

        if (fields.some(field => clientErrors[field])) return;

        setStep(current => Math.min(current + 1, STEPS.length - 1));
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (step < STEPS.length - 1) {
            next();
            return;
        }

        markTouched(STEP_FIELDS.flat());
        if (Object.keys(clientErrors).length) {
            const earliest = STEP_FIELDS.findIndex(fields => fields.some(f => clientErrors[f]));
            if (earliest >= 0) setStep(earliest);
            return;
        }

        form.post('/register');
    }

    const fullName = `${form.data.first_name} ${form.data.last_name}`.trim();
    const stateLabel = states?.[form.data.state] ?? form.data.state;

    return (
        <div className="min-h-screen bg-[var(--color-dash-bg)] lg:grid lg:grid-cols-2">
            <Head title="Create your account" />

            {/* Hero */}
            {/* justify-between rather than an absolutely-placed logo: the panel
                is only ~230px tall on a phone, where the two would collide. */}
            <aside
                className="flex min-h-[240px] flex-col justify-between gap-10 overflow-hidden bg-[#14110b] p-8 lg:sticky lg:top-0 lg:min-h-screen lg:p-12"
                style={{
                    backgroundImage: `linear-gradient(to top, rgba(10,8,5,0.92), rgba(10,8,5,0.35)), url('${hero.image}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <Link href="/" className="w-fit">
                    <img
                        src="/img/logo.png"
                        alt="Northshore Unlimited Capital"
                        className="h-8 w-auto brightness-0 invert lg:h-9"
                    />
                </Link>

                <div>
                    <h2 className="font-serif text-[1.75rem] leading-tight text-white sm:text-3xl lg:text-[2.75rem]">
                        {hero.headline}
                        <span className="block text-gold">{hero.accent}</span>
                    </h2>
                    <p className="mt-3 max-w-md text-sm text-white/70">{hero.subtext}</p>
                </div>
            </aside>

            {/* Form */}
            <main className="px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
                <div className="mx-auto w-full max-w-xl">
                    {promotion.enabled && (
                        <div
                            className="mb-8 flex items-start gap-3 rounded-xl border px-4 py-3.5"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--color-gold) 35%, transparent)',
                                background: 'color-mix(in srgb, var(--color-gold) 8%, #fff)',
                            }}
                        >
                            <BadgeDollarSign size={20} className="mt-0.5 shrink-0 text-gold" />
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-gold-ink)]">
                                    {promotion.headline}
                                </p>
                                <p className="text-sm text-[var(--color-dash-muted)]">{promotion.subtext}</p>
                            </div>
                        </div>
                    )}

                    <h1 className="font-serif text-4xl text-[var(--color-dash-text)] lg:text-[2.75rem]">
                        {TITLES[step].title}
                    </h1>
                    <p className="mt-1 text-[15px] text-[var(--color-dash-muted)]">{TITLES[step].subtitle}</p>

                    <div className="my-7">
                        <Stepper steps={STEPS} current={step} onJump={setStep} />
                    </div>

                    <form
                        onSubmit={submit}
                        noValidate
                        className="rounded-2xl border border-[var(--color-dash-border)] bg-white p-6 shadow-sm sm:p-8"
                    >
                        {/* ── 1 · Account ─────────────────────────────────── */}
                        {step === 0 && (
                            <div className="space-y-5">
                                <Field id="email" label="Email address" error={errorFor('email')}>
                                    <div className="relative">
                                        <FieldIcon>
                                            <Mail size={17} />
                                        </FieldIcon>
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            autoFocus
                                            value={form.data.email}
                                            onChange={e => set('email', e.target.value)}
                                            onBlur={() => markTouched(['email'])}
                                            placeholder="you@example.com"
                                            className={controlClass(!!errorFor('email'))}
                                        />
                                    </div>
                                </Field>

                                <Field id="password" label="Password" error={errorFor('password')}>
                                    <div className="relative">
                                        <FieldIcon>
                                            <Lock size={17} />
                                        </FieldIcon>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            value={form.data.password}
                                            onChange={e => set('password', e.target.value)}
                                            onBlur={() => markTouched(['password'])}
                                            placeholder="Create a strong password"
                                            className={`${controlClass(!!errorFor('password'))} pr-11`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]"
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </Field>

                                <Field
                                    id="password_confirmation"
                                    label="Confirm password"
                                    error={errorFor('password_confirmation')}
                                >
                                    <div className="relative">
                                        <FieldIcon>
                                            <Lock size={17} />
                                        </FieldIcon>
                                        <input
                                            id="password_confirmation"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            value={form.data.password_confirmation}
                                            onChange={e => set('password_confirmation', e.target.value)}
                                            onBlur={() => markTouched(['password_confirmation'])}
                                            placeholder="Re-enter your password"
                                            className={controlClass(!!errorFor('password_confirmation'))}
                                        />
                                    </div>
                                </Field>
                            </div>
                        )}

                        {/* ── 2 · Personal ────────────────────────────────── */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field id="first_name" label="First name" error={errorFor('first_name')}>
                                        <div className="relative">
                                            <FieldIcon tinted={!!errorFor('first_name')}>
                                                <User size={17} />
                                            </FieldIcon>
                                            <input
                                                id="first_name"
                                                type="text"
                                                autoComplete="given-name"
                                                autoFocus
                                                value={form.data.first_name}
                                                onChange={e => set('first_name', e.target.value)}
                                                onBlur={() => markTouched(['first_name'])}
                                                placeholder="John"
                                                className={controlClass(!!errorFor('first_name'))}
                                            />
                                        </div>
                                    </Field>

                                    <Field id="last_name" label="Last name" error={errorFor('last_name')}>
                                        <div className="relative">
                                            <FieldIcon tinted={!!errorFor('last_name')}>
                                                <User size={17} />
                                            </FieldIcon>
                                            <input
                                                id="last_name"
                                                type="text"
                                                autoComplete="family-name"
                                                value={form.data.last_name}
                                                onChange={e => set('last_name', e.target.value)}
                                                onBlur={() => markTouched(['last_name'])}
                                                placeholder="Doe"
                                                className={controlClass(!!errorFor('last_name'))}
                                            />
                                        </div>
                                    </Field>
                                </div>

                                <Field id="date_of_birth" label="Date of birth" error={errorFor('date_of_birth')}>
                                    <div className="relative">
                                        <FieldIcon>
                                            <Calendar size={17} />
                                        </FieldIcon>
                                        <input
                                            id="date_of_birth"
                                            type="date"
                                            autoComplete="bday"
                                            max={new Date().toISOString().slice(0, 10)}
                                            value={form.data.date_of_birth}
                                            onChange={e => set('date_of_birth', e.target.value)}
                                            onBlur={() => markTouched(['date_of_birth'])}
                                            className={controlClass(!!errorFor('date_of_birth'))}
                                        />
                                    </div>
                                </Field>

                                <Field id="phone" label="Phone number" error={errorFor('phone')}>
                                    <div className="relative">
                                        <FieldIcon>
                                            <Phone size={17} />
                                        </FieldIcon>
                                        <input
                                            id="phone"
                                            type="tel"
                                            autoComplete="tel"
                                            value={form.data.phone}
                                            onChange={e => set('phone', e.target.value)}
                                            onBlur={() => markTouched(['phone'])}
                                            placeholder="+1 (555) 000-0000"
                                            className={controlClass(!!errorFor('phone'))}
                                        />
                                    </div>
                                </Field>
                            </div>
                        )}

                        {/* ── 3 · Address ─────────────────────────────────── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <Field id="country" label="Country" error={errorFor('country')}>
                                    <div className="relative">
                                        <FieldIcon tinted>
                                            <MapPin size={17} />
                                        </FieldIcon>
                                        <select
                                            id="country"
                                            autoComplete="country"
                                            value={form.data.country}
                                            onChange={e => set('country', e.target.value)}
                                            className={controlClass(!!errorFor('country'))}
                                        >
                                            {Object.entries(countries).map(([code, name]) => (
                                                <option key={code} value={code}>
                                                    {name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </Field>

                                <Field id="street" label="Street address" error={errorFor('street')}>
                                    <div className="relative">
                                        <FieldIcon>
                                            <MapPin size={17} />
                                        </FieldIcon>
                                        <input
                                            id="street"
                                            type="text"
                                            autoComplete="address-line1"
                                            value={form.data.street}
                                            onChange={e => set('street', e.target.value)}
                                            onBlur={() => markTouched(['street'])}
                                            placeholder="123 Main Street"
                                            className={controlClass(!!errorFor('street'))}
                                        />
                                    </div>
                                </Field>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field id="city" label="City" error={errorFor('city')}>
                                        <input
                                            id="city"
                                            type="text"
                                            autoComplete="address-level2"
                                            value={form.data.city}
                                            onChange={e => set('city', e.target.value)}
                                            onBlur={() => markTouched(['city'])}
                                            placeholder="New York"
                                            className={controlClass(!!errorFor('city'), false)}
                                        />
                                    </Field>

                                    <Field id="state" label="State" error={errorFor('state')}>
                                        {states ? (
                                            <select
                                                id="state"
                                                autoComplete="address-level1"
                                                value={form.data.state}
                                                onChange={e => set('state', e.target.value)}
                                                onBlur={() => markTouched(['state'])}
                                                className={controlClass(!!errorFor('state'), false)}
                                            >
                                                <option value="">Select state</option>
                                                {Object.entries(states).map(([code, name]) => (
                                                    <option key={code} value={code}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                id="state"
                                                type="text"
                                                autoComplete="address-level1"
                                                value={form.data.state}
                                                onChange={e => set('state', e.target.value)}
                                                onBlur={() => markTouched(['state'])}
                                                placeholder="Region or province"
                                                className={controlClass(!!errorFor('state'), false)}
                                            />
                                        )}
                                    </Field>
                                </div>

                                <Field
                                    id="postal_code"
                                    label="ZIP / Postal code"
                                    error={errorFor('postal_code')}
                                >
                                    <input
                                        id="postal_code"
                                        type="text"
                                        autoComplete="postal-code"
                                        value={form.data.postal_code}
                                        onChange={e => set('postal_code', e.target.value)}
                                        onBlur={() => markTouched(['postal_code'])}
                                        placeholder="10001"
                                        className={controlClass(!!errorFor('postal_code'), false)}
                                    />
                                </Field>
                            </div>
                        )}

                        {/* ── 4 · Review ──────────────────────────────────── */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <Field
                                    id="referral_code"
                                    label="Referral code"
                                    error={errorFor('referral_code')}
                                >
                                    <div className="relative">
                                        <FieldIcon>
                                            <Users size={17} />
                                        </FieldIcon>
                                        <input
                                            id="referral_code"
                                            type="text"
                                            value={form.data.referral_code}
                                            onChange={e => set('referral_code', e.target.value.toUpperCase())}
                                            placeholder="GCC-XXXXXXXX (OPTIONAL)"
                                            className={`${controlClass(!!errorFor('referral_code'))} uppercase`}
                                        />
                                    </div>
                                </Field>

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-dash-muted)]">
                                        Account summary
                                    </p>

                                    <div className="space-y-3">
                                        <SummaryCard
                                            title="Account"
                                            onEdit={() => setStep(0)}
                                            rows={[['Email', form.data.email]]}
                                        />

                                        <SummaryCard
                                            title="Personal"
                                            onEdit={() => setStep(1)}
                                            rows={[
                                                ['Name', fullName],
                                                ['Date of Birth', form.data.date_of_birth],
                                                ['Phone', form.data.phone],
                                            ]}
                                        />

                                        <SummaryCard
                                            title="Address"
                                            onEdit={() => setStep(2)}
                                            rows={[
                                                ['Street', form.data.street],
                                                ['City', form.data.city],
                                                ['State', stateLabel],
                                                ['ZIP', form.data.postal_code],
                                                ['Country', countries[form.data.country] ?? ''],
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-start justify-center gap-2.5 text-center text-sm text-[var(--color-dash-text)]">
                                        <input
                                            type="checkbox"
                                            checked={form.data.terms}
                                            onChange={e => set('terms', e.target.checked)}
                                            onBlur={() => markTouched(['terms'])}
                                            className="mt-0.5 h-4 w-4 shrink-0 rounded accent-gold"
                                        />
                                        <span>
                                            I agree to the{' '}
                                            <Link
                                                href="/terms"
                                                className="text-[var(--color-gold-ink)] underline"
                                            >
                                                Terms of Service
                                            </Link>{' '}
                                            and{' '}
                                            <Link
                                                href="/compliance"
                                                className="text-[var(--color-gold-ink)] underline"
                                            >
                                                Privacy Policy
                                            </Link>
                                        </span>
                                    </label>
                                    {errorFor('terms') && (
                                        <p className="mt-1.5 text-center text-sm text-red-600">
                                            {errorFor('terms')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className={`mt-7 flex gap-3 ${step === 0 ? '' : 'items-center'}`}>
                            {step > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(s => s - 1)}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-dash-border)] px-6 py-3.5 text-[15px] font-medium text-[var(--color-dash-text)] transition-colors hover:bg-[var(--color-dash-surface-2)]"
                                >
                                    <ArrowLeft size={17} />
                                    Back
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-gold-dark disabled:opacity-60"
                            >
                                {step === STEPS.length - 1 ? (
                                    <>
                                        <UserPlus size={17} />
                                        {form.processing ? 'Creating account…' : 'Create Account'}
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-sm text-[var(--color-dash-muted)]">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-[var(--color-gold-ink)] hover:underline">
                            Sign in
                        </Link>
                    </p>

                    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--color-dash-muted)]">
                        <Shield size={12} />
                        256-bit SSL secured connection
                    </p>
                </div>
            </main>
        </div>
    );
}
