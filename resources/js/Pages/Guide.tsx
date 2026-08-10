import { motion } from 'motion/react';
import { Link } from '@inertiajs/react';

import { contactDetails, fadeIn, SiteChrome, SiteFooter, staggerContainer } from '../Components/SiteChrome';

const sectionNav = [
    { id: 'regulatory-shift', label: 'The Shift' },
    { id: 'understanding-bitcoin', label: 'Understanding Bitcoin' },
    { id: 'tax-advantaged', label: 'Tax-Advantaged Growth' },
    { id: 'why-northshore', label: 'Why Northshore' },
    { id: 'security', label: 'Security' },
    { id: 'faq', label: 'FAQ' },
    { id: 'guide-contact', label: 'Talk to Us' },
];

/**
 * Regulatory milestones shown on the timeline.
 *
 * Only publish entries that can be sourced to a public regulator action. The
 * spot-ETF approval below is the one dated event carried over from the legacy
 * Grey Crest page; anything further — proposed rulemaking, guidance letters,
 * state-level changes — must be confirmed against the regulator's own record
 * before it is added here, since clients read this as a factual timeline.
 */
const timeline = [
    {
        period: 'January 2024',
        title: 'Spot Bitcoin ETFs approved',
        text: 'The SEC approved the first spot Bitcoin exchange-traded products in the United States, giving regulated brokerages, advisers, and retirement platforms a familiar wrapper for direct Bitcoin exposure.',
    },
    {
        period: 'Since 2024',
        title: 'Custody standards matured',
        text: 'Qualified custodians extended institutional-grade cold storage, insurance, and audit practices to digital assets, closing much of the gap between crypto custody and the standards traditional retirement assets are held to.',
    },
    {
        period: 'Today',
        title: 'Self-directed retirement accounts opened up',
        text: 'Self-directed IRA providers increasingly support digital assets alongside conventional holdings, which is what makes it practical to hold Bitcoin inside a tax-advantaged retirement account rather than only in a taxable one.',
    },
];

const bitcoinAttributes = [
    {
        heading: 'A fixed supply',
        text: 'Bitcoin’s protocol caps total issuance at 21 million coins, and the rate of new issuance halves roughly every four years. Unlike a currency a central bank can print more of, the supply schedule is fixed in software and known in advance.',
    },
    {
        heading: 'A track record, not a guarantee',
        text: 'Bitcoin has existed since 2009 and has been through several deep drawdowns and recoveries. Its long-run history has been strong, but it has also fallen more than 70% from a peak more than once. Past performance does not predict future results.',
    },
    {
        heading: 'No single point of control',
        text: 'The network is maintained by tens of thousands of independent nodes worldwide. No company, government, or individual can unilaterally alter balances, reverse settled transactions, or change the issuance schedule.',
    },
    {
        heading: 'Institutional participation',
        text: 'Public companies, asset managers, and regulated funds now hold Bitcoin on their balance sheets or offer exposure to clients. That participation has deepened liquidity and brought reporting and custody practices closer to those of conventional assets.',
    },
];

const rothSteps = [
    {
        step: '01',
        heading: 'Contribute after-tax dollars',
        text: 'A Roth IRA is funded with income you have already paid tax on. There is no deduction in the year you contribute — the benefit comes later.',
    },
    {
        step: '02',
        heading: 'Hold the asset inside the account',
        text: 'The account, not you personally, owns the Bitcoin. Buying, selling, and rebalancing happen inside the account rather than in a taxable brokerage account.',
    },
    {
        step: '03',
        heading: 'Growth is not taxed year to year',
        text: 'Because activity happens inside the IRA, gains are not realised as taxable events as they occur. Nothing is reported on your return simply because the position appreciated.',
    },
    {
        step: '04',
        heading: 'Qualified withdrawals come out tax-free',
        text: 'Once you are 59½ or older and the account has been open at least five years, qualified distributions from a Roth IRA are federally tax-free. Withdrawals taken before then may be taxed and penalised.',
    },
];

