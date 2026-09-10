import React, { useEffect, useState, useRef } from 'react';
import { 
  SkipForward, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  Pause,
  Play,
  Layers,
  Sparkles,
  Repeat
} from 'lucide-react';
import { ObservationMarker, ViewMode } from '../types';
import { drawSlocumGlider } from '../utils/renderVehicles';

interface DiveTransitionProps {
  observation: ObservationMarker;
  viewMode: ViewMode;
  onCompleteDive: (finalDepth: number) => void;
  onCancelDive: () => void;
}

export const DiveTransition: React.FC<DiveTransitionProps> = ({
  observation,
  viewMode,
  onCompleteDive,
  onCancelDive,
}) => {
  // Vehicle selection: defaults to observation.type, but allows toggle
  const [vehicleType, setVehicleType] = useState<'argo' | 'glider'>(
    observation.type === 'glider' ? 'glider' : 'argo'
  );
  const [currentDepth, setCurrentDepth] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 5>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const targetDepth = observation.currentDepth || 452;

  // Depth markers scale on left (Exact match to both reference images)
  const depthMarkers = [0, 100, 250, 500, 750, 1000, 1500, 2000];

  // Milestone triggers based on ocean depth zones
  useEffect(() => {
    if (currentDepth >= 100 && currentDepth < 220) {
      setActiveMilestone(
        vehicleType === 'glider'
          ? '100m: Thermocline gradient entry — Autonomous wings generating forward hydrodynamic lift.'
          : '100m: Base of Euphotic Zone — 99% of sunlight is absorbed by ocean water.'
      );
    } else if (currentDepth >= 450 && currentDepth < 600) {
      setActiveMilestone(
        vehicleType === 'glider'
          ? '452m: Slocum Glider cruise depth — CTD, backscatter & fluorometer payload active.'
          : '452m: Profiling Cruise Depth — Argo CTD payload actively measuring T & S.'
      );
    } else if (currentDepth >= 1000 && currentDepth < 1200) {
      setActiveMilestone('1000m: Bathypelagic Midnight Zone — Pressure exceeds 100 atmospheres.');
    } else if (currentDepth >= 1950) {
      setActiveMilestone('2000m: Deep profiling cycle boundary reached.');
    }
  }, [currentDepth, vehicleType]);

  // Audio Sonar & Hydrophone synthesize using Web Audio API
  const playSonarPing = () => {
    if (!audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(vehicleType === 'glider' ? 960 : 880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(vehicleType === 'glider' ? 520 : 440, ctx.currentTime + 0.55);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Audio context might be restricted
    }
  };

  // Real-time Depth Descent Animation Loop
  useEffect(() => {
    if (isPaused) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let lastPing = 0;

    const update = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Hydrophone ping every 400m
      if (now - lastPing > 3000 / speedMultiplier) {
        lastPing = now;
        playSonarPing();
      }

      setCurrentDepth((prev) => {
        const increment = 110 * speedMultiplier * delta;
        const next = prev + increment;
        if (next >= targetDepth) {
          setTimeout(() => onCompleteDive(targetDepth), 600);
          return targetDepth;
        }
        return next;
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, speedMultiplier, targetDepth, onCompleteDive, audioEnabled, vehicleType]);

  // Canvas Motion Graphics Rendering
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

    // Preload background image
    const bgImage = new Image();
    bgImage.src = '/images/ocean_split_surface.jpg';
    let bgLoaded = false;
    bgImage.onload = () => {
      bgLoaded = true;
    };

    // Bubble particles streaming upward from vehicle
    const bubbles: Array<{
      x: number;
      y: number;
      r: number;
      speedY: number;
      speedX: number;
      opacity: number;
    }> = Array.from({ length: 50 }, () => ({
      x: width * 0.56 + (Math.random() - 0.5) * 60,
      y: Math.random() * height,
      r: Math.random() * 2.2 + 0.8,
      speedY: Math.random() * 2.2 + 1.2,
      speedX: (Math.random() - 0.5) * 0.8,
      opacity: Math.random() * 0.55 + 0.2,
    }));

    let time = 0;

    const render = () => {
      time += 0.024;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Background: Split level ocean surface (Matches reference images)
      if (bgLoaded && bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, width, height);
      } else {
        // Procedural split ocean fallback
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.26);
        skyGrad.addColorStop(0, '#5599c8');
        skyGrad.addColorStop(0.7, '#d8e5ee');
        skyGrad.addColorStop(1, '#eaf2f8');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height * 0.26);

        const oceanGrad = ctx.createLinearGradient(0, height * 0.26, 0, height);
        oceanGrad.addColorStop(0, '#005b8a');
        oceanGrad.addColorStop(0.3, '#00335c');
        oceanGrad.addColorStop(0.7, '#001a33');
        oceanGrad.addColorStop(1, '#000c1c');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, height * 0.26, width, height * 0.74);
      }

      // Dynamic water surface line Y position (~25.5% of screen height)
      const surfaceY = height * 0.255;
      const bottomTrackY = height * 0.86;

      // 2. Surface Water Line Subtle Undulation
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, surfaceY);
      for (let x = 0; x <= width; x += 30) {
        const waveY = surfaceY + Math.sin(x * 0.015 + time * 2) * 2.5;
        ctx.lineTo(x, waveY);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Horizontal position of the vertical descent cable
      // In the user's glider image, the cable is positioned around ~58% of screen width
      const trackX = vehicleType === 'glider' ? width * 0.58 : width * 0.528;

      // 3. Vertical Descent Cable / Tether (Thin steel guide line from surface)
      ctx.save();
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(trackX, surfaceY);
      ctx.lineTo(trackX, height * 0.96);
      ctx.stroke();
      ctx.restore();

      // 4. Calculate Y position of the active Descending Vehicle
      const depthFraction = Math.min(1, currentDepth / 2000);
      const visualDescentProgress = Math.pow(depthFraction, 0.75);
      const vehicleY = surfaceY + visualDescentProgress * (bottomTrackY - surfaceY);

      // Dynamic water darkness vignette based on current depth
      const vignetteOpacity = Math.min(0.65, depthFraction * 0.75);
      if (vignetteOpacity > 0) {
        const vigGrad = ctx.createRadialGradient(
          trackX,
          vehicleY,
          40,
          trackX,
          vehicleY,
          Math.max(width, height) * 0.7
        );
        vigGrad.addColorStop(0, 'rgba(0, 10, 25, 0)');
        vigGrad.addColorStop(1, `rgba(0, 5, 15, ${vignetteOpacity})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, surfaceY, width, height - surfaceY);
      }

      // 5. VEHICLE-SPECIFIC RENDERING: GLIDER vs ARGO
      if (vehicleType === 'glider') {
        // =========================================================================
        // SLOCUM OCEAN GLIDER (Exact match to User's Uploaded Glider Image)
        // Two gliders along the descent line (Active + Projected waypoint)
        // =========================================================================

        // A. Projected Lower Glider (at ~1100m, showing projected descent path)
        const lowerDepthFraction = Math.min(1, (currentDepth + 650) / 2000);
        const lowerY = surfaceY + Math.pow(lowerDepthFraction, 0.75) * (bottomTrackY - surfaceY);

        if (lowerY < bottomTrackY + 40) {
          drawSlocumGlider(ctx, trackX, lowerY, {
            scale: 0.92,
            pitchDeg: 24,
            time: time * 0.8,
            drawSensorBeam: false,
            opacity: 0.95,
            isGhost: false,
          });
        }

        // B. Active Upper Glider (at active descending depth, e.g. 452m)
        drawSlocumGlider(ctx, trackX, vehicleY, {
          scale: 1.05,
          pitchDeg: 24,
          time: time,
          drawSensorBeam: true,
          beamLength: 140,
          opacity: 1.0,
          isGhost: false,
        });

        // Micro-bubble wake trailing from glider wingtips
        bubbles.forEach((b) => {
          b.y -= b.speedY * (1 + speedMultiplier * 0.35);
          b.x -= b.speedX * 0.8;
          if (b.y < surfaceY + 5) {
            b.y = vehicleY + (Math.random() - 0.5) * 30;
            b.x = trackX - 25 - Math.random() * 40;
          }

          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 240, 255, ${b.opacity * 0.7})`;
          ctx.fill();
        });

      } else {
        // =========================================================================
        // ARGO PROFILING FLOAT (Exact match to Reference Image 1)
        // Surface Buoy + Descending Cylinder Float + Downward Volumetric Light Beam
        // =========================================================================

        // Surface Argo Float at 0m (bobbing gently on the waves)
        const surfaceBob = Math.sin(time * 2.2) * 3;
        ctx.save();
        ctx.translate(trackX, surfaceY + surfaceBob);

        // Antenna pointing up out of water into the sky
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, -95);
        ctx.stroke();

        // Antenna base collar
        ctx.fillStyle = '#061220';
        ctx.beginPath();
        ctx.roundRect(-4, -22, 8, 8, 2);
        ctx.fill();

        // Floating cylinder buoy (half submerged in water)
        const surfaceHullGrad = ctx.createLinearGradient(-13, 0, 13, 0);
        surfaceHullGrad.addColorStop(0, '#d98b00');
        surfaceHullGrad.addColorStop(0.4, '#ffc000');
        surfaceHullGrad.addColorStop(0.8, '#ffe066');
        surfaceHullGrad.addColorStop(1, '#b36b00');
        ctx.fillStyle = surfaceHullGrad;
        ctx.beginPath();
        ctx.roundRect(-13, -18, 26, 48, 5);
        ctx.fill();

        // Black band on surface buoy
        ctx.fillStyle = '#0a1018';
        ctx.fillRect(-13, -2, 26, 12);

        // Waterline meniscus reflection on the buoy
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(-13, 10, 26, 2);
        ctx.restore();

        // Volumetric Downward Blue Sensor Light Beam
        ctx.save();
        ctx.translate(trackX, vehicleY + 54);
        const beamGrad = ctx.createLinearGradient(0, 0, 0, 240);
        beamGrad.addColorStop(0, 'rgba(0, 229, 255, 0.85)');
        beamGrad.addColorStop(0.15, 'rgba(0, 194, 255, 0.55)');
        beamGrad.addColorStop(0.5, 'rgba(0, 140, 230, 0.25)');
        beamGrad.addColorStop(1, 'rgba(0, 50, 150, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-24, 240);
        ctx.lineTo(24, 240);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();

        // Sensor light core flare
        ctx.beginPath();
        ctx.arc(0, 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#E0F7FF';
        ctx.shadowColor = '#00C2FF';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Rising Bubbles from the sinking cylinder
        bubbles.forEach((b) => {
          b.y -= b.speedY * (1 + speedMultiplier * 0.4);
          b.x += b.speedX + Math.sin(time * 3 + b.y * 0.05) * 0.4;
          if (b.y < surfaceY + 5) {
            b.y = vehicleY + Math.random() * 50;
            b.x = trackX + (Math.random() - 0.5) * 36;
          }

          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 235, 255, ${b.opacity * (1 - (surfaceY / (b.y || 1)) * 0.5)})`;
          ctx.fill();
        });

        // Descending Argo Float Body (Yellow cylinder, black band, CTD nose)
        ctx.save();
        const floatWobble = Math.sin(time * 2.8) * 1.5;
        ctx.translate(trackX, vehicleY);
        ctx.rotate((floatWobble * Math.PI) / 180);

        // Top antenna extending upwards
        ctx.strokeStyle = '#1a2230';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.lineTo(0, -110);
        ctx.stroke();

        // Antenna base cap
        ctx.fillStyle = '#061220';
        ctx.beginPath();
        ctx.roundRect(-4, -46, 8, 8, 2);
        ctx.fill();

        // Yellow pressure hull
        const hullGrad = ctx.createLinearGradient(-15, 0, 15, 0);
        hullGrad.addColorStop(0, '#d98b00');
        hullGrad.addColorStop(0.35, '#ffc000');
        hullGrad.addColorStop(0.7, '#ffe066');
        hullGrad.addColorStop(1, '#b36b00');
        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.roundRect(-15, -42, 30, 84, 8);
        ctx.fill();

        // Black sensor collar band
        ctx.fillStyle = '#0a1018';
        ctx.fillRect(-15, -12, 30, 16);

        // Cyan telemetry stripe
        ctx.fillStyle = '#00C2FF';
        ctx.fillRect(-15, 0, 30, 2);

        // Bottom CTD nose cone
        ctx.fillStyle = '#080d14';
        ctx.beginPath();
        ctx.moveTo(-13, 42);
        ctx.lineTo(13, 42);
        ctx.lineTo(7, 54);
        ctx.lineTo(-7, 54);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 6. Left Vertical Depth Axis Ruler (Exact match to both reference images)
      const rulerX = 54;
      const rulerTop = surfaceY;
      const rulerBottom = bottomTrackY;

      // Vertical line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rulerX, rulerTop);
      ctx.lineTo(rulerX, rulerBottom);
      ctx.stroke();

      // Ticks and labels
      depthMarkers.forEach((d) => {
        const dFrac = d / 2000;
        const tickY = rulerTop + Math.pow(dFrac, 0.75) * (rulerBottom - rulerTop);

        // Tick line extending right
        ctx.beginPath();
        ctx.moveTo(rulerX, tickY);
        ctx.lineTo(rulerX + 8, tickY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Depth label on the left
        const isCurrentActive = Math.abs(currentDepth - d) < 65;
        ctx.font = isCurrentActive ? 'bold 13px monospace' : '12px monospace';
        ctx.fillStyle = isCurrentActive ? '#00E5FF' : 'rgba(255, 255, 255, 0.85)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${d} m`, rulerX - 10, tickY);
      });

      // Active Depth Tracker Notch along Ruler
      const currentTickY = vehicleY;
      ctx.beginPath();
      ctx.moveTo(rulerX - 3, currentTickY);
      ctx.lineTo(rulerX + 14, currentTickY);
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentDepth, speedMultiplier, vehicleType]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#001428] overflow-hidden select-none">
      {/* Background & Motion Canvas (Split Level Ocean) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Top Left Header */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none">
        <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center space-x-2.5">
          <span>3. DIVE TRANSITION</span>
        </h1>
        <p className="text-xs text-[#00E5FF] font-medium tracking-wide drop-shadow-md">
          {vehicleType === 'glider' ? 'Slocum Ocean Glider' : 'Argo Profiling Float'} ({observation.id}) • Water Column Profile
        </p>
      </div>

      {/* Top Right Floating Controls (Vehicle Switcher, Speed, Sound, Pause, Skip, Cancel) */}
      <div className="absolute top-5 right-6 z-20 flex items-center space-x-2 bg-[#061220]/80 border border-white/15 px-3 py-2 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto">
        {/* Vehicle Toggle Pill Switcher */}
        <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/10 mr-1">
          <button
            onClick={() => setVehicleType('glider')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              vehicleType === 'glider'
                ? 'bg-[#FFB020] text-[#061220] shadow-[0_0_10px_rgba(255,176,32,0.6)]'
                : 'text-white/60 hover:text-white'
            }`}
            title="Inspect Slocum Glider Descent"
          >
            Slocum Glider
          </button>
          <button
            onClick={() => setVehicleType('argo')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              vehicleType === 'argo'
                ? 'bg-[#00C2FF] text-[#061220] shadow-[0_0_10px_rgba(0,194,255,0.6)]'
                : 'text-white/60 hover:text-white'
            }`}
            title="Inspect Argo Float Descent"
          >
            Argo Float
          </button>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            const next = !audioEnabled;
            setAudioEnabled(next);
            if (next) playSonarPing();
          }}
          className={`p-2 rounded-xl transition-all ${
            audioEnabled
              ? 'bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/40'
              : 'text-white/60 hover:text-white bg-white/5'
          }`}
          title={audioEnabled ? 'Mute Hydrophone Ping' : 'Enable Ocean Hydrophone Ping'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Pause / Resume */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-2 rounded-xl text-white/80 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          title={isPaused ? 'Resume Descent' : 'Pause Descent'}
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Speed Controls */}
        <div className="flex items-center space-x-1 border-l border-white/15 pl-2">
          {([1, 2, 5] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => setSpeedMultiplier(spd)}
              className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                speedMultiplier === spd
                  ? 'bg-[#00C2FF] text-[#061220] shadow-[0_0_10px_rgba(0,194,255,0.5)]'
                  : 'text-white/70 hover:text-white bg-white/5'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>

        {/* Skip to Target Depth Button */}
        <button
          onClick={() => onCompleteDive(targetDepth)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#00E5FF] text-[#061220] text-xs font-bold shadow-[0_0_15px_rgba(0,194,255,0.4)] hover:shadow-[0_0_25px_rgba(0,194,255,0.7)] hover:scale-105 active:scale-95 transition-all ml-1"
          title="Fast-forward directly to target observation depth"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Skip to {targetDepth}m</span>
        </button>

        {/* Cancel / Return to Surface */}
        <button
          onClick={onCancelDive}
          className="p-2 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          title="Return to 3D Earth Globe"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Ocean Depth Zone Informational Pop-up */}
      {activeMilestone && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 max-w-md w-full px-4 pointer-events-none animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-[#061220]/90 border border-[#00C2FF]/40 px-4 py-2.5 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.6)] flex items-center space-x-3 backdrop-blur-xl text-center">
            <Sparkles className="w-4 h-4 text-[#00E5FF] shrink-0" />
            <span className="text-xs text-[#E6F4FF] font-medium leading-tight">
              {activeMilestone}
            </span>
          </div>
        </div>
      )}

      {/* Bottom Center Readout (Exact match to Reference Image: "Descending... 452 m") */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
        <div className="text-center font-mono select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          <span className="text-2xl sm:text-3xl font-normal text-white tracking-wide">
            Descending...{' '}
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight glow-cyan">
            {Math.round(currentDepth)} m
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-white/50 mt-1.5 font-mono">
          <span>Target: {targetDepth} m</span>
          <span>•</span>
          <span>Descent Rate: {110 * speedMultiplier} m/s</span>
        </div>
      </div>
    </div>
  );
};
