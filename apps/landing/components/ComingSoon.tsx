import React from 'react';
import { Reveal } from './ui/Reveal';
import { GlassCard } from './ui/GlassCard';
import { Trophy, Star, Smartphone, Brain, ChevronRight, Sparkles } from 'lucide-react';

export const ComingSoon: React.FC = () => {
  return (
    <section className="py-16 md:py-32 px-3 md:px-4 relative overflow-hidden bg-[#020420]">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[700px] md:h-[700px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <Reveal width="100%" className="mb-10 md:mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5">
            <Sparkles size={12} className="text-indigo-400" />
            <span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest">Coming Soon</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-3 tracking-tight">
            What's Next
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto">
            New features and programs on the horizon.
          </p>
        </Reveal>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          {/* Card 1: Scholarship Program */}
          <Reveal delay={0.1}>
            <GlassCard className="h-full min-h-[360px] md:min-h-[420px] bg-[#0a0c1a] !border-white/5 hover:!border-indigo-500/20 transition-all duration-300 !p-5 md:!p-8 flex flex-col">
              {/* Icon */}
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 md:mb-6">
                <Trophy size={22} className="md:w-6 md:h-6 text-indigo-400" strokeWidth={1.5} />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/15 mb-4">
                <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
                <span className="text-[9px] md:text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">Merit Based</span>
              </div>

              <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-3 tracking-tight">
                Scholarship Program
              </h3>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-5 md:mb-6">
                Rewarding excellence with financial support. Merit-based scholarships for deserving students with up to <span className="text-indigo-300 font-medium">50% fee reduction</span>.
              </p>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 mb-5 md:mb-6">
                {['Performance Based', 'All Classes', 'Quarterly Tests'].map((tag, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 text-gray-400">
                    <Star size={9} className="text-indigo-400/70" fill="currentColor" />
                    <span className="text-[10px] md:text-xs">{tag}</span>
                  </div>
                ))}
              </div>

              {/* Footer (Pinned) */}
              <div className="mt-auto">
                {/* Spacer row to match card 2 platform area */}
                <div className="h-8 md:h-10"></div>

                <div className="flex items-center gap-1.5 text-indigo-400 text-sm font-medium">
                  <span>Announcement Soon</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </GlassCard>
          </Reveal>

          {/* Card 2: MemoHack AI Mobile App */}
          <Reveal delay={0.15}>
            <GlassCard className="h-full min-h-[360px] md:min-h-[420px] bg-[#0a0c1a] !border-white/5 hover:!border-indigo-500/20 transition-all duration-300 !p-5 md:!p-8 flex flex-col">
              {/* Icon */}
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 md:mb-6 relative">
                <Smartphone size={20} className="md:w-5 md:h-5 text-purple-400" strokeWidth={1.5} />
                <Brain size={10} className="absolute -bottom-0.5 -right-0.5 text-indigo-400 bg-[#0a0c1a] rounded-full p-0.5" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/15 mb-4">
                <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                <span className="text-[9px] md:text-[10px] font-semibold text-purple-300 uppercase tracking-wider">Mobile App</span>
              </div>

              <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-3 tracking-tight">
                MemoHack AI
              </h3>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-5 md:mb-6">
                Your personal AI study companion. Smart flashcards, adaptive quizzes, and <span className="text-purple-300 font-medium">intelligent doubt solving</span> — in your pocket.
              </p>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 mb-5 md:mb-6">
                {['AI Doubt Solver', 'Smart Flashcards', 'Progress Tracking'].map((tag, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 text-gray-400">
                    <Star size={9} className="text-purple-400/70" fill="currentColor" />
                    <span className="text-[10px] md:text-xs">{tag}</span>
                  </div>
                ))}
              </div>

              {/* Footer (Pinned) */}
              <div className="mt-auto">
                {/* Platform Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 text-gray-400">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="M17.523 15.341a.5.5 0 00-.023-.055 4.09 4.09 0 01-.456-1.873c0-1.488.825-2.786 2.042-3.465a.5.5 0 00.157-.705 4.579 4.579 0 00-3.628-2.013c-.865-.086-1.69.242-2.373.503-.456.174-.85.324-1.168.324-.356 0-.788-.165-1.289-.356-.65-.248-1.39-.53-2.214-.482-1.26.052-2.42.733-3.074 1.822-1.334 2.215-.345 5.531 1.12 7.355.757 1.138 1.693 2.42 2.96 2.375.558-.02 1.01-.187 1.45-.35.469-.174.925-.343 1.62-.343.658 0 1.09.161 1.535.327.46.172.933.35 1.577.334 1.295-.02 2.124-1.207 2.913-2.369a11.17 11.17 0 00.851-1.43.5.5 0 00-.023-.599z"/>
                      <path d="M14.082 4.182c.567-.707.952-1.7.847-2.682-.817.034-1.82.559-2.407 1.247-.525.614-.99 1.608-.867 2.56.897.07 1.818-.462 2.427-1.125z"/>
                    </svg>
                    <span className="text-[10px]">iOS</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 text-gray-400">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="M17.523 2.146a.5.5 0 01.354.854L14.753 6.124a.5.5 0 01-.708-.708L17.17 2.293a.5.5 0 01.354-.147zM6.477 2.146a.5.5 0 00-.354.854L9.247 6.124a.5.5 0 00.708-.708L6.83 2.293a.5.5 0 00-.354-.147zM5 8a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2H5zm3 3a1 1 0 110 2 1 1 0 010-2zm8 0a1 1 0 110 2 1 1 0 010-2z"/>
                    </svg>
                    <span className="text-[10px]">Android</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-purple-400 text-sm font-medium">
                  <span>Coming to App Stores</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
