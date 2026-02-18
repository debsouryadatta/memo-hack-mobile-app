import React, { useState } from 'react';
import { GlassCard } from './ui/GlassCard';
import { generateInstituteAsset } from '../services/geminiService';
import { Sparkles, Loader2, Download, RefreshCw } from 'lucide-react';

export const AssetGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    "A futuristic physics laboratory with glowing equations in Agartala",
    "MemoHack institute branding poster dark indigo theme high quality",
    "Biology student studying DNA structure 3D render"
  ];

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateInstituteAsset(prompt);
      setGeneratedImage(result);
    } catch (e) {
      setError("Failed to generate asset. Please check API key configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="assets" className="py-24 px-4 bg-indigo-950/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              AI Creative <span className="text-indigo-400">Studio</span>
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Generate custom branding assets, study materials covers, or conceptual visualizations using our integrated 
              <span className="text-white font-mono bg-white/10 px-2 py-1 rounded mx-2 text-sm">Nano Banana Pro</span> 
              engine.
            </p>

            <div className="bg-black/40 p-6 rounded-3xl border border-indigo-500/20">
              <label className="block text-sm font-medium text-gray-300 mb-2">Describe your asset</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A minimalist poster for a Physics workshop on Quantum Mechanics..."
                className="w-full bg-indigo-900/20 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 h-32 resize-none mb-4"
              />
              
              <div className="flex flex-wrap gap-2 mb-6">
                {presets.map((p, i) => (
                  <button 
                    key={i} 
                    onClick={() => setPrompt(p)}
                    className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5 transition-colors text-gray-400"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                  ${loading || !prompt ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'}
                `}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {loading ? 'Generating High-Res Asset...' : 'Generate with Gemini 3 Pro'}
              </button>
              
              {error && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
            </div>
          </div>

          <div className="flex-1 w-full">
            <GlassCard className="min-h-[500px] flex items-center justify-center relative overflow-hidden group">
              {generatedImage ? (
                <div className="relative w-full h-full">
                  <img src={generatedImage} alt="Generated Asset" className="w-full h-full object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <a href={generatedImage} download="memohack-asset.png" className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                      <Download />
                    </a>
                    <button onClick={handleGenerate} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                      <RefreshCw />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 opacity-30">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Sparkles size={32} />
                  </div>
                  <p className="font-display text-xl">Asset Preview</p>
                  <p className="text-sm mt-2">Generated 1K assets will appear here</p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
};