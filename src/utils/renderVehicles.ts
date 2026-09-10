/**
 * High-Fidelity Procedural Rendering for Ocean Observation Platforms:
 * 1. Slocum Ocean Glider (Swept Wings, Torpedo Hull, Slocum Markings, Downward Glide Attitude)
 * 2. Argo Profiling Float (Vertical Cylinder, Sensor Collar, Volumetric Beam)
 */

export interface GliderRenderOptions {
  scale?: number;
  pitchDeg?: number;
  yawOffset?: number;
  time?: number;
  drawSensorBeam?: boolean;
  beamLength?: number;
  opacity?: number;
  isGhost?: boolean;
}

export function drawSlocumGlider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: GliderRenderOptions = {}
) {
  const {
    scale = 1.0,
    pitchDeg = 24, // Realistic downward glide angle matching user's reference image
    yawOffset = 0,
    time = 0,
    drawSensorBeam = false,
    beamLength = 220,
    opacity = 1.0,
    isGhost = false,
  } = options;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.rotate(((pitchDeg + Math.sin(time * 2) * 1.2) * Math.PI) / 180);
  ctx.scale(scale, scale);

  // Subtle hydrodynamic roll wobble
  const rollWobble = Math.sin(time * 2.5 + yawOffset) * 0.03;
  ctx.transform(1, rollWobble, 0, 1, 0, 0);

  // 1. Far/Upper Wing (Drawn behind the fuselage)
  ctx.save();
  ctx.fillStyle = isGhost ? '#b38600' : '#d99800';
  ctx.beginPath();
  ctx.moveTo(12, -10);
  ctx.lineTo(-28, -52); // Swept tip
  ctx.lineTo(-12, -56);
  ctx.lineTo(26, -10);
  ctx.closePath();
  ctx.fill();
  // Wing leading edge shadow
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 2. Black Aft/Tail Housing (Charcoal cylindrical propulsion & battery pitch housing)
  ctx.save();
  const aftGrad = ctx.createLinearGradient(-75, -11, -75, 11);
  aftGrad.addColorStop(0, '#334155');
  aftGrad.addColorStop(0.3, '#1e293b');
  aftGrad.addColorStop(0.7, '#0f172a');
  aftGrad.addColorStop(1, '#020617');
  ctx.fillStyle = aftGrad;
  ctx.beginPath();
  ctx.roundRect(-76, -11, 44, 22, 2);
  ctx.fill();

  // Joiner Ring / Clamp bands in metallic slate
  ctx.fillStyle = '#475569';
  ctx.fillRect(-75, -11, 3, 22);
  ctx.fillRect(-35, -11.5, 3, 23);

  // White emergency strobe / recovery LED on aft section
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.arc(-55, -11, 2, 0, Math.PI * 2);
  ctx.fill();

  // Small antenna mast on black aft section pointing straight up
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-50, -11);
  ctx.lineTo(-50, -32);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-50, -33, 1.8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // 3. Tail Assembly (Vertical Rudder Fin & Horizontal Stabilizer in Safety Yellow)
  ctx.save();
  // Vertical yellow rudder fin
  const finGrad = ctx.createLinearGradient(-76, -10, -76, -42);
  finGrad.addColorStop(0, '#eab308');
  finGrad.addColorStop(0.5, '#facc15');
  finGrad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = finGrad;
  ctx.beginPath();
  ctx.moveTo(-70, -10);
  ctx.lineTo(-78, -42); // Swept top tip
  ctx.lineTo(-64, -42);
  ctx.lineTo(-58, -10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Fin text / marking
  ctx.save();
  ctx.translate(-71, -26);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 5px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText('SLOCUM', 0, 0);
  ctx.restore();

  // Horizontal yellow tail plane
  ctx.fillStyle = '#ca8a04';
  ctx.beginPath();
  ctx.moveTo(-74, 4);
  ctx.lineTo(-88, 12);
  ctx.lineTo(-78, 13);
  ctx.lineTo(-68, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Main Yellow Fuselage (High-visibility cylindrical body)
  ctx.save();
  const hullGrad = ctx.createLinearGradient(0, -12.5, 0, 12.5);
  hullGrad.addColorStop(0, '#eab308');
  hullGrad.addColorStop(0.2, '#fde047');
  hullGrad.addColorStop(0.55, '#eab308');
  hullGrad.addColorStop(0.85, '#ca8a04');
  hullGrad.addColorStop(1, '#854d0e');
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.roundRect(-33, -12, 86, 24, 3);
  ctx.fill();

  // Highlight specular sheen line along top spine
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-30, -10);
  ctx.lineTo(50, -10);
  ctx.stroke();

  // Middle Section Insignia & Branding (Matching user reference image!)
  ctx.save();
  ctx.translate(14, 0);

  // Dual cyan/navy wave logo
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(-22, -1, 4, Math.PI * 0.8, Math.PI * 1.8);
  ctx.stroke();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(-20, 1.5, 3.5, Math.PI * 0.8, Math.PI * 1.8);
  ctx.stroke();

  // Text: "SLOCUM"
  ctx.font = '900 7.5px sans-serif';
  ctx.fillStyle = '#0f2b48';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SLOCUM', -13, -2);

  // Subtext: "OCEAN GLIDER"
  ctx.font = 'bold 3.8px sans-serif';
  ctx.fillStyle = '#1e3a5f';
  ctx.fillText('OCEAN GLIDER', -13, 4.5);
  ctx.restore();

  // Top Towing Bracket / Tether Eyelet (where the vertical descent wire attaches)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(8, -12, 2.5, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -12, 1.2, Math.PI, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // 5. Near/Lower Hydrodynamic Swept Wing (Foreground wing)
  ctx.save();
  const wingGrad = ctx.createLinearGradient(0, 8, -25, 52);
  wingGrad.addColorStop(0, '#facc15');
  wingGrad.addColorStop(0.6, '#eab308');
  wingGrad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(22, 9); // Forward root
  ctx.lineTo(-14, 46); // Swept outer tip
  ctx.lineTo(-32, 42); // Trailing tip
  ctx.lineTo(8, 9); // Aft root
  ctx.closePath();
  ctx.fill();

  // Wing trailing edge carbon strip
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-14, 46);
  ctx.lineTo(-32, 42);
  ctx.stroke();

  // Wing leading edge highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(22, 9);
  ctx.lineTo(-14, 46);
  ctx.stroke();
  ctx.restore();

  // 6. Rounded Black Nose Cone (Hydrodynamic dome nose with CTD sensor port)
  ctx.save();
  const noseGrad = ctx.createRadialGradient(62, -2, 2, 60, 0, 26);
  noseGrad.addColorStop(0, '#334155');
  noseGrad.addColorStop(0.4, '#1e293b');
  noseGrad.addColorStop(0.85, '#0f172a');
  noseGrad.addColorStop(1, '#020617');
  ctx.fillStyle = noseGrad;
  ctx.beginPath();
  ctx.moveTo(53, -12);
  ctx.bezierCurveTo(72, -11, 79, -5, 80, 0);
  ctx.bezierCurveTo(79, 5, 72, 11, 53, 12);
  ctx.closePath();
  ctx.fill();

  // Specular curve on nose dome
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, -8);
  ctx.quadraticCurveTo(70, -7, 76, -2);
  ctx.stroke();

  // White/Cyan Optical & CTD Sensor Port at Nose Tip
  ctx.beginPath();
  ctx.arc(78, 0, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = '#E0F7FF';
  ctx.shadowColor = '#00E5FF';
  ctx.shadowBlur = isGhost ? 0 : 8;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // 7. Forward Volumetric Ocean Illumination Beam (when active)
  if (drawSensorBeam) {
    ctx.save();
    ctx.translate(80, 0);
    const coneGrad = ctx.createLinearGradient(0, 0, beamLength, 0);
    coneGrad.addColorStop(0, 'rgba(0, 229, 255, 0.85)');
    coneGrad.addColorStop(0.15, 'rgba(0, 194, 255, 0.5)');
    coneGrad.addColorStop(0.55, 'rgba(0, 130, 230, 0.18)');
    coneGrad.addColorStop(1, 'rgba(0, 40, 120, 0)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(beamLength, -beamLength * 0.28);
    ctx.lineTo(beamLength, beamLength * 0.28);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
