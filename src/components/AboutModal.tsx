import React from 'react';
import { X, Info, Code, Layers, Server, ShieldCheck, ExternalLink, Cpu } from 'lucide-react';
import { ThemeMode } from '../types/weather';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  themeMode,
}) => {
  if (!isOpen) return null;
  const isDark = themeMode === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div 
        id="about-portfolio-modal"
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all custom-scrollbar ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">SkyCast Architecture</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Portfolio Showcase & Engineering Specification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technical Highlights */}
        <div className="space-y-4 text-xs sm:text-sm">
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="font-bold text-sky-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Frontend Engineering
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong>React 19 & TypeScript:</strong> Strict typing with custom hooks (`useWeather`), responsive components, and clean state separation.</li>
              <li><strong>Tailwind CSS:</strong> Atmospheric weather-reactive color tokens, responsive mobile drawer, and zero layout shift.</li>
              <li><strong>Recharts Integration:</strong> Interactive 24-hour diurnal thermal curve with time-of-day filters (Morning, Afternoon, Evening, Night).</li>
              <li><strong>Interactive Radar:</strong> Canvas-based simulation of Doppler radar sweeps, temperature contours, cloud layers, and wind vector dynamics.</li>
            </ul>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="font-bold text-indigo-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              Backend & API Proxy
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong>Express.js Reverse Proxy:</strong> Hides private secrets and secures client requests on port 3000.</li>
              <li><strong>In-Memory LRU/TTL Cache:</strong> 10-minute cache preventing rate limits while ensuring live data freshness.</li>
              <li><strong>Open-Meteo REST API:</strong> High-resolution WMO weather code decoding, solar calculation, air quality index evaluation.</li>
              <li><strong>Resilient Fallback Engine:</strong> Seamless fallback data system guaranteeing zero broken states even in offline scenarios.</li>
            </ul>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              AI Weather Intelligence
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Powered by server-side Google GenAI SDK integration (`gemini-2.5-flash`) delivering structured meteorologist briefs and outfit recommendations, alongside visual atmospheric scenery generator.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
