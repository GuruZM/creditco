import About from '@/components/hero-section/about';
import CtaBand from '@/components/hero-section/cta-band';
import Footer from '@/components/hero-section/footer';
import Hero from '@/components/hero-section/hero';
import HowItWorks from '@/components/hero-section/how-it-works';
import Nav from '@/components/hero-section/nav';
import Service from '@/components/hero-section/service';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

type HeroListing = {
    id: number;
    company: string;
    industry: string | null;
    amount: number;
    duration: string | null;
};

type HeroProps = {
    stats: {
        capital_requested: number;
        approved_capital: number;
        verified_borrowers: number;
        active_investors: number;
        live_listings: number;
        industries_served: number;
    };
    listings: HeroListing[];
};

export default function Welcome() {
    const { auth, hero } = usePage<SharedData & { hero: HeroProps }>().props;

    return (
        <>
            <Head title="CreditCo Invest — Capital that moves at the speed of business">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-black text-white antialiased">
                <Nav auth={auth} />
                <main>
                    <Hero auth={auth} hero={hero} />
                    <About />
                    <Service />
                    <HowItWorks />
                    <CtaBand auth={auth} />
                </main>
                <Footer />
            </div>
        </>
    );
}
