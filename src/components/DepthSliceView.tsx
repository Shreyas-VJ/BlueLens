import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  ObservationMarker, 
  OceanVariable, 
  PlatformType, 
  ViewMode 
} from '../types';
import { 
  Camera, 
  ArrowLeft, 
  Waves, 
  RotateCcw, 
  HelpCircle,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';

interface DepthSliceViewProps {
  observation: ObservationMarker;
  viewMode: ViewMode;
  onToggleViewMode?: () => void;
  onOpenGuide?: () => void;
  onBackToEarth?: () => void;
  onBackToUnderwater?: () => void;
  onNavigateToProfiles?: () => void;
  onNavigateToComparison?: () => void;
}

export const DepthSliceView: React.FC<DepthSliceViewProps> = ({
  observation,
  viewMode,
  onToggleViewMode,
  onOpenGuide,
  onBackToEarth,
  onBackToUnderwater,
  onNavigateToProfiles,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Active state controls matching the user's interface
  const [selectedDepth, setSelectedDepth] = useState<number>(0); // Default 0m like in image
  const [flowSpeed, setFlowSpeed] = useState<number>(1.0); // 1.0x
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(1.0); // 1.0x
  const [simulateCyclone, setSimulateCyclone] = useState<boolean>(false);
  const [screenshotFlash, setScreenshotFlash] = useState<boolean>(false);

  // 3D Object Layers Toggles (Checkboxes from image)
  const [layerThermalBox, setLayerThermalBox] = useState<boolean>(true);
  const [layerLaserSlice, setLayerLaserSlice] = useState<boolean>(true);
  const [layerParticles, setLayerParticles] = useState<boolean>(true);
  const [layerCurrentArrows, setLayerCurrentArrows] = useState<boolean>(true);
  const [layerArgoFloat, setLayerArgoFloat] = useState<boolean>(true);
  const [layerUnderwaterGlider, setLayerUnderwaterGlider] = useState<boolean>(true);

  // Active camera view mode
  const [activeCameraView, setActiveCameraView] = useState<'column' | 'argo' | 'glider' | 'plan'>('column');

  // Dynamic Telemetry State Variables
  const seaSurfaceTemp = 29.4; // °C
  const sliceTemp = useMemo(() => {
    // Temperature decaying non-linearly with depth
    const t = seaSurfaceTemp - Math.pow(selectedDepth / 2000, 0.6) * 26.6;
    return Math.max(2.8, +t.toFixed(1));
  }, [selectedDepth]);

  const currentVelocity = useMemo(() => {
    const v = (1.65 * flowSpeed * (1 - (selectedDepth / 2000) * 0.75)).toFixed(2);
    return `${v} m/s`;
  }, [selectedDepth, flowSpeed]);

  const salinityAtDepth = useMemo(() => {
    const s = (34.2 + Math.min(1.4, (selectedDepth / 400) * 1.1) + Math.sin(selectedDepth * 0.005) * 0.15).toFixed(1);
    return `${s} PSU`;
  }, [selectedDepth]);

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const boxGroupRef = useRef<THREE.Group | null>(null);
  const sliceMeshRef = useRef<THREE.Mesh | null>(null);
  const laserRimRef = useRef<THREE.LineSegments | null>(null);
  const thermalBoxGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particlePositionsRef = useRef<Float32Array | null>(null);
  const vectorGroupRef = useRef<THREE.Group | null>(null);
  const argoGroupRef = useRef<THREE.Group | null>(null);
  const gliderGroupRef = useRef<THREE.Group | null>(null);

  // Camera animation interpolation targets
  const cameraTargetPos = useRef(new THREE.Vector3(0, 0.4, 4.4));
  const cameraLookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Interactive camera rotation
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const boxRotationRef = useRef({ x: 0.38, y: -0.52 });
  const cameraDistanceRef = useRef(4.4);

  // Helper to create the Slocum Underwater Glider 3D Model
  const buildGliderModel = (): THREE.Group => {
    const glider = new THREE.Group();
    glider.scale.set(0.24, 0.24, 0.24); // Realistic proportional scale

    // Fuselage (Streamlined hydrodynamic body in warm orange-yellow)
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.2, 1.4, 24);
    bodyGeo.rotateZ(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffa500, // Orange
      metalness: 0.35,
      roughness: 0.3,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    glider.add(bodyMesh);

    // Nose Cone (Black dome CTD optic head)
    const noseGeo = new THREE.SphereGeometry(0.18, 20, 16);
    noseGeo.scale(1.3, 1.0, 1.0);
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      metalness: 0.5,
      roughness: 0.25,
    });
    const noseMesh = new THREE.Mesh(noseGeo, noseMat);
    noseMesh.position.set(0.7, 0, 0);
    glider.add(noseMesh);

    // Large swept-back wings (Orange with black aerofoil lines)
    const wingGeo = new THREE.BoxGeometry(0.25, 0.03, 1.9);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      metalness: 0.3,
      roughness: 0.3,
    });
    const wingMesh = new THREE.Mesh(wingGeo, wingMat);
    wingMesh.position.set(0.05, 0, 0);
    wingMesh.rotation.y = -0.15;
    glider.add(wingMesh);

    // Black wingtips
    [-0.95, 0.95].forEach((zPos) => {
      const tipGeo = new THREE.BoxGeometry(0.28, 0.04, 0.08);
      const tipMat = new THREE.MeshStandardMaterial({ color: 0x0a101d });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.set(0.05, 0, zPos);
      glider.add(tipMesh);
    });

    // Aft Propulsion & Battery Section
    const aftGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.5, 20);
    aftGeo.rotateZ(Math.PI / 2);
    const aftMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.4,
      roughness: 0.3,
    });
    const aftMesh = new THREE.Mesh(aftGeo, aftMat);
    aftMesh.position.set(-0.9, 0, 0);
    glider.add(aftMesh);

    // Vertical Swept Rudder Fin
    const rudderGeo = new THREE.BoxGeometry(0.25, 0.45, 0.03);
    const rudderMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const rudderMesh = new THREE.Mesh(rudderGeo, rudderMat);
    rudderMesh.position.set(-0.95, 0.22, 0);
    rudderMesh.rotation.z = -0.2;
    glider.add(rudderMesh);

    // Horizontal Stabilizer
    const stabGeo = new THREE.BoxGeometry(0.18, 0.025, 0.6);
    const stabMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const stabMesh = new THREE.Mesh(stabGeo, stabMat);
    stabMesh.position.set(-1.0, 0.02, 0);
    glider.add(stabMesh);

    // Antenna
    const antGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.5, 8);
    const antMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const antMesh = new THREE.Mesh(antGeo, antMat);
    antMesh.position.set(-0.85, 0.28, 0);
    antMesh.rotation.z = -0.3;
    glider.add(antMesh);

    // Realistic flight angle
    glider.rotation.z = -0.18;
    glider.rotation.y = 0.3;

    return glider;
  };

  // Helper to create the Autonomous Argo Float 3D Model
  const buildArgoModel = (): THREE.Group => {
    const argo = new THREE.Group();
    argo.scale.set(0.22, 0.22, 0.22); // Realistic scale

    // Yellow Cylindrical Hull
    const hullGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.25, 24);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00, // Vivid Yellow
      metalness: 0.3,
      roughness: 0.3,
    });
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    argo.add(hullMesh);

    // Mid-body Black Collar Ring
    const collarGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.2, 24);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x0b111d,
      roughness: 0.5,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.set(0, 0.1, 0);
    argo.add(collarMesh);

    // Top CTD Sensor Head
    const capGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.18, 20);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(0, 0.7, 0);
    argo.add(capMesh);

    // Antenna Mast
    const mastGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.85, 8);
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0xd0e0f0,
      metalness: 0.8,
      roughness: 0.2,
    });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.set(0, 1.15, 0);
    argo.add(mastMesh);

    // Cyan Beacon Light
    const tipGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.set(0, 1.6, 0);
    argo.add(tipMesh);

    // Bottom Hydraulic Bladder
    const bladderGeo = new THREE.CylinderGeometry(0.16, 0.08, 0.3, 16);
    const bladderMat = new THREE.MeshStandardMaterial({ color: 0x8a5500 });
    const bladderMesh = new THREE.Mesh(bladderGeo, bladderMat);
    bladderMesh.position.set(0, -0.75, 0);
    argo.add(bladderMesh);

    return argo;
  };

  // Generate dynamic laser slice plane texture
  const generateSliceTexture = (isCyclone: boolean, time: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const w = 512;
    const h = 512;
    const cx = w / 2;
    const cy = h / 2;

    if (isCyclone) {
      // Swirling fiery cyclone vortex
      const bgGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, 260);
      bgGrad.addColorStop(0, '#ffe838');
      bgGrad.addColorStop(0.2, '#ff6600');
      bgGrad.addColorStop(0.5, '#d91b00');
      bgGrad.addColorStop(0.8, '#700900');
      bgGrad.addColorStop(1, '#200303');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);
      for (let a = 0; a < 6; a++) {
        const baseAngle = (a * Math.PI * 2) / 6 + time * 1.6;
        ctx.beginPath();
        for (let r = 20; r < 240; r += 4) {
          const theta = baseAngle + r / 50;
          const px = Math.cos(theta) * r;
          const py = Math.sin(theta) * r;
          if (r === 20) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = a % 2 === 0 ? 'rgba(255, 230, 80, 0.5)' : 'rgba(255, 70, 0, 0.6)';
        ctx.lineWidth = 14;
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Coral-Red / Warm Laser Thermal Slice surface (as depicted in the user's image)
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, 'rgba(248, 113, 113, 0.7)');
      grad.addColorStop(0.3, 'rgba(239, 68, 68, 0.65)');
      grad.addColorStop(0.7, 'rgba(220, 38, 38, 0.6)');
      grad.addColorStop(1, 'rgba(185, 28, 28, 0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Fine wave and optical scan interference lines
      for (let y = 0; y < h; y += 14) {
        ctx.beginPath();
        for (let x = 0; x < w; x += 16) {
          const waveY = y + Math.sin(x * 0.05 + time * 1.5) * 3;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    return new THREE.CanvasTexture(canvas);
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, cameraDistanceRef.current);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00c2ff, 1.6);
    dirLight1.position.set(6, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffaa20, 0.8);
    dirLight2.position.set(-5, -2, -4);
    scene.add(dirLight2);

    // 5. Box Parent Group (Rotated by user drag)
    const boxGroup = new THREE.Group();
    boxGroupRef.current = boxGroup;
    scene.add(boxGroup);

    // 6. Perspective Grid (Ground plane exactly like user's image)
    const gridHelper = new THREE.GridHelper(5.2, 18, 0x00c2ff, 0x092a48);
    gridHelper.position.y = -1.15;
    boxGroup.add(gridHelper);

    // 7. Volumetric Ocean Box Dimensions: Width: 2.3, Depth: 2.3, Height: 1.7
    const boxW = 2.3;
    const boxH = 1.7;
    const boxD = 2.3;

    // Wireframe glowing bounding cube (Cyan edges)
    const boxGeo = new THREE.BoxGeometry(boxW, boxH, boxD);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.6,
    });
    const boxWireframe = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), wireframeMat);
    boxGroup.add(boxWireframe);

    // Subtle dark blue ocean backplate
    const waterVolMat = new THREE.MeshStandardMaterial({
      color: 0x031326,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    const waterVolume = new THREE.Mesh(boxGeo, waterVolMat);
    boxGroup.add(waterVolume);

    // 8. Thermal Volumetric Stratified Depth Layers (Exact color tiers from user's image)
    const thermalGroup = new THREE.Group();
    thermalBoxGroupRef.current = thermalGroup;
    boxGroup.add(thermalGroup);

    // 6 Thermal Tiers:
    // Tier 0: Surface Warm Coral Red (#e64949)
    // Tier 1: 250m Orange (#f97316)
    // Tier 2: 500m Gold-Yellow (#eab308)
    // Tier 3: 750m Mint Green (#22c55e)
    // Tier 4: 1000m Cyan (#06b6d4)
    // Tier 5: 1500m Deep Blue (#1d4ed8)
    const tierColors = [
      0xee4444, // Red
      0xf97316, // Orange
      0xeab308, // Yellow
      0x22c55e, // Green
      0x06b6d4, // Cyan
      0x1d4ed8, // Deep Blue
    ];

    tierColors.forEach((col, idx) => {
      const tierY = 0.82 - (idx / (tierColors.length - 1)) * 1.64;
      const tierGeo = new THREE.PlaneGeometry(boxW * 0.985, boxD * 0.985);
      tierGeo.rotateX(-Math.PI / 2);

      const tierMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      const tierMesh = new THREE.Mesh(tierGeo, tierMat);
      tierMesh.position.y = tierY;
      thermalGroup.add(tierMesh);

      // Glowing tier edge line
      const tierEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(tierGeo),
        new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.45 })
      );
      tierEdge.position.y = tierY;
      thermalGroup.add(tierEdge);
    });

    // 9. Laser Depth Scanner Plane with Glowing Rim (Image feature)
    const sliceGeo = new THREE.PlaneGeometry(boxW * 0.995, boxD * 0.995, 32, 32);
    sliceGeo.rotateX(-Math.PI / 2);
    const initialSliceTex = generateSliceTexture(false, 0);
    const sliceMat = new THREE.MeshStandardMaterial({
      map: initialSliceTex,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const sliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
    sliceMeshRef.current = sliceMesh;
    boxGroup.add(sliceMesh);

    // Glowing Laser Rim (Light pink / red perimeter outline around the scanner plane)
    const rimGeo = new THREE.EdgesGeometry(sliceGeo);
    const rimMat = new THREE.LineBasicMaterial({
      color: 0xff4d6d,
      linewidth: 3,
    });
    const laserRim = new THREE.LineSegments(rimGeo, rimMat);
    laserRimRef.current = laserRim;
    sliceMesh.add(laserRim);

    // 10. 3D Flow Streamline Particles (Colored according to depth tier, matching image!)
    const pCount = 380;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      const px = (Math.random() - 0.5) * boxW * 0.92;
      const py = (Math.random() - 0.5) * boxH * 0.92; // -0.85 to +0.85
      const pz = (Math.random() - 0.5) * boxD * 0.92;
      pPos[i * 3] = px;
      pPos[i * 3 + 1] = py;
      pPos[i * 3 + 2] = pz;

      // Color based on height py
      const normY = (py + boxH / 2) / boxH; // 0 (bottom blue) to 1 (top red)
      if (normY > 0.8) {
        // Red / Coral
        pColors[i * 3] = 0.95;
        pColors[i * 3 + 1] = 0.25;
        pColors[i * 3 + 2] = 0.25;
      } else if (normY > 0.6) {
        // Orange
        pColors[i * 3] = 0.98;
        pColors[i * 3 + 1] = 0.55;
        pColors[i * 3 + 2] = 0.1;
      } else if (normY > 0.45) {
        // Yellow
        pColors[i * 3] = 0.95;
        pColors[i * 3 + 1] = 0.85;
        pColors[i * 3 + 2] = 0.15;
      } else if (normY > 0.3) {
        // Green
        pColors[i * 3] = 0.15;
        pColors[i * 3 + 1] = 0.85;
        pColors[i * 3 + 2] = 0.45;
      } else if (normY > 0.15) {
        // Cyan
        pColors[i * 3] = 0.05;
        pColors[i * 3 + 1] = 0.75;
        pColors[i * 3 + 2] = 0.95;
      } else {
        // Deep Blue
        pColors[i * 3] = 0.1;
        pColors[i * 3 + 1] = 0.3;
        pColors[i * 3 + 2] = 0.9;
      }
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    particlePositionsRef.current = pPos;

    const pMat = new THREE.PointsMaterial({
      size: 0.026,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(pGeo, pMat);
    particlesRef.current = particles;
    boxGroup.add(particles);

    // 11. 3D Current Direction Arrows (Blue downward/directional arrows in water column)
    const vectorGroup = new THREE.Group();
    vectorGroupRef.current = vectorGroup;
    boxGroup.add(vectorGroup);

    const arrowDir = new THREE.Vector3(0.3, -0.7, 0.4).normalize();
    for (let x = -0.75; x <= 0.75; x += 0.5) {
      for (let z = -0.75; z <= 0.75; z += 0.5) {
        const origin = new THREE.Vector3(x, 0.15 - Math.abs(x * 0.2), z);
        const length = 0.18;
        const arrow = new THREE.ArrowHelper(arrowDir, origin, length, 0x00c2ff, 0.06, 0.035);
        vectorGroup.add(arrow);
      }
    }

    // 12. Add Both Autonomous Argo Float & Slocum Underwater Glider into the model!
    const argo = buildArgoModel();
    argo.position.set(-0.15, 0.1, 0.1);
    argoGroupRef.current = argo;
    boxGroup.add(argo);

    const glider = buildGliderModel();
    glider.position.set(0.12, 0.28, -0.05);
    gliderGroupRef.current = glider;
    boxGroup.add(glider);

    // 13. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth camera interpolation towards cameraTargetPos & currentLookAt
      if (cameraRef.current) {
        cameraRef.current.position.lerp(cameraTargetPos.current, 0.06);
        currentLookAt.current.lerp(cameraLookAtTarget.current, 0.06);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      // Box rotation (when free orbiting)
      if (boxGroupRef.current && activeCameraView === 'column') {
        boxGroupRef.current.rotation.x = boxRotationRef.current.x;
        boxGroupRef.current.rotation.y = boxRotationRef.current.y;
      }

      // Floating probe subtle natural water oscillations
      if (argoGroupRef.current) {
        argoGroupRef.current.position.y = 0.1 + Math.sin(time * 1.5) * 0.02;
        argoGroupRef.current.rotation.y = Math.sin(time * 0.8) * 0.08;
      }

      if (gliderGroupRef.current) {
        gliderGroupRef.current.position.y = 0.28 + Math.sin(time * 1.8) * 0.025;
        gliderGroupRef.current.rotation.z = -0.18 + Math.sin(time * 1.4) * 0.03;
      }

      // Streamline particle movement based on flowSpeed
      if (particlesRef.current && particlePositionsRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const speed = 0.003 * flowSpeed;
        for (let i = 0; i < pCount; i++) {
          positions[i * 3] += speed; // Drift X
          positions[i * 3 + 1] -= speed * 0.2; // Slight sink Y
          positions[i * 3 + 2] += speed * 0.3; // Drift Z

          if (positions[i * 3] > boxW * 0.48) positions[i * 3] = -boxW * 0.48;
          if (positions[i * 3 + 1] < -boxH * 0.48) positions[i * 3 + 1] = boxH * 0.48;
          if (positions[i * 3 + 2] > boxD * 0.48) positions[i * 3 + 2] = -boxD * 0.48;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse & Touch Orbit Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - prevMousePosRef.current.x;
        const dy = e.clientY - prevMousePosRef.current.y;
        boxRotationRef.current.y += dx * 0.008;
        boxRotationRef.current.x += dy * 0.008;
        boxRotationRef.current.x = Math.max(-1.1, Math.min(1.1, boxRotationRef.current.x));
        prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistanceRef.current = Math.max(2.4, Math.min(7.0, cameraDistanceRef.current + e.deltaY * 0.003));
      cameraTargetPos.current.set(
        cameraTargetPos.current.x,
        cameraTargetPos.current.y,
        cameraDistanceRef.current
      );
    };

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Laser Slice Plane position with selectedDepth
  useEffect(() => {
    const sliceMesh = sliceMeshRef.current;
    if (!sliceMesh) return;

    // Y position from surface (+0.82) to abyss (-0.82)
    const yPos = 0.82 - (selectedDepth / 2000) * 1.64;
    sliceMesh.position.y = yPos;

    // Update texture (cyclone vs laser thermal plane)
    const newTex = generateSliceTexture(simulateCyclone, 0);
    if (newTex) {
      const mat = sliceMesh.material as THREE.MeshStandardMaterial;
      if (mat.map) mat.map.dispose();
      mat.map = newTex;
      mat.needsUpdate = true;
    }
  }, [selectedDepth, simulateCyclone]);

  // Update Layer Visibilities from Checkboxes
  useEffect(() => {
    if (thermalBoxGroupRef.current) {
      thermalBoxGroupRef.current.visible = layerThermalBox;
    }
    if (sliceMeshRef.current) {
      sliceMeshRef.current.visible = layerLaserSlice;
    }
    if (particlesRef.current) {
      particlesRef.current.visible = layerParticles;
    }
    if (vectorGroupRef.current) {
      vectorGroupRef.current.visible = layerCurrentArrows;
    }
    if (argoGroupRef.current) {
      argoGroupRef.current.visible = layerArgoFloat;
    }
    if (gliderGroupRef.current) {
      gliderGroupRef.current.visible = layerUnderwaterGlider;
    }
  }, [
    layerThermalBox,
    layerLaserSlice,
    layerParticles,
    layerCurrentArrows,
    layerArgoFloat,
    layerUnderwaterGlider,
  ]);

  // Update Vertical Exaggeration
  useEffect(() => {
    if (boxGroupRef.current) {
      boxGroupRef.current.scale.y = verticalExaggeration;
    }
  }, [verticalExaggeration]);

  // Handle Quick Camera Navigation Preset Buttons
  const handleCameraPreset = (view: 'column' | 'argo' | 'glider' | 'plan') => {
    setActiveCameraView(view);
    if (view === 'column') {
      // 3D Water Column Overview
      cameraTargetPos.current.set(0, 0.4, 4.4);
      cameraLookAtTarget.current.set(0, 0, 0);
      boxRotationRef.current = { x: 0.38, y: -0.52 };
      if (boxGroupRef.current) {
        boxGroupRef.current.rotation.x = 0.38;
        boxGroupRef.current.rotation.y = -0.52;
      }
    } else if (view === 'argo') {
      // Focus Argo Float
      cameraTargetPos.current.set(-0.2, 0.25, 2.1);
      cameraLookAtTarget.current.set(-0.15, 0.1, 0.1);
    } else if (view === 'glider') {
      // Focus Underwater Glider
      cameraTargetPos.current.set(0.3, 0.45, 2.1);
      cameraLookAtTarget.current.set(0.12, 0.28, -0.05);
    } else if (view === 'plan') {
      // Plan View (SST Map) Looking straight down!
      cameraTargetPos.current.set(0, 3.8, 0.01);
      cameraLookAtTarget.current.set(0, 0, 0);
      if (boxGroupRef.current) {
        boxGroupRef.current.rotation.x = 0;
        boxGroupRef.current.rotation.y = 0;
      }
    }
  };

  // Capture canvas screenshot
  const handleScreenshot = () => {
    setScreenshotFlash(true);
    setTimeout(() => setScreenshotFlash(false), 300);

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `INCOIS_3D_Ocean_Digital_Twin_${selectedDepth}m.png`;
    a.click();
  };

  return (
    <div className="relative w-full h-screen bg-[#030914] overflow-hidden select-none font-sans text-white">
      {/* Screen flash on screenshot */}
      {screenshotFlash && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-300 opacity-80" />
      )}

      {/* 3D WebGL Canvas Scene */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ==================================================================== */}
      {/* TOP LEFT: INCOIS 3D OCEAN DIGITAL TWIN CARD (Exact Match to Image)   */}
      {/* ==================================================================== */}
      <div className="absolute top-4 left-6 z-30 pointer-events-auto">
        <div className="bg-[#071728]/90 border border-[#00C2FF]/40 rounded-2xl px-5 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col space-y-0.5">
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-[#E6F4FF] tracking-wide">
              INCOIS 3D Ocean Digital Twin
            </h1>
          </div>
          <p className="text-xs text-[#00C2FF]/80 font-medium">
            SIH PS 26067 • Ministry of Earth Sciences (MoES)
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TOP RIGHT: CAMERA VIEW SWITCHER BUTTONS (Exact Match to Image)       */}
      {/* ==================================================================== */}
      <div className="absolute top-4 right-6 z-30 flex items-center space-x-2.5 pointer-events-auto">
        <button
          onClick={() => handleCameraPreset('column')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            activeCameraView === 'column'
              ? 'bg-[#0B1D2E] border border-[#00C2FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,194,255,0.4)]'
              : 'bg-[#071728]/85 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md'
          }`}
        >
          3D Water Column (0-2000m)
        </button>

        <button
          onClick={() => handleCameraPreset('argo')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            activeCameraView === 'argo'
              ? 'bg-[#0B1D2E] border border-[#00C2FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,194,255,0.4)]'
              : 'bg-[#071728]/85 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md'
          }`}
        >
          Focus Argo Float
        </button>

        <button
          onClick={() => handleCameraPreset('glider')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            activeCameraView === 'glider'
              ? 'bg-[#0B1D2E] border border-[#00C2FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,194,255,0.4)]'
              : 'bg-[#071728]/85 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md'
          }`}
        >
          Focus Underwater Glider
        </button>

        <button
          onClick={() => handleCameraPreset('plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
            activeCameraView === 'plan'
              ? 'bg-[#00C2FF] text-[#061220] shadow-[0_0_20px_rgba(0,194,255,0.8)]'
              : 'bg-[#0088cc] hover:bg-[#00a3f5] text-white shadow-lg'
          }`}
        >
          Plan View (SST Map)
        </button>

        {/* Return & Guide Quick Icons */}
        {onBackToEarth && (
          <button
            onClick={onBackToEarth}
            className="p-2 rounded-xl bg-[#071728]/85 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-md"
            title="Back to Earth"
          >
            <ArrowLeft className="w-4 h-4 text-[#00C2FF]" />
          </button>
        )}

        {onBackToUnderwater && (
          <button
            onClick={onBackToUnderwater}
            className="p-2 rounded-xl bg-[#071728]/85 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-md"
            title="Back to Underwater"
          >
            <Waves className="w-4 h-4 text-[#00C2FF]" />
          </button>
        )}

        <button
          onClick={handleScreenshot}
          className="p-2 rounded-xl bg-[#071728]/85 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-md"
          title="Capture Snapshot"
        >
          <Camera className="w-4 h-4 text-[#00C2FF]" />
        </button>

        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="p-2 rounded-xl bg-[#071728]/85 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-md"
            title="User Guide"
          >
            <HelpCircle className="w-4 h-4 text-[#00C2FF]" />
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* LEFT SIDEBAR: OCEAN STATE VARIABLES & 3D LAYERS (Exact Match Image)   */}
      {/* ==================================================================== */}
      <div className="absolute top-24 left-6 z-30 w-72 pointer-events-auto">
        <div className="bg-[#071728]/90 border border-[#00C2FF]/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-4">
          {/* SECTION 1: OCEAN STATE VARIABLES */}
          <div>
            <div className="text-xs font-bold text-[#00C2FF] uppercase tracking-wider mb-2.5">
              OCEAN STATE VARIABLES
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Sea Surface Temp (0m):</span>
                <span className="font-mono font-bold text-[#00E5FF]">{seaSurfaceTemp} °C</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/70">Laser Slice Depth:</span>
                <span className="font-mono font-bold text-[#00E5FF]">{selectedDepth} m</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/70">Slice Temperature:</span>
                <span className="font-mono font-bold text-[#00E5FF]">{sliceTemp} °C</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/70">Current Velocity:</span>
                <span className="font-mono font-bold text-[#00E5FF]">{currentVelocity}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/70">Salinity at Depth:</span>
                <span className="font-mono font-bold text-[#00E5FF]">{salinityAtDepth}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            {/* SECTION 2: 3D OBJECT LAYERS */}
            <div className="text-xs font-bold text-[#00C2FF] uppercase tracking-wider mb-2.5">
              3D OBJECT LAYERS
            </div>

            <div className="space-y-2 text-xs">
              {/* Checkbox 1: Thermal Volumetric Box */}
              <label className="flex items-center space-x-2.5 cursor-pointer hover:text-white text-white/80 transition-colors">
                <input
                  type="checkbox"
                  checked={layerThermalBox}
                  onChange={(e) => setLayerThermalBox(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00E5FF] cursor-pointer"
                />
                <span>Thermal Volumetric Box</span>
              </label>

              {/* Checkbox 2: Laser Depth Scanner Plane */}
              <label className="flex items-center space-x-2.5 cursor-pointer hover:text-white text-white/80 transition-colors">
                <input
                  type="checkbox"
                  checked={layerLaserSlice}
                  onChange={(e) => setLayerLaserSlice(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00E5FF] cursor-pointer"
                />
                <span>Laser Depth Scanner Plane</span>
              </label>

              {/* Checkbox 3: 3D Flow Streamline Particles */}
              <label className="flex items-center space-x-2.5 cursor-pointer hover:text-white text-white/80 transition-colors">
                <input
                  type="checkbox"
                  checked={layerParticles}
                  onChange={(e) => setLayerParticles(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00E5FF] cursor-pointer"
                />
                <span>3D Flow Streamline Particles</span>
              </label>

              {/* Checkbox 4: 3D Current Direction Arrows */}
              <label className="flex items-center space-x-2.5 cursor-pointer hover:text-white text-white/80 transition-colors">
                <input
                  type="checkbox"
                  checked={layerCurrentArrows}
                  onChange={(e) => setLayerCurrentArrows(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00E5FF] cursor-pointer"
                />
                <span>3D Current Direction Arrows</span>
              </label>

              {/* Checkbox 5: Autonomous Argo Float (Yellow) */}
              <label className="flex items-center space-x-2.5 cursor-pointer hover:text-white text-white/80 transition-colors">
                <input
                  type="checkbox"
                  checked={layerArgoFloat}
                  onChange={(e) => setLayerArgoFloat(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00E5FF] cursor-pointer"
                />
                <span>Autonomous Argo Float (Yellow)</span>
              </label>

              {/* Checkbox 6: Underwater Glider (Orange) */}
              <label className="flex items-center space-x-2.5 cursor-pointer hover:text-white text-white/80 transition-colors">
                <input
                  type="checkbox"
                  checked={layerUnderwaterGlider}
                  onChange={(e) => setLayerUnderwaterGlider(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00E5FF] cursor-pointer"
                />
                <span>Underwater Glider (Orange)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* RIGHT SIDEBAR: TEMPERATURE COLORMAP & ARGO PROFILE (Exact Match)     */}
      {/* ==================================================================== */}
      <div className="absolute top-24 right-6 z-30 w-72 pointer-events-auto">
        <div className="bg-[#071728]/90 border border-[#00C2FF]/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-4">
          {/* Section 1: TEMPERATURE COLORMAP */}
          <div>
            <div className="text-xs font-bold text-[#00C2FF] uppercase tracking-wider mb-2">
              TEMPERATURE COLORMAP
            </div>

            {/* Gradient Bar from 32°C (Warm Surface) to 2°C (Deep Sea) */}
            <div className="h-3.5 w-full rounded-full overflow-hidden shadow-inner bg-gradient-to-r from-[#e64949] via-[#f97316] via-[#eab308] via-[#22c55e] via-[#06b6d4] to-[#1d4ed8]" />

            <div className="flex items-center justify-between text-[10px] text-white/70 font-semibold mt-1">
              <span>32°C (Warm Surface)</span>
              <span>2°C (Deep Sea)</span>
            </div>
          </div>

          {/* Section 2: ARGO DEPTH VS TEMP PROFILE */}
          <div className="pt-2 border-t border-white/10">
            <div className="text-xs font-bold text-[#00C2FF] uppercase tracking-wider mb-1">
              ARGO DEPTH VS TEMP PROFILE
            </div>

            {/* Legend */}
            <div className="text-[10px] font-medium text-white/70 mb-2">
              <span className="text-[#00C2FF]">— Blue: Observed (Argo)</span> |{' '}
              <span className="text-[#ef4444]">-- Red: ROMS Model</span>
            </div>

            {/* Profile Curve Graph */}
            <div className="relative w-full h-32 bg-[#040e1a]/80 rounded-xl border border-white/10 p-2 overflow-hidden">
              {/* Y-axis labels */}
              <div className="absolute left-1 top-2 text-[9px] font-mono text-white/50">0m</div>
              <div className="absolute left-1 top-10 text-[9px] font-mono text-white/50">500m</div>
              <div className="absolute left-1 top-18 text-[9px] font-mono text-white/50">1000m</div>
              <div className="absolute left-1 bottom-2 text-[9px] font-mono text-white/50">2000m</div>

              {/* SVG Depth Profile Curves */}
              <svg className="w-full h-full pl-8" viewBox="0 0 160 100" preserveAspectRatio="none">
                {/* Grid guidelines */}
                <line x1="0" y1="25" x2="160" y2="25" stroke="rgba(255,255,255,0.08)" strokeDasharray="2,2" />
                <line x1="0" y1="50" x2="160" y2="50" stroke="rgba(255,255,255,0.08)" strokeDasharray="2,2" />
                <line x1="0" y1="75" x2="160" y2="75" stroke="rgba(255,255,255,0.08)" strokeDasharray="2,2" />

                {/* ROMS Model Forecast (Red dashed line) */}
                <path
                  d="M 15 90 Q 25 55 55 40 T 150 12"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                />

                {/* Observed In Situ Argo CTD Profile (Blue solid curve) */}
                <path
                  d="M 15 90 Q 22 58 50 38 T 150 10"
                  fill="none"
                  stroke="#00C2FF"
                  strokeWidth="2.5"
                />

                {/* Active Laser Depth Horizontal Marker (Red line at selected depth) */}
                {(() => {
                  const lineY = 10 + (selectedDepth / 2000) * 80;
                  return (
                    <line
                      x1="0"
                      y1={lineY}
                      x2="160"
                      y2={lineY}
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                  );
                })()}
              </svg>
            </div>

            {/* Model Accuracy Badge */}
            <div className="mt-2.5 text-center text-xs font-semibold text-[#4ade80]">
              Model Accuracy: 98.6% (RMSE 0.18°C)
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM FLOATING BAR: SCANNER, SPEED, EXAGGERATION & CYCLONE (Image)  */}
      {/* ==================================================================== */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-auto max-w-4xl px-4">
        <div className="bg-[#071728]/95 border border-[#00C2FF]/40 rounded-2xl px-5 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-wrap items-center justify-center gap-6 text-xs">
          {/* Slider 1: Depth Scanner */}
          <div className="flex items-center space-x-3">
            <span className="text-white/80 font-semibold whitespace-nowrap">Depth Scanner</span>
            <span className="font-mono font-bold text-[#00E5FF] w-12 text-right">{selectedDepth}m</span>
            <input
              type="range"
              min="0"
              max="2000"
              step="25"
              value={selectedDepth}
              onChange={(e) => setSelectedDepth(parseInt(e.target.value))}
              className="w-28 accent-[#00E5FF] h-2 bg-[#040e1a] rounded cursor-pointer"
            />
          </div>

          {/* Slider 2: Current Flow Speed */}
          <div className="flex items-center space-x-3">
            <span className="text-white/80 font-semibold whitespace-nowrap">Current Flow Speed</span>
            <span className="font-mono font-bold text-[#00E5FF] w-10 text-right">{flowSpeed.toFixed(1)}x</span>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={flowSpeed}
              onChange={(e) => setFlowSpeed(parseFloat(e.target.value))}
              className="w-24 accent-[#00E5FF] h-2 bg-[#040e1a] rounded cursor-pointer"
            />
          </div>

          {/* Slider 3: Vertical Exaggeration */}
          <div className="flex items-center space-x-3">
            <span className="text-white/80 font-semibold whitespace-nowrap">Vertical Exaggeration</span>
            <span className="font-mono font-bold text-[#00E5FF] w-10 text-right">{verticalExaggeration.toFixed(1)}x</span>
            <input
              type="range"
              min="0.4"
              max="1.8"
              step="0.1"
              value={verticalExaggeration}
              onChange={(e) => setVerticalExaggeration(parseFloat(e.target.value))}
              className="w-24 accent-[#00E5FF] h-2 bg-[#040e1a] rounded cursor-pointer"
            />
          </div>

          {/* Button: Simulate Cyclone Vortex */}
          <button
            onClick={() => setSimulateCyclone(!simulateCyclone)}
            className={`px-4 py-2 rounded-xl font-bold tracking-wide transition-all shadow-lg whitespace-nowrap ${
              simulateCyclone
                ? 'bg-gradient-to-r from-[#ff5500] to-[#ff9900] text-[#030914] shadow-[0_0_20px_rgba(255,85,0,0.6)]'
                : 'bg-[#0099e6] hover:bg-[#00b0ff] text-white shadow-[0_0_15px_rgba(0,153,230,0.4)]'
            }`}
          >
            {simulateCyclone ? 'Vortex Active' : 'Simulate Cyclone Vortex'}
          </button>
        </div>
      </div>
    </div>
  );
};
