import React from "react";
import { GlassCard } from "./ui/GlassCard";
import { Reveal } from "./ui/Reveal";
import { MapPin, Phone, Mail, ArrowRight, GraduationCap, Calendar, IndianRupee, ChevronRight, MessageCircle } from "lucide-react";

interface ContactProps {
  onNavigate?: (view: 'admission') => void;
}

export const Contact: React.FC<ContactProps> = ({ onNavigate }) => {
  return (
    <section
      id="contact"
      className="py-12 md:py-24 px-3 md:px-4 relative overflow-hidden"
    >
      {/* Abstract Background Asset: Topographic / Quantum Field Lines */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-[#010212]">
        <svg
          className="w-full h-full opacity-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad1)" />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                style={{ stopColor: "#312e81", stopOpacity: 0 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#6366f1", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#312e81", stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>
        </svg>
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_100%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
          {/* Left Side: Visual & Info */}
          <Reveal>
            <div className="relative pt-4">
              <h2 className="text-3xl md:text-7xl font-display font-extrabold mb-3 md:mb-8 tracking-tight leading-[0.9]">
                BEGIN YOUR <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-white">
                  LEGACY
                </span>
              </h2>
              <p className="text-xs md:text-xl text-gray-300 font-medium max-w-lg leading-relaxed mb-6 md:mb-12">
                Join the elite cohort of students at Agartala's premier
                institute. Limited seats available for the 2025 Foundation and
                Target batches.
              </p>

              <div className="space-y-3 md:space-y-8">
                <div className="flex items-center gap-3 md:gap-6 group bg-white/5 p-3 rounded-lg md:bg-transparent md:p-0 border border-white/5 md:border-none">
                  <div className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors flex-shrink-0">
                    <MapPin
                      className="text-indigo-400 w-4 h-4 md:w-6 md:h-6"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-lg font-bold text-white mb-0 md:mb-1">
                      Offline Centre
                    </h4>
                    <p className="text-gray-400 font-medium text-[10px] md:text-base">
                      Skylark Club, Ker Chowmuhani, Agartala
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6 group bg-white/5 p-3 rounded-lg md:bg-transparent md:p-0 border border-white/5 md:border-none">
                  <div className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors flex-shrink-0">
                    <Phone
                      className="text-indigo-400 w-4 h-4 md:w-6 md:h-6"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-lg font-bold text-white mb-0 md:mb-1">
                      Contact number
                    </h4>
                    <p className="text-gray-400 font-medium text-[10px] md:text-base">
                      8787456991 / 9366635140
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6 group bg-white/5 p-3 rounded-lg md:bg-transparent md:p-0 border border-white/5 md:border-none">
                  <div className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors flex-shrink-0">
                    <Mail
                      className="text-indigo-400 w-4 h-4 md:w-6 md:h-6"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-lg font-bold text-white mb-0 md:mb-1">
                      Mail us on
                    </h4>
                    <p className="text-gray-400 font-medium text-[10px] md:text-base">
                      memohack9@gmail.com
                    </p>
                  </div>
                </div>

                <a 
                  href="https://wa.me/917085690513"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 group bg-gradient-to-r from-green-500/10 to-green-600/5 p-3 md:p-3 rounded-lg border border-green-500/30 hover:border-green-500/50 hover:from-green-500/20 hover:to-green-600/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 md:gap-6 flex-1">
                    <div className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center group-hover:bg-green-500/30 transition-colors flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-7 md:h-7 fill-green-400">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs md:text-lg font-bold text-white mb-0 md:mb-1">
                        WhatsApp Us
                      </h4>
                      <p className="text-gray-400 font-medium text-[10px] md:text-base">
                        +91 70856 90513
                      </p>
                    </div>
                  </div>
                  <div className="w-full md:w-auto">
                    <div className="bg-green-500/20 border border-green-500/40 hover:bg-green-500/30 hover:border-green-500/60 text-green-400 font-bold py-2.5 md:py-2 px-6 md:px-8 rounded-lg flex items-center justify-center gap-2 transition-all group-hover:scale-[1.02]">
                      <span className="text-xs md:text-sm">Chat Now</span>
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>

                {/* Apply Now - Google Form Button */}
                <a 
                  href="https://forms.gle/BjCzVJmNTdNxWNTW7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 group bg-indigo-500/10 p-3 md:p-3 rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 hover:bg-indigo-500/20 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 md:gap-6 flex-1">
                    <div className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors flex-shrink-0">
                      <GraduationCap className="w-4 h-4 md:w-7 md:h-7 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs md:text-lg font-bold text-white mb-0 md:mb-1">
                        Ready to Join?
                      </h4>
                      <p className="text-gray-400 font-medium text-[10px] md:text-base">
                        Fill out our admission form
                      </p>
                    </div>
                  </div>
                  <div className="w-full md:w-auto">
                    <div className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2.5 md:py-2 px-6 md:px-8 rounded-lg flex items-center justify-center gap-2 transition-all group-hover:scale-[1.02] shadow-lg shadow-indigo-500/20">
                      <span className="text-xs md:text-sm">Apply Now</span>
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </Reveal>

          {/* Right Side: Admission Card */}
          <Reveal delay={0.2} className="w-full">
            <div 
              onClick={() => onNavigate?.('admission')}
              className="cursor-pointer group"
            >
              <GlassCard className="!p-0 !bg-[#0a0c28]/80 !backdrop-blur-2xl !border-indigo-500/20 shadow-2xl shadow-indigo-900/20 relative overflow-hidden hover:!border-indigo-500/40 active:scale-[0.99] transition-all duration-300">
                {/* Background Decorative Elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 md:w-72 md:h-72 bg-gradient-to-br from-indigo-600/20 to-purple-600/10 rounded-full blur-[60px] md:blur-[100px] pointer-events-none group-hover:from-indigo-500/30 group-hover:to-purple-500/20 transition-all duration-700"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-tr from-purple-600/15 to-transparent rounded-full blur-[40px] md:blur-[60px] pointer-events-none"></div>
                
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-500">
                    <pattern id="contact-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.3"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#contact-grid)" />
                  </svg>
                </div>

                {/* HUD Corners */}
                <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-indigo-500/40 group-hover:border-indigo-400/60 transition-colors"></div>
                <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-indigo-500/40 group-hover:border-indigo-400/60 transition-colors"></div>
                <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-indigo-500/40 group-hover:border-indigo-400/60 transition-colors"></div>
                <div className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-indigo-500/40 group-hover:border-indigo-400/60 transition-colors"></div>

                {/* Content */}
                <div className="relative z-10 p-6 md:p-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 md:mb-8">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-colors shadow-lg shadow-indigo-500/10">
                        <GraduationCap size={24} className="md:w-8 md:h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-3xl font-display font-extrabold text-white group-hover:text-indigo-50 transition-colors">
                          Admissions
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
                          <span className="text-indigo-300/80 text-xs md:text-sm font-mono uppercase tracking-wider">Open Now</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow indicator - desktop */}
                    <div className="hidden md:flex w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 items-center justify-center text-indigo-300 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 md:mb-8 max-w-md">
                    Explore batch schedules, fee structures, and scholarship options for Physics & Biology classes (8-12).
                  </p>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
                    <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-indigo-300">
                      <Calendar size={14} className="md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm font-medium">Batch Schedule</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-green-950/50 border border-green-500/20 text-green-300">
                      <IndianRupee size={14} className="md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm font-medium">Fee Structure</span>
                    </div>
                  </div>

                  {/* Subject Icons */}
                  <div className="flex gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="flex-1 p-3 md:p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="3" />
                            <ellipse cx="12" cy="12" rx="10" ry="4" />
                            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
                            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm md:text-base">Physics</p>
                          <p className="text-gray-500 text-[10px] md:text-xs">JEE + Board</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-3 md:p-4 rounded-xl bg-green-950/30 border border-green-500/10 hover:border-green-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/20">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 3v18M15 3v18" />
                            <path d="M6 6h12M6 10h12M6 14h12M6 18h12" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm md:text-base">Biology</p>
                          <p className="text-gray-500 text-[10px] md:text-xs">NEET Focus</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-indigo-500 text-white py-3 md:py-4 rounded-xl font-extrabold text-sm md:text-base flex items-center justify-center gap-2 hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30">
                    View Batches & Fees
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p className="text-center text-[10px] md:text-xs text-gray-500 font-medium mt-4">
                    Class 8 - 12 • Physics & Biology • Limited Seats
                  </p>
                </div>
              </GlassCard>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
