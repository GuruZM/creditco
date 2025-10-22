import About from '@/components/hero-section/about';
import Footer from '@/components/hero-section/footer';
import Hero from '@/components/hero-section/hero';
import HowItWorks from '@/components/hero-section/how-it-works';
import Nav from '@/components/hero-section/nav';
import Service from '@/components/hero-section/service';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] text-[#1b1b18] lg:justify-center dark:bg-[#0a0a0a]">
                <header className="w-4/5 text-sm not-has-[nav]:hidden lg:max-w-4/5">
                    <Nav auth={auth} />
                </header>
                <Hero auth={auth} />
                <About />
                <Service />
                <HowItWorks />

                <div className="hidden h-14.5 lg:block"></div>
            </div>
            <Footer />
        </>
    );
}
