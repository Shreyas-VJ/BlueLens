import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  Home, 
  HelpCircle, 
  Camera, 
  Share2, 
  Box, 
  LineChart, 
  Info, 
  ChevronRight,
  X,
  Compass,
  Layers,
  Sparkles
} from 'lucide-react';
import { ObservationMarker, ViewMode } from '../types';
import { drawSlocumGlider } from '../utils/renderVehicles';

interface UnderwaterViewProps {
  observation: ObservationMarker;
  viewMode: ViewMode;
  onToggleViewMode?: () => void;
  onOpenGuide?: () => void;
  onEnterDepthSlice: () => void;
  onBackToSurface: () => void;
  onNavigateToProfiles?: () => void;
  onOpenObservationDetails?: () => void;
}

export const UnderwaterView: React.FC<UnderwaterViewProps> = ({
  observation,
  viewMode,
  onToggleViewMode,
  onOpenGuide,
  onEnterDepthSlice,
  onBackToSurface,
  onNavigateToProfiles,
  onOpenObservationDetails,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [vehicleType, setVehicleType] = useState<'argo' | 'glider'>(
    observation.type === 'glider' ? 'glider' : 'argo'
  );
  const [currentDepth, setCurrentDepth] = useState<number>(observation.currentDepth || 452);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [screenshotFlash, setScreenshotFlash] = useState(false);

  // Depth markers matching Image 2
  const depthMarkers = [0, 100, 250, 500, 750, 1000, 1500, 2000];

  // Dynamic telemetry calculated based on depth
  const temp = Math.max(1.8, +(29.2 - (currentDepth / 2000) * 26.5 + (Math.sin(currentDepth * 0.01) * 0.4)).toFixed(1));
  const salinity = +(34.4 + (currentDepth > 150 ? 0.7 : 0.2) + Math.sin(currentDepth * 0.005) * 0.15).toFixed(1);
  const currents = +(Math.max(0.08, 0.48 - (currentDepth / 2000) * 0.38) + Math.cos(currentDepth * 0.02) * 0.03).toFixed(2);

  // Canvas Motion Graphics Rendering (Exact match to Image 2 + Glider)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Preload canyon background image
    const bgImg = new Image();
    bgImg.src = '/images/deep_underwater_canyon.jpg';
    let bgLoaded = false;
    bgImg.onload = () => {
      bgLoaded = true;
    };

    // Marine snow & bioluminescent plankton particles drifting in currents
    const marineSnow = Array.from({ length: 110 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.2 + 0.6,
      speedX: (Math.random() * 0.4 + 0.15) * (currents / 0.35),
      speedY: (Math.random() - 0.5) * 0.3 + 0.1,
      glow: Math.random() > 0.75,
      pulse: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      time += 0.018;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Deep Underwater Abyss / Canyon Backdrop (Image 2 style)
      if (bgLoaded && bgImg.complete) {
        const imgAspect = bgImg.width / bgImg.height;
        const canvasAspect = width / height;
        let drawW = width;
        let drawH = height;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasAspect > imgAspect) {
          drawH = width / imgAspect;
          offsetY = (height - drawH) / 2;
        } else {
          drawW = height * imgAspect;
          offsetX = (width - drawW) / 2;
        }

        ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
      } else {
        // Fallback procedural deep ocean trench
        const abyssGrad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.4,
          50,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.8
        );
        abyssGrad.addColorStop(0, '#0a2e52');
        abyssGrad.addColorStop(0.4, '#061a2e');
        abyssGrad.addColorStop(1, '#020914');
        ctx.fillStyle = abyssGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Subtle atmospheric ocean vignette
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        100,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(1, 6, 15, 0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // 2. Drifting Marine Snow & Plankton Catching Ocean Light
      marineSnow.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x > width + 10) p.x = -10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        if (p.glow) {
          ctx.fillStyle = `rgba(0, 229, 255, ${0.45 + Math.sin(time * 2 + p.pulse) * 0.3})`;
          ctx.shadowColor = '#00C2FF';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = 'rgba(215, 235, 255, 0.35)';
          ctx.fill();
        }
      });

      // 3. Central Vehicle Placement (Centered in deep trench)
      const centerX = width * 0.495;
      const centerY = height * 0.43;

      if (vehicleType === 'glider') {
        // =====================================================================
        // SLOCUM OCEAN GLIDER (Winged Hydrodynamic Cruiser in Deep Canyon)
        // =====================================================================
        // Gentle sinusoidal glide oscillation & banking
        const glideBob = Math.sin(time * 1.5) * 8;
        const glideDrift = Math.cos(time * 0.9) * 12;
        const dynamicPitch = 12 + Math.sin(time * 1.2) * 5; // Subtle pitch trim

        // Wingtip turbulence wake
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX + glideDrift - 60, centerY + glideBob + 20);
        ctx.quadraticCurveTo(
          centerX + glideDrift - 120,
          centerY + glideBob + 30,
          centerX + glideDrift - 180,
          centerY + glideBob + 25
        );
        ctx.stroke();
        ctx.restore();

        // Render Slocum Glider with forward optical beam illuminating canyon
        drawSlocumGlider(ctx, centerX + glideDrift, centerY + glideBob, {
          scale: 1.45,
          pitchDeg: dynamicPitch,
          time: time,
          drawSensorBeam: true,
          beamLength: 280,
          opacity: 1.0,
        });

      } else {
        // =====================================================================
        // ARGO PROFILING FLOAT (Image 2 Vertical Float with Downward Light Beam)
        // =====================================================================
        const bobbing = Math.sin(time * 1.6) * 6;
        const pitch = Math.sin(time * 1.1) * 0.015;

        ctx.save();
        ctx.translate(centerX, centerY + bobbing);
        ctx.rotate(pitch);

        // Volumetric Downward Blue Sensor Light Beam
        const beamH = height * 0.45;
        const beamGrad = ctx.createLinearGradient(0, 80, 0, 80 + beamH);
        beamGrad.addColorStop(0, 'rgba(0, 229, 255, 0.9)');
        beamGrad.addColorStop(0.12, 'rgba(0, 194, 255, 0.65)');
        beamGrad.addColorStop(0.4, 'rgba(0, 140, 240, 0.28)');
        beamGrad.addColorStop(0.8, 'rgba(0, 80, 180, 0.1)');
        beamGrad.addColorStop(1, 'rgba(0, 20, 80, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-5, 80);
        ctx.lineTo(-32, 80 + beamH);
        ctx.lineTo(32, 80 + beamH);
        ctx.lineTo(5, 80);
        ctx.closePath();
        ctx.fill();

        // Inner core of sensor light
        const coreGrad = ctx.createLinearGradient(0, 80, 0, 80 + beamH * 0.4);
        coreGrad.addColorStop(0, 'rgba(220, 250, 255, 0.95)');
        coreGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.4)');
        coreGrad.addColorStop(1, 'rgba(0, 194, 255, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.moveTo(-2, 80);
        ctx.lineTo(-10, 80 + beamH * 0.4);
        ctx.lineTo(10, 80 + beamH * 0.4);
        ctx.lineTo(2, 80);
        ctx.closePath();
        ctx.fill();

        // Illuminating nozzle glow
        ctx.beginPath();
        ctx.arc(0, 80, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#E6F8FF';
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Antenna Mast pointing up with ball tip
        ctx.strokeStyle = '#c5d3e0';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, -68);
        ctx.lineTo(0, -175);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -177, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f0f6fc';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Antenna base cap
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-6, -74, 12, 8, 2);
        ctx.fill();

        // Yellow Cylindrical Argo Pressure Hull
        const hullW = 42;
        const hullH = 135;
        const hullRadius = 12;

        const hullGrad = ctx.createLinearGradient(-hullW / 2, 0, hullW / 2, 0);
        hullGrad.addColorStop(0, '#c77e00');
        hullGrad.addColorStop(0.3, '#ffb800');
        hullGrad.addColorStop(0.65, '#ffd64d');
        hullGrad.addColorStop(0.9, '#e08f00');
        hullGrad.addColorStop(1, '#9e5d00');

        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.roundRect(-hullW / 2, -66, hullW, hullH, hullRadius);
        ctx.fill();

        // Mid-body Black Band
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-hullW / 2, -14, hullW, 26);

        // Cyan status light on black band
        ctx.fillStyle = '#00C2FF';
        ctx.fillRect(-hullW / 2, 0, hullW, 2.5);

        // Lower Nose Cone & Sensor Housing
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.moveTo(-hullW / 2 + 2, 69);
        ctx.lineTo(hullW / 2 - 2, 69);
        ctx.lineTo(hullW / 2 - 12, 82);
        ctx.lineTo(-hullW / 2 + 12, 82);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 4. Left Vertical Depth Ruler (Exact match to Image 2)
      const rulerX = 52;
      const rulerTop = height * 0.16;
      const rulerBottom = height * 0.82;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rulerX, rulerTop);
      ctx.lineTo(rulerX, rulerBottom);
      ctx.stroke();

      depthMarkers.forEach((d) => {
        const dFrac = d / 2000;
        const tickY = rulerTop + Math.pow(dFrac, 0.72) * (rulerBottom - rulerTop);

        ctx.beginPath();
        ctx.moveTo(rulerX, tickY);
        ctx.lineTo(rulerX + 8, tickY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const isCurrent = Math.abs(currentDepth - d) < 60;
        ctx.font = isCurrent ? 'bold 13px monospace' : '12px monospace';
        ctx.fillStyle = isCurrent ? '#00E5FF' : 'rgba(255, 255, 255, 0.75)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${d} m`, rulerX - 10, tickY);
      });

      // Active Depth Marker Tick at currentDepth
      const curFrac = currentDepth / 2000;
      const currentTickY = rulerTop + Math.pow(curFrac, 0.72) * (rulerBottom - rulerTop);
      ctx.beginPath();
      ctx.moveTo(rulerX - 2, currentTickY);
      ctx.lineTo(rulerX + 16, currentTickY);
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentDepth, currents, vehicleType]);

  // Capture canvas screenshot
  const handleScreenshot = () => {
    setScreenshotFlash(true);
    setTimeout(() => setScreenshotFlash(false), 300);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `BLUELENS_${vehicleType}_Depth_${currentDepth}m.png`;
    a.click();
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🌊 INCOIS BLUELENS Ocean Observation:\nPlatform: ${
        vehicleType === 'glider' ? 'Slocum Ocean Glider' : 'Argo Float'
      } (${observation.id})\nDepth: ${currentDepth} m\nTemperature: ${temp}°C\nSalinity: ${salinity} PSU\nCurrents: ${currents} m/s\nExplore live: ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#020914] overflow-hidden select-none">
      {/* Screen flash on screenshot */}
      {screenshotFlash && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-300 opacity-75" />
      )}

      {/* Deep Underwater Canvas Scene */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* TOP HEADER (Exact Match to Image 2 + Vehicle Toggle) */}
      <div className="absolute top-4 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: 3D Blue Swirling Lens Emblem + BLUELENS Brand */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#00C2FF]/40 shadow-[0_0_15px_rgba(0,194,255,0.4)] bg-[#0B1D2E]/80 backdrop-blur-md flex items-center justify-center p-0.5">
            <img
              src="/images/lens_emblem.jpg"
              alt="BLUELENS Emblem"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <span className="text-xl font-black tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            BLUELENS
          </span>
        </div>

        {/* Center: Vehicle Toggle & [ SCIENTIST MODE ] / [ EXPLORER MODE ] Pill Switch */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Vehicle Switcher */}
          <div className="bg-[#0B1D2E]/80 border border-white/15 p-1 rounded-2xl shadow-xl backdrop-blur-xl flex items-center space-x-1">
            <button
              onClick={() => setVehicleType('glider')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                vehicleType === 'glider'
                  ? 'bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/60 shadow-[0_0_12px_rgba(255,176,32,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Glider
            </button>
            <button
              onClick={() => setVehicleType('argo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                vehicleType === 'argo'
                  ? 'bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/60 shadow-[0_0_12px_rgba(0,194,255,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Argo
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="bg-[#0B1D2E]/80 border border-white/15 p-1 rounded-2xl shadow-xl backdrop-blur-xl flex items-center space-x-1">
            <button
              onClick={() => {
                if (viewMode !== 'scientist' && onToggleViewMode) onToggleViewMode();
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                viewMode === 'scientist'
                  ? 'bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/60 shadow-[0_0_12px_rgba(0,194,255,0.3)]'
                : 'text-white/60 hover:text-white'
              }`}
            >
              SCIENTIST MODE
            </button>
            <button
              onClick={() => {
                if (viewMode !== 'explorer' && onToggleViewMode) onToggleViewMode();
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                viewMode === 'explorer'
                  ? 'bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/60 shadow-[0_0_12px_rgba(0,194,255,0.3)]'
                : 'text-white/60 hover:text-white'
              }`}
            >
              EXPLORER MODE
            </button>
          </div>
        </div>

        {/* Right: ? Guide Button */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#0B1D2E]/80 border border-white/15 text-white/90 text-xs font-semibold shadow-lg backdrop-blur-xl hover:bg-white/10 hover:border-white/30 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-[#00C2FF]" />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* BOTTOM ROW: 4 TELEMETRY CARDS (Exact Match to Image 2) */}
      <div className="absolute bottom-6 left-6 right-24 z-30 pointer-events-none">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl pointer-events-auto">
          {/* Card 1: Depth */}
          <div className="bg-[#0B1D2E]/85 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-xl hover:border-[#00C2FF]/40 transition-colors">
            <div className="text-xs font-semibold text-white/60 mb-1">Depth</div>
            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
              {currentDepth} <span className="text-sm font-normal text-white/70">m</span>
            </div>
          </div>

          {/* Card 2: Temp */}
          <div className="bg-[#0B1D2E]/85 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-xl hover:border-[#00C2FF]/40 transition-colors">
            <div className="text-xs font-semibold text-white/60 mb-1">Temp.</div>
            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
              {temp} <span className="text-sm font-normal text-white/70">°C</span>
            </div>
          </div>

          {/* Card 3: Salinity */}
          <div className="bg-[#0B1D2E]/85 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-xl hover:border-[#00C2FF]/40 transition-colors">
            <div className="text-xs font-semibold text-white/60 mb-1">Salinity</div>
            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
              {salinity} <span className="text-sm font-normal text-white/70">PSU</span>
            </div>
          </div>

          {/* Card 4: Currents */}
          <div className="bg-[#0B1D2E]/85 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-xl hover:border-[#00C2FF]/40 transition-colors">
            <div className="text-xs font-semibold text-white/60 mb-1">Currents</div>
            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
              {currents} <span className="text-sm font-normal text-white/70">m/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM RIGHT FLOATING BUTTONS (Exact Match to Image 2) */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col space-y-3 pointer-events-auto">
        {/* Top Button: MapPin / Telemetry Details */}
        <button
          onClick={() => {
            if (onOpenObservationDetails) {
              onOpenObservationDetails();
            } else {
              setShowInfoDrawer(!showInfoDrawer);
            }
          }}
          className="w-12 h-12 rounded-full bg-[#0B1D2E]/90 border border-white/20 hover:border-[#00C2FF]/60 text-white hover:text-[#00C2FF] flex items-center justify-center shadow-2xl backdrop-blur-xl hover:scale-110 active:scale-95 transition-all"
          title="Inspect Telemetry & Coordinates"
        >
          <MapPin className="w-5 h-5" />
        </button>

        {/* Bottom Button: Home / Return to 3D Earth */}
        <button
          onClick={onBackToSurface}
          className="w-12 h-12 rounded-full bg-[#0B1D2E]/90 border border-white/20 hover:border-[#00C2FF]/60 text-white hover:text-[#00C2FF] flex items-center justify-center shadow-2xl backdrop-blur-xl hover:scale-110 active:scale-95 transition-all"
          title="Return to 3D Earth Globe"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      {/* Action Bar Toggle Button for Depth Box, Profiles, Screenshot */}
      <div className="absolute top-20 right-6 z-30 flex items-center space-x-2 pointer-events-auto">
        <button
          onClick={onEnterDepthSlice}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#00E5FF] text-[#061220] font-bold text-xs shadow-[0_0_15px_rgba(0,194,255,0.4)] hover:shadow-[0_0_25px_rgba(0,194,255,0.7)] hover:scale-105 active:scale-95 transition-all"
          title="Enter 3D Ocean Depth Box"
        >
          <Box className="w-4 h-4" />
          <span>Enter 3D Depth Box ➔</span>
        </button>

        {onNavigateToProfiles && (
          <button
            onClick={onNavigateToProfiles}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#0B1D2E]/80 border border-white/15 text-white/80 hover:text-white text-xs font-medium hover:bg-white/10 transition-colors backdrop-blur-xl"
            title="Inspect Temperature & Salinity Profile Curves"
          >
            <LineChart className="w-4 h-4 text-[#00C2FF]" />
            <span className="hidden sm:inline">T & S Curves</span>
          </button>
        )}

        <button
          onClick={handleScreenshot}
          className="p-2 rounded-xl bg-[#0B1D2E]/80 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-xl"
          title="Capture Snapshot"
        >
          <Camera className="w-4 h-4" />
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="p-2 rounded-xl bg-[#0B1D2E]/80 border border-white/15 text-emerald-400 hover:text-emerald-300 hover:bg-white/10 transition-colors backdrop-blur-xl"
          title="Share on WhatsApp"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Explorer Mode Narration Banner */}
      {viewMode === 'explorer' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 max-w-lg w-full px-4 pointer-events-none animate-in fade-in duration-300">
          <div className="bg-[#0B1D2E]/90 border border-[#00C2FF]/30 p-3 rounded-2xl text-center shadow-2xl backdrop-blur-md">
            <p className="text-xs text-[#E6F4FF] font-medium leading-relaxed">
              {vehicleType === 'glider'
                ? `💡 "At ${currentDepth}m deep, the Slocum Glider shifts internal battery pitch mass and changes oil buoyancy to glide silently through deep ocean currents."`
                : `💡 "At ${currentDepth}m deep, sunlight is completely gone. The Argo float uses high-precision CTD sensors to measure ocean heat storage and salinity."`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
