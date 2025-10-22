import { CheckCircle, Lock, Shield, Users } from 'lucide-react';
const About = () => {
    return (
        <section id="about" className="bg-white py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                        About Us
                    </h2>
                    <p className="mx-auto max-w-3xl text-xl text-gray-600">
                        We bridge the gap between SME's seeking funds and
                        investors looking for guaranteed returns
                    </p>
                </div>

                <div className="grid items-center gap-12 md:grid-cols-2">
                    <div>
                        <h3 className="mb-6 text-2xl font-bold text-gray-900">
                            How Our Platform Works
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <CheckCircle
                                    className="mt-1 text-green-500"
                                    size={20}
                                />
                                <p className="text-gray-600">
                                    SME's apply online with detailed information
                                    including loan amount, maturity, and credit
                                    history
                                </p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle
                                    className="mt-1 text-green-500"
                                    size={20}
                                />
                                <p className="text-gray-600">
                                    Our platform assesses credit risk and
                                    assigns appropriate interest rates
                                </p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle
                                    className="mt-1 text-green-500"
                                    size={20}
                                />
                                <p className="text-gray-600">
                                    Investors bid on loans anonymously during
                                    the soliciting period
                                </p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle
                                    className="mt-1 text-green-500"
                                    size={20}
                                />
                                <p className="text-gray-600">
                                    Once funded, investors receive credit claim
                                    documents guaranteeing returns
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-8">
                        <h3 className="mb-6 text-2xl font-bold text-gray-900">
                            Security & Transparency
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Shield className="text-blue-600" size={24} />
                                <span className="font-semibold text-gray-900">
                                    Smart Contracts
                                </span>
                            </div>
                            <p className="ml-9 text-gray-600">
                                All agreements are secured
                            </p>

                            <div className="flex items-center space-x-3">
                                <Lock className="text-blue-600" size={24} />
                                <span className="font-semibold text-gray-900">
                                    Anti-Money Laundering (AML) Compliance
                                </span>
                            </div>
                            <p className="ml-9 text-gray-600">
                                We comply with Anti-Money Laundering regulations
                                and conduct thorough due diligence checks
                            </p>

                            <div className="flex items-center space-x-3">
                                <Users className="text-blue-600" size={24} />
                                <span className="font-semibold text-gray-900">
                                    No Fund Storage
                                </span>
                            </div>
                            <p className="ml-9 text-gray-600">
                                We never store investor funds, ensuring maximum
                                security
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
