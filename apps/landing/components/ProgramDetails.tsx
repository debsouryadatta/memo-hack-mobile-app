import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Play, FileText, Download, ChevronRight, Atom, Dna, Loader2 } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Reveal } from './ui/Reveal';
import { fetchSheetData, ProgramClassData } from '../services/googleSheetsService';

interface ProgramDetailsProps {
  type: 'physics' | 'biology';
  onBack: () => void;
}

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({ type, onBack }) => {
  const [classData, setClassData] = useState<Record<number, ProgramClassData>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Fetch data from Google Sheets
    const loadData = async () => {
      try {
        setLoading(true);
        const sheetData = await fetchSheetData();
        const programData = type === 'physics' ? sheetData.physics_mastery : sheetData.biology_system;
        setClassData(programData);
      } catch (error) {
        console.error('Error loading sheet data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [type]);

  const getProgramData = () => {
    switch (type) {
      case 'physics':
        return {
            title: "Physics Mastery",
            subtitle: "From Newton to Quantum Mechanics",
            gradient: "from-indigo-400 to-purple-400",
            icon: <Atom size={32} />,
            themeColor: "indigo",
            classes: [8, 9, 10, 11, 12]
        };
      case 'biology':
        return {
            title: "Biology System",
            subtitle: "Mastering Life Sciences",
            gradient: "from-green-400 to-teal-400",
            icon: <Dna size={32} />,
            themeColor: "green",
            classes: [8, 9, 10, 11, 12]
        };
      default:
        return { title: "", subtitle: "", gradient: "", icon: null, themeColor: "gray", classes: [] };
    }
  };

  const data = getProgramData();

  // Helper to render content section
  const ContentSection = ({ subject, color, topic, classNum }: { subject?: string, color: string, topic: string, classNum: number }) => {
    const currentClassData = classData[classNum];
    
    const studyMaterials = [
      { 
        name: 'Chapter Wise Notes', 
        link: currentClassData?.chapter_notes_pdf || '#' 
      },
      { 
        name: 'Daily Practice Problems (DPP)', 
        link: currentClassData?.daily_dpp_pdf || '#' 
      }
    ];
    
    const demoTitle = currentClassData?.demo_lecture_title || topic;
    const demoDuration = currentClassData?.demo_lecture_duration || '45:00';
    const demoLink = currentClassData?.demo_lecture_youtube || '#';

    const handleVideoClick = () => {
      if (demoLink && demoLink !== '#') {
        window.open(demoLink, '_blank');
      }
    };

    return (
    <div className="flex flex-col gap-4">
        {subject && (
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center text-${color}-400 border border-${color}-500/30`}>
                    {subject === 'Physics' ? <Atom size={16} /> : <Dna size={16} />}
                </div>
                <h4 className={`text-lg font-display font-bold text-white`}>{subject}</h4>
            </div>
        )}
        
        {/* Study Materials */}
        <div>
            <h5 className={`flex items-center gap-2 text-[10px] font-bold text-${color}-400/80 uppercase tracking-widest mb-2`}>
                <BookOpen size={10} /> Study Material
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {studyMaterials.map((item, i) => (
                    <a 
                        key={i} 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all group/item"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded bg-${color}-500/20 text-${color}-400`}>
                                <FileText size={12} />
                            </div>
                            <span className="text-xs font-medium text-gray-300 group-hover/item:text-white transition-colors">{item.name}</span>
                        </div>
                        <Download size={12} className="text-gray-500 group-hover/item:text-white transition-colors" />
                    </a>
                ))}
            </div>
        </div>

        {/* Video */}
        <div>
            <h5 className={`flex items-center gap-2 text-[10px] font-bold text-${color}-400/80 uppercase tracking-widest mb-2`}>
                <Play size={10} /> Demo Lecture
            </h5>
            <div 
                onClick={handleVideoClick}
                className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-white/10 group/video cursor-pointer shadow-lg shadow-black/50"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-800"></div>
                <div className="absolute inset-0 flex items-center justify-center group-hover/video:scale-110 transition-transform">
                    <div className={`w-10 h-10 rounded-full bg-${color}-500 flex items-center justify-center text-black shadow-lg shadow-${color}-500/50`}>
                        <Play size={16} fill="currentColor" className="ml-1" />
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-xs font-bold text-white">{demoTitle}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Duration: {demoDuration} • HD</p>
                </div>
            </div>
        </div>
    </div>
  )};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020420] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading course data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020420] pb-20">
      
      {/* --- HEADER SECTION --- */}
      <div className="relative pt-24 pb-12 md:pt-32 md:pb-20 px-4 overflow-hidden">
        {/* Abstract Background */}
        <div className={`absolute top-0 left-0 w-full h-[500px] bg-${data.themeColor}-900/20 blur-[120px] pointer-events-none`}></div>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
             <svg width="100%" height="100%">
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className={`text-${data.themeColor}-500`}/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
             </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
            <button 
                onClick={onBack}
                className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 md:mb-12"
            >
                <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                    <ArrowLeft size={16} />
                </div>
                <span className="text-sm font-mono tracking-widest uppercase">Back to Home</span>
            </button>

            <Reveal>
                <div className="flex items-center gap-4 md:gap-6 mb-4">
                    <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl bg-${data.themeColor}-500/10 border border-${data.themeColor}-500/30 flex items-center justify-center text-${data.themeColor}-400 shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]`}>
                        {data.icon}
                    </div>
                    <div>
                        <h1 className={`text-3xl md:text-7xl font-display font-black tracking-tight text-white mb-1 md:mb-2`}>
                            {data.title}
                        </h1>
                        <p className={`text-${data.themeColor}-300/80 text-sm md:text-xl font-medium tracking-wide`}>
                            {data.subtitle}
                        </p>
                    </div>
                </div>
            </Reveal>
        </div>
      </div>

      {/* --- CLASSES GRID --- */}
      <div className="max-w-6xl mx-auto px-4 space-y-8 md:space-y-16">
        {data.classes.map((className, index) => (
            <Reveal key={className} delay={index * 0.1} width="100%">
                <div className="relative group">
                    {/* Connection Line */}
                    {index !== data.classes.length - 1 && (
                        <div className={`absolute left-4 md:left-8 top-12 bottom-[-64px] md:bottom-[-128px] w-0.5 bg-gradient-to-b from-${data.themeColor}-500/50 to-transparent z-0 hidden md:block`}></div>
                    )}

                    <div className="relative z-10">
                        {/* Class Label */}
                        <div className="flex items-center gap-4 mb-4 md:mb-6">
                             <div className={`flex items-center justify-center w-8 h-8 md:w-16 md:h-16 rounded-full bg-[#020420] border-2 border-${data.themeColor}-500/50 text-white font-display font-bold text-sm md:text-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                                {className}
                             </div>
                             <div className={`h-px flex-1 bg-gradient-to-r from-${data.themeColor}-500/50 to-transparent`}></div>
                             <span className={`text-${data.themeColor}-400 font-mono text-xs md:text-sm uppercase tracking-widest bg-${data.themeColor}-950/50 px-3 py-1 rounded-full border border-${data.themeColor}-500/20`}>
                                Academic Year 2024-25
                             </span>
                        </div>

                        {/* Content Card */}
                        <GlassCard className="!p-0 overflow-hidden bg-[#050614]/60 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all">
                            <div className="flex flex-col md:flex-row">
                                
                                {/* Left: Visual Cover */}
                                <div className="w-full md:w-[30%] min-h-[120px] md:min-h-[300px] relative overflow-hidden bg-black/40 border-b md:border-b-0 md:border-r border-white/5">
                                    <div className={`absolute inset-0 bg-${data.themeColor}-900/20 mix-blend-color`}></div>
                                    
                                    {/* Abstract Generated Graphic Placeholder */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                        <svg viewBox="0 0 200 200" className={`w-full h-full text-${data.themeColor}-500 animate-[spin-slow_20s_linear_infinite]`}>
                                             <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                             <path d="M100,20 L100,180 M20,100 L180,100" stroke="currentColor" strokeWidth="0.2" />
                                             <rect x="60" y="60" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(45 100 100)" />
                                        </svg>
                                    </div>
                                    
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-1">Class {className}</h3>
                                        <p className="text-xs text-gray-400 line-clamp-2">
                                            Comprehensive curriculum aligned with Board & Competitive exams.
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Content Sections */}
                                <div className="flex-1 p-4 md:p-8">
                                    <ContentSection 
                                        color={data.themeColor} 
                                        topic={type === 'physics' 
                                            ? `Introduction to Mechanics - Class ${className}` 
                                            : `Fundamental Unit of Life - Class ${className}`
                                        }
                                        classNum={className}
                                    />
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </Reveal>
        ))}
      </div>
      
      {/* Footer CTA in Details */}
      <div className="text-center mt-20 md:mt-32">
        <p className="text-gray-400 text-sm mb-4">Ready to start your journey?</p>
        <button onClick={() => document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'})} className={`bg-${data.themeColor}-500 text-black px-8 py-3 rounded-full font-bold text-sm md:text-base hover:scale-105 transition-transform shadow-lg shadow-${data.themeColor}-500/20`}>
            Enroll in Class {data.classes[0]} - {data.classes[data.classes.length-1]}
        </button>
      </div>

    </div>
  );
};
