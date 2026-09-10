import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Activity, 
  Download, 
  Info, 
  Layers, 
  Filter, 
  HelpCircle,
  BarChart2,
  CheckCircle2,
  ArrowDown
} from 'lucide-react';
import { ObservationMarker, ViewMode } from '../types';
import { FLOAT_6902345_PROFILE, PROFILE_STATS, MOCK_OBSERVATIONS } from '../data/oceanData';

interface ScientificProfilesViewProps {
  observation: ObservationMarker;
  viewMode: ViewMode;
  onNavigateToComparison: () => void;
  onNavigateToDepthSlice: () => void;
}

export const ScientificProfilesView: React.FC<ScientificProfilesViewProps> = ({
  observation,
  viewMode,
  onNavigateToComparison,
  onNavigateToDepthSlice,
}) => {
  const [profileType, setProfileType] = useState<'temperature' | 'salinity' | 'ts-diagram' | 'oxygen'>('temperature');
  const [hoveredDepth, setHoveredDepth] = useState<number | null>(452);
  const [showModelLine, setShowModelLine] = useState(true);
  const [showThermoclineBand, setShowThermoclineBand] = useState(true);

  // SVG Chart dimensions
  const chartWidth = 640;
  const chartHeight = 520;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 35;
  const padBottom = 55;

  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  // Max depth is 2000m
  const maxDepth = 2000;

  // Scale calculations for inverted depth (0m at top, 2000m at bottom)
  const depthToY = (depth: number) => padTop + (depth / maxDepth) * innerHeight;
  const yToDepth = (y: number) => Math.max(0, Math.min(2000, ((y - padTop) / innerHeight) * maxDepth));

  // Range scales for X-axis
  const xMin = profileType === 'temperature' ? 0 : profileType === 'salinity' ? 32 : profileType === 'ts-diagram' ? 33 : 0;
  const xMax = profileType === 'temperature' ? 32 : profileType === 'salinity' ? 36 : profileType === 'ts-diagram' ? 36 : 6;
  const valToX = (val: number) => padLeft + ((val - xMin) / (xMax - xMin)) * innerWidth;

  // Generate SVG path for Observed & Model
  const observedPath = FLOAT_6902345_PROFILE.map((pt, i) => {
    const x = valToX(
      profileType === 'temperature'
        ? pt.observedTemp
        : profileType === 'salinity'
        ? pt.observedSalinity
        : pt.observedOxygen
    );
    const y = depthToY(pt.depth);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const modelPath = FLOAT_6902345_PROFILE.map((pt, i) => {
    const x = valToX(
      profileType === 'temperature'
        ? pt.modelTemp
        : profileType === 'salinity'
        ? pt.modelSalinity
        : pt.modelOxygen
    );
    const y = depthToY(pt.depth);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Find hovered point
  const currentPoint = hoveredDepth !== null
    ? FLOAT_6902345_PROFILE.reduce((prev, curr) =>
        Math.abs(curr.depth - hoveredDepth) < Math.abs(prev.depth - hoveredDepth) ? curr : prev
      )
    : FLOAT_6902345_PROFILE[9]; // default 452m

  const handleDownloadCSV = () => {
    const header = 'Depth_m,Observed_Temp_C,Model_Temp_C,Observed_Salinity_PSU,Model_Salinity_PSU,Density_kg_m3\n';
    const rows = FLOAT_6902345_PROFILE.map(
      (p) => `${p.depth},${p.observedTemp},${p.modelTemp},${p.observedSalinity},${p.modelSalinity},${p.density}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INCOIS_${observation.id}_Scientific_Profile.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#061220] p-4 sm:p-6 lg:p-8 select-none text-[#E6F4FF]">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00C2FF] animate-ping" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white glow-cyan">
              SCIENTIFIC DEPTH PROFILES — {observation.name}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#00C2FF] font-medium mt-1">
            {viewMode === 'scientist'
              ? 'CTD Sensor Telemetry (0–2000m) vs INCOIS ROMS High-Resolution Hydrodynamic Forecast'
              : 'Water conditions from ocean surface down to 2,000 metres depth'}
          </p>
        </div>

        {/* Profile Switcher Buttons */}
        <div className="flex items-center space-x-1.5 bg-[#0B1D2E] p-1 rounded-xl border border-[#00C2FF]/30">
          <button
            onClick={() => setProfileType('temperature')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              profileType === 'temperature'
                ? 'bg-[#FE5F4E] text-white shadow-[0_0_10px_rgba(254,95,78,0.4)]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature (°C)</span>
          </button>
          <button
            onClick={() => setProfileType('salinity')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              profileType === 'salinity'
                ? 'bg-[#00C2FF] text-[#061220] shadow-[0_0_10px_rgba(0,194,255,0.4)]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Salinity (PSU)</span>
          </button>
          <button
            onClick={() => setProfileType('ts-diagram')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              profileType === 'ts-diagram'
                ? 'bg-[#00C2C2] text-[#061220] shadow-[0_0_10px_rgba(0,194,194,0.4)]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>T-S Diagram</span>
          </button>
          <button
            onClick={() => setProfileType('oxygen')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              profileType === 'oxygen'
                ? 'bg-[#FFB020] text-[#061220] shadow-[0_0_10px_rgba(255,176,32,0.4)]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dissolved O₂</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Scientific Chart on Left, Analytics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart Area */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-[#00C2FF]/20 shadow-2xl relative">
          {/* Chart Controls Strip */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showModelLine}
                  onChange={(e) => setShowModelLine(e.target.checked)}
                  className="accent-[#00C2FF]"
                />
                <span className="flex items-center space-x-1 text-cyan-300 font-medium">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-[#00C2FF]" />
                  <span>INCOIS ROMS Model (Cyan)</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <span className="w-4 h-1 bg-[#FFB020] rounded" />
                <span className="text-[#FFB020] font-medium">Observed Float Sensor (Orange)</span>
              </label>

              {profileType === 'temperature' && (
                <label className="flex items-center space-x-2 cursor-pointer hidden sm:flex">
                  <input
                    type="checkbox"
                    checked={showThermoclineBand}
                    onChange={(e) => setShowThermoclineBand(e.target.checked)}
                    className="accent-[#00C2C2]"
                  />
                  <span className="text-white/60">Highlight Thermocline Layer</span>
                </label>
              )}
            </div>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#061220] hover:bg-white/10 border border-white/10 text-xs text-white"
            >
              <Download className="w-3.5 h-3.5 text-[#00C2FF]" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* SVG Profile Chart */}
          <div className="w-full flex justify-center overflow-x-auto py-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full max-w-2xl h-auto"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const scaleY = chartHeight / rect.height;
                const mouseY = (e.clientY - rect.top) * scaleY;
                const depth = yToDepth(mouseY);
                setHoveredDepth(Math.round(depth));
              }}
            >
              {/* Chart Background Grid */}
              <rect x={padLeft} y={padTop} width={innerWidth} height={innerHeight} fill="#071629" stroke="rgba(0,194,255,0.2)" />

              {/* Inverted Depth Grid lines (every 250m) */}
              {[0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000].map((d) => {
                const y = depthToY(d);
                return (
                  <g key={d}>
                    <line x1={padLeft} y1={y} x2={padLeft + innerWidth} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <text x={padLeft - 10} y={y + 4} fill="rgba(230,244,255,0.6)" fontSize="11" textAnchor="end" fontFamily="monospace">
                      {d}m
                    </text>
                  </g>
                );
              })}

              {/* X-axis ticks */}
              {profileType === 'temperature' && [0, 5, 10, 15, 20, 25, 30].map((val) => {
                const x = valToX(val);
                return (
                  <g key={val}>
                    <line x1={x} y1={padTop} x2={x} y2={padTop + innerHeight} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <text x={x} y={padTop + innerHeight + 18} fill="rgba(230,244,255,0.7)" fontSize="11" textAnchor="middle" fontFamily="monospace">
                      {val}°C
                    </text>
                  </g>
                );
              })}

              {profileType === 'salinity' && [32, 33, 34, 35, 36].map((val) => {
                const x = valToX(val);
                return (
                  <g key={val}>
                    <line x1={x} y1={padTop} x2={x} y2={padTop + innerHeight} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <text x={x} y={padTop + innerHeight + 18} fill="rgba(230,244,255,0.7)" fontSize="11" textAnchor="middle" fontFamily="monospace">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Thermocline / Halocline highlight band (65m to 200m) */}
              {showThermoclineBand && profileType === 'temperature' && (
                <g>
                  <rect
                    x={padLeft}
                    y={depthToY(65)}
                    width={innerWidth}
                    height={depthToY(200) - depthToY(65)}
                    fill="rgba(0, 194, 255, 0.08)"
                    stroke="rgba(0, 194, 255, 0.2)"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={padLeft + innerWidth - 8}
                    y={depthToY(130)}
                    fill="#00C2FF"
                    fontSize="10"
                    textAnchor="end"
                    fontStyle="italic"
                  >
                    Thermocline Layer (65–200m)
                  </text>
                </g>
              )}

              {/* Model Forecast Dashed Curve (Cyan) */}
              {showModelLine && (
                <path
                  d={modelPath}
                  fill="none"
                  stroke="#00C2FF"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
              )}

              {/* Observed In-Situ Curve (Solid Orange) */}
              <path
                d={observedPath}
                fill="none"
                stroke="#FFB020"
                strokeWidth="2.8"
              />

              {/* Hover Indicator Crosshair */}
              {hoveredDepth !== null && (
                <g>
                  <line
                    x1={padLeft}
                    y1={depthToY(currentPoint.depth)}
                    x2={padLeft + innerWidth}
                    y2={depthToY(currentPoint.depth)}
                    stroke="#FE5F4E"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={valToX(
                      profileType === 'temperature'
                        ? currentPoint.observedTemp
                        : profileType === 'salinity'
                        ? currentPoint.observedSalinity
                        : currentPoint.observedOxygen
                    )}
                    cy={depthToY(currentPoint.depth)}
                    r="5"
                    fill="#FFB020"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {showModelLine && (
                    <circle
                      cx={valToX(
                        profileType === 'temperature'
                          ? currentPoint.modelTemp
                          : profileType === 'salinity'
                          ? currentPoint.modelSalinity
                          : currentPoint.modelOxygen
                      )}
                      cy={depthToY(currentPoint.depth)}
                      r="4"
                      fill="#00C2FF"
                    />
                  )}
                </g>
              )}

              {/* Axis Titles */}
              <text
                x={padLeft + innerWidth / 2}
                y={padTop + innerHeight + 42}
                fill="#E6F4FF"
                fontSize="12"
                textAnchor="middle"
                fontWeight="bold"
              >
                {profileType === 'temperature'
                  ? 'Temperature (°C)'
                  : profileType === 'salinity'
                  ? 'Salinity (Practical Salinity Units - PSU)'
                  : 'Dissolved Oxygen (ml/L)'}
              </text>
              <text
                transform={`rotate(-90) translate(-${padTop + innerHeight / 2}, ${padLeft - 45})`}
                fill="#E6F4FF"
                fontSize="12"
                textAnchor="middle"
                fontWeight="bold"
              >
                Depth Inverted (metres below surface)
              </text>
            </svg>
          </div>

          {/* Interactive Depth Scrubber / Indicator at Bottom */}
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-white/60">Hovered Probe Depth:</span>
              <span className="font-mono text-[#00C2FF] font-bold text-sm">
                {currentPoint.depth} m
              </span>
            </div>
            <div className="flex items-center space-x-4 font-mono">
              <span className="text-[#FFB020]">
                Observed: {profileType === 'temperature' ? `${currentPoint.observedTemp}°C` : `${currentPoint.observedSalinity} PSU`}
              </span>
              <span className="text-[#00C2FF]">
                Model: {profileType === 'temperature' ? `${currentPoint.modelTemp}°C` : `${currentPoint.modelSalinity} PSU`}
              </span>
              <span className="text-white/60">
                Bias: {(currentPoint.modelTemp - currentPoint.observedTemp).toFixed(2)}°C
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Statistical Insights & Explorer Explanations */}
        <div className="lg:col-span-4 space-y-4">
          {/* Summary Stats Box */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Statistical Summary</span>
              <span className="text-[10px] text-[#00C2FF] font-mono">0–2000m</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#061220]/70 p-2.5 rounded-lg border border-white/5">
                <span className="text-white/50 text-[10px] uppercase">Mean Temperature</span>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {PROFILE_STATS.temp.mean} °C
                </div>
              </div>
              <div className="bg-[#061220]/70 p-2.5 rounded-lg border border-white/5">
                <span className="text-white/50 text-[10px] uppercase">Std Deviation</span>
                <div className="text-base font-bold font-mono text-[#00C2FF] mt-0.5">
                  ± {PROFILE_STATS.temp.stdDev} °C
                </div>
              </div>
              <div className="bg-[#061220]/70 p-2.5 rounded-lg border border-white/5">
                <span className="text-white/50 text-[10px] uppercase">Surface Mixed Layer</span>
                <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                  {PROFILE_STATS.temp.surfaceMixedLayer}
                </div>
              </div>
              <div className="bg-[#061220]/70 p-2.5 rounded-lg border border-white/5">
                <span className="text-white/50 text-[10px] uppercase">Thermocline Span</span>
                <div className="text-sm font-bold font-mono text-[#FFB020] mt-0.5">
                  {PROFILE_STATS.temp.thermoclineDepth}
                </div>
              </div>
            </div>

            {/* Density computation readout */}
            <div className="bg-[#061220]/70 p-3 rounded-xl border border-purple-500/20 text-xs">
              <div className="flex justify-between text-white/70 mb-1">
                <span>Calculated Seawater Density (at {currentPoint.depth}m):</span>
                <span className="font-mono text-purple-300 font-bold">{currentPoint.density} kg/m³</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400"
                  style={{ width: `${((currentPoint.density - 1020) / 11) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Model Validation Skills Card (Page 16 from PDF) */}
          <div className="glass-panel p-4 rounded-2xl border border-[#00C2FF]/30 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Model Skill Metrics
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Grade: {PROFILE_STATS.validation.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/60">Root Mean Square Error (RMSE):</span>
                <span className="font-mono text-white font-semibold">{PROFILE_STATS.validation.rmseTemp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/60">Pearson Correlation (r):</span>
                <span className="font-mono text-[#00C2FF] font-semibold">{PROFILE_STATS.validation.corrTemp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/60">Mean Temperature Bias:</span>
                <span className="font-mono text-[#FFB020] font-semibold">{PROFILE_STATS.validation.biasTemp}</span>
              </div>
            </div>

            <button
              onClick={onNavigateToComparison}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-[#00C2FF]/20 hover:bg-[#00C2FF]/30 border border-[#00C2FF]/40 text-xs font-semibold text-[#00C2FF] transition-colors flex items-center justify-center"
            >
              <span>View Bar Chart Comparison</span>
            </button>
          </div>

          {/* Explorer Educational Card */}
          {viewMode === 'explorer' && (
            <div className="glass-panel p-4 rounded-2xl border border-[#FFB020]/30 shadow-xl space-y-2">
              <div className="flex items-center space-x-2 text-[#FFB020]">
                <Info className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">What is the Thermocline?</span>
              </div>
              <p className="text-xs text-[#E6F4FF]/80 leading-relaxed">
                Notice how the line drops dramatically between 65m and 180m? That is the <strong>thermocline</strong> — an invisible underwater barrier where warm sunlit water meets the freezing deep ocean!
              </p>
            </div>
          )}

          {/* Jump to 3D Depth Box */}
          <button
            onClick={onNavigateToDepthSlice}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#00C2C2] text-[#061220] font-bold text-xs shadow-[0_0_20px_rgba(0,194,255,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center"
          >
            <span>Switch to 3D Depth Slice Box</span>
          </button>
        </div>
      </div>
    </div>
  );
};
