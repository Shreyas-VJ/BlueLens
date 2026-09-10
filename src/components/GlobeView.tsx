import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  ObservationMarker, 
  OceanAlert, 
  ViewMode,
  ScreenId 
} from '../types';
import { 
  INCOIS_REGIONS, 
  MOCK_OBSERVATIONS, 
  MOCK_ALERTS 
} from '../data/oceanData';
import { 
  Compass, 
  Layers, 
  Search, 
  Download, 
  MapPin, 
  Filter, 
  Crosshair,
  RotateCcw,
  ChevronRight,
  Home,
  LayoutGrid,
  User,
  Settings,
  HelpCircle,
  X,
  Volume2,
  VolumeX,
  Sliders,
  Box,
  LineChart,
  Scale,
  AlertTriangle,
  Fish,
  BookOpen,
  Network
} from 'lucide-react';

interface GlobeViewProps {
  onSelectObservation: (obs: ObservationMarker) => void;
  selectedObsId: string | null;
  viewMode: ViewMode;
  onNavigateToDepthSlice: () => void;
  onNavigateToAlerts: () => void;
  onSelectScreen?: (screen: ScreenId) => void;
  onToggleViewMode?: () => void;
  onOpenGuide?: () => void;
  onReturnToSplash?: () => void;
  alertCount?: number;
}

