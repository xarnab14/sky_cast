import React from 'react';
import { X, Settings, Thermometer, Moon, Sun, Database, Trash2, Check } from 'lucide-react';
import { ThemeMode, UnitSystem } from '../types/weather';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitSystem;
  setUnit: (unit: UnitSystem) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  unit,
  setUnit,
  themeMode,
  setThemeMode,
}) => {
  if (!isOpen) return null;

  const isDark = themeMode === 'dark';

  const handleResetData = () => {
    if (confirm('Clear all SkyCast saved favorites and recent searches?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="settings-modal"
        className={`w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit System Option */}
        <div className="space-y-4">
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Measurement System
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnit('metric')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  unit === 'metric'
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                    : isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div>
                  <span className="font-bold text-sm block">Metric</span>
                  <span className="text-[11px] opacity-70">°C, km/h, mm, hPa</span>
                </div>
                {unit === 'metric' && <Check className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setUnit('imperial')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  unit === 'imperial'
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                    : isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div>
                  <span className="font-bold text-sm block">Imperial</span>
                  <span className="text-[11px] opacity-70">°F, mph, in, inHg</span>
                </div>
                {unit === 'imperial' && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Theme Mode Option */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Theme Appearance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  themeMode === 'dark'
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                    : isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  <span className="font-bold text-sm">Dark Theme</span>
                </div>
                {themeMode === 'dark' && <Check className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  themeMode === 'light'
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                    : isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <span className="font-bold text-sm">Light Theme</span>
                </div>
                {themeMode === 'light' && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Data Sources info */}
          <div className={`p-3.5 rounded-2xl border text-xs ${
            isDark ? 'bg-slate-800/40 border-slate-700/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-2 font-semibold text-slate-300 mb-1">
              <Database className="w-4 h-4 text-sky-400" />
              <span>Data & Reliability</span>
            </div>
            <p>Powered by Open-Meteo High-Resolution Weather Model API & WMO Meteorological Code standards.</p>
          </div>

          {/* Reset button */}
          <div className="pt-2">
            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset all favorites and recent history</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
