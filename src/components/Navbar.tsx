import React, { useState } from 'react';
import { 
  CloudSun, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Settings, 
  Sparkles,
  MapPin, 
  Heart, 
  Info, 
  Compass, 
  Calendar
} from 'lucide-react';
import { ThemeMode, UnitSystem } from '../types/weather';

interface NavbarProps {
  activeTab: 'weather' | 'forecast' | 'maps' | 'favorites' | 'about';
  setActiveTab: (tab: 'weather' | 'forecast' | 'maps' | 'favorites' | 'about') => void;
  unit: UnitSystem;
  toggleUnit: () => void;
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  onOpenSettings: () => void;
  onOpenAiModal?: () => void;
  favoritesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unit,
  toggleUnit,
  themeMode,
  toggleThemeMode,
  onOpenSettings,
  onOpenAiModal,
  favoritesCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  interface NavItem {
    id: 'weather' | 'forecast' | 'maps' | 'favorites' | 'about';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'weather', label: 'Weather', icon: CloudSun },
    { id: 'forecast', label: 'Forecast', icon: Calendar },
    { id: 'maps', label: 'Maps', icon: Compass },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: favoritesCount },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleNavClick = (tabId: 'weather' | 'forecast' | 'maps' | 'favorites' | 'about') => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const isDark = themeMode === 'dark';

  return (
    <header 
      id="main-navigation"
      className={`sticky top-0 z-40 w-full backdrop-blur-xl transition-colors duration-300 border-b ${
        isDark 
          ? 'bg-slate-900/80 border-slate-800/80 text-white' 
          : 'bg-white/85 border-slate-200/80 text-slate-800 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          id="nav-brand"
          onClick={() => handleNavClick('weather')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <CloudSun className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              SkyCast
            </span>
            <span className="text-[10px] tracking-widest uppercase opacity-70 -mt-1 font-medium">
              Precision Weather
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav id="desktop-nav-links" className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? isDark 
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' 
                      : 'bg-sky-50 text-sky-600 border border-sky-200'
                    : isDark 
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'opacity-70'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[11px] rounded-full bg-sky-500/20 text-sky-400 font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div id="nav-controls" className="flex items-center gap-2 sm:gap-3">
          {/* AI Weather Insights / Art Button */}
          {onOpenAiModal && (
            <button
              id="ai-insights-trigger"
              onClick={onOpenAiModal}
              title="AI Weather Brief & SkyArt"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all ${
                isDark 
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25' 
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Brief</span>
            </button>
          )}

          {/* Unit Switcher: °C | °F */}
          <button
            id="unit-toggle-button"
            onClick={toggleUnit}
            title={`Switch to ${unit === 'metric' ? 'Fahrenheit (°F)' : 'Celsius (°C)'}`}
            aria-label="Toggle temperature unit"
            className={`flex items-center font-semibold text-xs rounded-lg px-2.5 py-1.5 border transition-all ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-200' 
                : 'bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700'
            }`}
          >
            <span className={unit === 'metric' ? 'text-sky-400 font-bold' : 'opacity-50'}>°C</span>
            <span className="mx-1 text-slate-500">|</span>
            <span className={unit === 'imperial' ? 'text-sky-400 font-bold' : 'opacity-50'}>°F</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            id="theme-mode-toggle"
            onClick={toggleThemeMode}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme mode"
            className={`p-2 rounded-lg border transition-all ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-amber-300' 
                : 'bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Icon */}
          <button
            id="nav-settings-button"
            onClick={onOpenSettings}
            title="Application Settings"
            aria-label="Open settings"
            className={`p-2 rounded-lg border transition-all ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300' 
                : 'bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div 
          id="mobile-nav-drawer"
          className={`md:hidden border-b px-4 py-3 space-y-1.5 transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? isDark 
                      ? 'bg-sky-500/20 text-sky-400 font-semibold' 
                      : 'bg-sky-50 text-sky-600 font-semibold'
                    : isDark 
                      ? 'text-slate-300 hover:bg-slate-800/50' 
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-sky-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-sky-500/20 text-sky-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {onOpenAiModal && (
            <button
              id="mobile-ai-trigger"
              onClick={() => {
                onOpenAiModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Weather Brief & SkyArt</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
