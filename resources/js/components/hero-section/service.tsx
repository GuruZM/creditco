import { ArrowRight, DollarSign, Users } from 'lucide-react';

const Service = () => {
    return (
        <section id="services" className="bg-gray-50 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                        Our Services
                    </h2>
                    <p className="text-xl text-gray-600">
                        Tailored solutions for borrowers and investors
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* For Borrowers */}
                    <div className="rounded-2xl bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
                        <div className="mb-6 text-center">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                                <DollarSign className="text-black" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                For SME's
                            </h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-blue-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Quick online application process
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-blue-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Automated credit risk assessment
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-blue-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Competitive interest rates
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-blue-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Fast funding once matched with investors
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-blue-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Flexible loan terms and amounts
                                </span>
                            </li>
                        </ul>
                        <div className="mt-6">
                            <button
                                // onClick={() => setShowSignupModal(true)}
                                className="w-full rounded-lg bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* For Investors */}
                    <div className="rounded-2xl bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
                        <div className="mb-6 text-center">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <Users className="text-green-600" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                For Investors
                            </h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-green-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Anonymous participation with coded usernames
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-green-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Bid for desired returns on loans
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-green-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Guaranteed return documents
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-green-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Earn profit through credit claims
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <ArrowRight
                                    className="mt-1 text-green-600"
                                    size={16}
                                />
                                <span className="text-gray-600">
                                    Transparent risk assessment information
                                </span>
                            </li>
                        </ul>
                        <div className="mt-6">
                            <button
                                // onClick={() => setShowSignupModal(true)}
                                className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
                            >
                                Start Investing
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Service;
