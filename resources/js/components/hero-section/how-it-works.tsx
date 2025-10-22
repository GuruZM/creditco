const HowItWorks = () => {
    return (
        <section id="how-it-works" className="bg-white py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                        How It Works
                    </h2>
                    <p className="text-xl text-gray-600">
                        Simple steps to connect borrowers and investors
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-6">
                    {[
                        {
                            step: '1',
                            title: 'SME Applies',
                            description:
                                'Submit loan application with required details',
                        },
                        {
                            step: '2',
                            title: 'Risk Assessment',
                            description:
                                'Platform evaluates credit risk and assigns rate',
                        },
                        {
                            step: '3',
                            title: 'Loan Listed',
                            description:
                                'Application listed for investor solicitation',
                        },
                        {
                            step: '4',
                            title: 'Investors Bid',
                            description:
                                'Anonymous investors place bids for returns',
                        },
                        {
                            step: '5',
                            title: 'Funding Complete',
                            description: 'Loan funded and disbursed to SME',
                        },
                        {
                            step: '6',
                            title: 'Returns Earned',
                            description: 'Investors receive guaranteed returns',
                        },
                    ].map((item, index) => (
                        <div key={index} className="text-center">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-bold text-white">
                                {item.step}
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
