import React from 'react';
import { Reveal } from './ui/Reveal';
import { ArrowUpRight, Play, Atom, Binary, Dna, Calculator, Zap, FlaskConical, BrainCircuit, Magnet, Globe, GraduationCap } from 'lucide-react';
import { VideoCarousel } from './VideoCarousel';

interface HeroProps {
  onNavigate?: (view: 'admission') => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-4 pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-[#020420]">
      
      {/* --- BACKGROUND LAYERS --- */}
      
      {/* 1. Base Gradient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-600/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-green-500/10 rounded-full blur-[60px] md:blur-[100px] pointer-events-none mix-blend-screen"></div>

      {/* 2. Sliding Grid Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 hero-grid animate-grid-flow opacity-30 transform scale-125 origin-center"></div>
      </div>

      {/* 3. Floating Glass Elements (Mobile Optimized & Enriched) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* -- Left Side -- */}
        {/* Physics: Atom */}
        <div className="absolute top-[12%] left-[2%] md:top-[15%] md:left-[10%] animate-float opacity-70">
           <div className="glass-card p-1.5 md:p-3 rounded-xl md:rounded-2xl border-white/10 bg-indigo-500/5 backdrop-blur-sm rotate-[-12deg]">
             <Atom size={16} className="text-indigo-300 md:w-6 md:h-6" strokeWidth={1.5} />
           </div>
        </div>
        
        {/* Math: Calculator */}
        <div className="absolute top-[35%] left-[-2%] md:left-[5%] animate-float-delayed opacity-50 scale-75 md:scale-100">
           <div className="glass-card p-1.5 md:p-2 rounded-lg md:rounded-xl border-white/10 bg-purple-500/5 backdrop-blur-sm rotate-[6deg]">
             <Calculator size={14} className="text-purple-300 md:w-5 md:h-5" strokeWidth={1.5} />
           </div>
        </div>

        {/* Physics: Magnet */}
        <div className="absolute bottom-[30%] left-[5%] md:left-[12%] animate-float opacity-40">
           <div className="glass-card p-1.5 md:p-2 rounded-lg md:rounded-xl border-white/10 bg-red-500/5 backdrop-blur-sm rotate-[-15deg]">
             <Magnet size={14} className="text-red-300 md:w-5 md:h-5" strokeWidth={1.5} />
           </div>
        </div>

        {/* Biology: Leaf/Nature (Globe as proxy for bio-sphere) */}
        <div className="absolute bottom-[15%] left-[-5%] md:left-[8%] animate-float-delayed opacity-30 scale-90">
           <div className="glass-card p-1.5 md:p-2 rounded-lg md:rounded-xl border-white/10 bg-green-500/5 backdrop-blur-sm rotate-[10deg]">
             <Globe size={14} className="text-green-300 md:w-5 md:h-5" strokeWidth={1.5} />
           </div>
        </div>

        {/* -- Right Side -- */}
        {/* Biology: DNA */}
        <div className="absolute top-[15%] right-[2%] md:top-[20%] md:right-[10%] animate-float-delayed opacity-70">
           <div className="glass-card p-1.5 md:p-3 rounded-xl md:rounded-2xl border-white/10 bg-green-500/5 backdrop-blur-sm rotate-[12deg]">
             <Dna size={16} className="text-green-300 md:w-6 md:h-6" strokeWidth={1.5} />
           </div>
        </div>

        {/* Tech: Binary/Code */}
        <div className="absolute top-[40%] right-[-2%] md:right-[5%] animate-float opacity-50 scale-75 md:scale-100">
           <div className="glass-card p-1.5 md:p-2 rounded-lg md:rounded-xl border-white/10 bg-blue-500/5 backdrop-blur-sm rotate-[-6deg]">
             <Binary size={14} className="text-blue-300 md:w-5 md:h-5" strokeWidth={1.5} />
           </div>
        </div>

        {/* Chemistry: Flask */}
        <div className="absolute bottom-[25%] right-[5%] md:right-[15%] animate-float-delayed opacity-60">
           <div className="glass-card p-1.5 md:p-2 rounded-lg md:rounded-xl border-white/10 bg-yellow-500/5 backdrop-blur-sm rotate-[8deg]">
             <FlaskConical size={14} className="text-yellow-300 md:w-5 md:h-5" strokeWidth={1.5} />
           </div>
        </div>

         {/* Physics: Zap/Energy */}
        <div className="absolute bottom-[10%] right-[0%] md:right-[8%] animate-float opacity-30 scale-90">
           <div className="glass-card p-1.5 md:p-2 rounded-lg md:rounded-xl border-white/10 bg-orange-500/5 backdrop-blur-sm rotate-[-5deg]">
             <Zap size={14} className="text-orange-300 md:w-5 md:h-5" strokeWidth={1.5} />
           </div>
        </div>
        
        {/* Neuro: Brain */}
        <div className="absolute top-[8%] right-[30%] md:right-[35%] animate-float opacity-20 scale-75 hidden md:block">
           <div className="glass-card p-2 rounded-xl border-white/10 bg-pink-500/5 backdrop-blur-sm rotate-[3deg]">
             <BrainCircuit size={18} className="text-pink-300" strokeWidth={1.5} />
           </div>
        </div>
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 flex flex-col items-center max-w-5xl mx-auto w-full">
        
        <Reveal>
          <div className="inline-flex items-center gap-1.5 md:gap-3 border border-white/10 bg-white/5 backdrop-blur-xl px-2.5 py-1 md:px-4 md:py-1.5 rounded-full mb-6 md:mb-8 shadow-2xl shadow-green-900/10 hover:border-green-500/30 transition-all cursor-default group">
            <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500"></span>
            </span>
            <span className="text-gray-300 text-[8px] md:text-[10px] font-bold tracking-widest uppercase font-display group-hover:text-white transition-colors">
              Admissions Open <span className="text-gray-500 mx-1">|</span> Classes VIII to XII
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="text-center z-10 relative px-2">
            <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter leading-[0.9] text-white drop-shadow-2xl">
              CONCEPTS.
            </span>
            <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-indigo-200 to-indigo-500 drop-shadow-lg">
              CLARITY.
            </span>
            <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-400 to-green-600 drop-shadow-[0_0_30px_rgba(74,222,128,0.3)] mt-1 md:mt-2">
              CONFIDENCE.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.2} width="100%" className="flex justify-center z-10">
          <p className="mt-6 md:mt-10 text-xs md:text-xl text-indigo-100/70 text-center max-w-2xl font-light leading-relaxed px-6 md:px-0">
            Bridging the gap between <span className="text-white font-semibold">concept</span> and <span className="text-white font-semibold">rank</span>. 
            <br className="hidden md:block"/> Agartala's premier ecosystem for future doctors and engineers.
          </p>
        </Reveal>