const differentiators = [
    {
        heading: 'A named person, not a ticket queue',
        text: 'You work with one broker who knows your account. Questions go to someone you have already spoken with, not to whoever picks up next.',
    },
    {
        heading: 'Institutional custody',
        text: 'Client assets are held with a qualified custodian using cold storage and multi-signature controls, segregated from company operating funds.',
    },
    {
        heading: 'No pressure to act',
        text: 'We do not run sales quotas on client accounts. If the honest answer is that the timing or the product is wrong for you, that is the answer you will get.',
    },
    {
        heading: 'Your money stays yours',
        text: 'No lock-up periods and no withdrawal penalties imposed by us. Retirement accounts remain subject to the IRS rules that govern them.',
    },
];

const securityPoints = [
    {
        heading: 'Cold storage by default',
        text: 'The overwhelming majority of client Bitcoin is held offline in cold storage. Only the working balance required to settle pending transactions is held in connected systems.',
    },
    {
        heading: 'Segregated client assets',
        text: 'Client holdings are recorded and held separately from company operating funds and are not lent, rehypothecated, or used as collateral.',
    },
    {
        heading: 'Independent verification',
        text: 'Holdings are reconciled against on-chain records and reviewed by third parties, so what the statement says can be checked against what the network shows.',
    },
    {
        heading: 'Identity and access controls',
        text: 'Withdrawals require verified identity and multi-party approval. Account changes are logged and confirmed through a channel separate from the request.',
    },
];

const faqs = [
    {
        question: 'Is Bitcoin safe to hold in a retirement account?',
        answer: 'The custody can be made very secure — cold storage, segregation, and multi-party approval are mature practices. The asset itself remains volatile, and that risk does not go away because the account is a retirement account. The two questions are worth keeping separate.',
    },
    {
        question: 'What happens when the price falls sharply?',
        answer: 'It has happened repeatedly and should be expected to happen again. Bitcoin has fallen more than 70% from a peak on several occasions. Position size should be set on the assumption that a drawdown of that scale will occur at some point while you hold it.',
    },
    {
        question: 'How much of a portfolio should be in Bitcoin?',
        answer: 'There is no single correct figure, and anyone who gives you one without knowing your circumstances is guessing. It depends on your time horizon, your other holdings, and how much of a decline you can hold through without selling. This is a conversation to have with a qualified adviser who knows your full position.',
    },
    {
        question: 'What protects my holdings if something happens to Northshore?',
        answer: 'Client assets are held with a qualified custodian and segregated from company operating funds, so they are not company property and are not available to company creditors. Ask us for the current custodian’s attestation before you fund an account.',
    },
    {
        question: 'What does it cost?',
        answer: 'Fees are disclosed in writing before you fund an account, and we will walk through them line by line. If a fee has not been shown to you in writing, it does not apply to your account.',
    },
    {
        question: 'Can I take money out whenever I want?',
        answer: 'We impose no lock-ups or withdrawal penalties. A retirement account is still bound by IRS rules, so an early distribution from an IRA may be taxable and may carry a penalty regardless of our policy.',
    },
    {
        question: 'Can I move an existing IRA or 401(k) across?',
        answer: 'Often yes, by transfer or rollover, though it depends on the account type and whether your current plan permits it. We will review your existing paperwork and tell you plainly if it is not possible.',
    },
    {
        question: 'How long does it take to open an account?',
        answer: 'Identity verification is usually same-day. Funding timelines depend on how you fund — a transfer from an existing retirement account is set by the releasing institution and typically takes longer than a direct contribution.',
    },
];

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-ink">{eyebrow}</p>
            <h3 className="mb-10 font-serif text-3xl italic text-ink md:text-4xl">{title}</h3>
        </>
    );
}

