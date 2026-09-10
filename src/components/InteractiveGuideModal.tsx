import React, { useState } from 'react';
import { 
  X, 
  Compass, 
  Globe, 
  Box, 
  LineChart, 
  AlertTriangle, 
  Fish, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  Sliders, 
  Keyboard
} from 'lucide-react';
import { ScreenId, ViewMode } from '../types';

interface InteractiveGuideModalProps {
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
}

export const InteractiveGuideModal: React.FC<InteractiveGuideModalProps> = ({
  onClose,
  onNavigate,
  viewMode,
  onToggleViewMode,
}) => {
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'shortcuts' | 'about'>('walkthrough');

  const guideSteps = [
    {
      title: '1. 3D Digital Earth Observation',
      screen: 'earth' as ScreenId,
      icon: <Globe className="w-5 h-5 text-[#00C2FF]" />,
      desc: 'Pan, tilt, and zoom around the Indian Ocean. Click any glowing Argo float or Seaglider marker to view its live CTD telemetry card.',
    },
    {
      title: '2. Cinematic Ocean Descent (Dive)',
      screen: 'dive' as ScreenId,
      icon: <Compass className="w-5 h-5 text-[#00C2C2]" />,
      desc: 'Experience a smooth underwater descent from sunlit surface waters through the thermocline down to the 2,000-metre abyss.',
    },
    {
      title: '3. 3D Volumetric Depth Slice Box',
      screen: 'depth-slice' as ScreenId,
      icon: <Box className="w-5 h-5 text-[#FE5F4E]" />,
      desc: 'Inspect 3D physical models of the Argo float and Seaglider. Move the depth scanner slider, toggle isosurfaces, and scrub the 4D temporal animation bar.',
    },
    {
      title: '4. Scientific Profiles & Model Validation',
      screen: 'profiles' as ScreenId,
      icon: <LineChart className="w-5 h-5 text-emerald-400" />,
      desc: 'Analyze high-precision Temperature, Salinity, Density, and Oxygen depth curves. Compare in-situ observations against INCOIS ROMS forecast models.',
    },
    {
      title: '5. Early Warning Alerts & Disaster Tracking',
      screen: 'alerts' as ScreenId,
      icon: <AlertTriangle className="w-5 h-5 text-[#FFB020]" />,
      desc: 'Monitor real-time cyclone tracks, Category III marine heatwaves, tsunami bottom pressure sensor networks, and rough sea advisories.',
    },
    {
      title: '6. Potential Fishing Zone (PFZ) Advisory',
      screen: 'pfz' as ScreenId,
      icon: <Fish className="w-5 h-5 text-[#00C2FF]" />,
      desc: 'Operational fishing advisories with compass bearings, GPS coordinates, expected species, fuel savings, and multilingual audio narration.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-[#00C2FF]/40 shadow-[0_0_40px_rgba(0,194,255,0.25)] overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0B1D2E]/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#00C2FF]/20 border border-[#00C2FF]/40 text-[#00C2FF]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                BLUELENS Interactive Guide
              </h2>
              <p className="text-xs text-[#00C2FF]">
                INCOIS 3D/4D Ocean Observation & Decision Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#061220] px-5 pt-3 space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'walkthrough'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Platform Walkthrough
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'shortcuts'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Keyboard Controls
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'about'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Dual View Modes
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {activeTab === 'walkthrough' && (
            <div className="space-y-3">
              <p className="text-xs text-white/70">
                Click any section below to instantly navigate to that feature in BLUELENS:
              </p>
              {guideSteps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onNavigate(step.screen);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-[#0B1D2E]/70 border border-white/5 hover:border-[#00C2FF]/40 hover:bg-[#0B1D2E] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-start space-x-3 pr-2">
                    <span className="p-2 rounded-lg bg-[#061220] border border-white/10 shrink-0">
                      {step.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-white group-hover:text-[#00C2FF] transition-colors text-xs sm:text-sm">
                        {step.title}
                      </h4>
                      <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#00C2FF] group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#061220] rounded-xl border border-white/5 text-xs text-white/80 flex items-center space-x-2">
                <Keyboard className="w-4 h-4 text-[#00C2FF]" />
                <span>Use keyboard shortcuts for fast oceanographic inspection:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: '1', action: 'Go to 3D Earth Globe' },
                  { key: '2', action: 'Go to 3D Depth Slice Box' },
                  { key: '3', action: 'Go to T & S Profiles' },
                  { key: '4', action: 'Go to Model vs Obs Comparison' },
                  { key: '5', action: 'Go to Ocean Alerts' },
                  { key: '6', action: 'Go to Potential Fishing Zones' },
                  { key: 'M', action: 'Toggle Scientist / Explorer Mode' },
                  { key: 'Space', action: 'Play / Pause 4D Animation Scrubber' },
                  { key: 'Esc', action: 'Close any active modal or return' },
                ].map((sc, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-[#0B1D2E] border border-white/5 flex items-center justify-between"
                  >
                    <span className="text-xs text-white/70">{sc.action}</span>
                    <kbd className="px-2 py-1 rounded bg-[#061220] border border-white/20 font-mono text-[11px] font-bold text-[#00C2FF]">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B1D2E] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs sm:text-sm">Current Active View Mode</h4>
                  <button
                    onClick={onToggleViewMode}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'scientist'
                        ? 'bg-[#00C2FF] text-[#061220]'
                        : 'bg-[#FFB020] text-[#061220]'
                    }`}
                  >
                    Switch to {viewMode === 'scientist' ? 'Explorer Mode' : 'Scientist Mode'}
                  </button>
                </div>
                <p className="text-xs text-white/70">
                  You are currently in <strong className="text-white capitalize">{viewMode} Mode</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[#061220] border border-[#00C2FF]/30 space-y-2">
                  <div className="flex items-center space-x-2 text-[#00C2FF] font-bold text-xs">
                    <span>🔬</span>
                    <span>SCIENTIST MODE</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Designed for oceanographers and researchers: displays exact WMO IDs, CTD pressure in decibars, Practical Salinity Units (PSU), mathematical colormaps (Viridis/Jet), ROMS bias validation metrics, and NetCDF exports.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#061220] border border-[#FFB020]/30 space-y-2">
                  <div className="flex items-center space-x-2 text-[#FFB020] font-bold text-xs">
                    <span>🧭</span>
                    <span>EXPLORER MODE</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Designed for students, fishermen, and the public: uses everyday plain English terms ("Water Warmth", "Saltiness"), voice audio narration in regional languages, intuitive color schemes, and real-world analogies.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0B1D2E]/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#00C2FF] text-[#061220] font-bold text-xs hover:bg-[#00C2FF]/90 transition-all shadow-[0_0_15px_rgba(0,194,255,0.4)]"
          >
            Got It, Explore Oceans
          </button>
        </div>
      </div>
    </div>
  );
};
