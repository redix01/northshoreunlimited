import { motion } from 'motion/react';

import { fadeIn, SiteChrome, SiteFooter, staggerContainer } from '../Components/SiteChrome';

export default function CompanyPage() {
    return (
        <SiteChrome>
            <main className="mx-auto min-h-[calc(100vh-60px)] max-w-7xl px-6 pt-32 md:px-12">
                <section className="py-12 lg:py-20">
                    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="max-w-4xl">
                        <motion.p variants={fadeIn} className="mb-4 text-[11px] uppercase tracking-[0.3em] text-gold-ink font-semibold">
                            Institutional Heritage
                        </motion.p>
                        <motion.h2 variants={fadeIn} className="mb-10 font-serif text-5xl font-normal leading-[1.1] italic text-ink md:text-6xl">
                            The Northshore standard of excellence.
                        </motion.h2>
                        <motion.div variants={fadeIn} className="grid gap-12 text-lg leading-relaxed text-ink/70 md:grid-cols-2">
                            <p>
                                Founded on the principles of absolute discretion and professional integrity, Northshore Unlimited Partners serves as a critical bridge between digital asset markets and institutional capital requirements. We specialize in non-custodial, high-volume settlement services tailored for private clients and global firms.
                            </p>
                            <p>
                                Our approach combines proprietary compliance software with a dedicated human-led settlement desk, ensuring that every transaction meets the highest standards of regulatory governance and operational efficiency.
                            </p>
                        </motion.div>
                    </motion.div>

                    <div className="mt-24 grid gap-8 sm:grid-cols-3">
                        {[
                            { detail: '$1.2T', title: 'Annual Trading Volume*' },
                            { detail: '$376B', title: 'Assets on Platform*' },
                            { detail: '100+', title: 'Countries' },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group flex flex-col items-center rounded-xl border border-elegant-border bg-elegant-card p-12 text-center transition-colors hover:border-gold/20"
                            >
                                <p className="mb-4 text-4xl font-serif italic tracking-tight text-ink">{item.detail}</p>
                                <h4 className="text-[10px] uppercase tracking-[0.3em] text-ink/60 font-semibold">{item.title}</h4>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-6 text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">* As of 12/31/25</p>
                    </div>

                    <div className="relative mt-24 overflow-hidden rounded-2xl border border-elegant-border bg-gold/[0.05] p-12">
                        <div className="relative z-10 max-w-2xl">
                            <h3 className="mb-6 font-serif text-3xl italic text-ink">Our Mission</h3>
                            <p className="text-lg leading-relaxed text-ink/65">
                                To provide the most secure and private infrastructure for high-velocity capital movement in the digital age, without compromising on jurisdictional integrity or operational speed.
                            </p>
                        </div>
                        <div className="pointer-events-none absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-gold/5 to-transparent" />
                    </div>

                    <div className="mt-12 grid gap-8 md:grid-cols-2">
                        <div className="group rounded-2xl border border-elegant-border bg-elegant-card p-10 transition-colors hover:border-gold/20">
                            <h3 className="mb-6 font-serif text-xl italic text-ink">Full-reserve exchange and qualified custodian</h3>
                            <p className="text-sm leading-relaxed text-ink/65">
                                At Northshore Unlimited, trust and security are our top priorities. Northshore Unlimited Trust Company (NSTC) is a full-reserve exchange and qualified custodian under the New York Banking Law and is licensed by the New York State Department of Financial Services. Northshore Unlimited, LLC utilizes the eOTC settlement and wallet infrastructure, which is managed by NSTC, which is SOC-2 Type II compliant.
                            </p>
                        </div>
                        <div className="group rounded-2xl border border-elegant-border bg-elegant-card p-10 transition-colors hover:border-gold/20">
                            <h3 className="mb-6 font-serif text-xl italic text-ink">Our Commitment to Compliance</h3>
                            <p className="text-sm leading-relaxed text-ink/65">
                                A strong compliance foundation is critical to Northshore Unlimited mission of being the most trusted crypto platform. To this end, we have developed a Compliance Program that is rooted in best practices from traditional financial services as well as innovative, sophisticated compliance technology to bring the Bitcoin industry forward. We hold a high standard for what assets we list, what services we provide, and who has access to our products.
                            </p>
                        </div>
                    </div>

                    <div className="mt-24 border-t border-elegant-border py-24">
                        <div className="max-w-3xl">
                            <h3 className="mb-8 font-serif text-3xl italic text-ink">Advancing Economic Freedom</h3>
                            <div className="space-y-6 text-lg leading-relaxed text-ink/70">
                                <p>
                                    Bitcoin creates economic freedom by ensuring that people can participate fairly in the economy, and Northshore Unlimited is on a mission to increase economic freedom for more than 1 billion people.
                                </p>
                                <p>
                                    We’re updating the century-old financial system by providing a trusted platform that makes it easy for people and institutions to engage with Bitcoin assets, including trading, staking, safekeeping, spending, and fast, free global transfers.
                                </p>
                                <p>
                                    We also provide critical infrastructure for onchain activity and support builders who share our vision that onchain is the new online. And together with the Bitcoin community, we advocate for responsible rules to make the benefits of Bitcoin available around the world.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-24 grid gap-8 md:grid-cols-2">
                        <div className="rounded-2xl border border-elegant-border bg-gold/[0.04] p-10">
                            <h4 className="mb-6 text-[10px] uppercase tracking-[0.3em] text-gold-ink font-semibold">Institutional Grade</h4>
                            <h3 className="mb-6 text-2xl font-serif italic text-ink">Tailor-made OTC Solutions</h3>
                            <p className="text-sm leading-relaxed text-ink/65">
                                Our OTC solution is tailor-made for institutional traders and investors.¹ Execute trades by partnering with Northshore’s OTC trading desk or manage your own trading execution strategy through eOTC, Northshore’s automated trading platform.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-elegant-border bg-gold/[0.04] p-10">
                            <h4 className="mb-6 text-[10px] uppercase tracking-[0.3em] text-gold-ink font-semibold">Governance</h4>
                            <h3 className="mb-6 text-2xl font-serif italic text-ink">Global Regulatory Engagement</h3>
                            <p className="text-sm leading-relaxed text-ink/65">
                                We have worked with regulatory stakeholders and lawmakers around the world to help shape thoughtful regulation that fosters both consumer protection and innovation. We have spent considerable time applying for and becoming licensed and regulated in various jurisdictions across the world. This is not the easier path but we believe it is the right one.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </SiteChrome>
    );
}
