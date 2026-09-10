import React, { useState } from 'react';
import { 
  Users, 
  Anchor, 
  ShieldAlert, 
  Ship, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Compass, 
  Wind, 
  Waves, 
  Fish, 
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import { ViewMode } from '../types';

interface DecisionHubViewProps {
  viewMode: ViewMode;
  onNavigateToPFZ: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToProfiles: () => void;
}

export const DecisionHubView: React.FC<DecisionHubViewProps> = ({
  viewMode,
  onNavigateToPFZ,
  onNavigateToAlerts,
  onNavigateToProfiles,
}) => {
  const [activePersona, setActivePersona] = useState<'fishermen' | 'disaster' | 'shipping' | 'researcher'>('fishermen');

  const personas = [
    {
      id: 'fishermen' as const,
      label: 'Fishermen & Coastal Community',
      icon: <Fish className="w-4 h-4 text-[#00C2C2]" />,
      color: '#00C2C2',
      tagline: 'PFZ advisories, safety at sea, and high-swell advisories',
    },
    {
      id: 'disaster' as const,
      label: 'Disaster Managers & Coast Guard',
      icon: <ShieldAlert className="w-4 h-4 text-[#FE5F4E]" />,
      color: '#FE5F4E',
      tagline: 'Cyclone tracks, storm surge inundation, and SAR drift forecasts',
    },
    {
      id: 'shipping' as const,
      label: 'Shipping & Maritime Ports',
      icon: <Ship className="w-4 h-4 text-[#00C2FF]" />,
      color: '#00C2FF',
      tagline: 'Optimal low-resistance routing, port tides, and heavy sea states',
    },
    {
      id: 'researcher' as const,
      label: 'Ocean Researchers & Academia',
      icon: <GraduationCap className="w-4 h-4 text-[#FFB020]" />,
      color: '#FFB020',
      tagline: 'CTD sensor calibration, model assimilation, and climate trends',
    },
  ];

  const handleExportBriefing = () => {
    const report = `INCOIS BLUELENS OPERATIONAL DECISION BRIEFING
Stakeholder Sector: ${activePersona.toUpperCase()}
Generated: ${new Date().toUTCString()}
Status: OPERATIONAL ADVISORY ACTIVE
Authorizing Center: ESSO - INCOIS Hyderabad, MoES, Government of India
`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INCOIS_Decision_Briefing_${activePersona}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#061220] p-4 sm:p-6 lg:p-8 select-none text-[#E6F4FF]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-[#00C2FF]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white glow-cyan">
              DECISION SUPPORT HUB (CROSS-PERSONA)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#00C2FF] font-medium mt-1">
            Tailored operational intelligence, decision matrix & early actions for ocean stakeholders
          </p>
        </div>

        <button
          onClick={handleExportBriefing}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0B1D2E] hover:bg-white/10 border border-[#00C2FF]/30 text-xs font-semibold text-white transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-[#00C2FF]" />
          <span>Export Sector Briefing</span>
        </button>
      </div>

      {/* Stakeholder Persona Selector Tabs (Screen 16 from PDF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {personas.map((p) => {
          const isActive = activePersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePersona(p.id)}
              className={`p-4 rounded-2xl text-left transition-all border ${
                isActive
                  ? 'bg-[#0B1D2E] border-[#00C2FF] shadow-[0_0_20px_rgba(0,194,255,0.25)] scale-[1.02]'
                  : 'bg-[#0B1D2E]/50 border-white/5 hover:border-white/20 hover:bg-[#0B1D2E]/80'
              }`}
            >
              <div className="flex items-center space-x-2.5 mb-2">
                <span className="p-2 rounded-xl bg-[#061220] border border-white/10">{p.icon}</span>
                <span className="text-xs font-bold text-white tracking-wide">{p.label}</span>
              </div>
              <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">{p.tagline}</p>
            </button>
          );
        })}
      </div>

      {/* Persona Dynamic Detail Dashboard */}
      {activePersona === 'fishermen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-[#00C2C2]/40 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-[#00C2C2] uppercase font-bold">
                  Sector Priority · Daily Advisory
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Small-Scale & Mechanized Fishing Operations
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
                Advisory Window Open
              </span>
            </div>

            {/* Actionable Recommendations */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                Actionable Operations Checklist
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#061220] rounded-xl border border-white/5 flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Head to Veraval / Mangrol PFZ Front:</strong>
                    <p className="text-white/70 mt-0.5">
                      Dense pelagic aggregations 42 km offshore, bearing 215° SW. High probability of Indian Mackerel & Ribbon Fish catch.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-[#061220] rounded-xl border border-white/5 flex items-start space-x-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Avoid Southern Bay of Bengal past 18:00 IST:</strong>
                    <p className="text-white/70 mt-0.5">
                      Swell heights rising to 3.8m due to deep depression cyclogenesis. Return to harbour before 17:00 IST.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToPFZ}
              className="w-full py-3 rounded-xl bg-[#00C2C2] text-[#061220] font-bold text-xs shadow-md hover:bg-[#00E5FF] transition-colors flex items-center justify-center space-x-2"
            >
              <span>Explore Potential Fishing Zone Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Cost & Safety Benefits
              </h3>
              <div className="space-y-2 text-xs">
                <div className="bg-[#061220] p-3 rounded-xl border border-white/5">
                  <span className="text-white/50 block text-[10px]">DIESEL FUEL REDUCTION</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">30%–35%</span>
                  <p className="text-white/60 text-[11px] mt-0.5">By directing boats straight to thermal aggregation fronts.</p>
                </div>
                <div className="bg-[#061220] p-3 rounded-xl border border-white/5">
                  <span className="text-white/50 block text-[10px]">SEARCH TIME SAVED</span>
                  <span className="text-xl font-bold font-mono text-[#00C2FF]">4.5 to 6 hrs</span>
                  <p className="text-white/60 text-[11px] mt-0.5">Average trip reduction per mechanized trawler voyage.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePersona === 'disaster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-[#FE5F4E]/40 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-[#FE5F4E] uppercase font-bold">
                  National Disaster Management Authority (NDMA) & Coast Guard
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Cyclone & Search and Rescue (SAR) Drift Operations
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold font-mono animate-pulse">
                Critical Readiness
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                Active Tactical Directives
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#061220] rounded-xl border border-red-500/20 flex items-start space-x-3">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-300">Storm Surge Inundation Warning (Odisha Coast):</strong>
                    <p className="text-white/70 mt-0.5">
                      Astronomical spring tide coupled with 1.8m cyclone surge expected to inundate low-lying coastal areas in Kendrapara and Jagatsinghpur.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-[#061220] rounded-xl border border-white/5 flex items-start space-x-3">
                  <Compass className="w-4 h-4 text-[#00C2FF] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">SAR Drift Model Vectoring (Offshore Mumbai):</strong>
                    <p className="text-white/70 mt-0.5">
                      Surface currents running 0.65 m/s toward 045° (NE). Search grid expanded to Sector Charlie-4.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToAlerts}
              className="w-full py-3 rounded-xl bg-[#FE5F4E] text-white font-bold text-xs shadow-md hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span>View Disaster Early Warning System</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Emergency Hotline & Inter-Agency Feeds
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#061220] rounded-xl border border-white/5">
                  <span className="text-white/50 text-[10px] block">INCOIS TEWS (TSUNAMI HOTLINE)</span>
                  <span className="text-white font-mono font-bold">+91 40 2389 5011</span>
                </div>
                <div className="p-3 bg-[#061220] rounded-xl border border-white/5">
                  <span className="text-white/50 text-[10px] block">INDIAN COAST GUARD MRCC</span>
                  <span className="text-white font-mono font-bold">VHF Ch 16 / 1554</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePersona === 'shipping' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-[#00C2FF]/40 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-[#00C2FF] uppercase font-bold">
                  Major Ports & Commercial Shipping Fleets
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Vessel Routing & Hydrodynamic Sea-State Advisory
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/40 text-xs font-bold font-mono">
                Sea State: Moderate
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                Key Route Recommendations
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#061220] rounded-xl border border-white/5 flex items-start space-x-3">
                  <Wind className="w-4 h-4 text-[#00C2FF] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Colombo to Singapore (Malacca Strait Route):</strong>
                    <p className="text-white/70 mt-0.5">
                      Favorable 0.8 m/s eastward equatorial jet current reduces bunker fuel burn by 6.2% when navigating south of Great Nicobar Island.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-[#061220] rounded-xl border border-white/5 flex items-start space-x-3">
                  <Waves className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Gulf of Khambhat & Kandla Port Approach:</strong>
                    <p className="text-white/70 mt-0.5">
                      Tidal range exceeds 6.8m; high-water draft clearance window is 14:20 to 17:00 IST for vessels with &gt;11m draft.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Bunker Fuel Optimization
              </h3>
              <div className="bg-[#061220] p-3 rounded-xl border border-white/5 text-xs">
                <span className="text-white/50 text-[10px] block">ESTIMATED ROUTE EMISSIONS SAVINGS</span>
                <span className="text-xl font-bold font-mono text-[#00C2FF]">14.8 MT CO₂</span>
                <p className="text-white/60 text-[11px] mt-1">Per container vessel transit through current-assisted waypoints.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePersona === 'researcher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-[#FFB020]/40 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-[#FFB020] uppercase font-bold">
                  Marine Biologists & Physical Oceanographers
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Climate Research, Argo Profiling & Biogeochemistry
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/40 text-xs font-bold font-mono">
                100% QA / QC Clean
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                Oceanographic Phenomena Under Active Observation
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#061220] rounded-xl border border-white/5 flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-[#FFB020] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Oxygen Minimum Zone (OMZ) Expansion:</strong>
                    <p className="text-white/70 mt-0.5">
                      Argo float BGC sensors detect hypoxic layer (&lt;0.5 ml/L O₂) shallowing to 110m depth in the Northern Arabian Sea.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-[#061220] rounded-xl border border-white/5 flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-[#00C2FF] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Indian Ocean Dipole (IOD) Phase Index:</strong>
                    <p className="text-white/70 mt-0.5">
                      Positive IOD anomaly developing (+0.42°C DMI) indicating favorable southwest monsoon convective rainfall over the subcontinent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToProfiles}
              className="w-full py-3 rounded-xl bg-[#FFB020] text-[#061220] font-bold text-xs shadow-md hover:bg-amber-400 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Inspect High-Resolution CTD Sensor Curves</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Data Interoperability
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#061220] rounded-xl border border-white/5">
                  <span className="text-white/50 text-[10px] block">DATA PROTOCOLS</span>
                  <span className="text-white font-mono">NetCDF-4 / CF-1.8 Compliant</span>
                </div>
                <div className="p-2.5 bg-[#061220] rounded-xl border border-white/5">
                  <span className="text-white/50 text-[10px] block">OPENDAP / THREDDS SERVER</span>
                  <span className="text-[#00C2FF] font-mono">incois.gov.in/thredds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
