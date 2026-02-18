import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Atom, 
  Dna, 
  Clock, 
  Calendar, 
  IndianRupee, 
  ChevronRight,
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
  FileEdit
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Reveal } from './ui/Reveal';
import { fetchSheetData, AdmissionClassData } from '../services/googleSheetsService';

interface AdmissionDetailsProps {
  onBack: () => void;
}

type SubjectType = 'physics' | 'biology';
type ClassType = 8 | 9 | 10 | 11 | 12;

interface BatchSchedule {
  days: string;
  time: string;
  duration: string;
  startDate: string;
}

interface FeeStructure {
  monthly: number;
  quarterly: number;
  yearly: number;
  scholarship: string;
}

interface ClassData {
  batch: BatchSchedule;
  fees: FeeStructure;
  seats: number;
  highlights: string[];
}

// Static highlights data (these don't change dynamically)
const classHighlights: Record<SubjectType, Record<ClassType, string[]>> = {
  physics: {
    8: ['Foundation Mechanics', 'Basic Optics', 'Interactive Lab Sessions'],
    9: ['Motion & Laws', 'Gravitation', 'Work & Energy', 'Sound Waves'],
    10: ['Electricity & Magnetism', 'Light & Optics', 'Board Focused'],
    11: ['Complete Mechanics', 'Thermodynamics', 'Oscillations & Waves', 'JEE Mains Prep'],
    12: ['Electrostatics', 'Modern Physics', 'Optics Advanced', 'JEE Advanced Prep']
  },
  biology: {
    8: ['Cell Biology Basics', 'Living World', 'NCERT Foundation'],
    9: ['Tissues', 'Diversity in Living', 'Health & Disease', 'Food Production'],
    10: ['Life Processes', 'Heredity & Evolution', 'Board Pattern Focus'],
    11: ['Plant Physiology', 'Human Physiology', 'Structural Organisation', 'NEET Pattern'],
    12: ['Genetics', 'Biotechnology', 'Ecology', 'NEET 720/720 Target']
  }
};

const classes: ClassType[] = [12, 11, 10, 9, 8];