export default function GuidePage() {
    return (
        <SiteChrome>
            <main className="pt-20 xl:pt-24">
                {/* Hero */}
                <section className="mx-auto max-w-7xl px-6 pt-20 md:px-12 md:pt-28">
                    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="max-w-4xl">
                        <motion.p
                            variants={fadeIn}
                            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-ink"
                        >
                            Guide
                        </motion.p>
                        <motion.h2
                            variants={fadeIn}
                            className="mb-10 font-serif text-5xl font-normal leading-[1.1] italic text-ink md:text-6xl"
                        >
                            Bitcoin, retirement <br /> accounts, and the rules <br /> that govern both.
                        </motion.h2>
                        <motion.p variants={fadeIn} className="max-w-2xl text-lg leading-relaxed text-ink/70">
                            A plain-language guide to holding Bitcoin inside a tax-advantaged retirement account — what
                            changed, how the tax treatment works, where the risks sit, and what to ask before you fund
                            anything.
                        </motion.p>
                    </motion.div>

                    <nav className="mt-16 flex flex-wrap gap-x-8 gap-y-4 border-t border-elegant-border pt-8">
                        {sectionNav.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                className="text-[11px] font-medium uppercase tracking-[0.15em] text-ink/62 transition hover:text-gold-ink"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </section>

                {/* Regulatory shift */}
                <section
                    id="regulatory-shift"
                    className="mx-auto max-w-7xl border-t border-elegant-border px-6 py-24 md:px-12"
                >
                    <SectionHeading eyebrow="The Shift" title="What Actually Changed" />
                    <div className="max-w-3xl">
                        <p className="mb-16 text-base leading-relaxed text-ink/65">
                            Holding Bitcoin in a retirement account was awkward for most of its history — not because it
                            was forbidden, but because the custody and reporting infrastructure regulated providers
                            require did not exist yet. That is what changed.
                        </p>
                    </div>

                    <div className="border-l border-elegant-border">
                        {timeline.map((entry) => (
                            <div key={entry.title} className="relative pb-16 pl-12 last:pb-0">
                                <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-gold" />
                                <span className="mb-3 block font-serif text-[11px] uppercase italic tracking-widest text-ink/55">
                                    {entry.period}
                                </span>
                                <h4 className="mb-3 text-lg font-medium text-ink">{entry.title}</h4>
                                <p className="max-w-2xl text-sm leading-relaxed text-ink/65">{entry.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Understanding Bitcoin */}
                <section id="understanding-bitcoin" className="border-y border-elegant-border bg-gold/[0.04]">
                    <div className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                        <SectionHeading eyebrow="Understanding Bitcoin" title="Four Things Worth Understanding" />
                        <div className="grid gap-8 md:grid-cols-2">
                            {bitcoinAttributes.map((item) => (
                                <div
                                    key={item.heading}
                                    className="rounded-xl border border-elegant-border bg-elegant-card p-10 transition-colors hover:border-gold/20"
                                >
                                    <h4 className="mb-4 font-serif text-xl italic text-ink">{item.heading}</h4>
                                    <p className="text-sm leading-relaxed text-ink/65">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Tax-advantaged growth */}
                <section
                    id="tax-advantaged"
                    className="mx-auto max-w-7xl border-t border-elegant-border px-6 py-24 md:px-12"
                >
                    <SectionHeading eyebrow="Tax-Advantaged Growth" title="How a Roth IRA Changes the Maths" />
                    <div className="max-w-3xl">
                        <p className="mb-16 text-base leading-relaxed text-ink/65">
                            The asset behaves the same way wherever you hold it. What changes inside a Roth IRA is when
                            and whether the gains are taxed.
                        </p>
                    </div>

                    <div className="grid gap-px overflow-hidden rounded-xl border border-elegant-border bg-elegant-border md:grid-cols-2">
                        {rothSteps.map((item) => (
                            <div key={item.step} className="bg-elegant-card p-10">
                                <span className="mb-5 block font-serif text-2xl italic text-gold-ink">{item.step}</span>
                                <h4 className="mb-3 text-base font-medium text-ink">{item.heading}</h4>
                                <p className="text-sm leading-relaxed text-ink/65">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 rounded-xl border border-gold/25 bg-gold/[0.06] p-8">
                        <p className="text-sm leading-relaxed text-ink/78">
                            <span className="font-medium text-ink">Worth being precise about: </span>
                            a Roth IRA changes the tax treatment of your gains. It does not reduce the volatility of the
                            asset, insure it, or make a loss recoverable. Contribution limits, income limits, and the
                            five-year rule all apply, and they change from year to year — check the current IRS figures
                            rather than relying on a number you read somewhere.
                        </p>
                    </div>
                </section>

                {/* Why Northshore */}
                <section id="why-northshore" className="border-y border-elegant-border bg-gold/[0.04]">
                    <div className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                        <SectionHeading eyebrow="Why Northshore" title="How We Work" />
                        <div className="grid gap-8 md:grid-cols-2">
                            {differentiators.map((item) => (
                                <div
                                    key={item.heading}
                                    className="rounded-xl border border-elegant-border bg-elegant-card p-10 transition-colors hover:border-gold/20"
                                >
                                    <h4 className="mb-4 font-serif text-xl italic text-ink">{item.heading}</h4>
                                    <p className="text-sm leading-relaxed text-ink/65">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section id="security" className="mx-auto max-w-7xl border-t border-elegant-border px-6 py-24 md:px-12">
                    <SectionHeading eyebrow="Security" title="How Client Assets Are Held" />
                    <div className="grid gap-px overflow-hidden rounded-xl border border-elegant-border bg-elegant-border sm:grid-cols-2">
                        {securityPoints.map((item) => (
                            <div key={item.heading} className="bg-elegant-card p-10">
                                <h4 className="mb-3 text-base font-medium text-ink">{item.heading}</h4>
                                <p className="text-sm leading-relaxed text-ink/65">{item.text}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-10 text-sm text-ink/62">
                        Our registrations, licences, and audit posture are set out in full on the{' '}
                        <Link href="/compliance" className="text-gold-ink underline underline-offset-4">
                            compliance page
                        </Link>
                        .
                    </p>
                </section>

                {/* FAQ */}
                <section id="faq" className="border-y border-elegant-border bg-gold/[0.04]">
                    <div className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                        <SectionHeading eyebrow="FAQ" title="Questions We Are Asked Most" />
                        <div className="grid gap-px overflow-hidden rounded-xl border border-elegant-border bg-elegant-border">
                            {faqs.map((faq) => (
                                <div key={faq.question} className="bg-elegant-card p-10">
                                    <h4 className="mb-4 text-base font-medium text-ink">{faq.question}</h4>
                                    <p className="max-w-3xl text-sm leading-relaxed text-ink/65">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contact / CTA */}
                <section
                    id="guide-contact"
                    className="mx-auto max-w-7xl border-t border-elegant-border px-6 py-24 md:px-12"
                >
                    <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
                        <div>
                            <SectionHeading eyebrow="Talk to Us" title="Ask Before You Commit" />
                            <p className="mb-12 max-w-xl text-base leading-relaxed text-ink/65">
                                A consultation costs nothing and carries no obligation. Bring your existing statements
                                and your questions — including the sceptical ones. If a Bitcoin retirement account is
                                not the right fit for your situation, we will say so.
                            </p>
                            <div className="flex flex-wrap gap-5">
                                <Link
                                    href="/schedule"
                                    className="rounded-sm bg-gold px-8 py-4 text-xs font-bold uppercase tracking-widest text-ink transition hover:bg-gold-dark"
                                >
                                    Book a Consultation
                                </Link>
                                <a
                                    href={contactDetails.phoneHref}
                                    className="rounded-sm border border-elegant-border px-8 py-4 text-xs font-bold uppercase tracking-widest text-ink transition hover:bg-ink/5"
                                >
                                    {contactDetails.phone}
                                </a>
                            </div>
                        </div>

                        <div className="rounded-xl border border-elegant-border bg-elegant-card p-10">
                            <h4 className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
                                Desk Hours
                            </h4>
                            <p className="mb-8 text-sm leading-relaxed text-ink/65">{contactDetails.hours}</p>
                            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
                                Email
                            </h4>
                            <a
                                href={`mailto:${contactDetails.email}`}
                                className="text-sm text-ink transition hover:text-gold-ink"
                            >
                                {contactDetails.email}
                            </a>
                        </div>
                    </div>

                    <div className="mt-20 border-t border-elegant-border pt-10">
                        <p className="max-w-4xl text-xs leading-relaxed text-ink/62">
                            This guide is educational and is not investment, financial, tax, or legal advice. Northshore
                            Unlimited does not provide individualised recommendations through this page. Digital assets
                            are volatile and you may lose money, including your entire investment. Tax treatment depends
                            on your personal circumstances and on rules that change. Consult a qualified tax or
                            financial professional before acting. Full terms are set out on the{' '}
                            <Link href="/terms" className="text-gold-ink underline underline-offset-4">
                                terms of service
                            </Link>{' '}
                            page.
                        </p>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </SiteChrome>
    );
}
