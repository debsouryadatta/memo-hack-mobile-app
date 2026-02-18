import React from 'react';
import { GlassCard } from './ui/GlassCard';
import { Reveal } from './ui/Reveal';
import { Microscope, Activity, BookOpen, ArrowRight, Target, ChevronRight } from 'lucide-react';

interface BentoGridProps {
  onNavigate: (view: 'physics' | 'biology' | 'test-series') => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ onNavigate }) => {
  return (
    <section id="courses" className="py-12 md:py-32 px-3 md:px-4 max-w-7xl mx-auto relative overflow-hidden">
      {/* Section Background Decor */}
      <div className="absolute top-1/2 left-0 w-full h-[500px] bg-indigo-900/10 blur-[150px] -z-10 pointer-events-none"></div>

      <Reveal className="mb-6 md:mb-16 px-1">
        <h2 className="text-2xl md:text-6xl font-display font-bold mb-2 md:mb-6 tracking-tight">
          Structured <span className="text-indigo-400">Programs</span>
        </h2>
        <p className="text-gray-400 text-xs md:text-lg max-w-xl leading-relaxed">
          Comprehensive coaching for Classes VIII to XII. Meticulously crafted to ensure success in Boards, NEET, JEE, and Olympiads.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 auto-rows-auto md:auto-rows-[420px]">
        {/* Physics Card */}
        <div 
            className="md:col-span-1 row-span-1 cursor-pointer touch-manipulation"
            onClick={() => onNavigate('physics')}
        >
            <GlassCard className="h-full flex flex-col justify-between group relative overflow-hidden bg-[#0a0c28] !border-indigo-500/10 min-h-[220px] md:min-h-[300px] !p-4 md:!p-8 hover:!border-indigo-500/40 active:scale-[0.98] active:bg-indigo-900/20 transition-all duration-200">
                {/* HUD Corners */}
                <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-indigo-500/30"></div>
                <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-indigo-500/30"></div>
                <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-indigo-500/30"></div>
                <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-indigo-500/30"></div>

                {/* Custom SVG Illustration: Magnetic Fields / Quantum */}
                <div className="absolute right-[-10%] top-[-10%] w-[120%] h-[120%] opacity-15 group-hover:opacity-25 transition-all duration-700 ease-in-out pointer-events-none">
                     <svg viewBox="0 0 400 400" className="w-full h-full text-indigo-500">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-30"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        <circle cx="200" cy="200" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-[spin_20s_linear_infinite]" />
                        <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="4 4" className="animate-[spin_30s_linear_infinite_reverse]"/>
                        
                        {/* Field Lines */}
                        <path d="M0,200 Q200,0 400,200" fill="none" stroke="#818cf8" strokeWidth="1" className="opacity-40" />
                        <path d="M0,200 Q200,400 400,200" fill="none" stroke="#818cf8" strokeWidth="1" className="opacity-40" />
                        <path d="M50,200 Q200,100 350,200" fill="none" stroke="#6366f1" strokeWidth="1" className="opacity-30" />
                        <path d="M50,200 Q200,300 350,200" fill="none" stroke="#6366f1" strokeWidth="1" className="opacity-30" />
                     </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3 md:mb-8">
                        <div className="w-8 h-8 md:w-14 md:h-14 bg-indigo-500/10 rounded-lg md:rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                            <Activity size={16} className="md:w-7 md:h-7" />
                        </div>
                        <span className="text-[9px] md:text-xs font-mono text-indigo-400/50 uppercase tracking-widest border border-indigo-500/20 px-2 py-0.5 rounded-full bg-indigo-950/50">Module 01</span>
                    </div>
                    <h3 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 font-display tracking-tight text-white group-hover:text-indigo-200 transition-colors">Physics Mastery</h3>
                    <p className="text-indigo-200/60 text-[10px] md:text-lg max-w-md leading-relaxed">
                        Concepts over rote learning. Real-life mechanics, electrical visuals, and extensive problem practice. Classes VIII-XII.
                    </p>
                </div>
                
                <div className="relative z-10 mt-3 md:mt-8 flex items-center justify-between md:justify-start">
                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-2 text-indigo-400 font-medium group-hover:gap-4 transition-all text-sm">
                        <span>View Curriculum</span>
                        <ArrowRight size={14} className="md:w-4 md:h-4"/>
                    </div>
                    {/* Mobile CTA */}
                    <div className="flex md:hidden items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                        <span>Explore Physics</span>
                        <ChevronRight size={12} />
                    </div>
                </div>
            </GlassCard>
        </div>

        {/* Biology Card */}
        <div 
            className="md:col-span-1 row-span-1 cursor-pointer touch-manipulation"
            onClick={() => onNavigate('biology')}
        >
            <GlassCard className="h-full flex flex-col justify-between group relative overflow-hidden bg-[#050f0a] !border-green-500/10 min-h-[220px] md:min-h-[300px] !p-4 md:!p-8 hover:!border-green-500/40 active:scale-[0.98] active:bg-green-900/20 transition-all duration-200">
                {/* HUD Corners */}
                <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-green-500/30"></div>
                <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-green-500/30"></div>
                <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-green-500/30"></div>
                <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-green-500/30"></div>

                {/* Custom SVG: Voronoi / Cellular */}
                <div className="absolute right-[-10%] top-[-10%] w-[120%] h-[120%] opacity-15 group-hover:opacity-25 transition-all duration-700 ease-in-out pointer-events-none">
                    <svg viewBox="0 0 400 400" className="w-full h-full text-green-500">
                        <path d="M40,40 L100,20 L160,60 L120,120 L40,100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        <path d="M160,60 L240,40 L300,100 L220,160 L120,120 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        <path d="M40,100 L120,120 L100,200 L20,180 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        <path d="M120,120 L220,160 L200,260 L80,240 L100,200 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        {/* DNA Helix Abstract */}
                        <path d="M320,0 Q240,100 320,200 T320,400" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
                        <path d="M340,0 Q260,100 340,200 T340,400" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3 md:mb-8">
                        <div className="w-8 h-8 md:w-14 md:h-14 bg-green-500/10 rounded-lg md:rounded-2xl flex items-center justify-center border border-green-500/20 text-green-400 group-hover:bg-green-500/20 transition-colors">
                            <Microscope size={16} className="md:w-7 md:h-7" />
                        </div>
                        <span className="text-[9px] md:text-xs font-mono text-green-400/50 uppercase tracking-widest border border-green-500/20 px-2 py-0.5 rounded-full bg-green-950/50">Module 02</span>
                    </div>
                    <h3 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 font-display tracking-tight text-white group-hover:text-green-200 transition-colors">Biology System</h3>
                    <p className="text-green-200/60 text-[10px] md:text-lg max-w-md leading-relaxed">
                        Mnemonics & diagrams for 100% recall. NCERT mastery with engaging explanations. Classes VIII-XII.
                    </p>
                </div>

                <div className="relative z-10 mt-3 md:mt-8 flex items-center justify-between md:justify-start">
                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-2 text-green-400 font-medium group-hover:gap-4 transition-all text-sm">
                        <span>View Curriculum</span>
                        <ArrowRight size={14} className="md:w-4 md:h-4"/>
                    </div>
                    {/* Mobile CTA */}
                    <div className="flex md:hidden items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                        <span>Explore Biology</span>
                        <ChevronRight size={12} />
                    </div>
                </div>
            </GlassCard>
        </div>

         {/* Wide Card - Results with Graph Asset */}
        <div 
            className="md:col-span-2 row-span-1 cursor-pointer touch-manipulation" 
            id="results"
            onClick={() => onNavigate('test-series')}
        >
            <GlassCard className="h-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-12 bg-gradient-to-r from-[#0f1130] to-[#020420] relative overflow-hidden !p-4 md:!p-8 hover:border-purple-500/30 active:scale-[0.98] active:bg-purple-900/10 transition-all duration-200">
                {/* Background Graph Asset - Data Dashboard Style */}
                <div className="absolute bottom-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                         <path d="M0,200 L50,180 L100,190 L150,140 L200,160 L250,100 L300,120 L350,50 L400,80 L800,0" 
                               fill="none" stroke="#6366f1" strokeWidth="1" />
                         <path d="M0,200 L50,180 L100,190 L150,140 L200,160 L250,100 L300,120 L350,50 L400,80 L800,0 V200 H0 Z" 
                               fill="url(#gradGraph)" className="opacity-30" />
                         <defs>
                             <linearGradient id="gradGraph" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0" stopColor="#6366f1" stopOpacity="0.5"/>
                                 <stop offset="1" stopColor="#6366f1" stopOpacity="0"/>
                             </linearGradient>
                         </defs>
                         {/* Grid Lines */}
                         <line x1="0" y1="50" x2="800" y2="50" stroke="#ffffff" strokeWidth="0.2" strokeDasharray="4 4" />
                         <line x1="0" y1="100" x2="800" y2="100" stroke="#ffffff" strokeWidth="0.2" strokeDasharray="4 4" />
                         <line x1="0" y1="150" x2="800" y2="150" stroke="#ffffff" strokeWidth="0.2" strokeDasharray="4 4" />
                    </svg>
                </div>

                <div className="flex-1 relative z-10 w-full">
                    <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-6">
                         <div className="w-8 h-8 md:w-14 md:h-14 bg-purple-500/10 rounded-lg md:rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                            <Target size={16} className="md:w-7 md:h-7" />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-3xl font-bold font-display text-white">NRTS & JRTS</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                                <p className="text-purple-300/80 text-[10px] md:text-sm font-mono uppercase tracking-wider">Test Series Live</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-gray-400 text-[10px] md:text-lg max-w-2xl leading-relaxed">
                        Data-driven testing designed to improve <span className="text-white font-medium">accuracy</span> and <span className="text-white font-medium">speed</span>.
                    </p>
                </div>
                
                <div className="flex flex-col w-full md:w-auto gap-4 relative z-10">
                    <div className="grid grid-cols-2 gap-2 md:gap-6">
                        <div className="text-center px-3 py-2 md:px-8 md:py-6 bg-[#020420]/80 backdrop-blur-md rounded-lg md:rounded-3xl border border-white/10 shadow-xl group hover:border-indigo-500/50 transition-colors">
                            <div className="text-base md:text-3xl font-bold text-indigo-400 font-display">Weekly</div>
                            <div className="text-[8px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold group-hover:text-indigo-300">Analysis</div>
                        </div>
                        <div className="text-center px-3 py-2 md:px-8 md:py-6 bg-[#020420]/80 backdrop-blur-md rounded-lg md:rounded-3xl border border-white/10 shadow-xl group hover:border-purple-500/50 transition-colors">
                            <div className="text-base md:text-3xl font-bold text-purple-400 font-display">Daily</div>
                            <div className="text-[8px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold group-hover:text-purple-300">DPPs</div>
                        </div>
                    </div>
                    
                    {/* Mobile Button */}
                    <div className="flex md:hidden items-center justify-center gap-2 w-full bg-purple-500/10 border border-purple-500/20 py-2 rounded-lg text-purple-300 text-xs font-bold uppercase tracking-widest">
                        <span>Explore Test Series</span>
                        <ArrowRight size={12} />
                    </div>
                </div>
                
                 <div className="absolute right-4 bottom-4 hidden md:block">
                    <ArrowRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                </div>
            </GlassCard>
        </div>
      </div>
    </section>
  );
};