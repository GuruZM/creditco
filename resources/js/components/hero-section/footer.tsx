import AppLogo from '../app-logo';

const Footer = () => {
    return (
        <footer className="bg-black py-12 text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-8 md:grid-cols-4">
                    <div className="flex flex-col gap-3 md:col-span-2">
                        <AppLogo />
                        <p className="mb-4 text-gray-300">
                            Connecting borrowers with investors through secure,
                            transparent lending solutions.
                        </p>
                    </div>
                    <div>
                        <h4 className="mb-4 text-lg font-semibold">
                            Quick Links
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <button className="text-gray-300 transition-colors hover:text-white">
                                    About
                                </button>
                            </li>
                            <li>
                                <button className="text-gray-300 transition-colors hover:text-white">
                                    Services
                                </button>
                            </li>
                            <li>
                                <button className="text-gray-300 transition-colors hover:text-white">
                                    How It Works
                                </button>
                            </li>
                            <li>
                                <button className="text-gray-300 transition-colors hover:text-white">
                                    Contact
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 text-lg font-semibold">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="#"
                                    className="text-gray-300 transition-colors hover:text-white"
                                >
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-gray-300 transition-colors hover:text-white"
                                >
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-gray-300 transition-colors hover:text-white"
                                >
                                    Risk Disclosure
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-800 pt-8 text-center">
                    <p className="text-gray-300">
                        &copy; 2025 CreditCo Invest. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
