import { useForm, usePage, Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import {
    CheckCircle2,
    Lock,
    ShieldCheck,
    Zap,
} from 'lucide-react';

import { fadeIn, SiteChrome, SiteFooter, staggerContainer } from '../Components/SiteChrome';

type SharedPageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
};

export default function HomePage() {
    const { flash } = usePage<SharedPageProps>().props;
    const form = useForm({
        full_name: '',
        email: '',
        jurisdiction: '',
        estimated_btc_volume: '',
        transaction_context: '',
        consent: false,
    });

    const submitted = form.wasSuccessful || Boolean(flash?.success);

    const features = [
        {
            title: 'Private OTC Support',
            description:
                'A discreet request-based process for clients seeking to buy or sell digital assets through a direct company-managed workflow.',
            icon: <Lock className="w-5 h-5 text-gold-ink/60" />,
        },
        {
            title: 'Compliance First',
            description:
                'Every transaction is subject to identity verification, internal review, and applicable regulatory requirements before approval.',
            icon: <ShieldCheck className="w-5 h-5 text-gold-ink/60" />,
        },
        {
            title: 'Fast Settlement',
            description:
                'Approved trades are coordinated directly with our team for clear pricing, payment confirmation, and wallet delivery steps.',
            icon: <Zap className="w-5 h-5 text-gold-ink/60" />,
        },
    ];

    const steps = [
        'Submit a private trade request',
        'Complete KYC and verification',
        'Receive quote and trade terms',
        'Confirm payment and settlement details',
        'Finalize transfer with company support',
    ];

    return (
        <SiteChrome>
            <main className="mx-auto min-h-[calc(100vh-60px)] max-w-7xl px-6 pt-24 md:px-12 md:pt-32">
                <section className="py-12 lg:py-20">
                    <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                        <motion.div initial="initial" animate="animate" variants={staggerContainer} className="hero-content">
                            <motion.div variants={fadeIn} className="mb-6 inline-flex items-center gap-2 rounded-full border border-elegant-border px-4 py-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
                                    SECURED OTC GATEWAY
                                </span>
                            </motion.div>
                            <motion.h2 variants={fadeIn} className="font-serif text-5xl font-normal leading-[1.1] italic text-ink md:text-6xl">
                                Discreet capital movement <br /> through private settlement.
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-8 max-w-lg text-lg leading-relaxed text-ink/70">
                                Northshore Unlimited provides a professional request-based framework for high-volume Bitcoin liquidity. Every transaction is managed through our proprietary compliance engine.
                            </motion.p>
                            <motion.div variants={fadeIn} className="mt-12 flex flex-wrap gap-5">
                                <a href="#trade-request" className="rounded-sm bg-gold px-8 py-4 text-xs font-bold uppercase tracking-widest text-ink transition-all hover:bg-gold-dark">
                                    Initiate Request
                                </a>
                                <Link href="/company" className="rounded-sm border border-elegant-border bg-transparent px-8 py-4 text-xs font-bold uppercase tracking-widest text-ink transition hover:bg-ink/5">
                                    Our Company
                                </Link>
                            </motion.div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="bento-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col justify-between rounded-xl border border-elegant-border bg-elegant-card p-8 text-ink sm:col-span-2">
                                <div>
                                    <span className="mb-4 block text-[10px] uppercase tracking-[0.2em] text-ink/60">
                                        Active Operations
                                    </span>
                                    <div className="mb-2 font-sans text-xl font-medium">Private P2P Settlement</div>
                                    <p className="text-sm leading-relaxed text-ink/65">
                                        Direct company-managed workflow bypassing public order books to ensure zero slippage and total discretion.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center gap-3 text-[12px] font-medium text-gold-ink">
                                    <div className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_0_3px_rgba(201,162,39,0.25)]" />
                                    Desk Status: Accepting Inquiries
                                </div>
                            </div>
                            <div className="rounded-xl border border-elegant-border bg-elegant-card p-8 text-ink">
                                <span className="mb-4 block text-[10px] uppercase tracking-[0.2em] text-ink/60">
                                    Verification
                                </span>
                                <div className="mb-2 font-sans text-lg font-medium">KYC Level 3</div>
                                <p className="text-xs leading-relaxed text-ink/65">
                                    Full identity and source-of-wealth vetting required prior to quote issuance.
                                </p>
                            </div>
                            <div className="rounded-xl border border-elegant-border bg-elegant-card p-8 text-ink transition-colors hover:border-gold/30">
                                <span className="mb-4 block text-[10px] uppercase tracking-[0.2em] text-ink/60">
                                    Velocity
                                </span>
                                <div className="mb-2 font-sans text-lg font-medium">T+0 Finality</div>
                                <p className="text-xs leading-relaxed text-ink/65">
                                    Coordination with global banking partners for same-day settlement.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section id="about" className="border-t border-elegant-border py-24">
                    <div className="grid gap-16 md:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.title} className="group">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-elegant-border bg-elegant-card transition-colors group-hover:border-gold/30">
                                    {feature.icon}
                                </div>
                                <h4 className="mb-4 text-lg font-medium text-ink">{feature.title}</h4>
                                <p className="text-sm leading-relaxed text-ink/65">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="process" className="border-t border-elegant-border py-24">
                    <div className="max-w-4xl">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-ink">
                            Protocol Execution
                        </p>
                        <h3 className="mb-12 font-serif text-4xl italic text-ink">Controlled Settlement Path</h3>
                        <div className="space-y-0 border-l border-elegant-border">
                            {steps.map((step, index) => (
                                <div key={step} className="relative pb-16 pl-12 last:pb-0">
                                    <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-gold" />
                                    <span className="mb-2 block text-[10px] italic uppercase tracking-widest text-ink/55 font-serif">
                                        Phase 0{index + 1}
                                    </span>
                                    <p className="text-lg text-ink/85">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="trade-request" className="border-t border-elegant-border py-24">
                    <div className="grid gap-16 lg:grid-cols-[1.5fr_1fr]">
                        <div>
                            <h3 className="mb-6 font-serif text-4xl italic text-ink">Initiate Secure Request</h3>
                            <p className="mb-12 max-w-lg text-sm leading-relaxed text-ink/65">
                                Submit your inquiry for institutional review through the Northshore Unlimited framework.
                            </p>
                            {!submitted ? (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        form.post('/trade-request', {
                                            preserveScroll: true,
                                        });
                                    }}
                                    className="grid gap-6"
                                >
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Full Name"
                                                value={form.data.full_name}
                                                onChange={(event) => form.setData('full_name', event.target.value)}
                                                className="w-full border-b border-elegant-border bg-transparent py-4 text-sm text-ink placeholder:text-ink/55 outline-none transition focus:border-gold"
                                            />
                                            {form.errors.full_name && (
                                                <p className="mt-2 text-xs text-red-600">{form.errors.full_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                required
                                                type="email"
                                                placeholder="Email Address"
                                                value={form.data.email}
                                                onChange={(event) => form.setData('email', event.target.value)}
                                                className="w-full border-b border-elegant-border bg-transparent py-4 text-sm text-ink placeholder:text-ink/55 outline-none transition focus:border-gold"
                                            />
                                            {form.errors.email && (
                                                <p className="mt-2 text-xs text-red-600">{form.errors.email}</p>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Jurisdiction / Country"
                                                value={form.data.jurisdiction}
                                                onChange={(event) => form.setData('jurisdiction', event.target.value)}
                                                className="w-full border-b border-elegant-border bg-transparent py-4 text-sm text-ink placeholder:text-ink/55 outline-none transition focus:border-gold"
                                            />
                                            {form.errors.jurisdiction && (
                                                <p className="mt-2 text-xs text-red-600">{form.errors.jurisdiction}</p>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Estimated BTC Volume"
                                                value={form.data.estimated_btc_volume}
                                                onChange={(event) => form.setData('estimated_btc_volume', event.target.value)}
                                                className="w-full border-b border-elegant-border bg-transparent py-4 text-sm text-ink placeholder:text-ink/55 outline-none transition focus:border-gold"
                                            />
                                            {form.errors.estimated_btc_volume && (
                                                <p className="mt-2 text-xs text-red-600">{form.errors.estimated_btc_volume}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <textarea
                                            rows={4}
                                            placeholder="Transaction context..."
                                            value={form.data.transaction_context}
                                            onChange={(event) => form.setData('transaction_context', event.target.value)}
                                            className="w-full resize-none border-b border-elegant-border bg-transparent py-4 text-sm text-ink placeholder:text-ink/55 outline-none transition focus:border-gold"
                                        />
                                        {form.errors.transaction_context && (
                                            <p className="mt-2 text-xs text-red-600">{form.errors.transaction_context}</p>
                                        )}
                                    </div>

                                    <div className="flex items-start gap-4 py-4">
                                        <input
                                            required
                                            id="consent"
                                            type="checkbox"
                                            checked={form.data.consent}
                                            onChange={(event) => form.setData('consent', event.target.checked)}
                                            className="mt-1 h-3.5 w-3.5 rounded-sm border-elegant-border bg-transparent text-gold-ink focus:ring-0"
                                        />
                                        <label htmlFor="consent" className="cursor-pointer select-none text-[10px] uppercase tracking-wider text-ink/60">
                                            Confirmed: AML vetting per protocol.
                                        </label>
                                    </div>
                                    {form.errors.consent && (
                                        <p className="-mt-2 text-xs text-red-600">{form.errors.consent}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="w-fit rounded-sm bg-gold px-12 py-5 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-all hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {form.processing ? 'Transmitting...' : 'Transmit Request'}
                                    </button>
                                </form>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-gold/20 bg-gold/5 py-16 text-center">
                                    <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-gold-ink" />
                                    <h4 className="mb-2 text-xl text-ink">Request Transmitted</h4>
                                    <p className="text-sm text-ink/65">Our desk operations will process your inquiry shortly.</p>
                                </motion.div>
                            )}
                        </div>

                        <div className="space-y-8">
                            <div className="rounded-xl border border-elegant-border bg-elegant-card p-10">
                                <h4 className="mb-6 text-xs uppercase tracking-[0.3em] font-semibold text-ink/60">
                                    Desk Operations
                                </h4>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-ink/62">PROTOCOL EMAIL</span>
                                        <span className="font-medium text-ink/85">trades@northshore.com</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-ink/62">SERVICE STATUS</span>
                                        <span className="font-medium tracking-widest text-gold-ink">• ONLINE</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-ink/62">SLA WINDOW</span>
                                        <span className="font-medium text-ink/85">T+0 SETTLEMENT</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </SiteChrome>
    );
}
