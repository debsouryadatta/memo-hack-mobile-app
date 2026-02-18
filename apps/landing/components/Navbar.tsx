import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

interface NavbarProps {
  onNavigate?: (view: 'home' | 'admission', sectionId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    e.preventDefault();
    onNavigate?.('home', sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300`}
    >
      <div
        className={`
        relative flex items-center justify-between px-4 md:px-6 h-16 md:h-20
        transition-all duration-300 mx-auto
        ${
          scrolled
            ? "w-[95%] md:w-[60%] bg-indigo-950/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-indigo-500/10 rounded-full mt-2"
            : "w-full max-w-7xl bg-transparent border-transparent"
        }
      `}
      >
        {/* Logo */}
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('home'); }} className="flex-shrink-0 z-10 cursor-pointer">
          <img
            src="/assets/memohack-logo.png"
            alt="MemoHack"
            className="h-10 md:h-12 lg:h-14 w-auto object-contain drop-shadow-[0_0_10px_rgba(74,222,128,0.3)] hover:drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] transition-all"
          />
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300 ml-auto mr-8">
          <a
            href="#courses"
            onClick={(e) => handleNavClick(e, 'courses')}
            className="hover:text-green-400 transition-colors cursor-pointer"
          >
            Programs
          </a>
          <a
            href="#faculty"
            onClick={(e) => handleNavClick(e, 'faculty')}
            className="hover:text-green-400 transition-colors cursor-pointer"
          >
            Mentors
          </a>
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, 'contact')}
            className="hover:text-green-400 transition-colors cursor-pointer"
          >
            Contact
          </a>
        </div>

        {/* CTA */}
        <div className="hidden md:block">
          <button
            onClick={() => onNavigate?.('admission')}
            className="bg-green-500 text-indigo-950 px-5 py-2 rounded-full text-sm font-bold hover:bg-green-400 transition-colors flex items-center gap-2 group shadow-lg shadow-green-500/20"
          >
            Admission
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white p-1 ml-auto"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 md:top-20 left-3 right-3 bg-indigo-950/95 backdrop-blur-xl rounded-3xl p-6 flex flex-col gap-4 border border-white/10 md:hidden animate-fade-in-up shadow-2xl">
          <a
            href="#courses"
            onClick={(e) => handleNavClick(e, 'courses')}
            className="text-lg font-medium py-2 border-b border-white/5 cursor-pointer"
          >
            Programs
          </a>
          <a
            href="#faculty"
            onClick={(e) => handleNavClick(e, 'faculty')}
            className="text-lg font-medium py-2 border-b border-white/5 cursor-pointer"
          >
            Mentors
          </a>
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, 'contact')}
            className="text-lg font-medium py-2 border-b border-white/5 cursor-pointer"
          >
            Contact
          </a>
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate?.('admission');
            }}
            className="bg-green-500 text-indigo-950 w-full py-3.5 rounded-xl font-bold mt-2 flex items-center justify-center gap-2"
          >
            Admission <ArrowRight size={18} />
          </button>
        </div>
      )}
    </nav>
  );
};
