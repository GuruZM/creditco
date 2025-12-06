import { dashboard } from '@/routes';
import { Link } from '@inertiajs/react';
const Hero = ({ auth }: { auth: any }) => {
    return (
        <section
            id="hero"
            className="relative flex min-h-screen w-full items-center overflow-hidden bg-gradient-to-br from-black via-black to-black"
        >
            {/* Animated Particles Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="animate-float-1 absolute h-2 w-2 rounded-full bg-blue-200 opacity-60"
                    style={{ top: '10%', left: '10%', animationDelay: '0s' }}
                ></div>
                <div
                    className="animate-float-2 absolute h-1 w-1 rounded-full bg-white opacity-80"
                    style={{ top: '20%', left: '80%', animationDelay: '1s' }}
                ></div>
                <div
                    className="animate-float-3 absolute h-3 w-3 rounded-full bg-blue-100 opacity-40"
                    style={{ top: '60%', left: '15%', animationDelay: '2s' }}
                ></div>
                <div
                    className="animate-float-1 absolute h-1.5 w-1.5 rounded-full bg-white opacity-70"
                    style={{ top: '80%', left: '70%', animationDelay: '3s' }}
                ></div>
                <div
                    className="animate-float-2 absolute h-2 w-2 rounded-full bg-blue-200 opacity-50"
                    style={{ top: '40%', left: '90%', animationDelay: '4s' }}
                ></div>
                <div
                    className="animate-float-3 absolute h-1 w-1 rounded-full bg-white opacity-90"
                    style={{ top: '30%', left: '30%', animationDelay: '5s' }}
                ></div>
                <div
                    className="animate-float-1 absolute h-2.5 w-2.5 rounded-full bg-blue-100 opacity-30"
                    style={{ top: '70%', left: '40%', animationDelay: '6s' }}
                ></div>
                <div
                    className="animate-float-2 absolute h-1 w-1 rounded-full bg-white opacity-85"
                    style={{ top: '15%', left: '60%', animationDelay: '7s' }}
                ></div>
                <div
                    className="animate-float-3 absolute h-2 w-2 rounded-full bg-blue-200 opacity-45"
                    style={{ top: '85%', left: '20%', animationDelay: '8s' }}
                ></div>
                <div
                    className="animate-float-1 absolute h-1.5 w-1.5 rounded-full bg-white opacity-75"
                    style={{ top: '25%', left: '75%', animationDelay: '9s' }}
                ></div>
                <div
                    className="animate-float-2 absolute h-3 w-3 rounded-full bg-blue-100 opacity-35"
                    style={{ top: '55%', left: '85%', animationDelay: '10s' }}
                ></div>
                <div
                    className="animate-float-3 absolute h-1 w-1 rounded-full bg-white opacity-95"
                    style={{ top: '45%', left: '5%', animationDelay: '11s' }}
                ></div>
                <div
                    className="animate-float-1 absolute h-2 w-2 rounded-full bg-blue-200 opacity-55"
                    style={{ top: '75%', left: '95%', animationDelay: '12s' }}
                ></div>
                <div
                    className="animate-float-2 absolute h-1.5 w-1.5 rounded-full bg-white opacity-65"
                    style={{ top: '35%', left: '50%', animationDelay: '13s' }}
                ></div>
                <div
                    className="animate-float-3 absolute h-2.5 w-2.5 rounded-full bg-blue-100 opacity-25"
                    style={{ top: '90%', left: '60%', animationDelay: '14s' }}
                ></div>
            </div>

            <div className="relative z-10 mx-auto w-4/5 border-red-400 px-4 sm:px-6 lg:px-8">
                <div className="text-left">
                    <h1 className="mb-6 text-4xl font-bold text-white md:text-6xl">
                        Helping SME's
                        <span className="text-blue-200"> Scale</span>
                    </h1>
                    <p className="mb-8 max-w-3xl text-xl text-blue-100 md:text-2xl">
                        Peer-to-peer lending for SME's, providing quick and
                        secure access to capital for borrowers while giving
                        investors a guaranteed return on their investment
                        through our transparent platform.
                    </p>
                    <div className="justify-left flex flex-col gap-4 sm:flex-row">
                        <div className="flex gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="flex items-center rounded-sm border border-white px-5 py-1.5 text-sm leading-normal text-[#1b1b18] text-white hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="flex items-center rounded-sm border border-white px-5 py-1.5 text-sm leading-normal text-white hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                    >
                                        Log in
                                    </Link>

                                    <Link
                                        href="/signup"
                                        className="flex items-center rounded-sm border border-white px-5 py-1.5 text-sm leading-normal text-white hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {/* <div className="mt-16">
                    <Link
                        href="#about"
                        className="animate-bounce cursor-pointer rounded-full border-2 text-white transition-colors hover:text-blue-200"
                    >
                        <ChevronDown size={32} />
                    </Link>
                </div> */}
            </div>
            <style jsx>{`
                @keyframes float-1 {
                    0%,
                    100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    25% {
                        transform: translateY(-20px) translateX(10px);
                    }
                    50% {
                        transform: translateY(-10px) translateX(-5px);
                    }
                    75% {
                        transform: translateY(-15px) translateX(15px);
                    }
                }

                @keyframes float-2 {
                    0%,
                    100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    33% {
                        transform: translateY(-25px) translateX(-10px);
                    }
                    66% {
                        transform: translateY(-5px) translateX(20px);
                    }
                }

                @keyframes float-3 {
                    0%,
                    100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    20% {
                        transform: translateY(-15px) translateX(5px);
                    }
                    40% {
                        transform: translateY(-30px) translateX(-15px);
                    }
                    60% {
                        transform: translateY(-10px) translateX(10px);
                    }
                    80% {
                        transform: translateY(-20px) translateX(-5px);
                    }
                }

                .animate-float-1 {
                    animation: float-1 8s ease-in-out infinite;
                }
                .animate-float-2 {
                    animation: float-2 10s ease-in-out infinite;
                }
                .animate-float-3 {
                    animation: float-3 12s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
};

export default Hero;
