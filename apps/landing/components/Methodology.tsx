import React from 'react';
import { Reveal } from './ui/Reveal';
import { Brain, Target, BarChart3, ChevronRight, Zap } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

export const Methodology: React.FC = () => {
  return (
    <section className="py-12 md:py-32 px-3 md:px-4 relative overflow-hidden bg-[#020420]">
      {/* Background radial gradient for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[800px] bg-indigo-500/5 rounded-full blur-[60px] md:blur-[100px] pointer-events-none"></div>

      {/* Background Decor - Neural Net */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="neural-net" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="currentColor" className="text-white"/>
              <circle cx="90" cy="90" r="1" fill="currentColor" className="text-white"/>
              <circle cx="90" cy="10" r="1" fill="currentColor" className="text-white"/>
              <line x1="10" y1="10" x2="90" y2="90" stroke="currentColor" strokeWidth="0.5" className="text-indigo-500"/>
              <line x1="90" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="0.5" className="text-indigo-500"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#neural-net)"/>
          </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <Reveal width="100%" className="mb-8 md:mb-20 text-center px-2">
          <h2 className="text-2xl md:text-6xl font-display font-extrabold mb-2 md:mb-6 tracking-tight">
            Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Excellence</span>
          </h2>
          <p className="text-gray-400 text-xs md:text-lg max-w-2xl mx-auto font-medium">
            Our algorithmic approach to competitive exams ensures every study hour translates directly into rank improvement.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-16 items-center">
          {/* Left: The Methodology Visual Asset */}
          <Reveal delay={0.2} width="100%">
            <div className="relative aspect-[4/3] rounded-xl md:rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden shadow-2xl shadow-indigo-900/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5"></div>
              
              {/* Complex SVG: The Neural Learning Architecture */}
              <svg viewBox="0 0 600 500" className="w-full h-full p-2 md:p-8">
                <defs>
                  <filter id="glow-method" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#312e81" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#312e81" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Central Core */}
                <g transform="translate(300, 250) scale(0.8)">
                  <circle r="60" fill="none" stroke="#6366f1" strokeWidth="1" className="opacity-20 animate-[spin_10s_linear_infinite]" />
                  <circle r="45" fill="none" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4" className="opacity-40 animate-[spin_15s_linear_infinite_reverse]" />
                  <circle r="20" fill="#4f46e5" className="opacity-20 animate-pulse" />
                  <circle r="8" fill="#fff" />
                </g>

                {/* Nodes */}
                {/* Node 1: Concept */}
                <g transform="translate(150, 150) scale(0.8)">
                  <line x1="0" y1="0" x2="187" y2="125" stroke="url(#line-grad)" strokeWidth="1" />
                  <circle r="30" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
                  <path d="M-10 -10 L10 10 M-10 10 L10 -10" stroke="#fff" strokeWidth="2" transform="scale(0.5)" />
                  <text y="50" x="0" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold" fontFamily="Syne">CONCEPT</text>
                </g>

                {/* Node 2: Practice */}
                <g transform="translate(450, 150) scale(0.8)">
                  <line x1="0" y1="0" x2="-187" y2="125" stroke="url(#line-grad)" strokeWidth="1" />
                  <circle r="30" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
                  <rect x="-10" y="-10" width="20" height="20" rx="2" stroke="#fff" strokeWidth="2" fill="none" transform="scale(0.5)" />
                   <text y="50" x="0" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold" fontFamily="Syne">PRACTICE</text>
                </g>

                {/* Node 3: Analysis */}
                <g transform="translate(150, 350) scale(0.8)">
                  <line x1="0" y1="0" x2="187" y2="-125" stroke="url(#line-grad)" strokeWidth="1" />
                  <circle r="30" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
                  <path d="M-10 10 L-5 10 L0 0 L5 10 L10 10" stroke="#fff" strokeWidth="2" fill="none" transform="scale(0.5)" />
                   <text y="50" x="0" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold" fontFamily="Syne">ANALYSIS</text>
                </g>

                {/* Node 4: Rank */}
                <g transform="translate(450, 350) scale(0.8)">
                  <line x1="0" y1="0" x2="-187" y2="-125" stroke="url(#line-grad)" strokeWidth="1" />
                  <circle r="30" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                  <polygon points="0,-10 8,5 -8,5" stroke="#fff" strokeWidth="2" fill="none" transform="scale(0.8)" />
                   <text y="50" x="0" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold" fontFamily="Syne">RANK</text>
                </g>
                
                {/* Data Flow Particles */}
                <circle r="3" fill="#fff" filter="url(#glow-method)">
                   <animateMotion dur="3s" repeatCount="indefinite" path="M120,120 L240,200" />
                </circle>
              </svg>
            </div>
          </Reveal>

          {/* Right: Content Cards */}
          <div className="space-y-2 md:space-y-6">
            <Reveal delay={0.3}>
              <GlassCard className="flex gap-3 md:gap-6 items-center group border-l-[3px] !border-l-indigo-500 !border-y-white/5 !border-r-white/5 bg-indigo-950/10 !p-3 md:!p-8 relative overflow-hidden">
                {/* Scanline Effect */}
                <div className="absolute top-0 left-0 w-[2px] h-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0 border border-indigo-500/20">
                  <Brain size={16} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="text-sm md:text-xl font-bold font-display text-white mb-0.5 md:mb-2">Cognitive Mapping</h3>
                  <p className="text-gray-400 text-[10px] md:text-sm leading-tight md:leading-relaxed font-medium">
                    Neural links between topics. Mechanics connects to Calculus.
                  </p>
                </div>
                <ChevronRight size={14} className="ml-auto text-indigo-500/50" />
              </GlassCard>
            </Reveal>

            <Reveal delay={0.4}>
              <GlassCard className="flex gap-3 md:gap-6 items-center group border-l-[3px] !border-l-purple-500 !border-y-white/5 !border-r-white/5 bg-purple-950/5 !p-3 md:!p-8 relative overflow-hidden">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0 border border-purple-500/20">
                  <Target size={16} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="text-sm md:text-xl font-bold font-display text-white mb-0.5 md:mb-2">Precision Testing</h3>
                  <p className="text-gray-400 text-[10px] md:text-sm leading-tight md:leading-relaxed font-medium">
                    AI-driven tests mimicking NTA patterns & difficulty.
                  </p>
                </div>
                <ChevronRight size={14} className="ml-auto text-purple-500/50" />
              </GlassCard>
            </Reveal>

            <Reveal delay={0.5}>
               <GlassCard className="flex gap-3 md:gap-6 items-center group border-l-[3px] !border-l-green-500 !border-y-white/5 !border-r-white/5 bg-green-950/5 !p-3 md:!p-8 relative overflow-hidden">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform flex-shrink-0 border border-green-500/20">
                  <BarChart3 size={16} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="text-sm md:text-xl font-bold font-display text-white mb-0.5 md:mb-2">Performance Analytics</h3>
                  <p className="text-gray-400 text-[10px] md:text-sm leading-tight md:leading-relaxed font-medium">
                    Granular insights: Speed, accuracy, & retention rates.
                  </p>
                </div>
                <ChevronRight size={14} className="ml-auto text-green-500/50" />
              </GlassCard>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};