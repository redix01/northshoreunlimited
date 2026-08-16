import { useForm, usePage } from '@inertiajs/react';
import { motion } from 'motion/react';
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Phone, User } from 'lucide-react';
import { useMemo, useState } from 'react';

import { SiteChrome, SiteFooter } from '../Components/SiteChrome';

type Advisor = {
    id: string;
    name: string;
    role: string;
    specialty: string;
};

type TakenSlot = {
    advisorId: string;
    date: string;
    time: string;
};

type Props = {
    advisors: Advisor[];
    slots: string[];
    timezoneLabel: string;
    sessionMinutes: number;
    bookingWindowDays: number;
    takenSlots: TakenSlot[];
    flash?: { success?: string; error?: string };
};

const STEPS = ['Advisor', 'Date', 'Time', 'Confirm'] as const;

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Local Y-m-d, so a date never shifts a day from a UTC round-trip. */
function toDateKey(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

/** Calendar cells for a month, padded so the grid starts on Monday. */
function buildMonthGrid(year: number, month: number): (Date | null)[] {
    const first = new Date(year, month, 1);
    const leading = (first.getDay() + 6) % 7; // JS weeks start Sunday; the grid starts Monday.
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
        ...Array.from({ length: leading }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
}

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="mb-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:gap-x-6">
            {STEPS.map((label, index) => {
                const done = index < current;
                const active = index === current;

                return (
                    <div key={label} className="flex items-center gap-2 sm:gap-3">
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                                done
                                    ? 'border border-gold/40 bg-gold/20 text-gold-ink'
                                    : active
                                      ? 'bg-gold text-ink'
                                      : 'border border-elegant-border bg-elegant-card text-ink/55'
                            }`}
                        >
                            {done ? <Check size={14} /> : index + 1}
                        </span>
                        <span
                            className={`text-sm ${active || done ? 'font-medium text-ink' : 'text-ink/55'}`}
                        >
                            {label}
                        </span>
                        {index < STEPS.length - 1 && (
                            <span className="hidden h-px w-10 bg-elegant-border sm:block" aria-hidden="true" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function BackLink({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mb-6 inline-flex items-center gap-2 text-sm text-ink/62 transition hover:text-gold-ink"
        >
            <ArrowLeft size={16} />
            Back
        </button>
    );
}

export default function SchedulePage() {
    const { advisors, slots, timezoneLabel, sessionMinutes, bookingWindowDays, takenSlots, flash } =
        usePage<Props>().props;

    const [step, setStep] = useState(0);
    const [advisor, setAdvisor] = useState<Advisor | null>(null);
    const [date, setDate] = useState<Date | null>(null);
    const [time, setTime] = useState<string | null>(null);

    const today = useMemo(() => startOfDay(new Date()), []);
    const lastBookable = useMemo(() => {
        const limit = new Date(today);
        limit.setDate(limit.getDate() + bookingWindowDays);
        return limit;
    }, [today, bookingWindowDays]);

    const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

    const form = useForm({
        advisor_id: '',
        scheduled_date: '',
        scheduled_time: '',
        full_name: '',
        email: '',
        phone: '',
        topic: '',
    });

    const submitted = form.wasSuccessful || Boolean(flash?.success);

    const takenLookup = useMemo(
        () => new Set(takenSlots.map((slot) => `${slot.advisorId}|${slot.date}|${slot.time}`)),
        [takenSlots],
    );

    const isSelectableDay = (day: Date) => {
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        return !isWeekend && day >= today && day <= lastBookable;
    };

    const monthGrid = useMemo(
        () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
        [cursor],
    );

    const canGoBackAMonth = cursor > new Date(today.getFullYear(), today.getMonth(), 1);
    const canGoForwardAMonth =
        new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= lastBookable;

    const chooseAdvisor = (choice: Advisor) => {
        setAdvisor(choice);
        form.setData('advisor_id', choice.id);
        setStep(1);
    };

    const chooseDate = (day: Date) => {
        setDate(day);
        form.setData('scheduled_date', toDateKey(day));
        setTime(null);
        form.setData('scheduled_time', '');
        setStep(2);
    };

    const chooseTime = (slot: string) => {
        setTime(slot);
        form.setData('scheduled_time', slot);
        setStep(3);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/schedule', { preserveScroll: true });
    };

    return (
        <SiteChrome>
            <main className="pt-20 xl:pt-24">
                <section className="mx-auto max-w-4xl px-6 pt-16 pb-24 md:px-12 md:pt-24">
                    <div className="mb-12 text-center">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-ink">
                            Book a Call
                        </p>
                        <h2 className="mb-6 font-serif text-4xl font-normal italic leading-[1.1] text-ink md:text-5xl">
                            Schedule Your Consultation
                        </h2>
                        <p className="mx-auto max-w-2xl text-base leading-relaxed text-ink/70">
                            Speak with one of our advisors about your goals and how Northshore Unlimited Capital can help you
                            build long-term wealth through bitcoin. Sessions run {sessionMinutes} minutes and there is
                            no obligation.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-elegant-border bg-elegant-card p-6 shadow-xl shadow-black/5 sm:p-10">
                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 text-center"
                            >
                                <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold-ink">
                                    <Check size={26} />
                                </span>
                                <h3 className="mb-3 font-serif text-2xl italic text-ink">Consultation Requested</h3>
                                <p className="mx-auto mb-2 max-w-md text-sm leading-relaxed text-ink/65">
                                    {flash?.success ??
                                        'The desk will confirm your booking by email shortly.'}
                                </p>
                                {advisor && date && time && (
                                    <p className="text-sm text-ink/62">
                                        {advisor.name} ·{' '}
                                        {date.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}{' '}
                                        · {time} {timezoneLabel}
                                    </p>
                                )}
                            </motion.div>
                        ) : (
                            <>
                                <StepIndicator current={step} />

                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {/* Step 1 — advisor */}
                                    {step === 0 && (
                                        <>
                                            <h3 className="mb-2 text-center text-xl font-semibold text-ink">
                                                Select Your Advisor
                                            </h3>
                                            <p className="mb-8 text-center text-sm text-ink/62">
                                                Choose a specialist to guide your consultation
                                            </p>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {advisors.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        onClick={() => chooseAdvisor(option)}
                                                        className="group flex items-start gap-4 rounded-xl border border-elegant-border bg-white p-5 text-left transition hover:border-gold/40 hover:bg-gold/[0.04]"
                                                    >
                                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-elegant-border text-ink/55 transition group-hover:border-gold/40 group-hover:text-gold-ink">
                                                            <User size={20} />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="flex items-start justify-between gap-2">
                                                                <span className="text-base font-semibold text-ink">
                                                                    {option.name}
                                                                </span>
                                                                <ChevronRight
                                                                    size={18}
                                                                    className="mt-0.5 shrink-0 text-ink/45 transition group-hover:text-gold-ink"
                                                                />
                                                            </span>
                                                            <span className="mt-0.5 block text-sm text-ink/62">
                                                                {option.role}
                                                            </span>
                                                            <span className="mt-3 block text-sm text-gold-ink">
                                                                {option.specialty}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Step 2 — date */}
                                    {step === 1 && (
                                        <>
                                            <BackLink onClick={() => setStep(0)} />
                                            <h3 className="mb-2 text-center text-xl font-semibold text-ink">
                                                Pick a Date
                                            </h3>
                                            <p className="mb-8 text-center text-sm text-ink/62">
                                                Weekdays only. Select a date that works for you
                                            </p>

                                            <div className="mb-6 flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    disabled={!canGoBackAMonth}
                                                    onClick={() =>
                                                        setCursor(
                                                            new Date(
                                                                cursor.getFullYear(),
                                                                cursor.getMonth() - 1,
                                                                1,
                                                            ),
                                                        )
                                                    }
                                                    aria-label="Previous month"
                                                    className="rounded-lg p-2 text-ink/62 transition hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <span className="text-base font-medium text-ink">
                                                    {cursor.toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={!canGoForwardAMonth}
                                                    onClick={() =>
                                                        setCursor(
                                                            new Date(
                                                                cursor.getFullYear(),
                                                                cursor.getMonth() + 1,
                                                                1,
                                                            ),
                                                        )
                                                    }
                                                    aria-label="Next month"
                                                    className="rounded-lg p-2 text-ink/62 transition hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 text-center">
                                                {WEEKDAY_LABELS.map((label) => (
                                                    <span
                                                        key={label}
                                                        className="py-2 text-xs font-medium text-ink/55"
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                                {monthGrid.map((day, index) => {
                                                    if (!day) {
                                                        return <span key={`pad-${index}`} />;
                                                    }

                                                    const selectable = isSelectableDay(day);
                                                    const selected =
                                                        date !== null && toDateKey(date) === toDateKey(day);

                                                    return (
                                                        <button
                                                            key={toDateKey(day)}
                                                            type="button"
                                                            disabled={!selectable}
                                                            onClick={() => chooseDate(day)}
                                                            className={`aspect-square rounded-lg text-sm transition ${
                                                                selected
                                                                    ? 'bg-gold font-semibold text-ink'
                                                                    : selectable
                                                                      ? 'text-ink hover:bg-gold/15'
                                                                      : 'cursor-not-allowed text-ink/25'
                                                            }`}
                                                        >
                                                            {day.getDate()}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}

                                    {/* Step 3 — time */}
                                    {step === 2 && date && advisor && (
                                        <>
                                            <BackLink onClick={() => setStep(1)} />
                                            <h3 className="mb-2 text-center text-xl font-semibold text-ink">
                                                Choose a Time
                                            </h3>
                                            <p className="mb-8 text-center text-sm text-ink/62">
                                                {date.toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                                . {sessionMinutes}-minute session · {timezoneLabel}
                                            </p>

                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                {slots.map((slot) => {
                                                    const taken = takenLookup.has(
                                                        `${advisor.id}|${toDateKey(date)}|${slot}`,
                                                    );
                                                    const selected = time === slot;

                                                    return (
                                                        <button
                                                            key={slot}
                                                            type="button"
                                                            disabled={taken}
                                                            onClick={() => chooseTime(slot)}
                                                            className={`rounded-xl border px-3 py-3.5 text-sm transition ${
                                                                selected
                                                                    ? 'border-gold bg-gold/15 font-semibold text-ink'
                                                                    : taken
                                                                      ? 'cursor-not-allowed border-elegant-border bg-elegant-card text-ink/25'
                                                                      : 'border-elegant-border bg-white text-ink hover:border-gold/40 hover:bg-gold/[0.06]'
                                                            }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {form.errors.scheduled_time && (
                                                <p className="mt-4 text-center text-sm text-red-600">
                                                    {form.errors.scheduled_time}
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {/* Step 4 — confirm */}
                                    {step === 3 && advisor && date && time && (
                                        <>
                                            <BackLink onClick={() => setStep(2)} />
                                            <h3 className="mb-2 text-center text-xl font-semibold text-ink">
                                                Confirm Your Booking
                                            </h3>
                                            <p className="mb-8 text-center text-sm text-ink/62">
                                                Review your details and complete the booking
                                            </p>

                                            <div className="mb-8 rounded-xl border border-elegant-border bg-white p-5">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold-ink">
                                                        <User size={20} />
                                                    </span>
                                                    <span>
                                                        <span className="block text-base font-semibold text-ink">
                                                            {advisor.name}
                                                        </span>
                                                        <span className="block text-sm text-ink/62">
                                                            {advisor.role}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-ink/70">
                                                    <span className="flex items-center gap-2">
                                                        <CalendarDays size={16} className="text-gold-ink" />
                                                        {date.toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        <Clock size={16} className="text-gold-ink" />
                                                        {time} {timezoneLabel} ({sessionMinutes} min)
                                                    </span>
                                                </div>
                                            </div>

                                            <form onSubmit={submit} className="space-y-5">
                                                <div>
                                                    <label
                                                        htmlFor="full_name"
                                                        className="mb-1.5 block text-sm font-medium text-ink"
                                                    >
                                                        Full Name
                                                    </label>
                                                    <input
                                                        id="full_name"
                                                        type="text"
                                                        required
                                                        autoComplete="name"
                                                        placeholder="Your full name"
                                                        value={form.data.full_name}
                                                        onChange={(event) =>
                                                            form.setData('full_name', event.target.value)
                                                        }
                                                        className="w-full rounded-xl border border-elegant-border bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/45 focus:border-gold/60"
                                                    />
                                                    {form.errors.full_name && (
                                                        <p className="mt-1.5 text-xs text-red-600">
                                                            {form.errors.full_name}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="email"
                                                        className="mb-1.5 block text-sm font-medium text-ink"
                                                    >
                                                        Email Address
                                                    </label>
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        required
                                                        autoComplete="email"
                                                        placeholder="you@example.com"
                                                        value={form.data.email}
                                                        onChange={(event) =>
                                                            form.setData('email', event.target.value)
                                                        }
                                                        className="w-full rounded-xl border border-elegant-border bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/45 focus:border-gold/60"
                                                    />
                                                    {form.errors.email && (
                                                        <p className="mt-1.5 text-xs text-red-600">
                                                            {form.errors.email}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="phone"
                                                        className="mb-1.5 block text-sm font-medium text-ink"
                                                    >
                                                        Phone Number
                                                    </label>
                                                    <div className="relative">
                                                        <Phone
                                                            size={16}
                                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/45"
                                                        />
                                                        <input
                                                            id="phone"
                                                            type="tel"
                                                            required
                                                            autoComplete="tel"
                                                            placeholder="+1 (555) 000-0000"
                                                            value={form.data.phone}
                                                            onChange={(event) =>
                                                                form.setData('phone', event.target.value)
                                                            }
                                                            className="w-full rounded-xl border border-elegant-border bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-ink/45 focus:border-gold/60"
                                                        />
                                                    </div>
                                                    {form.errors.phone && (
                                                        <p className="mt-1.5 text-xs text-red-600">
                                                            {form.errors.phone}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="topic"
                                                        className="mb-1.5 block text-sm font-medium text-ink"
                                                    >
                                                        Consultation Topic{' '}
                                                        <span className="font-normal text-ink/55">(optional)</span>
                                                    </label>
                                                    <textarea
                                                        id="topic"
                                                        rows={4}
                                                        placeholder="Tell us briefly what you'd like to discuss..."
                                                        value={form.data.topic}
                                                        onChange={(event) =>
                                                            form.setData('topic', event.target.value)
                                                        }
                                                        className="w-full resize-none rounded-xl border border-elegant-border bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/45 focus:border-gold/60"
                                                    />
                                                    {form.errors.topic && (
                                                        <p className="mt-1.5 text-xs text-red-600">
                                                            {form.errors.topic}
                                                        </p>
                                                    )}
                                                </div>

                                                {(form.errors.scheduled_date ||
                                                    form.errors.scheduled_time ||
                                                    form.errors.advisor_id) && (
                                                    <p className="text-sm text-red-600">
                                                        {form.errors.scheduled_date ??
                                                            form.errors.scheduled_time ??
                                                            form.errors.advisor_id}
                                                    </p>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={form.processing}
                                                    className="w-full rounded-xl bg-gold py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {form.processing ? 'Booking…' : 'Confirm Booking'}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </div>
                </section>
            </main>
            <SiteFooter />
        </SiteChrome>
    );
}
