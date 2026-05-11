import { Github, Linkedin, Mail, Twitter } from 'lucide-react';
import AppLogo from '../app-logo';

const footerLinks = {
    Product: ['About', 'Services', 'How it works', 'Pricing'],
    Company: ['Story', 'Careers', 'Press', 'Contact'],
    Legal: ['Privacy policy', 'Terms of service', 'Risk disclosure', 'Cookies'],
};

const Footer = () => {
    return (
        <footer className="relative overflow-hidden border-t border-white/10 bg-black py-16 text-white">

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-12">
                    <div className="md:col-span-5">
                        <div className="text-white">
                            <AppLogo />
                        </div>
                        <p className="mt-4 max-w-sm text-sm text-white/60">
                            Connecting Zambian SMEs with investors through a
                            secure, transparent peer-to-peer lending platform.
                        </p>
                        <div className="mt-6 flex gap-2">
                            {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {Object.entries(footerLinks).map(([heading, items]) => (
                        <div key={heading} className="md:col-span-2">
                            <h4 className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                                {heading}
                            </h4>
                            <ul className="mt-4 space-y-2.5">
                                {items.map((item) => (
                                    <li key={item}>
                                        <a
                                            href="#"
                                            className="text-sm text-white/70 transition hover:text-white"
                                        >
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="md:col-span-1" />
                </div>

                <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
                    <p>
                        &copy; {new Date().getFullYear()} CreditCo Invest. All
                        rights reserved.
                    </p>
                    <p>Built in Zambia · Powered by trust.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
