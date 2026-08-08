import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

type SharedPageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
};

export const contactDetails = {
    phone: '+1 (818) 208-0918',
    phoneHref: 'tel:+18182080918',
    officeLine1: '21031 Ventura Blvd. Suite 200,',
    officeLine2: 'Woodland Hills, CA 91364',
    email: 'support@northshore.com',
    hours: 'Mon – Fri, 9:00 AM – 5:00 PM PST',
};

export const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const primaryNav = [
    { label: 'About', href: '/company' },
    { label: 'Proof of Reserves', href: '/#proof-of-reserves' },
];

const complianceMenu = [
    { label: 'Compliance', description: 'Licensing & certifications', href: '/compliance' },
    { label: 'Terms of Service', description: 'Usage terms and conditions', href: '/terms' },
];

const navLinkClass =
    'whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.1em] text-white/60 transition hover:text-gold';

/** Icon tile used by the contact card, matching the paired label/value rows. */
function IconTile({ children }: { children: ReactNode }) {
    return (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
            {children}
        </span>
    );
}

function NavDropdown({ label, children }: { label: string; children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapper = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!isOpen) return;

        const onPointerDown = (event: PointerEvent) => {
            if (!wrapper.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen]);

    useEffect(() => () => window.clearTimeout(closeTimer.current), []);

    const open = () => {
        window.clearTimeout(closeTimer.current);
        setIsOpen(true);
    };

    // A short delay keeps the panel reachable while the pointer crosses the gap.
    const scheduleClose = () => {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setIsOpen(false), 140);
    };

    return (
        <div ref={wrapper} className="relative" onMouseEnter={open} onMouseLeave={scheduleClose}>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 ${navLinkClass} ${isOpen ? 'text-gold' : ''}`}
            >
                {label}
                <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ComplianceMenu({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <div className="w-[300px] overflow-hidden rounded-2xl border border-elegant-border bg-elegant-card p-2 shadow-2xl shadow-black/60">
            {complianceMenu.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className="block rounded-xl px-4 py-3.5 transition hover:bg-white/5"
                >
                    <span className="block text-sm font-medium text-white">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-white/40">{item.description}</span>
                </Link>
            ))}
        </div>
    );
}

function ContactCard() {
    return (
        <div className="w-[380px] rounded-2xl border border-elegant-border bg-elegant-card p-7 shadow-2xl shadow-black/60">
            <div className="flex items-center gap-4">
                <IconTile>
                    <Mail className="h-5 w-5" />
                </IconTile>
                <h3 className="text-lg font-medium text-white">Contact Us</h3>
            </div>

            <div className="my-6 h-px bg-elegant-border" />

            <div className="space-y-6">
                <a href={contactDetails.phoneHref} className="group flex items-start gap-4">
                    <IconTile>
                        <Phone className="h-5 w-5" />
                    </IconTile>
                    <span className="pt-0.5">
                        <span className="block text-sm text-white/40">Call us</span>
                        <span className="mt-0.5 block text-base font-medium text-white transition group-hover:text-gold">
                            {contactDetails.phone}
                        </span>
                    </span>
                </a>

                <div className="flex items-start gap-4">
                    <IconTile>
                        <MapPin className="h-5 w-5" />
                    </IconTile>
                    <span className="pt-0.5">
                        <span className="block text-sm text-white/40">Office</span>
                        <span className="mt-0.5 block text-base font-medium leading-relaxed text-white">
                            {contactDetails.officeLine1}
                            <br />
                            {contactDetails.officeLine2}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export function SiteNav({
    isMenuOpen,
    setIsMenuOpen,
}: {
    isMenuOpen: boolean;
    setIsMenuOpen: (value: boolean) => void;
}) {
    const { url } = usePage<SharedPageProps>();
    const isPortal = url.split('?')[0] === '/portal';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-elegant-border bg-elegant-bg/95 backdrop-blur-md xl:h-24">
            <div className="mx-auto flex h-full max-w-7xl items-center gap-6 px-6 md:px-12 2xl:gap-10">
                <Link href="/" className="flex min-w-0 shrink-0 flex-col gap-1">
                    <h1 className="whitespace-nowrap text-[13px] font-bold tracking-[0.14em] text-white sm:text-base sm:tracking-[0.22em] xl:text-lg xl:tracking-[0.28em]">
                        NORTHSHORE UNLIMITED
                    </h1>
                    <span className="whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.18em] text-white/30 sm:text-[9px] sm:tracking-[0.2em]">
                        Personalized Bitcoin Brokerage
                    </span>
                </Link>

                {!isPortal && (
                    <>
                        <nav className="hidden flex-1 items-center justify-center gap-7 xl:flex 2xl:gap-10">
                            {primaryNav.map((item) => (
                                <Link key={item.label} href={item.href} className={navLinkClass}>
                                    {item.label}
                                </Link>
                            ))}
                            <NavDropdown label="Compliance">
                                <ComplianceMenu />
                            </NavDropdown>
                            <NavDropdown label="Support">
                                <ContactCard />
                            </NavDropdown>
                        </nav>

                        <div className="hidden shrink-0 items-center gap-5 xl:flex 2xl:gap-6">
                            <Link href="/portal" className={navLinkClass}>
                                Log In
                            </Link>
                            <span className="h-6 w-px bg-elegant-border" aria-hidden="true" />
                            <Link
                                href="/portal"
                                className="whitespace-nowrap rounded-sm border border-elegant-border px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:bg-white/5"
                            >
                                Sign Up
                            </Link>
                            <a
                                href="/#contact"
                                className="whitespace-nowrap rounded-sm bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-black transition hover:bg-neutral-200"
                            >
                                Book a Call
                            </a>
                        </div>
                    </>
                )}

                <div className="ml-auto xl:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white" aria-label="Toggle menu">
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-elegant-border bg-elegant-bg xl:hidden"
                    >
                        <div className="flex flex-col gap-6 px-6 py-8 text-xs uppercase tracking-widest text-white/60">
                            {primaryNav.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="transition hover:text-gold"
                                >
                                    {item.label}
                                </Link>
                            ))}

                            <div className="border-t border-elegant-border pt-6">
                                <span className="mb-4 block text-[10px] font-semibold tracking-[0.3em] text-white/25">
                                    Compliance
                                </span>
                                <div className="flex flex-col gap-4 pl-4">
                                    {complianceMenu.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="transition hover:text-gold"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-elegant-border pt-6">
                                <span className="mb-5 block text-[10px] font-semibold tracking-[0.3em] text-white/25">
                                    Contact Us
                                </span>
                                <div className="space-y-5 normal-case tracking-normal">
                                    <a href={contactDetails.phoneHref} className="flex items-start gap-4">
                                        <IconTile>
                                            <Phone className="h-5 w-5" />
                                        </IconTile>
                                        <span className="pt-0.5">
                                            <span className="block text-sm text-white/40">Call us</span>
                                            <span className="mt-0.5 block text-base font-medium text-white">
                                                {contactDetails.phone}
                                            </span>
                                        </span>
                                    </a>
                                    <div className="flex items-start gap-4">
                                        <IconTile>
                                            <MapPin className="h-5 w-5" />
                                        </IconTile>
                                        <span className="pt-0.5">
                                            <span className="block text-sm text-white/40">Office</span>
                                            <span className="mt-0.5 block text-base font-medium leading-relaxed text-white">
                                                {contactDetails.officeLine1}
                                                <br />
                                                {contactDetails.officeLine2}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 border-t border-elegant-border pt-6">
                                <Link
                                    href="/portal"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="transition hover:text-gold"
                                >
                                    Log In
                                </Link>
                                <Link
                                    href="/portal"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="transition hover:text-gold"
                                >
                                    Sign Up
                                </Link>
                                <a
                                    href="/#contact"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-fit rounded-sm bg-white px-6 py-3 text-[10px] font-bold tracking-[0.2em] text-black"
                                >
                                    Book a Call
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

const footerColumns = [
    {
        title: 'Platform',
        links: [
            { label: 'About', href: '/company' },
            { label: 'Proof of Reserves', href: '/#proof-of-reserves' },
            { label: 'Sign Up', href: '/portal' },
            { label: 'Login', href: '/portal' },
        ],
    },
    {
        title: 'Services',
        links: [
            { label: 'Crypto Trading', href: '/#contact' },
            { label: 'SMSF Solutions', href: '/#contact' },
            { label: 'Corporate Accounts', href: '/#contact' },
            { label: 'Become an Affiliate', href: '/#affiliates' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About', href: '/company' },
            { label: 'Contact Us', href: '/#contact' },
            { label: 'Compliance', href: '/compliance' },
            { label: 'Schedule a Call', href: '/#contact' },
            { label: 'Proof of Reserves', href: '/#proof-of-reserves' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Privacy Policy', href: '/compliance#data-protection' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Compliance', href: '/compliance' },
            { label: 'Trust Center', href: '/compliance' },
            { label: 'Proof of Reserves', href: '/#proof-of-reserves' },
        ],
    },
];

export function SiteFooter() {
    return (
        <footer className="border-t border-elegant-border">
            <div className="mx-auto max-w-7xl px-6 md:px-12">
                <div className="grid gap-10 border-b border-elegant-border py-14 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                        <h3 className="mb-3 font-serif text-2xl italic text-white">Market Updates</h3>
                        <p className="max-w-md text-sm leading-relaxed text-white/40">
                            Weekly market analysis and portfolio insights from our expert team.
                        </p>
                    </div>
                    <form
                        onSubmit={(event) => event.preventDefault()}
                        className="flex w-full max-w-md items-center gap-4"
                    >
                        <input
                            type="email"
                            placeholder="Email address"
                            className="w-full border-b border-elegant-border bg-transparent py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-gold"
                        />
                        <button
                            type="submit"
                            className="shrink-0 rounded-sm bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-neutral-200"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>

                <div className="grid gap-12 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
                    <div>
                        <h4 className="mb-4 text-sm font-bold tracking-[0.2em] text-white">NORTHSHORE UNLIMITED</h4>
                        <p className="max-w-xs text-sm leading-relaxed text-white/40">
                            Your personalized bitcoin brokerage. Invest, earn, and withdraw bitcoin with expert
                            guidance.
                        </p>
                    </div>

                    {footerColumns.map((column) => (
                        <div key={column.title}>
                            <h4 className="mb-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                                {column.title}
                            </h4>
                            <ul className="space-y-3 text-sm text-white/50">
                                {column.links.map((link) => (
                                    <li key={`${column.title}-${link.label}`}>
                                        <Link href={link.href} className="transition hover:text-gold">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-elegant-border py-8 text-[10px] uppercase tracking-[0.2em] text-white/20 md:flex-row">
                    <div className="text-center md:text-left">
                        &copy; 2026 Northshore Unlimited. All rights reserved.
                    </div>
                    <div className="text-center md:text-right">Personalized crypto brokerage</div>
                </div>
            </div>
        </footer>
    );
}

export function SiteChrome({ children }: { children: ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-elegant-bg font-sans selection:bg-gold selection:text-black">
            <SiteNav isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            {children}
        </div>
    );
}