        <Reveal delay={0.3} className="z-10 w-full flex justify-center">
          <div className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-8 sm:px-0">
            <button 
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-white text-indigo-950 rounded-full font-bold text-sm md:text-base hover:bg-green-50 transition-all hover:scale-105 shadow-[0_0_50px_-15px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 group"
            >
              Start Learning
              <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => onNavigate?.('admission')}
              className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-full font-bold text-sm md:text-base hover:bg-white/10 transition-colors flex items-center justify-center gap-3 group"
            >
               <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white text-indigo-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap size={14} className="md:w-[16px] md:h-[16px]" />
               </div>
              Admission
            </button>
          </div>
        </Reveal>

        {/* --- BOTTOM VISUAL ASSET: Video Carousel --- */}
        <div className="mt-12 md:mt-32 w-full max-w-4xl relative z-10 px-4">
          <Reveal delay={0.4} width="100%">
            <VideoCarousel 
              videos={[
                { url: 'https://youtu.be/K_cLZlI0Cl4?si=Rso6AqrR7B3XkabB', title: 'Understanding Physics: A Deep Dive' },
                { url: 'https://youtu.be/7cbm-vcRAmk?si=1QblcQ8NCaHn4x6u', title: 'Biology Fundamentals Explained' },
              ]}
              autoPlayInterval={5000}
            />
          </Reveal>
        </div>

      </div>
    </section>
  );
};