export const GlobeView: React.FC<GlobeViewProps> = ({
  onSelectObservation,
  selectedObsId,
  viewMode,
  onNavigateToDepthSlice,
  onNavigateToAlerts,
  onSelectScreen,
  onToggleViewMode,
  onOpenGuide,
  onReturnToSplash,
  alertCount = 4,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lon: string }>({ lat: '15.00° N', lon: '80.00° E' });
  const [hoveredObs, setHoveredObs] = useState<ObservationMarker | null>(null);
  const [showGraticule, setShowGraticule] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'argo' | 'glider'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('bay-of-bengal');

  // UI Drawers & Panels state (to match Image 2's clean look while keeping all Image 1 features accessible)
  const [appsDrawerOpen, setAppsDrawerOpen] = useState(false);
  const [regionsPanelOpen, setRegionsPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [platformsPanelOpen, setPlatformsPanelOpen] = useState(true); // Open by default or toggled via bottom-right floating pin buttons

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const graticuleGroupRef = useRef<THREE.Group | null>(null);
  const heatmapMeshRef = useRef<THREE.Mesh | null>(null);
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.18, y: -1.35 }); // Oriented toward Indian Ocean & India
  const currentRotationRef = useRef({ x: 0.18, y: -1.35 });
  const targetZoomRef = useRef(3.0);
  const currentZoomRef = useRef(3.0);

  // Helper to convert Lat/Lon to 3D Sphere vector
  const latLonToVector3 = useCallback((lat: number, lon: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }, []);

  // Zoom to target region
  const zoomToRegion = (regionId: string) => {
    setActiveRegion(regionId);
    const region = INCOIS_REGIONS.find((r) => r.id === regionId);
    if (!region) return;
    const [lat, lon] = region.center;
    targetRotationRef.current = {
      x: (lat * Math.PI) / 180 * 0.45,
      y: -((lon - 90) * Math.PI) / 180,
    };
    targetZoomRef.current = region.zoom >= 7 ? 2.2 : 2.7;
  };

  // Near Me: Locate user or coastal station
  const handleNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          targetRotationRef.current = {
            x: (lat * Math.PI) / 180 * 0.45,
            y: -((lon - 90) * Math.PI) / 180,
          };
          targetZoomRef.current = 2.4;
          setCursorCoords({
            lat: `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`,
            lon: `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`,
          });
        },
        () => {
          zoomToRegion('chennai');
        }
      );
    } else {
      zoomToRegion('chennai');
    }
  };

  // Export GeoJSON data
  const handleExportGeoJSON = () => {
    const geoJson = {
      type: 'FeatureCollection',
      name: 'INCOIS_Ocean_Observations_BLUELENS',
      features: MOCK_OBSERVATIONS.map((obs) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [obs.longitude, obs.latitude],
        },
        properties: {
          id: obs.id,
          name: obs.name,
          type: obs.type,
          status: obs.status,
          depth: obs.currentDepth,
          temperature500m: obs.temperatureAt500m,
          salinity500m: obs.salinityAt500m,
          currents500m: obs.currentsAt500m,
          dateTime: obs.dateTime,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INCOIS_Ocean_Observations_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Three.js Photorealistic Earth Globe Scene Setup (Image 2 style)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.0);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and high precision
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights: Realistic sunlight matching Image 2 (top-left illumination with specular highlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(-5, 4, 4); // Sun shining on Europe, Africa & Indian Ocean
    scene.add(sunLight);

    const oceanGlintLight = new THREE.DirectionalLight(0x00c2ff, 1.2);
    oceanGlintLight.position.set(2, 2, 4);
    scene.add(oceanGlintLight);

    // Deep space rim light for dark side
    const darkSideRim = new THREE.DirectionalLight(0x062040, 0.8);
    darkSideRim.position.set(5, -3, -4);
    scene.add(darkSideRim);

    // 5. Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // 6. Texture Loader for NASA Blue Marble Photorealistic Earth & Clouds
    const textureLoader = new THREE.TextureLoader();

    // Fallback procedural texture in case of load delay
    const createFallbackCanvas = () => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#062040';
        ctx.fillRect(0, 0, 1024, 512);
        ctx.fillStyle = '#1c4d29';
        ctx.beginPath();
        ctx.arc(512, 256, 120, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(c);
    };

    // Load Photorealistic Earth Surface Texture
    const earthDayTexture = textureLoader.load(
      '/images/earth_day.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback
        earthMesh.material = new THREE.MeshStandardMaterial({
          map: createFallbackCanvas(),
          roughness: 0.6,
        });
      }
    );

    // Earth Sphere Geometry
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthDayTexture,
      roughness: 0.5,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // 7. Dynamic Swirling Clouds Layer (Radius: 1.01)
    const cloudsTexture = textureLoader.load(
      '/images/earth_clouds.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
      }
    );

    const cloudsGeo = new THREE.SphereGeometry(1.012, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMeshRef.current = cloudsMesh;
    globeGroup.add(cloudsMesh);

    // 8. Atmospheric Outer Blue Glow (Fresnel Shader matching Image 2's glowing blue halo)
    const atmosGeo = new THREE.SphereGeometry(1.035, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          gl_FragColor = vec4(0.0, 0.72, 1.0, 1.0) * intensity * 1.3;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 9. Lat/Lon Graticule Grid (toggleable)
    const graticuleGroup = new THREE.Group();
    graticuleGroupRef.current = graticuleGroup;
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.18,
    });

    // Latitude circles (-60° to +60° every 15°)
    for (let lat = -60; lat <= 60; lat += 15) {
      const radius = Math.cos((lat * Math.PI) / 180) * 1.002;
      const y = Math.sin((lat * Math.PI) / 180) * 1.002;
      const circleGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      for (let theta = 0; theta <= 360; theta += 6) {
        const rad = (theta * Math.PI) / 180;
        points.push(new THREE.Vector3(radius * Math.cos(rad), y, radius * Math.sin(rad)));
      }
      circleGeo.setFromPoints(points);
      const line = new THREE.Line(circleGeo, gridMat);
      graticuleGroup.add(line);
    }

    // Longitude circles (every 30°)
    for (let lon = 0; lon < 360; lon += 30) {
      const circleGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 6) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = lon * (Math.PI / 180);
        const x = -(1.002 * Math.sin(phi) * Math.cos(theta));
        const z = 1.002 * Math.sin(phi) * Math.sin(theta);
        const y = 1.002 * Math.cos(phi);
        points.push(new THREE.Vector3(x, y, z));
      }
      circleGeo.setFromPoints(points);
      const line = new THREE.Line(circleGeo, gridMat);
      graticuleGroup.add(line);
    }
    globeGroup.add(graticuleGroup);

    // 10. Float Density Heatmap Mesh (toggleable)
    const heatmapGeo = new THREE.SphereGeometry(1.008, 64, 64);
    const heatmapCanvas = document.createElement('canvas');
    heatmapCanvas.width = 1024;
    heatmapCanvas.height = 512;
    const hctx = heatmapCanvas.getContext('2d');
    if (hctx) {
      hctx.clearRect(0, 0, 1024, 512);
      const drawDensity = (lon: number, lat: number, r: number, color: string) => {
        const x = ((lon + 180) / 360) * 1024;
        const y = ((90 - lat) / 180) * 512;
        const grad = hctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        hctx.fillStyle = grad;
        hctx.beginPath();
        hctx.arc(x, y, r, 0, Math.PI * 2);
        hctx.fill();
      };
      drawDensity(88, 15, 90, 'rgba(0, 194, 255, 0.45)'); // Bay of Bengal
      drawDensity(68, 14, 80, 'rgba(255, 176, 32, 0.4)');  // Arabian Sea
      drawDensity(73, 10, 50, 'rgba(0, 229, 255, 0.5)');  // Lakshadweep
      drawDensity(83, 17, 60, 'rgba(254, 95, 78, 0.45)');  // Coastal Hazard
    }
    const heatmapTex = new THREE.CanvasTexture(heatmapCanvas);
    const heatmapMat = new THREE.MeshBasicMaterial({
      map: heatmapTex,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const heatmapMesh = new THREE.Mesh(heatmapGeo, heatmapMat);
    heatmapMeshRef.current = heatmapMesh;
    globeGroup.add(heatmapMesh);

    // 11. Observation Markers Group
    const markersGroup = new THREE.Group();
    markersGroupRef.current = markersGroup;
    globeGroup.add(markersGroup);

    // 12. Deep Space Starfield Background + Realistic Milky Way Cosmic Skybox
    const spaceTexture = textureLoader.load('/images/space_milkyway.jpg');
    spaceTexture.wrapS = THREE.RepeatWrapping;
    spaceTexture.wrapT = THREE.ClampToEdgeWrapping;
    const spaceGeo = new THREE.SphereGeometry(140, 32, 32);
    const spaceMat = new THREE.MeshBasicMaterial({
      map: spaceTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.85,
    });
    const spaceSkybox = new THREE.Mesh(spaceGeo, spaceMat);
    scene.add(spaceSkybox);

    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 30 + Math.random() * 50;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);

      // Subtle celestial colors (pure white, icy cyan, soft blue)
      const isBlue = Math.random() > 0.6;
      starColors[i] = isBlue ? 0.75 : 1.0;
      starColors[i + 1] = isBlue ? 0.9 : 1.0;
      starColors[i + 2] = 1.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.42,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 13. Animation Loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera and rotation interpolation
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;
      currentZoomRef.current += (targetZoomRef.current - currentZoomRef.current) * 0.08;

      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.x = currentRotationRef.current.x;
        globeGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      // Slowly swirl atmospheric clouds over time for realistic living Earth effect
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += 0.00025;
      }

      if (cameraRef.current) {
        cameraRef.current.position.z = currentZoomRef.current;
      }

      // Pulse 3D in-situ markers
      if (markersGroupRef.current) {
        markersGroupRef.current.children.forEach((child, index) => {
          if (child.name.startsWith('marker-ring-')) {
            const scale = 1 + Math.sin(elapsedTime * 3 + index) * 0.35;
            child.scale.set(scale, scale, scale);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse Interaction Handlers
    const handleMouseDown = (e: MouseEvent) => {
      // Don't drag if clicking UI panels
      if ((e.target as HTMLElement).closest('.interactive-hud')) return;
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - prevMousePosRef.current.x;
        const deltaY = e.clientY - prevMousePosRef.current.y;
        targetRotationRef.current.y += deltaX * 0.005;
        targetRotationRef.current.x += deltaY * 0.005;
        targetRotationRef.current.x = Math.max(-1.1, Math.min(1.1, targetRotationRef.current.x));
        prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      }

      // Cursor Lat/Lon calculation
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / height) * 2 + 1;
      const rotY = targetRotationRef.current.y;
      const rotX = targetRotationRef.current.x;
      const lon = (((-rotY * 180) / Math.PI + mouseX * 45) % 360 + 360) % 360 - 180;
      const lat = Math.max(-80, Math.min(80, (rotX * 180) / Math.PI + mouseY * 45));

      setCursorCoords({
        lat: `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`,
        lon: `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoomRef.current = Math.max(1.8, Math.min(4.5, targetZoomRef.current + e.deltaY * 0.002));
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update In-Situ Platform Markers when data or filters change
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    if (!markersGroup) return;

    // Clear existing children
    while (markersGroup.children.length > 0) {
      const obj = markersGroup.children[0];
      markersGroup.remove(obj);
    }

    const visibleObs = MOCK_OBSERVATIONS.filter((obs) => {
      if (selectedTypeFilter !== 'all' && obs.type !== selectedTypeFilter) return false;
      if (searchQuery.trim() && 
          !obs.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !obs.region.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });

    visibleObs.forEach((obs) => {
      const pos = latLonToVector3(obs.latitude, obs.longitude, 1.018);
      const isSelected = obs.id === selectedObsId;
      const isArgo = obs.type === 'argo';
      const markerColor = isArgo ? 0x00e5ff : 0xffb020;

      // Sphere core marker
      const sphereGeo = new THREE.SphereGeometry(isSelected ? 0.024 : 0.016, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: markerColor,
      });
      const markerMesh = new THREE.Mesh(sphereGeo, sphereMat);
      markerMesh.position.copy(pos);
      markerMesh.name = `marker-${obs.id}`;
      markersGroup.add(markerMesh);

      // Acoustic pulsing outer ring
      const ringGeo = new THREE.RingGeometry(0.02, 0.032, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: markerColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      ringMesh.name = `marker-ring-${obs.id}`;
      markersGroup.add(ringMesh);
    });

    // Alert Hazard Warning Beacons
    MOCK_ALERTS.forEach((alert) => {
      const coords = alert.coordinates || [alert.latitude, alert.longitude];
      const pos = latLonToVector3(coords[0], coords[1], 1.022);
      const alertColor = alert.severity === 'critical' ? 0xfe5f4e : alert.severity === 'warning' ? 0xffb020 : 0x00c2c2;
      const alertGeo = new THREE.SphereGeometry(0.026, 16, 16);
      const alertMat = new THREE.MeshBasicMaterial({
        color: alertColor,
        wireframe: true,
      });
      const alertMesh = new THREE.Mesh(alertGeo, alertMat);
      alertMesh.position.copy(pos);
      alertMesh.name = `alert-${alert.id}`;
      markersGroup.add(alertMesh);
    });
  }, [selectedTypeFilter, searchQuery, selectedObsId, latLonToVector3]);

  // Graticule visibility
  useEffect(() => {
    if (graticuleGroupRef.current) {
      graticuleGroupRef.current.visible = showGraticule;
    }
  }, [showGraticule]);

  // Heatmap opacity
  useEffect(() => {
    if (heatmapMeshRef.current) {
      const mat = heatmapMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = showHeatmap ? 0.75 : 0.0;
    }
  }, [showHeatmap]);

  const navMenuItems: { id: ScreenId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'earth', label: '3D Earth View', icon: <GlobeIcon /> },
    { id: 'depth-slice', label: '3D Depth Box', icon: <Box className="w-4 h-4 text-[#FE5F4E]" /> },
    { id: 'profiles', label: viewMode === 'scientist' ? 'T & S Profiles' : 'Water Temperature', icon: <LineChart className="w-4 h-4 text-emerald-400" /> },
    { id: 'comparison', label: viewMode === 'scientist' ? 'Model vs Obs' : 'Forecast Check', icon: <Scale className="w-4 h-4 text-[#00C2FF]" /> },
    { id: 'alerts', label: 'Early Warnings & Alerts', icon: <AlertTriangle className="w-4 h-4 text-[#FFB020]" />, badge: alertCount },
    { id: 'pfz', label: 'Potential Fishing Zone', icon: <Fish className="w-4 h-4 text-cyan-400" /> },
    { id: 'tours', label: 'Guided Ocean Stories', icon: <Compass className="w-4 h-4 text-blue-400" /> },
    { id: 'decision', label: 'Multi-Persona Decision Hub', icon: <Sliders className="w-4 h-4 text-purple-400" /> },
    { id: 'glossary', label: 'Ocean Glossary', icon: <BookOpen className="w-4 h-4 text-amber-300" /> },
    { id: 'architecture', label: 'System Architecture', icon: <Network className="w-4 h-4 text-indigo-400" /> },
  ];

  function GlobeIcon() {
    return (
      <svg className="w-4 h-4 text-[#00C2FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#020814] overflow-hidden select-none">
      {/* 3D WebGL Photorealistic Earth Canvas */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* TOP HEADER (Exact Match to Image 2) */}
      <header className="absolute top-0 left-0 right-0 z-30 px-4 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between pointer-events-none">
        {/* Top Left: Subtitle & BLUELENS Brand with Glowing Emblem (Matching Image 2) */}
        <div className="flex flex-col space-y-1 pointer-events-auto">
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-white/90 drop-shadow-md">
            2. 3D EARTH - INITIAL VIEW
          </span>
          <div 
            onClick={onReturnToSplash}
            className="flex items-center space-x-2.5 cursor-pointer group"
            title="Return to Welcome Screen"
          >
            {/* 3D Blue Lens Emblem Icon (from splash) */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-[#00C2FF] via-[#0055ff] to-[#00E5FF] shadow-[0_0_15px_rgba(0,194,255,0.7)] group-hover:scale-110 transition-transform">
              <img 
                src="/images/lens_emblem.jpg" 
                alt="BLUELENS Logo" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-white tracking-wider glow-cyan">
              BLUELENS
            </span>
          </div>
        </div>

        {/* Top Center: SCIENTIST MODE / EXPLORER MODE Pill Toggle (Exact Match to Image 2) */}
        <div className="pointer-events-auto flex items-center bg-[#071728]/85 border border-[#00C2FF]/30 rounded-xl p-1 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <button
            onClick={() => onToggleViewMode && onToggleViewMode()}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
              viewMode === 'scientist'
                ? 'bg-[#00C2FF]/20 text-[#00E5FF] border border-[#00C2FF] shadow-[0_0_12px_rgba(0,194,255,0.4)]'
                : 'text-white/60 hover:text-white border border-transparent'
            }`}
          >
            SCIENTIST MODE
          </button>
          <button
            onClick={() => onToggleViewMode && onToggleViewMode()}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
              viewMode === 'explorer'
                ? 'bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020] shadow-[0_0_12px_rgba(255,176,32,0.4)]'
                : 'text-white/60 hover:text-white border border-transparent'
            }`}
          >
            EXPLORER MODE
          </button>
        </div>

        {/* Top Right: ? Guide Button (Exact Match to Image 2) */}
        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#071728]/85 hover:bg-[#00C2FF]/20 border border-white/15 hover:border-[#00C2FF]/50 text-white hover:text-[#00E5FF] text-xs font-bold shadow-lg transition-all backdrop-blur-md"
            title="Open Interactive Guide & Shortcuts"
          >
            <HelpCircle className="w-4 h-4 text-[#00E5FF]" />
            <span>Guide</span>
          </button>
        </div>
      </header>

      {/* LEFT FLOATING VERTICAL DOCK (Exact Match to Image 2's 4 Circular Buttons) */}
      <nav className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col space-y-3 pointer-events-auto interactive-hud" aria-label="Quick Tools Navigation">
        {/* 1. Home Button -> Returns to splash / home */}
        <button
          onClick={onReturnToSplash}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#0B1D2E]/85 hover:bg-[#00C2FF]/25 border border-white/20 hover:border-[#00C2FF] flex items-center justify-center text-white/80 hover:text-[#00E5FF] shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all group"
          title="Return to Welcome Screen (Home)"
        >
          <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* 2. Grid / Apps Menu Button -> Toggles Screens Navigation Drawer */}
        <button
          onClick={() => {
            setAppsDrawerOpen(!appsDrawerOpen);
            setRegionsPanelOpen(false);
            setSettingsPanelOpen(false);
          }}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all group ${
            appsDrawerOpen
              ? 'bg-[#00C2FF] text-[#061220] border-[#00C2FF] shadow-[0_0_15px_rgba(0,194,255,0.6)]'
              : 'bg-[#0B1D2E]/85 hover:bg-[#00C2FF]/25 border-white/20 hover:border-[#00C2FF] text-white/80 hover:text-[#00E5FF]'
          }`}
          title="Navigate to other Platform Screens (3D Depth Box, Profiles, Alerts...)"
        >
          <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* 3. Regions / Indian Ocean Basins Button -> Toggles Regions quick fly-to bar */}
        <button
          onClick={() => {
            setRegionsPanelOpen(!regionsPanelOpen);
            setAppsDrawerOpen(false);
            setSettingsPanelOpen(false);
          }}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all group ${
            regionsPanelOpen
              ? 'bg-[#00C2FF] text-[#061220] border-[#00C2FF] shadow-[0_0_15px_rgba(0,194,255,0.6)]'
              : 'bg-[#0B1D2E]/85 hover:bg-[#00C2FF]/25 border-white/20 hover:border-[#00C2FF] text-white/80 hover:text-[#00E5FF]'
          }`}
          title="Zoom to Indian Ocean Regions (Bay of Bengal, Arabian Sea, Chennai...)"
        >
          <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* 4. Settings / Layers Controls Button -> Toggles Graticule, Heatmap, Reset Camera */}
        <button
          onClick={() => {
            setSettingsPanelOpen(!settingsPanelOpen);
            setAppsDrawerOpen(false);
            setRegionsPanelOpen(false);
          }}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all group ${
            settingsPanelOpen
              ? 'bg-[#00C2FF] text-[#061220] border-[#00C2FF] shadow-[0_0_15px_rgba(0,194,255,0.6)]'
              : 'bg-[#0B1D2E]/85 hover:bg-[#00C2FF]/25 border-white/20 hover:border-[#00C2FF] text-white/80 hover:text-[#00E5FF]'
          }`}
          title="Display Layers & Settings (Graticule, Heatmap, Camera Reset)"
        >
          <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </nav>

      {/* FLYOUT DRAWER 1: APPS / SCREENS NAVIGATION DRAWER (Opened via Grid Icon 2) */}
      {appsDrawerOpen && (
        <div className="absolute left-20 top-1/2 -translate-y-1/2 z-40 w-72 sm:w-80 glass-panel p-4 rounded-2xl border border-[#00C2FF]/40 shadow-2xl backdrop-blur-xl animate-fade-in interactive-hud">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center space-x-2">
              <LayoutGrid className="w-4 h-4 text-[#00C2FF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Platform Modules</h3>
            </div>
            <button 
              onClick={() => setAppsDrawerOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {navMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (onSelectScreen) onSelectScreen(item.id);
                  setAppsDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  item.id === 'earth'
                    ? 'bg-[#00C2FF]/25 text-[#00E5FF] border border-[#00C2FF]/50'
                    : 'bg-[#061220]/70 hover:bg-white/10 text-white/80 border border-white/5'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#FE5F4E] text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FLYOUT DRAWER 2: REGIONS SELECTOR (Opened via Icon 3) */}
      {regionsPanelOpen && (
        <div className="absolute left-20 top-1/2 -translate-y-1/2 z-40 w-72 glass-panel p-4 rounded-2xl border border-[#00C2FF]/40 shadow-2xl backdrop-blur-xl animate-fade-in interactive-hud">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-[#00C2FF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Indian Ocean Regions</h3>
            </div>
            <button 
              onClick={() => setRegionsPanelOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-white/60 mb-3">
            Click any regional oceanic sector to automatically orient and zoom the 3D Earth:
          </p>

          <div className="space-y-1.5">
            {INCOIS_REGIONS.map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  zoomToRegion(reg.id);
                  setRegionsPanelOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeRegion === reg.id
                    ? 'bg-[#00C2FF] text-[#061220] font-bold shadow-[0_0_10px_rgba(0,194,255,0.4)]'
                    : 'bg-[#061220]/70 hover:bg-white/10 text-white/80 border border-white/5'
                }`}
              >
                <span>{reg.name}</span>
                <span className="text-[10px] opacity-70">Zoom {reg.zoom}x</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FLYOUT DRAWER 3: SETTINGS & DISPLAY CONTROLS (Opened via Icon 4) */}
      {settingsPanelOpen && (
        <div className="absolute left-20 top-1/2 -translate-y-1/2 z-40 w-72 glass-panel p-4 rounded-2xl border border-[#00C2FF]/40 shadow-2xl backdrop-blur-xl animate-fade-in interactive-hud">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-[#00C2FF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Visual Layers</h3>
            </div>
            <button 
              onClick={() => setSettingsPanelOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <button
              onClick={() => setShowGraticule(!showGraticule)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                showGraticule
                  ? 'bg-[#00C2FF]/20 border-[#00C2FF] text-[#00E5FF]'
                  : 'bg-[#061220]/70 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4" />
                <span>Latitude/Longitude Graticule</span>
              </div>
              <span className="text-[10px] font-mono uppercase font-bold">
                {showGraticule ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                showHeatmap
                  ? 'bg-[#FFB020]/20 border-[#FFB020] text-[#FFB020]'
                  : 'bg-[#061220]/70 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Float Density Heatmap</span>
              </div>
              <span className="text-[10px] font-mono uppercase font-bold">
                {showHeatmap ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => {
                targetRotationRef.current = { x: 0.18, y: -1.35 };
                targetZoomRef.current = 3.0;
              }}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Camera View</span>
            </button>
          </div>
        </div>
      )}

      {/* RIGHT SLIDE-OUT / COLLAPSIBLE IN-SITU PLATFORMS PANEL (Image 1 feature) */}
      {platformsPanelOpen && (
        <div className="absolute top-16 sm:top-20 right-4 z-30 flex flex-col items-end space-y-2.5 max-w-sm pointer-events-auto interactive-hud">
          <div className="glass-panel p-3.5 rounded-2xl border border-[#00C2FF]/30 shadow-2xl backdrop-blur-xl w-72 sm:w-80">
            {/* Header & Close Toggle */}
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
                <span className="text-xs font-bold tracking-wide text-white uppercase">In-Situ Telemetry</span>
              </div>
              <button
                onClick={() => setPlatformsPanelOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Collapse Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-2.5">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search float ID, Chennai, Vizag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#061220] border border-[#00C2FF]/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            {/* Filter Layers */}
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="text-white/60 font-medium">Filter Layer:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setSelectedTypeFilter('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    selectedTypeFilter === 'all'
                      ? 'bg-[#00C2FF] text-[#061220] font-bold'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  All ({MOCK_OBSERVATIONS.length})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('argo')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    selectedTypeFilter === 'argo'
                      ? 'bg-[#00C2FF] text-[#061220] font-bold'
                      : 'bg-white/5 text-[#00C2FF] hover:bg-white/10'
                  }`}
                >
                  Argo (Cyan)
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('glider')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    selectedTypeFilter === 'glider'
                      ? 'bg-[#FFB020] text-[#061220] font-bold'
                      : 'bg-white/5 text-[#FFB020] hover:bg-white/10'
                  }`}
                >
                  Gliders (Orange)
                </button>
              </div>
            </div>

            {/* Quick Graticule & Heatmap shortcuts */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs mb-2">
              <button
                onClick={() => setShowGraticule(!showGraticule)}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[11px] transition-colors ${
                  showGraticule ? 'text-[#00C2FF] bg-[#00C2FF]/15' : 'text-white/50 hover:text-white'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>Grid Graticule</span>
              </button>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[11px] transition-colors ${
                  showHeatmap ? 'text-[#FFB020] bg-[#FFB020]/15 font-semibold' : 'text-white/50 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Float Density Heatmap</span>
              </button>
            </div>

            {/* Primary In-Situ Platforms List (Click to inspect) */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[11px] text-[#00C2FF] font-semibold mb-1.5 flex items-center justify-between">
                <span>Primary In-Situ Platforms</span>
                <span className="text-[10px] text-white/50">Click to inspect</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {MOCK_OBSERVATIONS.map((obs) => (
                  <button
                    key={obs.id}
                    onClick={() => onSelectObservation(obs)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      selectedObsId === obs.id
                        ? 'bg-[#00C2FF]/25 border border-[#00C2FF] text-white font-semibold'
                        : 'bg-[#061220]/60 hover:bg-white/10 text-white/80 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          obs.type === 'argo' ? 'bg-[#00C2FF]' : 'bg-[#FFB020]'
                        }`}
                      />
                      <span className="truncate max-w-[130px]">{obs.name}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[10px] text-[#00C2FF]">
                      <span>{obs.currentDepth}m</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT FLOATING BUTTONS (Exact Match to Image 2's bottom-right circular buttons) */}
      <div className="absolute right-4 bottom-20 z-30 flex flex-col space-y-3 pointer-events-auto interactive-hud">
        {/* Toggle Platforms Explorer */}
        <button
          onClick={() => setPlatformsPanelOpen(!platformsPanelOpen)}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all group ${
            platformsPanelOpen
              ? 'bg-[#00C2FF] text-[#061220] border-[#00C2FF] shadow-[0_0_15px_rgba(0,194,255,0.7)]'
              : 'bg-[#0B1D2E]/85 hover:bg-[#00C2FF]/25 border-white/20 hover:border-[#00C2FF] text-white/80 hover:text-[#00E5FF]'
          }`}
          title={platformsPanelOpen ? 'Hide In-Situ Platforms Drawer' : 'Show In-Situ Platforms & Search'}
        >
          <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Near Me / Geolocation Fly-to Button */}
        <button
          onClick={handleNearMe}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0B1D2E]/85 hover:bg-[#00C2FF]/25 border border-white/20 hover:border-[#00C2FF] flex items-center justify-center text-white/80 hover:text-[#00E5FF] shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all group"
          title="Locate nearest Indian coastal waters (Near Me)"
        >
          <Compass className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* BOTTOM PROMPTS & HUD BAR (Exact Match to Image 2 with all Image 1 controls included) */}
      <footer className="absolute bottom-3 left-4 right-4 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Center/Left: Drag, Scroll, Click prompts (Exact match to Image 2's bottom text icons) */}
        <div className="flex items-center space-x-3 pointer-events-auto bg-[#071728]/85 px-4 py-2 rounded-full border border-[#00C2FF]/25 shadow-xl backdrop-blur-md text-xs">
          <div className="flex items-center space-x-3 text-white/85 font-medium">
            <span className="flex items-center space-x-1.5">
              <span>🤲</span>
              <span>Drag to rotate</span>
            </span>
            <span className="text-white/30">•</span>
            <span className="flex items-center space-x-1.5">
              <span>🔍</span>
              <span>Scroll to zoom</span>
            </span>
            <span className="text-white/30">•</span>
            <span className="flex items-center space-x-1.5 text-[#00E5FF]">
              <span>🖱️</span>
              <span>Click on markers</span>
            </span>
          </div>

          <div className="h-3 w-[1px] bg-white/20 hidden md:block" />

          {/* Coordinates */}
          <div className="hidden md:flex items-center space-x-1.5 font-mono text-[#00C2FF] text-[11px]">
            <span>{cursorCoords.lat}</span>
            <span>{cursorCoords.lon}</span>
          </div>
        </div>

        {/* Right: Legend, GeoJSON Export & Direct "Enter 3D Depth Box" CTA */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Observation Legend */}
          <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 rounded-full bg-[#071728]/85 border border-white/10 text-xs backdrop-blur-md">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00C2FF] shadow-[0_0_6px_#00C2FF]" />
              <span className="text-white/80 text-[11px]">Argo (2000m)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFB020] shadow-[0_0_6px_#FFB020]" />
              <span className="text-white/80 text-[11px]">Seaglider (1000m)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FE5F4E] shadow-[0_0_6px_#FE5F4E]" />
              <span className="text-white/80 text-[11px]">Active Hazard</span>
            </div>
          </div>

          {/* Export GeoJSON */}
          <button
            onClick={handleExportGeoJSON}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#071728]/85 hover:bg-white/10 border border-white/20 text-white text-xs font-medium shadow-md transition-colors backdrop-blur-md"
            title="Export In-Situ Telemetry as GeoJSON"
          >
            <Download className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="hidden xl:inline">Export GeoJSON</span>
          </button>

          {/* Primary Action Button: Enter 3D Depth Box */}
          <button
            onClick={onNavigateToDepthSlice}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#00C2C2] text-[#061220] text-xs font-extrabold shadow-[0_0_20px_rgba(0,194,255,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>Enter 3D Depth Box</span>
            <ChevronRight className="w-4 h-4 text-[#061220]" />
          </button>
        </div>
      </footer>
    </div>
  );
};