export const AdmissionDetails: React.FC<AdmissionDetailsProps> = ({ onBack }) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('physics');
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(12);
  const [admissionData, setAdmissionData] = useState<{
    physics: Record<number, AdmissionClassData>;
    biology: Record<number, AdmissionClassData>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Fetch data from Google Sheets
    const loadData = async () => {
      try {
        setLoading(true);
        const sheetData = await fetchSheetData();
        setAdmissionData(sheetData.admission);
      } catch (error) {
        console.error('Error loading sheet data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const getSubjectData = () => {
    return selectedSubject === 'physics' 
      ? {
          title: 'Physics',
          icon: <Atom size={24} />,
          themeColor: 'indigo',
          gradient: 'from-indigo-500 to-purple-500'
        }
      : {
          title: 'Biology',
          icon: <Dna size={24} />,
          themeColor: 'green',
          gradient: 'from-green-500 to-teal-500'
        };
  };

  const subjectInfo = getSubjectData();
  
  // Get class data from dynamic sheet data
  const getClassData = (): ClassData | null => {
    if (!selectedClass || !admissionData) return null;
    
    const sheetClassData = admissionData[selectedSubject][selectedClass];
    if (!sheetClassData) return null;
    
    return {
      batch: {
        days: sheetClassData.batch_days || 'TBD',
        time: sheetClassData.batch_time || 'TBD',
        duration: sheetClassData.batch_duration || 'TBD',
        startDate: sheetClassData.batch_start_date || 'TBD'
      },
      fees: {
        monthly: sheetClassData.fee_monthly || 0,
        quarterly: sheetClassData.fee_quarterly || 0,
        yearly: sheetClassData.fee_yearly || 0,
        scholarship: sheetClassData.scholarship || 'Contact for details'
      },
      seats: sheetClassData.available_seats || 0,
      highlights: classHighlights[selectedSubject][selectedClass] || []
    };
  };

  const classData = getClassData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020420] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading admission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020420] pb-20">
      
      {/* --- HEADER SECTION --- */}
      <div className="relative pt-24 pb-12 md:pt-32 md:pb-20 px-4 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-900/10 blur-[150px] pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-900/15 blur-[120px] pointer-events-none"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="admission-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-cyan-500"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#admission-grid)" />
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
            <div className="flex items-center gap-4 md:gap-6 mb-8">
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_40px_-5px_rgba(6,182,212,0.2)]">
                <GraduationCap size={32} />
              </div>
              <div>
                <h1 className="text-3xl md:text-6xl font-display font-black tracking-tight text-white mb-1 md:mb-2">
                  Admissions
                </h1>
                <p className="text-cyan-300/80 text-sm md:text-xl font-medium tracking-wide">
                  Batch Schedule & Fee Structure
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* --- SUBJECT SELECTOR --- */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <Reveal>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
            {/* Physics Tab */}
            <button
              onClick={() => { setSelectedSubject('physics'); setSelectedClass(12); }}
              className={`flex-1 group relative overflow-hidden rounded-2xl p-6 md:p-8 border transition-all duration-300 ${
                selectedSubject === 'physics'
                  ? 'bg-indigo-950/50 border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]'
                  : 'bg-[#0a0c28]/60 border-white/5 hover:border-indigo-500/30'
              }`}
            >
              {/* Background SVG */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-500">
                  <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="4 4" />
                  <path d="M100,20 L100,180 M20,100 L180,100" stroke="currentColor" strokeWidth="0.3" />
                  <ellipse cx="100" cy="100" rx="90" ry="30" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(30 100 100)" />
                  <ellipse cx="100" cy="100" rx="90" ry="30" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(-30 100 100)" />
                </svg>
              </div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center border transition-colors ${
                  selectedSubject === 'physics'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                    : 'bg-white/5 border-white/10 text-gray-400 group-hover:text-indigo-400'
                }`}>
                  <Atom size={28} />
                </div>
                <div className="text-left">
                  <h3 className={`text-xl md:text-2xl font-display font-bold transition-colors ${
                    selectedSubject === 'physics' ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>Physics</h3>
                  <p className={`text-xs md:text-sm transition-colors ${
                    selectedSubject === 'physics' ? 'text-indigo-300/80' : 'text-gray-500'
                  }`}>Class 8 - 12 • JEE/Board Focus</p>
                </div>
              </div>
              
              {selectedSubject === 'physics' && (
                <div className="absolute top-3 right-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </button>

            {/* Biology Tab */}
            <button
              onClick={() => { setSelectedSubject('biology'); setSelectedClass(12); }}
              className={`flex-1 group relative overflow-hidden rounded-2xl p-6 md:p-8 border transition-all duration-300 ${
                selectedSubject === 'biology'
                  ? 'bg-green-950/50 border-green-500/50 shadow-[0_0_40px_-10px_rgba(34,197,94,0.4)]'
                  : 'bg-[#050f0a]/60 border-white/5 hover:border-green-500/30'
              }`}
            >
              {/* Background SVG - DNA Helix */}
              <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                <svg viewBox="0 0 200 200" className="w-full h-full text-green-500">
                  <path d="M60,0 Q100,50 60,100 T60,200" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M140,0 Q100,50 140,100 T140,200" fill="none" stroke="currentColor" strokeWidth="2" />
                  {/* Cross bars */}
                  <line x1="60" y1="25" x2="140" y2="25" stroke="currentColor" strokeWidth="1" />
                  <line x1="60" y1="75" x2="140" y2="75" stroke="currentColor" strokeWidth="1" />
                  <line x1="60" y1="125" x2="140" y2="125" stroke="currentColor" strokeWidth="1" />
                  <line x1="60" y1="175" x2="140" y2="175" stroke="currentColor" strokeWidth="1" />
                  {/* Circles at intersections */}
                  <circle cx="60" cy="50" r="4" fill="currentColor" opacity="0.5" />
                  <circle cx="140" cy="50" r="4" fill="currentColor" opacity="0.5" />
                  <circle cx="100" cy="100" r="4" fill="currentColor" opacity="0.5" />
                  <circle cx="60" cy="150" r="4" fill="currentColor" opacity="0.5" />
                  <circle cx="140" cy="150" r="4" fill="currentColor" opacity="0.5" />
                </svg>
              </div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center border transition-colors ${
                  selectedSubject === 'biology'
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-white/5 border-white/10 text-gray-400 group-hover:text-green-400'
                }`}>
                  <Dna size={28} />
                </div>
                <div className="text-left">
                  <h3 className={`text-xl md:text-2xl font-display font-bold transition-colors ${
                    selectedSubject === 'biology' ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>Biology</h3>
                  <p className={`text-xs md:text-sm transition-colors ${
                    selectedSubject === 'biology' ? 'text-green-300/80' : 'text-gray-500'
                  }`}>Class 8 - 12 • NEET Focus</p>
                </div>
              </div>
              
              {selectedSubject === 'biology' && (
                <div className="absolute top-3 right-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
          </div>
        </Reveal>
      </div>

      {/* --- CLASS GRID --- */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <Reveal delay={0.1}>
          <h3 className={`text-lg md:text-2xl font-display font-bold mb-6 flex items-center gap-3 ${
            selectedSubject === 'physics' ? 'text-indigo-300' : 'text-green-300'
          }`}>
            <BookOpen size={20} />
            Select Class for {subjectInfo.title}
          </h3>
          
          <div className="grid grid-cols-5 gap-3 md:gap-4">
            {classes.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`group relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-6 border transition-all duration-300 ${
                  selectedClass === cls
                    ? selectedSubject === 'physics'
                      ? 'bg-indigo-950/60 border-indigo-500/60 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)]'
                      : 'bg-green-950/60 border-green-500/60 shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]'
                    : 'bg-[#050614]/80 border-white/5 hover:border-white/20'
                }`}
              >
                {/* Decorative corner */}
                <div className={`absolute top-1 right-1 w-2 h-2 border-t border-r transition-colors ${
                  selectedClass === cls
                    ? selectedSubject === 'physics' ? 'border-indigo-500/50' : 'border-green-500/50'
                    : 'border-white/10'
                }`}></div>
                
                <div className="text-center">
                  <div className={`text-2xl md:text-4xl font-display font-black transition-colors ${
                    selectedClass === cls
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-white'
                  }`}>{cls}</div>
                  <div className={`text-[8px] md:text-xs font-mono uppercase tracking-wider mt-1 transition-colors ${
                    selectedClass === cls
                      ? selectedSubject === 'physics' ? 'text-indigo-400' : 'text-green-400'
                      : 'text-gray-600'
                  }`}>Class</div>
                </div>
                
                {selectedClass === cls && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                    selectedSubject === 'physics' ? 'bg-indigo-500' : 'bg-green-500'
                  }`}></div>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* --- BATCH & FEE DETAILS --- */}
      {selectedClass && classData && (
        <div className="max-w-6xl mx-auto px-4">
          <Reveal delay={0.2}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              
              {/* Batch Schedule Card */}
              <GlassCard className={`!p-0 overflow-hidden border-${subjectInfo.themeColor}-500/20 hover:border-${subjectInfo.themeColor}-500/40 bg-[#050614]/60`}>
                <div className={`p-6 md:p-8 border-b border-white/5 bg-gradient-to-r ${
                  selectedSubject === 'physics' 
                    ? 'from-indigo-950/50 to-transparent' 
                    : 'from-green-950/50 to-transparent'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedSubject === 'physics'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-display font-bold text-white">Batch Schedule</h4>
                      <p className="text-gray-400 text-sm">Class {selectedClass} • {subjectInfo.title}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 space-y-6">
                  {/* Schedule Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className={selectedSubject === 'physics' ? 'text-indigo-400' : 'text-green-400'} />
                        <span className="text-gray-400 font-medium">Days</span>
                      </div>
                      <span className="text-white font-bold">{classData.batch.days}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Clock size={18} className={selectedSubject === 'physics' ? 'text-indigo-400' : 'text-green-400'} />
                        <span className="text-gray-400 font-medium">Timing</span>
                      </div>
                      <span className="text-white font-bold">{classData.batch.time}</span>
                    </div>
                  </div>
                  
                  {/* Start Date Highlight */}
                  <div className={`p-4 rounded-xl border ${
                    selectedSubject === 'physics'
                      ? 'bg-indigo-950/30 border-indigo-500/20'
                      : 'bg-green-950/30 border-green-500/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        selectedSubject === 'physics' ? 'bg-indigo-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-gray-400 text-sm">New Batch Starting</span>
                    </div>
                    <p className={`text-lg font-bold mt-1 ${
                      selectedSubject === 'physics' ? 'text-indigo-300' : 'text-green-300'
                    }`}>{classData.batch.startDate}</p>
                  </div>
                  
                  {/* Highlights */}
                  <div className="pt-4 border-t border-white/5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Course Highlights</h5>
                    <div className="flex flex-wrap gap-2">
                      {classData.highlights.map((highlight, i) => (
                        <span key={i} className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border ${
                          selectedSubject === 'physics'
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                            : 'bg-green-500/10 border-green-500/20 text-green-300'
                        }`}>
                          <CheckCircle size={10} />
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Fee Structure Card */}
              <GlassCard className={`!p-0 overflow-hidden border-${subjectInfo.themeColor}-500/20 hover:border-${subjectInfo.themeColor}-500/40 bg-[#050614]/60`}>
                <div className={`p-6 md:p-8 border-b border-white/5 bg-gradient-to-r ${
                  selectedSubject === 'physics' 
                    ? 'from-indigo-950/50 to-transparent' 
                    : 'from-green-950/50 to-transparent'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedSubject === 'physics'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      <IndianRupee size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-display font-bold text-white">Fee Structure</h4>
                      <p className="text-gray-400 text-sm">Class {selectedClass} • {subjectInfo.title}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 space-y-6">
                  {/* Fee Options */}
                  <div className="space-y-4">
                    <div className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-400 text-sm">Monthly</span>
                          <div className="flex items-center gap-1 mt-1">
                            <IndianRupee size={18} className="text-white" />
                            <span className="text-2xl font-display font-bold text-white">{classData.fees.monthly.toLocaleString()}</span>
                            <span className="text-gray-500 text-sm">/month</span>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    
                    <div className={`group p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedSubject === 'physics'
                        ? 'bg-indigo-950/30 border-indigo-500/30 hover:border-indigo-500/50'
                        : 'bg-green-950/30 border-green-500/30 hover:border-green-500/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={selectedSubject === 'physics' ? 'text-indigo-300' : 'text-green-300'} style={{fontSize: '14px'}}>Quarterly</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              selectedSubject === 'physics'
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>POPULAR</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <IndianRupee size={18} className="text-white" />
                            <span className="text-2xl font-display font-bold text-white">{classData.fees.quarterly.toLocaleString()}</span>
                            <span className="text-gray-500 text-sm">/3 months</span>
                          </div>
                        </div>
                        <ChevronRight size={20} className={`transition-colors ${
                          selectedSubject === 'physics' ? 'text-indigo-400' : 'text-green-400'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">Yearly</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400">BEST VALUE</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <IndianRupee size={18} className="text-white" />
                            <span className="text-2xl font-display font-bold text-white">{classData.fees.yearly.toLocaleString()}</span>
                            <span className="text-gray-500 text-sm">/year</span>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Scholarship Info */}
                  <div className={`p-4 rounded-xl border ${
                    selectedSubject === 'physics'
                      ? 'bg-gradient-to-r from-indigo-950/40 to-purple-950/20 border-indigo-500/20'
                      : 'bg-gradient-to-r from-green-950/40 to-teal-950/20 border-green-500/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedSubject === 'physics'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        <GraduationCap size={16} />
                      </div>
                      <div>
                        <h5 className="text-white font-bold text-sm mb-1">Scholarships</h5>
                        <p className={`text-sm ${
                          selectedSubject === 'physics' ? 'text-indigo-300/80' : 'text-green-300/80'
                        }`}>Coming Soon</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA */}
                  <a 
                    href="https://forms.gle/BjCzVJmNTdNxWNTW7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-4 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      selectedSubject === 'physics'
                        ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20'
                        : 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20'
                    }`}
                  >
                    Enroll Now for Class {selectedClass}
                    <ExternalLink size={18} />
                  </a>
                </div>
              </GlassCard>
            </div>
          </Reveal>
        </div>
      )}

      {/* Floating Apply Now CTA Section */}
      <div className="max-w-6xl mx-auto px-4 mt-12">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-indigo-950/60 border border-indigo-500/20 p-6 md:p-10">
            {/* Background Effects */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            {/* Decorative Grid */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <svg width="100%" height="100%">
                <pattern id="cta-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-indigo-400"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#cta-grid)" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-4">
                  <FileEdit size={14} />
                  <span>Admission Open 2025</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-extrabold text-white mb-2">
                  Ready to Start Your Journey?
                </h3>
                <p className="text-gray-400 text-sm md:text-base max-w-md">
                  Fill out our admission form and take the first step towards academic excellence at MemoHack.
                </p>
              </div>
              
              <a 
                href="https://forms.gle/BjCzVJmNTdNxWNTW7"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-shrink-0 w-full md:w-auto"
              >
                <div className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-4 px-8 md:px-12 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 group-hover:scale-[1.02]">
                  <span className="text-base md:text-lg">Apply Now</span>
                  <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </a>
            </div>
          </div>
        </Reveal>
      </div>

    </div>
  );
};
