import React, { useState } from 'react';
import { 
  Globe, 
  Box, 
  LineChart, 
  Scale, 
  AlertTriangle, 
  Compass, 
  BookOpen, 
  HelpCircle, 
  Network, 
  Waves, 
  Menu, 
  X,
  Volume2,
  VolumeX,
  Fish,
  Sliders
} from 'lucide-react';
import { ScreenId, ViewMode } from '../types';

interface NavigationProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  onOpenGuide: () => void;
  alertCount: number;
  onReturnToSplash: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onSelectScreen,
  viewMode,
  onToggleViewMode,
  onOpenGuide,
  alertCount,
  onReturnToSplash,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Audio tone generation for subtle ocean pressure ambience
  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(55, ctx.currentTime); // 55Hz deep water drone
          gain.gain.setValueAtTime(0.02, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          setTimeout(() => {
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3);
            setTimeout(() => osc.stop(), 3100);
          }, 4000);
        }
      } catch {
        // audio context fallback
      }
    }
  };

  const navItems: { id: ScreenId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'earth', label: '3D Earth', icon: <Globe className="w-4 h-4" /> },
    { id: 'depth-slice', label: '3D Depth Box', icon: <Box className="w-4 h-4" /> },
    { id: 'profiles', label: viewMode === 'scientist' ? 'T & S Profiles' : 'Water Temperature', icon: <LineChart className="w-4 h-4" /> },
    { id: 'comparison', label: viewMode === 'scientist' ? 'Model vs Obs' : 'Forecast Check', icon: <Scale className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="w-4 h-4" />, badge: alertCount },
    { id: 'pfz', label: 'PFZ Advisory', icon: <Fish className="w-4 h-4" /> },
    { id: 'tours', label: 'Guided Stories', icon: <Compass className="w-4 h-4" /> },
    { id: 'decision', label: 'Decision Hub', icon: <Sliders className="w-4 h-4" /> },
    { id: 'glossary', label: 'Glossary', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'architecture', label: 'Architecture', icon: <Network className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-16 w-full border-b border-[#00C2FF]/20 bg-[#0B1D2E]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={onReturnToSplash}
            className="flex items-center space-x-2.5 group text-left focus:outline-none"
            title="Return to Welcome Splash"
          >
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#00C2FF] via-[#0B3D6B] to-[#00C2C2] p-[2px] shadow-[0_0_15px_rgba(0,194,255,0.4)] group-hover:shadow-[0_0_22px_rgba(0,194,255,0.7)] transition-all">
              <div className="w-full h-full rounded-full bg-[#061220] flex items-center justify-center overflow-hidden">
                <div className="w-4 h-4 rounded-full border border-[#00C2FF] bg-[#00C2FF]/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-ping" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-wider text-[#E6F4FF] group-hover:text-[#00C2FF] transition-colors">
                  BLUELENS
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00C2FF]/15 text-[#00C2FF] font-medium border border-[#00C2FF]/30">
                  INCOIS
                </span>
              </div>
              <p className="text-[10px] text-[#E6F4FF]/60 hidden sm:block">
                See Beyond. Understand Deeper.
              </p>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-[#061220]/70 p-1 rounded-xl border border-white/5 shadow-inner max-w-2xl overflow-x-auto">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00C2FF] text-[#061220] font-semibold shadow-[0_0_12px_rgba(0,194,255,0.4)]'
                    : 'text-[#E6F4FF]/75 hover:text-[#E6F4FF] hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#FE5F4E] text-white' : 'bg-[#FE5F4E]/90 text-white animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls: Mode Switch, Audio & Guide */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dual Mode Switcher Pill */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#061220] border border-[#00C2FF]/30 text-xs">
            <button
              onClick={() => viewMode !== 'scientist' && onToggleViewMode()}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1 ${
                viewMode === 'scientist'
                  ? 'bg-[#00C2FF] text-[#061220] font-bold shadow-[0_0_10px_rgba(0,194,255,0.35)]'
                  : 'text-[#E6F4FF]/60 hover:text-white'
              }`}
            >
              <span>🔬</span>
              <span className="hidden sm:inline">Scientist</span>
            </button>
            <button
              onClick={() => viewMode !== 'explorer' && onToggleViewMode()}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1 ${
                viewMode === 'explorer'
                  ? 'bg-[#FFB020] text-[#061220] font-bold shadow-[0_0_10px_rgba(255,176,32,0.35)]'
                  : 'text-[#E6F4FF]/60 hover:text-white'
              }`}
            >
              <span>🧭</span>
              <span className="hidden sm:inline">Explorer</span>
            </button>
          </div>

          {/* Ambience audio */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg border text-xs transition-colors hidden sm:flex items-center ${
              soundEnabled
                ? 'bg-[#00C2FF]/20 border-[#00C2FF] text-[#00C2FF]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
            title={soundEnabled ? 'Deep Ocean Ambience Active' : 'Enable Deep Ocean Ambience'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Guide Help Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#E6F4FF] hover:bg-[#00C2FF]/15 hover:border-[#00C2FF]/40 text-xs font-medium transition-all"
            title="Help & Interactive System Guide"
          >
            <HelpCircle className="w-4 h-4 text-[#00C2FF]" />
            <span className="hidden md:inline">Guide</span>
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation (When hamburger clicked) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-[#061220]/95 backdrop-blur-xl p-4 lg:hidden border-b border-[#00C2FF]/20 flex flex-col space-y-2 overflow-y-auto">
          <div className="text-xs text-[#00C2FF] font-semibold tracking-wider uppercase mb-1">
            Navigation Menu ({viewMode.toUpperCase()} MODE)
          </div>
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectScreen(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#00C2FF] text-[#061220] font-bold'
                    : 'bg-[#0B1D2E]/80 text-[#E6F4FF] border border-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FE5F4E] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Screen 15: Screen 15 Mobile Responsive View) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#0B1D2E]/95 backdrop-blur-lg border-t border-[#00C2FF]/20 flex items-center justify-around px-2 lg:hidden">
        <button
          onClick={() => onSelectScreen('earth')}
          className={`flex flex-col items-center justify-center w-12 py-1 text-[10px] ${
            currentScreen === 'earth' ? 'text-[#00C2FF] font-semibold' : 'text-white/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Map</span>
        </button>
        <button
          onClick={() => onSelectScreen('depth-slice')}
          className={`flex flex-col items-center justify-center w-12 py-1 text-[10px] ${
            currentScreen === 'depth-slice' ? 'text-[#00C2FF] font-semibold' : 'text-white/60'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>3D Box</span>
        </button>
        <button
          onClick={() => onSelectScreen('profiles')}
          className={`flex flex-col items-center justify-center w-12 py-1 text-[10px] ${
            currentScreen === 'profiles' ? 'text-[#00C2FF] font-semibold' : 'text-white/60'
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Profiles</span>
        </button>
        <button
          onClick={() => onSelectScreen('pfz')}
          className={`flex flex-col items-center justify-center w-12 py-1 text-[10px] ${
            currentScreen === 'pfz' ? 'text-[#00C2FF] font-semibold' : 'text-white/60'
          }`}
        >
          <Fish className="w-4 h-4" />
          <span>PFZ</span>
        </button>
        <button
          onClick={() => onSelectScreen('alerts')}
          className={`flex flex-col items-center justify-center w-12 py-1 text-[10px] relative ${
            currentScreen === 'alerts' ? 'text-[#00C2FF] font-semibold' : 'text-white/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Alerts</span>
          {alertCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#FE5F4E] animate-ping" />
          )}
        </button>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-12 py-1 text-[10px] text-white/60"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </div>
    </>
  );
};
