import { useState } from 'react';
import AppLogo from '../app-logo';
const Nav = ({ auth }: any) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('hero');

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMenuOpen(false);
    };
    return (
        <nav className="flex items-center justify-between gap-4 p-6">
            <div>
                <AppLogo />
            </div>
            <div className="flex">
                <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                        {[
                            { id: 'hero', label: 'Home' },
                            { id: 'about', label: 'About' },
                            { id: 'services', label: 'Services' },
                            { id: 'how-it-works', label: 'How It Works' },
                            // { id: 'contact', label: 'Contact' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                    activeSection === item.id
                                        ? 'bg-blue-50 text-black'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Nav;
