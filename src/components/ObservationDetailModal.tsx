import React, { useState } from 'react';
import { 
  ObservationMarker, 
  OceanVariable, 
  ViewMode 
} from '../types';
import { 
  X, 
  Thermometer, 
  Droplets, 
  Leaf, 
  Wind, 
  Activity, 
  Download, 
  CheckSquare, 
  Square, 
  ArrowDown, 
  Globe2, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ObservationDetailModalProps {
  observation: ObservationMarker;
  onClose: () => void;
  onStartDive: () => void;
  onViewProfile: () => void;
  onViewDepthSlice: () => void;
  viewMode: ViewMode;
}

export const ObservationDetailModal: React.FC<ObservationDetailModalProps> = ({
  observation,
  onClose,
  onStartDive,
  onViewProfile,
  onViewDepthSlice,
  viewMode,
}) => {
  const [selectedVar, setSelectedVar] = useState<OceanVariable>('temperature');
  const [compareWithModel, setCompareWithModel] = useState(true);

  const isArgo = observation.type === 'argo';

  const variableDetails: Record<OceanVariable, { label: string; plainLabel: string; unit: string; icon: React.ReactNode }> = {
    temperature: {
      label: 'Temperature',
      plainLabel: 'Water Warmth',
      unit: '°C',
      icon: <Thermometer className="w-4 h-4 text-[#FE5F4E]" />,
    },
    salinity: {
      label: 'Salinity',
      plainLabel: 'Saltiness',
      unit: 'PSU',
      icon: <Droplets className="w-4 h-4 text-[#00C2FF]" />,
    },
    chlorophyll: {
      label: 'Chlorophyll-a',
      plainLabel: 'Ocean Life / Plankton',
      unit: 'mg/m³',
      icon: <Leaf className="w-4 h-4 text-[#00C2C2]" />,
    },
    oxygen: {
      label: 'Dissolved Oxygen',
      plainLabel: 'Oxygen for Fish',
      unit: 'ml/L',
      icon: <Activity className="w-4 h-4 text-[#FFB020]" />,
    },
    currents: {
      label: 'Ocean Currents',
      plainLabel: 'Current Speed & Drift',
      unit: 'm/s',
      icon: <Wind className="w-4 h-4 text-[#00C2FF]" />,
    },
    density: {
      label: 'Density',
      plainLabel: 'Water Weight',
      unit: 'kg/m³',
      icon: <Activity className="w-4 h-4 text-purple-400" />,
    },
    ssh: {
      label: 'Sea Surface Height',
      plainLabel: 'Sea Surface Level',
      unit: 'm',
      icon: <Globe2 className="w-4 h-4 text-emerald-400" />,
    },
  };

  const handleDownload = (format: 'csv' | 'netcdf') => {
    const filename = `${observation.id}_profile_data.${format}`;
    const dummyContent = format === 'csv'
      ? `depth_m,temperature_c,salinity_psu,oxygen_ml_l\n0,29.4,34.2,4.8\n100,23.8,35.0,3.1\n452,14.2,35.1,1.25\n1000,8.2,34.88,1.85\n2000,2.9,34.72,4.05`
      : `NetCDF-4 binary format emulation for ${observation.name}`;
    const blob = new Blob([dummyContent], { type: format === 'csv' ? 'text/csv' : 'application/x-netcdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[28rem] bg-[#0B1D2E]/95 backdrop-blur-xl border-l border-[#00C2FF]/30 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto text-[#E6F4FF] transition-transform animate-in slide-in-from-right duration-300">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isArgo ? 'bg-[#00C2FF]' : 'bg-[#FFB020]'} shadow-[0_0_8px_currentColor]`} />
            <h3 className="text-base font-bold text-white tracking-wide">
              {isArgo ? 'Argo Float' : 'Autonomous Glider'} · {observation.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between bg-[#061220]/70 p-2.5 rounded-xl border border-white/5 mb-4">
          <div className="flex items-center space-x-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-300">Active</span>
            <span className="text-white/40">·</span>
            <span className="text-white/60">Last reported {observation.lastReportedHoursAgo}h ago</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#00C2FF]/15 text-[#00C2FF] font-medium border border-[#00C2FF]/30">
            {observation.country} / INCOIS
          </span>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
          <div className="bg-[#061220]/50 p-2.5 rounded-lg border border-white/5">
            <div className="text-white/50 text-[10px] uppercase font-semibold">Location</div>
            <div className="text-white font-mono mt-0.5 font-medium">
              {observation.latitude}° N, {observation.longitude}° E
            </div>
            <div className="text-white/40 text-[10px] truncate">{observation.region}</div>
          </div>
          <div className="bg-[#061220]/50 p-2.5 rounded-lg border border-white/5">
            <div className="text-white/50 text-[10px] uppercase font-semibold">Max Depth Target</div>
            <div className="text-[#00C2FF] font-mono mt-0.5 font-bold">
              {observation.maxDepth} metres
            </div>
            <div className="text-white/40 text-[10px]">
              {viewMode === 'explorer' ? 'Deeper than 50 buildings stacked' : 'Full CTD Column'}
            </div>
          </div>
          <div className="bg-[#061220]/50 p-2.5 rounded-lg border border-white/5">
            <div className="text-white/50 text-[10px] uppercase font-semibold">Observation Date</div>
            <div className="text-white mt-0.5 font-medium truncate">{observation.dateTime}</div>
          </div>
          <div className="bg-[#061220]/50 p-2.5 rounded-lg border border-white/5">
            <div className="text-white/50 text-[10px] uppercase font-semibold">Current Probe Depth</div>
            <div className="text-[#FFB020] font-mono mt-0.5 font-bold">
              {observation.currentDepth} m ({observation.status})
            </div>
          </div>
        </div>

        {/* Scientist specifics: WMOID & Program */}
        {viewMode === 'scientist' && (
          <div className="bg-[#061220]/70 p-2.5 rounded-lg border border-[#00C2FF]/20 text-[11px] space-y-1 mb-4">
            <div className="flex justify-between">
              <span className="text-white/50">WMO Identifier:</span>
              <span className="font-mono text-white font-semibold">{observation.wmoid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Program / Entity:</span>
              <span className="text-[#00C2FF]">{observation.program}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Telemetry Link:</span>
              <span className="text-emerald-400">Iridium SBD Live</span>
            </div>
          </div>
        )}

        {/* Explorer specifics: Plain language quote */}
        {viewMode === 'explorer' && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#0B3D6B]/50 to-[#00C2FF]/10 border border-[#00C2FF]/30 text-xs text-[#E6F4FF]/90 mb-4">
            <p className="italic">
              "This robot sinks by releasing oil from its internal bladder — no noisy engine needed. It measures ocean health up to 2,000 m deep!"
            </p>
          </div>
        )}

        {/* Available Variables Selector Chips (Screen 4 from PDF) */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-white/80 mb-2 flex items-center justify-between">
            <span>Available Variables</span>
            <span className="text-[10px] text-white/40">Click to preview</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {observation.availableVariables.map((v) => {
              const info = variableDetails[v];
              const isSelected = selectedVar === v;
              return (
                <button
                  key={v}
                  onClick={() => setSelectedVar(v)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#00C2FF] text-[#061220] font-bold shadow-[0_0_10px_rgba(0,194,255,0.4)]'
                      : 'bg-[#061220]/70 text-white/80 border border-white/10 hover:border-[#00C2FF]/40'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{viewMode === 'scientist' ? info.label : info.plainLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mini Depth Profile Preview (T vs Depth Thumbnail) */}
        <div className="bg-[#061220]/80 p-3 rounded-xl border border-white/10 mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white/70 font-semibold">
              Depth Profile Preview ({variableDetails[selectedVar].label})
            </span>
            <span className="text-[10px] text-[#00C2FF] font-mono">0m to 2000m</span>
          </div>
          {/* SVG Mini Sparkline chart */}
          <div className="h-20 w-full relative flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 240 80">
              {/* Grid lines */}
              <line x1="0" y1="20" x2="240" y2="20" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="240" y2="50" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              {/* Thermocline shading */}
              <rect x="30" y="10" width="70" height="60" fill="rgba(0,194,255,0.06)" />
              {/* Model dashed curve (Cyan) */}
              {compareWithModel && (
                <path
                  d="M 10 12 Q 50 18 80 50 T 230 72"
                  fill="none"
                  stroke="#00C2FF"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}
              {/* Observed solid curve (Orange) */}
              <path
                d="M 10 14 Q 45 20 85 54 T 230 74"
                fill="none"
                stroke="#FFB020"
                strokeWidth="2.2"
              />
              {/* Marker pin at current depth (452m) */}
              <circle cx="95" cy="56" r="3.5" fill="#FE5F4E" />
            </svg>
            <span className="absolute bottom-1 right-2 text-[9px] text-white/40">
              Thermocline (65–180m)
            </span>
          </div>

          {/* Model Compare Toggle */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <button
              onClick={() => setCompareWithModel(!compareWithModel)}
              className="flex items-center space-x-1.5 text-white/80 hover:text-white"
            >
              {compareWithModel ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#00C2FF]" />
              ) : (
                <Square className="w-3.5 h-3.5 text-white/40" />
              )}
              <span>Compare with ROMS Model</span>
            </button>
            <button
              onClick={onViewProfile}
              className="text-[#00C2FF] hover:underline flex items-center text-[11px]"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions: DIVE Button & Exports */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        {/* Prominent DIVE Button (Screen 4 from PDF) */}
        <button
          onClick={onStartDive}
          className="w-full group relative flex items-center justify-center py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00C2FF] via-[#00E5FF] to-[#00C2C2] text-[#061220] shadow-[0_0_25px_rgba(0,194,255,0.5)] hover:shadow-[0_0_35px_rgba(0,194,255,0.8)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <ArrowDown className="w-4 h-4 mr-2 animate-bounce" />
          <span>DIVE — UNDERWATER IMMERSION</span>
        </button>

        {/* Secondary: 3D Depth Box view or Profile */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onViewDepthSlice}
            className="flex items-center justify-center py-2 px-3 rounded-lg bg-[#061220] hover:bg-[#00C2FF]/20 border border-[#00C2FF]/40 text-xs font-semibold text-[#00C2FF] transition-colors"
          >
            <span>3D Depth Slice</span>
          </button>
          <button
            onClick={onViewProfile}
            className="flex items-center justify-center py-2 px-3 rounded-lg bg-[#061220] hover:bg-white/10 border border-white/15 text-xs font-medium text-white transition-colors"
          >
            <span>Inspect T & S Curve</span>
          </button>
        </div>

        {/* Data Downloads (NetCDF / CSV) */}
        {viewMode === 'scientist' && (
          <div className="flex items-center justify-between text-[11px] text-white/60 pt-1">
            <span>Export Raw Data:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDownload('csv')}
                className="hover:text-[#00C2FF] flex items-center"
              >
                <Download className="w-3 h-3 mr-0.5" /> CSV
              </button>
              <button
                onClick={() => handleDownload('netcdf')}
                className="hover:text-[#00C2FF] flex items-center"
              >
                <Download className="w-3 h-3 mr-0.5" /> NetCDF-CF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
