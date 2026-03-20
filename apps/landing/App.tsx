import React, { useState } from "react";
import { AdmissionDetails } from "./components/AdmissionDetails";
import { BentoGrid } from "./components/BentoGrid";
import { ComingSoon } from "./components/ComingSoon";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Methodology } from "./components/Methodology";
import { Navbar } from "./components/Navbar";
import { ProgramDetails } from "./components/ProgramDetails";
import { SocialMedia } from "./components/SocialMedia";
import { TestSeriesDetails } from "./components/TestSeriesDetails";
import { Grain } from "./components/ui/Grain";
import { WhatsAppFloatingButton } from "./components/WhatsAppFloatingButton";

type ViewState = "home" | "physics" | "biology" | "test-series" | "admission";

function App() {
  const [view, setView] = useState<ViewState>("home");

  const handleNavigation = (targetView: ViewState, sectionId?: string) => {
    setView(targetView);
    if (targetView === 'home' && sectionId) {
      // Small delay to ensure DOM is ready after view change
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020420] text-slate-800 dark:text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 font-sans relative transition-colors duration-300">
      <Grain />
      <Navbar onNavigate={handleNavigation} />
      <main className="relative z-10">
        {view === "home" ? (
          <>
            <Hero onNavigate={handleNavigation} />

            {/* Marquee Section */}
            <section className="py-4 md:py-12 border-y border-slate-200 dark:border-white/5 bg-slate-100/80 dark:bg-black/40 backdrop-blur-sm overflow-hidden">
              <div className="flex animate-marquee gap-8 md:gap-16 whitespace-nowrap items-center opacity-50 md:opacity-70">
                {[...Array(6)].map((_, i) => (
                  <React.Fragment key={i}>
                    <span className="text-sm md:text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-slate-400 to-slate-500 dark:from-gray-700 dark:to-gray-900 uppercase tracking-widest">
                      NRTS • NEET Raftaar Test Series
                    </span>
                    <span className="text-sm md:text-3xl font-display font-extrabold text-indigo-300/50 dark:text-indigo-900/50 uppercase tracking-widest">
                      JRTS • JEE Raftaar Test Series
                    </span>
                    <span className="text-sm md:text-3xl font-display font-extrabold text-green-300/50 dark:text-green-900/50 uppercase tracking-widest">
                      Biology
                    </span>
                    <span className="text-sm md:text-3xl font-display font-extrabold text-blue-300/50 dark:text-blue-900/50 uppercase tracking-widest">
                      Physics
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </section>

            <BentoGrid onNavigate={handleNavigation} />

            <Methodology />

            <section
              id="faculty"
              className="py-12 md:py-32 px-4 text-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#020420] dark:to-[#05062a]"
            >
              <h2 className="text-2xl md:text-6xl font-display font-extrabold mb-8 md:mb-16 tracking-tight text-slate-900 dark:text-white">
                Meet The <span className="text-indigo-600 dark:text-indigo-400">Founders</span>
              </h2>
              <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 max-w-5xl mx-auto">
                {/* Faculty 1 - Debargha Datta - Compact Mobile Card */}
                <div className="flex-1 p-4 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0b1e] hover:border-indigo-400/50 dark:hover:border-indigo-500/30 transition-all duration-500 cursor-pointer group relative overflow-hidden flex flex-row md:flex-col items-center gap-4 md:gap-0 shadow-sm dark:shadow-none">
                  <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Corner Accent */}
                  <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-indigo-500/30 md:hidden"></div>

                  <div className="w-16 h-16 md:w-32 md:h-32 bg-indigo-100 dark:bg-indigo-950 rounded-xl md:rounded-full md:mx-auto md:mb-8 overflow-hidden border-2 md:border-4 border-indigo-300/40 dark:border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors relative shadow-2xl flex-shrink-0">
                    <img
                      src="/assets/phy-mentor.png"
                      alt="Debargha Datta"
                      className="w-full h-full object-cover object-top relative z-10 group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>

                  <div className="text-left md:text-center">
                    <h3 className="text-sm md:text-2xl font-extrabold text-slate-900 dark:text-white mb-1 md:mb-2 font-display">
                      Debargha Datta
                    </h3>
                    <div className="inline-block px-1.5 py-0.5 md:px-3 md:py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-300/40 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[8px] md:text-xs font-bold font-mono mb-1 md:mb-6">
                      Co-Founder | Physics
                    </div>
                    <p className="text-slate-600 dark:text-gray-300 font-medium text-[10px] md:text-sm leading-relaxed hidden md:block">
                      4+ Years Exp. His mission is to remove the fear of
                      Physics. He uses real-life examples and extensive problem
                      practice to make Physics logical and learnable.
                    </p>
                    <p className="text-slate-500 dark:text-gray-400 font-medium text-[9px] leading-tight md:hidden">
                      Physics Expert. Simplifying complex mechanics with
                      real-life logic.
                    </p>
                  </div>
                </div>

                {/* Faculty 2 - Subhrapratim Bhattacharjee */}
                <div className="flex-1 p-4 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#06100a] hover:border-green-400/50 dark:hover:border-green-500/30 transition-all duration-500 cursor-pointer group relative overflow-hidden flex flex-row md:flex-col items-center gap-4 md:gap-0 shadow-sm dark:shadow-none">
                  <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Corner Accent */}
                  <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-green-500/30 md:hidden"></div>

                  <div className="w-16 h-16 md:w-32 md:h-32 bg-green-100 dark:bg-green-950 rounded-xl md:rounded-full md:mx-auto md:mb-8 overflow-hidden border-2 md:border-4 border-green-300/40 dark:border-green-500/20 group-hover:border-green-500/50 transition-colors relative shadow-2xl flex-shrink-0">
                    <img
                      src="/assets/bio-mentor.png"
                      alt="Subhrapratim Bhattacharjee"
                      className="w-full h-full object-cover object-top relative z-10 group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>

                  <div className="text-left md:text-center">
                    <h3 className="text-sm md:text-2xl font-extrabold text-slate-900 dark:text-white mb-1 md:mb-2 font-display">
                      Subhrapratim Bhattacharjee
                    </h3>
                    <div className="inline-block px-1.5 py-0.5 md:px-3 md:py-1 rounded-full bg-green-100 dark:bg-green-500/10 border border-green-300/40 dark:border-green-500/20 text-green-600 dark:text-green-400 text-[8px] md:text-xs font-bold font-mono mb-1 md:mb-6">
                      Founder | Biology
                    </div>
                    <p className="text-slate-600 dark:text-gray-300 font-medium text-[10px] md:text-sm leading-relaxed hidden md:block">
                      4+ Years Exp. Known for his hard work and student-centric
                      approach. He uses mnemonics and short tricks to make
                      Biology easy and engaging for NEET.
                    </p>
                    <p className="text-slate-500 dark:text-gray-400 font-medium text-[9px] leading-tight md:hidden">
                      Biology Mentor. Mnemonics master for 100% NCERT retention.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <ComingSoon />

            <Contact onNavigate={handleNavigation} />

            <SocialMedia />
          </>
        ) : view === "test-series" ? (
          <TestSeriesDetails onBack={() => handleNavigation("home")} />
        ) : view === "admission" ? (
          <AdmissionDetails onBack={() => handleNavigation("home")} />
        ) : (
          <ProgramDetails type={view} onBack={() => handleNavigation("home")} />
        )}
      </main>
      <Footer />
      
      {/* WhatsApp Floating Button */}
      <WhatsAppFloatingButton phoneNumber="917085690513" />
    </div>
  );
}

export default App;
