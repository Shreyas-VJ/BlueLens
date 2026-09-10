import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Activity, 
  Box, 
  Microscope, 
  Users, 
  Volume2, 
  VolumeX,
  Sparkles,
  Compass
} from 'lucide-react';
import { ViewMode } from '../types';

interface SplashViewProps {
  onEnter: () => void;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
}

export const SplashView: React.FC<SplashViewProps> = ({
  onEnter,
  viewMode,
  onSelectViewMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound generator for ocean ambient sonar and entrance whoosh
  const playSonarTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // AudioContext blocked or not supported
    }
  };

  const handleStartExploring = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    playSonarTone();

    // Cinematic delay for warp into the ocean depths
    setTimeout(() => {
      onEnter();
    }, 950);
  };

  // Underwater Canvas Motion Graphics: Water caustics, bubbles, marine snow, and swimming fish
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Dynamic rising bubbles & bioluminescent plankton
    const bubbles = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3.5 + 0.8,
      speedY: Math.random() * 0.9 + 0.3,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.2,
      wobble: Math.random() * Math.PI * 2,
    }));

    // School of swimming fish
    const fishSchool = Array.from({ length: 18 }, (_, i) => ({
      x: width * 0.12 + (i % 6) * 18 + Math.random() * 10,
      y: height * 0.38 + Math.floor(i / 6) * 14 + Math.random() * 8,
      speed: Math.random() * 0.6 + 0.8,
      size: Math.random() * 4 + 7,
      tailOffset: Math.random() * Math.PI * 2,
    }));

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Shimmering God Rays / Volumetric sunlight filtering from surface
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const rayAngle = Math.sin(time * 0.4 + i) * 0.08 - 0.04;
        const startX = width * (0.2 + i * 0.18);
        const rayGrad = ctx.createLinearGradient(
          startX,
          0,
          startX + Math.tan(rayAngle) * height,
          height
        );
        rayGrad.addColorStop(0, 'rgba(0, 225, 255, 0.16)');
        rayGrad.addColorStop(0.45, 'rgba(0, 194, 255, 0.05)');
        rayGrad.addColorStop(1, 'rgba(6, 18, 32, 0)');

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(startX - 25, 0);
        ctx.lineTo(startX + 40, 0);
        ctx.lineTo(startX + 180 + Math.tan(rayAngle) * height, height);
        ctx.lineTo(startX + 50 + Math.tan(rayAngle) * height, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Draw swimming school of fish on upper left coral approach
      ctx.save();
      fishSchool.forEach((fish) => {
        fish.x += fish.speed;
        fish.y += Math.sin(time + fish.tailOffset) * 0.3;

        // Wrap around screen
        if (fish.x > width * 0.55) {
          fish.x = width * 0.05 - Math.random() * 40;
          fish.y = height * 0.34 + Math.random() * 80;
        }

        ctx.fillStyle = 'rgba(180, 230, 255, 0.75)';
        ctx.beginPath();
        // Fish body ellipse
        ctx.ellipse(fish.x, fish.y, fish.size, fish.size * 0.38, 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Fish tail fin flapping
        const tailX = fish.x - fish.size;
        const tailY = fish.y + Math.sin(time * 6 + fish.tailOffset) * 1.5;
        ctx.beginPath();
        ctx.moveTo(tailX, fish.y);
        ctx.lineTo(tailX - fish.size * 0.6, tailY - fish.size * 0.35);
        ctx.lineTo(tailX - fish.size * 0.6, tailY + fish.size * 0.35);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      // Draw rising bubbles and bio-luminescent plankton particles
      bubbles.forEach((b) => {
        b.y -= b.speedY;
        b.x += b.speedX + Math.sin(time + b.wobble) * 0.35;
        if (b.y < -15) {
          b.y = height + 15;
          b.x = Math.random() * width;
        }

        const pulseOpacity = b.opacity + Math.sin(time * 2 + b.wobble) * 0.15;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 220, 255, ${Math.max(0.12, Math.min(0.85, pulseOpacity))})`;
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = b.radius * 2.5;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#061220] select-none ${isTransitioning ? 'pointer-events-none' : ''}`}>
      {/* Photorealistic Deep Ocean & Submersible Background (Matching 2nd Image) */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 transform ${
          isTransitioning ? 'scale-125 filter blur-sm brightness-150' : 'scale-100'
        }`}
        style={{
          backgroundImage: `url('/images/deep_ocean_submersible_1788970972929.jpg')`,
        }}
      >
        {/* Subtle Vignette and Deep Ocean Color Grade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#031528]/40 via-transparent to-[#020b14]/75" />
      </div>

      {/* Dynamic Water Caustics, God-Rays, Swimming Fish & Bubbles Motion Graphics Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Submersible Headlight Volumetric Beam Simulation on the Right */}
      <div className="absolute right-[8%] top-[20%] w-[320px] h-[320px] pointer-events-none z-10 opacity-70 hidden md:block">
        <div className="w-full h-full bg-gradient-to-bl from-yellow-100/25 via-cyan-400/10 to-transparent rounded-full filter blur-2xl animate-beam-flicker" />
      </div>

      {/* Top Bar: Discreet INCOIS Header, Persona Switcher & Audio Toggle */}
      <header className="relative z-20 w-full px-4 sm:px-8 pt-4 sm:pt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="px-3 py-1 rounded-full bg-[#06192e]/80 border border-[#00C2FF]/30 backdrop-blur-md flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-[#E6F4FF] uppercase">
              INCOIS OPERATIONAL PLATFORM
            </span>
          </div>
          <span className="text-[11px] text-white/60 hidden lg:inline font-medium">
            Ministry of Earth Sciences, Govt. of India
          </span>
        </div>

        {/* Top Controls: Mode Switcher & Ambient Audio */}
        <div className="flex items-center space-x-2">
          {/* Audio toggle */}
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              playSonarTone();
            }}
            className="p-2 rounded-xl bg-[#06192e]/80 hover:bg-[#00C2FF]/20 border border-white/10 text-white/70 hover:text-white transition-all backdrop-blur-md"
            title={audioEnabled ? 'Mute Ocean Sonar' : 'Enable Ocean Sonar'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-[#00E5FF]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#06192e]/85 border border-[#00C2FF]/40 rounded-xl p-1 backdrop-blur-md shadow-lg">
            <button
              onClick={() => onSelectViewMode('scientist')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                viewMode === 'scientist'
                  ? 'bg-[#00C2FF] text-[#061220] shadow-[0_0_12px_rgba(0,194,255,0.6)] font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <span>🔬</span>
              <span className="hidden sm:inline">Scientist Mode</span>
              <span className="sm:hidden">Sci</span>
            </button>
            <button
              onClick={() => onSelectViewMode('explorer')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                viewMode === 'explorer'
                  ? 'bg-[#FFB020] text-[#061220] shadow-[0_0_12px_rgba(255,176,32,0.6)] font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <span>🧭</span>
              <span className="hidden sm:inline">Explorer Mode</span>
              <span className="sm:hidden">Exp</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Center Stage: 3D Blue Lens Emblem, Typography, and "ENTER START EXPLORING" Button */}
      <main className={`relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 py-6 sm:py-8 my-auto transition-all duration-700 ${
        isTransitioning ? 'scale-110 opacity-0 filter blur-md' : 'scale-100 opacity-100'
      }`}>
        {/* 3D Swirling Blue Aperture Vortex Emblem */}
        <div 
          onClick={handleStartExploring}
          className="relative mb-5 sm:mb-6 cursor-pointer group select-none"
          title="Click to dive into the ocean"
        >
          {/* Outer Pulsing Bioluminescent Halo */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-[#00C2FF]/30 via-[#0055ff]/20 to-[#00E5FF]/40 filter blur-xl animate-pulse group-hover:scale-125 transition-transform duration-700" />

          {/* Rotating Outer Blade Ring */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full p-[2px] bg-gradient-to-tr from-[#00C2FF] via-[#0055ff] to-[#00e5ff] shadow-[0_0_50px_rgba(0,194,255,0.6)] group-hover:shadow-[0_0_80px_rgba(0,229,255,0.9)] transition-all duration-500">
            {/* Spinning decorative aperture blades */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00C2FF]/40 animate-spin-slow" />
            <div className="absolute inset-2 rounded-full border border-[#00E5FF]/50 animate-spin-reverse-slow" />

            {/* High-Resolution 3D Metallic Blue Lens Emblem */}
            <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner bg-[#031528] flex items-center justify-center">
              <img 
                src="/images/ocean_lens_emblem_1788970988782.jpg" 
                alt="BLUELENS Aperture Emblem"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full transform group-hover:scale-110 group-hover:rotate-45 transition-transform duration-700"
              />

              {/* Central Glowing Energy Iris / Sonar Core */}
              <div className="absolute w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-cyan-300/40 backdrop-blur-sm border border-white flex items-center justify-center shadow-[0_0_20px_#00E5FF]">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white shadow-[0_0_12px_#ffffff] animate-ping opacity-80" />
              </div>

              {/* Acoustic Sonar Ring Animation */}
              <div className="absolute inset-0 rounded-full border-2 border-[#00E5FF]/60 animate-ping opacity-30 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Title: BLULENS (Exact typography and styling from Image 2) */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-wider text-white mb-2 drop-shadow-[0_4px_24px_rgba(0,194,255,0.8)] glow-cyan">
          BLULENS
        </h1>

        {/* Horizontal Divider Line with "UNDERSTAND DEEPER" */}
        <div className="flex items-center justify-center space-x-3 sm:space-x-4 my-2 text-white/95 text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase">
          <div className="h-[1px] w-12 sm:w-20 md:w-28 bg-gradient-to-r from-transparent via-[#00C2FF] to-[#00C2FF]" />
          <span className="drop-shadow-[0_2px_8px_rgba(0,194,255,0.7)]">UNDERSTAND DEEPER</span>
          <div className="h-[1px] w-12 sm:w-20 md:w-28 bg-gradient-to-l from-transparent via-[#00C2FF] to-[#00C2FF]" />
        </div>

        {/* Subtitle: BEYOND OCEAN */}
        <h2 className="text-xs sm:text-sm font-extrabold tracking-[0.35em] text-[#00C2FF] uppercase mb-7 drop-shadow-[0_2px_12px_rgba(0,194,255,0.7)]">
          BEYOND OCEAN
        </h2>

        {/* Main CTA: Glowing Pill Button "→ ENTER START EXPLORING" */}
        <button
          onClick={handleStartExploring}
          className="group relative inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm text-white bg-[#06203a]/75 hover:bg-[#00C2FF]/20 border-2 border-[#00C2FF] shadow-[0_0_25px_rgba(0,194,255,0.6)] hover:shadow-[0_0_45px_rgba(0,229,255,0.95)] hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-md cursor-pointer"
        >
          {/* Subtle neon glowing pulse border */}
          <span className="absolute -inset-0.5 rounded-full bg-[#00C2FF]/30 blur-sm group-hover:bg-[#00E5FF]/60 transition-all" />
          
          <span className="relative z-10 flex items-center space-x-2.5">
            <ArrowRight className="w-4 h-4 text-[#00E5FF] transition-transform duration-300 group-hover:translate-x-1.5" />
            <span className="tracking-wider">ENTER START EXPLORING</span>
          </span>
        </button>
      </main>

      {/* Bottom 4 Feature Columns with Delicate Dividers (Matching 2nd Image) */}
      <footer className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 items-center justify-center border-t border-white/10 pt-4 sm:pt-6 gap-4 md:gap-0">
          {/* 1. Real-Time Data */}
          <div className="flex flex-col items-center text-center px-3 md:border-r md:border-white/15 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#06192e]/60 border border-[#00C2FF]/30 flex items-center justify-center mb-1.5 shadow-[0_0_15px_rgba(0,194,255,0.2)] group-hover:border-[#00C2FF] transition-all">
              <Activity className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">
              Real-Time
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">
              Data
            </span>
          </div>

          {/* 2. 3D Visualization */}
          <div className="flex flex-col items-center text-center px-3 md:border-r md:border-white/15 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#06192e]/60 border border-[#00C2FF]/30 flex items-center justify-center mb-1.5 shadow-[0_0_15px_rgba(0,194,255,0.2)] group-hover:border-[#00C2FF] transition-all">
              <Box className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">
              3D
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">
              Visualization
            </span>
          </div>

          {/* 3. Scientific Insights */}
          <div className="flex flex-col items-center text-center px-3 md:border-r md:border-white/15 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#06192e]/60 border border-[#00C2FF]/30 flex items-center justify-center mb-1.5 shadow-[0_0_15px_rgba(0,194,255,0.2)] group-hover:border-[#00C2FF] transition-all">
              <Microscope className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">
              Scientific
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">
              Insights
            </span>
          </div>

          {/* 4. For Everyone */}
          <div className="flex flex-col items-center text-center px-3 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#06192e]/60 border border-[#00C2FF]/30 flex items-center justify-center mb-1.5 shadow-[0_0_15px_rgba(0,194,255,0.2)] group-hover:border-[#00C2FF] transition-all">
              <Users className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">
              For Everyone
            </span>
            <span className="text-[11px] text-white/50 hidden sm:inline">
              Coastal & Global
            </span>
          </div>
        </div>
      </footer>

      {/* Cinematic Warp Dive Transition Flash Overlay when clicking Enter */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-gradient-to-t from-[#00C2FF]/40 via-transparent to-white/30 backdrop-blur-md animate-warp-out">
          <div className="w-48 h-48 rounded-full border-4 border-white animate-ping opacity-90 shadow-[0_0_100px_#00E5FF]" />
        </div>
      )}
    </div>
  );
};
