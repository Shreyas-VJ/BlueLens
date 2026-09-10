import React, { useState } from 'react';
import { 
  Cpu, 
  Database, 
  Layers, 
  Radio, 
  Server, 
  Monitor, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Activity,
  HardDrive,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import { ViewMode } from '../types';

interface ArchitectureViewProps {
  viewMode: ViewMode;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ viewMode }) => {
  const [selectedLayer, setSelectedLayer] = useState<number>(3); // default Layer 4 (Engine)

  const architectureLayers = [
    {
      level: 1,
      name: 'Layer 1: In-Situ Ocean Observation & Remote Sensing',
      category: 'Sensor Telemetry',
      icon: <Radio className="w-5 h-5 text-[#FFB020]" />,
      color: '#FFB020',
      description: 'Physical autonomous ocean profiling robots, moored buoys, wave gliders, and Earth observation satellite constellations.',
      components: [
        'Argo Autonomous Profiling Floats (0–2000m CTD Sensors)',
        'Deep Argo Floats (0–6000m Abyssal sensors)',
        'INCOIS Moored OMNI Buoy Network (Arabian Sea & Bay of Bengal)',
        'Autonomous Underwater Seagliders (SG-542 / Webb Slocum)',
        'Oceansat-3 / Sentinel-3 (Sea Surface Temperature & Ocean Colour)',
      ],
      protocols: 'Iridium SUT SBD / ARGOS-4 Satellite Transceiver Link',
      latency: 'Instantaneous on surface upload (10-day cycle)',
      throughput: '~14,000 active profile CTD measurements daily',
    },
    {
      level: 2,
      name: 'Layer 2: Real-Time Ingestion, Telemetry & QC Pipeline',
      category: 'Data Ingestion & QC',
      icon: <Server className="w-5 h-5 text-[#00C2C2]" />,
      color: '#00C2C2',
      description: 'Automated ground station ingestion, automated real-time Quality Control flagging (RTQC) conforming to WMO / IOC standard procedures.',
      components: [
        'INCOIS Global Data Assembly Centre (GDAC) Mirror',
        'Automated Real-Time Quality Control (RTQC Flags 1 to 4)',
        'Spike test, regional climatology range checks, gradient test',
        'NetCDF-4 (CF-1.8 Metadata) & WMO BUFR Encoding Engine',
      ],
      protocols: 'TCP/IP Sockets, FTP, WMO GTS, Kafka Stream Event Bus',
      latency: '&lt; 45 minutes from buoy surface to GDAC archive',
      throughput: '1.2 TB / day sensor telemetry streams',
    },
    {
      level: 3,
      name: 'Layer 3: Numerical Modeling & Data Assimilation',
      category: 'HPC Physics Engine',
      icon: <Database className="w-5 h-5 text-[#FE5F4E]" />,
      color: '#FE5F4E',
      description: 'High-performance computing (HPC) cluster running operational 3D hydrodynamic models assimilating in-situ float data.',
      components: [
        'ROMS (Regional Ocean Modeling System) 1/12° resolution grid',
        'Ensemble Kalman Filter (EnKF) Data Assimilation Engine',
        'WaveWatch III (Spectral Wave Model for Swell & Surf)',
        'INCOIS TEWS Multi-Scenario Tsunami Inundation Model',
      ],
      protocols: 'OpenMP / MPI parallelization on Cray XC40 Supercomputer',
      latency: 'Daily 7-day operational forecast runs (00:00 & 12:00 UTC)',
      throughput: '100+ Vertical Depth Layers simulated across Indian Ocean',
    },
    {
      level: 4,
      name: 'Layer 4: BLUELENS 3D/4D Visualization Engine',
      category: 'Client Presentation Core',
      icon: <Cpu className="w-5 h-5 text-[#00C2FF]" />,
      color: '#00C2FF',
      description: 'WebGL-accelerated Three.js rendering engine executing volumetric depth slice box shaders and smooth 3D globe coordinate projections.',
      components: [
        'Three.js (r128) WebGL Render Pipeline & Custom GLSL Shaders',
        'Dynamic 3D Depth Slice Box with Volumetric Colormaps',
        'Procedural Ocean Caustics, Particle Plankton Snow & Bathymetry',
        'Temporal 4D Animation Scrubber with Interpolated Eddy Drift',
        'Web Speech API Multi-lingual Synthesizer for Fishermen Audio',
      ],
      protocols: 'HTTPS / WebGL 2.0 / Canvas API / Web Audio API',
      latency: '60 FPS client-side GPU hardware acceleration',
      throughput: 'Zero-install browser execution across Desktop & Mobile',
    },
    {
      level: 5,
      name: 'Layer 5: Decision Support & Multi-Stakeholder Delivery',
      category: 'Dissemination Layer',
      icon: <Monitor className="w-5 h-5 text-emerald-400" />,
      color: '#34D399',
      description: 'Tailored persona delivery channels ensuring actionable early warnings reach coastal communities and decision makers.',
      components: [
        'Potential Fishing Zone (PFZ) Multilingual Audio & Coordinates',
        'Disaster Early Warning Bulletins to NDMA & Coast Guard',
        'Commercial Shipping Navigational Hydrodynamic Stream',
        'Scientific Data Portal with NetCDF / CSV Downloader',
      ],
      protocols: 'CAP (Common Alerting Protocol), WhatsApp API, SMS, PWA',
      latency: '&lt; 1.5 seconds alert broadcast trigger',
      throughput: 'Serving 7,500+ km of Indian coastline & island territories',
    },
  ];

  const current = architectureLayers[selectedLayer - 1];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#061220] p-4 sm:p-6 lg:p-8 select-none text-[#E6F4FF]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <Layers className="w-6 h-6 text-[#00C2FF]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white glow-cyan">
              ARCHITECTURE & TECHNOLOGY PIPELINE
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#00C2FF] font-medium mt-1">
            End-to-end data pipeline: from deep-sea autonomous robotics to client-side 3D WebGL rendering
          </p>
        </div>

        {/* Live System Operational Status */}
        <div className="flex items-center space-x-3 bg-[#0B1D2E] px-4 py-2 rounded-xl border border-emerald-500/40">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="text-xs">
            <span className="text-white/50 block text-[10px]">SYSTEM STATUS</span>
            <span className="font-mono font-bold text-emerald-400">OPERATIONAL (99.98% UPTIME)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Layer Stack on Left, Layer Deep Dive on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Five Architecture Layers (Left) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
            Five-Tier Operational Architecture
          </h3>

          <div className="space-y-2.5">
            {architectureLayers.map((layer) => {
              const isSelected = selectedLayer === layer.level;
              return (
                <div
                  key={layer.level}
                  onClick={() => setSelectedLayer(layer.level)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#0B1D2E] border-[#00C2FF] shadow-[0_0_20px_rgba(0,194,255,0.25)] scale-[1.02]'
                      : 'bg-[#0B1D2E]/50 border-white/5 hover:border-white/20 hover:bg-[#0B1D2E]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="p-2 rounded-xl bg-[#061220] border border-white/10">
                        {layer.icon}
                      </span>
                      <div>
                        <span className="text-[10px] font-mono text-white/50 uppercase block font-semibold">
                          Tier {layer.level}
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          {layer.name.replace(/Layer \d: /, '')}
                        </h4>
                      </div>
                    </div>
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${layer.color}20`, color: layer.color }}
                    >
                      {layer.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Layer Specification Dossier (Right) */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 rounded-2xl border border-[#00C2FF]/40 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <span className="p-2.5 rounded-xl bg-[#061220] border border-white/10">
                  {current.icon}
                </span>
                <div>
                  <span className="text-xs font-mono uppercase font-bold" style={{ color: current.color }}>
                    {current.category}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{current.name}</h2>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#E6F4FF]/90 leading-relaxed bg-[#061220]/70 p-4 rounded-xl border border-white/5">
              {current.description}
            </p>

            {/* Sub-Components List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">
                Core Architectural Subsystems
              </h4>
              <div className="space-y-1.5">
                {current.components.map((comp, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#061220] border border-white/5 flex items-center space-x-2.5 text-xs text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#00C2FF] shrink-0" />
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance & Protocol Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-[#061220] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase text-white/50 block">DATA PROTOCOLS</span>
                <span className="text-xs font-mono font-bold text-white mt-1 block">
                  {current.protocols}
                </span>
              </div>
              <div className="bg-[#061220] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase text-white/50 block">PIPELINE LATENCY</span>
                <span className="text-xs font-mono font-bold text-[#00C2FF] mt-1 block">
                  {current.latency}
                </span>
              </div>
              <div className="bg-[#061220] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase text-white/50 block">DATA THROUGHPUT</span>
                <span className="text-xs font-mono font-bold text-emerald-400 mt-1 block">
                  {current.throughput}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
