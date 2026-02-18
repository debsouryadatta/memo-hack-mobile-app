import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Download,
  Activity,
  Target,
  Zap,
  Trophy,
  Timer,
  BarChart,
  Loader2,
} from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { Reveal } from "./ui/Reveal";
import { fetchSheetData, TestSeriesData } from "../services/googleSheetsService";

interface TestSeriesDetailsProps {
  onBack: () => void;
}

export const TestSeriesDetails: React.FC<TestSeriesDetailsProps> = ({
  onBack,
}) => {
  const [testSeriesData, setTestSeriesData] = useState<{ nrts: TestSeriesData; jrts: TestSeriesData } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Fetch data from Google Sheets
    const loadData = async () => {
      try {
        setLoading(true);
        const sheetData = await fetchSheetData();
        setTestSeriesData(sheetData.test_series);
      } catch (error) {
        console.error('Error loading sheet data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const programs = [
    {
      id: "nrts" as const,
      title: "NRTS",
      subtitle: "NEET Raftaar Test Series",
      description:
        "A rigorously designed test series mirroring the NTA NEET pattern. Focuses on speed, accuracy, and NCERT-based questions.",
      theme: "green",
      icon: <Activity size={32} />,
      features: [
        "NCERT Line-by-Line",
        "Assertion-Reasoning",
        "Section A & B Pattern",
      ],
      poster: "/assets/NRTS-poster.jpeg",
    },
    {
      id: "jrts" as const,
      title: "JRTS",
      subtitle: "JEE Raftaar Test Series",
      description:
        "Engineered for JEE Mains & Advanced. High-level problems involving multi-concept application and numerical reasoning.",
      theme: "indigo",
      icon: <Zap size={32} />,
      features: [
        "Integer Type Questions",
        "Multi-Correct Options",
        "Previous Year Trends",
      ],
      poster: "/assets/JRTS-poster.jpeg",
    },
  ];

  // Get dynamic assets for a program
  const getAssets = (programId: 'nrts' | 'jrts') => {
    const data = testSeriesData?.[programId];
    return [
      {
        type: "material",
        label: "Test Schedule & Syllabus",
        sub: data?.schedule_syllabus_title || (programId === 'nrts' ? "Phase 1 - 2024-25" : "Mains + Advanced Protocol"),
        link: data?.schedule_syllabus_pdf || '#',
      },
      {
        type: "pdf",
        label: "Sample Mock Test",
        sub: data?.mock_test_title || (programId === 'nrts' ? "Full Length Paper - 01" : "Integer & MCQs Pattern"),
        link: data?.mock_test_pdf || '#',
      },
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020420] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading test series data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020420] pb-20">
      {/* --- HEADER SECTION --- */}
      <div className="relative pt-24 pb-12 md:pt-32 md:pb-20 px-4 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 blur-[120px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-900/20 blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 md:mb-12"
          >
            <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
              <ArrowLeft size={16} />
            </div>
            <span className="text-sm font-mono tracking-widest uppercase">
              Back to Home
            </span>
          </button>

          <Reveal>
            <div className="flex items-center gap-4 md:gap-6 mb-4">
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]">
                <Target size={32} />
              </div>
              <div>
                <h1 className="text-3xl md:text-7xl font-display font-black tracking-tight text-white mb-1 md:mb-2">
                  Test Series
                </h1>
                <p className="text-purple-300/80 text-sm md:text-xl font-medium tracking-wide">
                  Assess. Analyze. Accelerate.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* --- CARDS SECTION --- */}
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        {programs.map((program, index) => (
          <Reveal key={program.id} delay={index * 0.1} width="100%">
            <GlassCard
              className={`relative overflow-hidden !p-0 border-${program.theme}-500/20 hover:border-${program.theme}-500/40 group`}
            >
              {/* Background Decor */}
              <div
                className={`absolute top-[-50%] right-[-10%] w-[60%] h-[200%] bg-gradient-to-l from-${program.theme}-900/20 to-transparent skew-x-12 pointer-events-none`}
              ></div>

              <div className="flex flex-col md:flex-row">
                {/* Left: Visual Identity */}
                <div className="w-full md:w-[35%] relative min-h-[200px] md:min-h-auto bg-[#000]/40 overflow-hidden border-b md:border-b-0 md:border-r border-white/5 p-8 flex flex-col justify-between">
                  {/* Abstract SVG Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <pattern
                        id={`grid-${program.id}`}
                        width="10"
                        height="10"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 10 0 L 0 0 0 10"
                          fill="none"
                          stroke="currentColor"
                          className={`text-${program.theme}-500`}
                          strokeWidth="0.5"
                        />
                      </pattern>
                      <rect
                        width="100%"
                        height="100%"
                        fill={`url(#grid-${program.id})`}
                      />
                    </svg>
                  </div>

                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-${program.theme}-500/20 flex items-center justify-center text-${program.theme}-400 mb-6 border border-${program.theme}-500/30`}
                    >
                      {program.icon}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter mb-2">
                      {program.title}
                    </h2>
                    <h3
                      className={`text-xl font-medium text-${program.theme}-300`}
                    >
                      {program.subtitle}
                    </h3>
                  </div>

                  <div className="relative z-10 mt-8">
                    <div className="flex gap-2 flex-wrap">
                      {program.features.map((feature, i) => (
                        <span
                          key={i}
                          className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Content & Poster */}
                <div className="flex-1 p-6 md:p-10">
                  <p className="text-gray-300 text-sm md:text-lg mb-6 leading-relaxed max-w-2xl">
                    {program.description}
                  </p>

                  {/* Poster Image */}
                  <div className="relative rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all group/poster mb-6">
                    <img
                      src={program.poster}
                      alt={`${program.title} Poster`}
                      className="w-full h-auto object-cover group-hover/poster:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity"></div>
                  </div>

                  {/* Downloadable Assets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {getAssets(program.id).map((asset, i) => (
                      <a
                        key={i}
                        href={asset.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/asset relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-lg bg-${program.theme}-500/10 text-${program.theme}-400 group-hover/asset:bg-${program.theme}-500/20 transition-colors`}
                          >
                            {asset.type === "material" ? (
                              <FileText size={20} />
                            ) : (
                              <BarChart size={20} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm md:text-base">
                              {asset.label}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {asset.sub}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full bg-[#020420] flex items-center justify-center text-gray-400 group-hover/asset:text-${program.theme}-400 border border-white/10 group-hover/asset:border-${program.theme}-500/30 transition-all`}
                        >
                          <Download size={14} />
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Additional Info / Stats */}
                  <div className="mt-8 pt-8 border-t border-white/5 flex gap-8">
                    <div>
                      <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">
                        <Trophy size={12} /> Target
                      </div>
                      <div className="text-white font-display font-bold text-lg">
                        {program.id === "nrts" ? "720/720" : "300/300"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      <div className="text-center mt-20 md:mt-32">
        <p className="text-gray-400 text-sm mb-4">
          Want to analyze your performance?
        </p>
        <button
          onClick={() =>
            document
              .getElementById("contact")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold text-sm md:text-base hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20"
        >
          Register for Next Test
        </button>
      </div>
    </div>
  );
};
