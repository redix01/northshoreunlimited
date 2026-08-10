import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import React, { ReactNode, useState } from 'react';

type SharedPageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
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
        <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-elegant-border bg-elegant-bg/95 backdrop-blur-md">
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-12">
                <Link href="/" className="flex flex-col">
                    <h1 className="text-lg font-bold tracking-[0.4em] text-ink">
                        NORTHSHORE UNLIMITED
                    </h1>
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/60">
                        Institutional Digital Liquidity
                    </span>
                </Link>

                {!isPortal && (
                    <nav className="hidden items-center gap-8 text-[12px] font-medium uppercase tracking-[0.1em] text-ink/70 md:flex">
                        <Link href="/company" className="transition hover:text-gold-ink">
                            Company
                        </Link>
                        <Link href="/portal" className="transition hover:text-gold-ink">
                            Portal
                        </Link>
                    </nav>
                )}

                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-ink">
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
                        className="border-t border-elegant-border bg-elegant-bg px-6 py-6 md:hidden"
                    >
                        <div className="flex flex-col gap-6 text-xs uppercase tracking-widest text-ink/70">
                            <Link
                                href="/company"
                                onClick={() => setIsMenuOpen(false)}
                                className="transition hover:text-gold-ink"
                            >
                                Company
                            </Link>
                            <Link
                                href="/portal"
                                onClick={() => setIsMenuOpen(false)}
                                className="transition hover:text-gold-ink"
                            >
                                Portal
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

export function SiteFooter() {
    return (
        <footer className="mx-auto flex h-auto max-w-7xl flex-col items-center justify-between gap-4 border-t border-elegant-border px-6 py-8 text-[10px] uppercase tracking-[0.2em] text-ink/55 md:h-[80px] md:flex-row md:px-12 md:py-0">
            <div className="text-center md:text-left">&copy; 2026 NORTHSHORE UNLIMITED PARTNERS.</div>
            <div className="text-center md:block">PRIVATE ACCESS ONLY • JURISDICTIONAL RESTRICTIONS APPLY</div>
        </footer>
    );
}

export function SiteChrome({ children }: { children: ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-elegant-bg font-sans selection:bg-gold/30 selection:text-ink">
            <SiteNav isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            {children}
        </div>
    );
}
