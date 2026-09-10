export type ViewMode = 'scientist' | 'explorer';

export type ScreenId = 
  | 'splash'
  | 'earth'
  | 'detail'
  | 'dive'
  | 'underwater'
  | 'depth-slice'
  | 'profiles'
  | 'comparison'
  | 'explorer-dash'
  | 'alerts'
  | 'pfz'
  | 'tours'
  | 'decision'
  | 'glossary'
  | 'architecture';

export type OceanVariable = 
  | 'temperature' 
  | 'salinity' 
  | 'chlorophyll' 
  | 'oxygen' 
  | 'currents' 
  | 'density' 
  | 'ssh';

export type PlatformType = 'argo' | 'glider' | 'satellite';

export interface ObservationMarker {
  id: string;
  wmoid: string;
  name: string;
  type: PlatformType;
  latitude: number;
  longitude: number;
  region: string;
  dateTime: string;
  maxDepth: number;
  currentDepth: number;
  status: 'Active' | 'Inactive' | 'Ascending' | 'Descending';
  lastReportedHoursAgo: number;
  country: string;
  program: string;
  temperatureAtSurface: number;
  temperatureAt500m: number;
  salinityAt500m: number;
  currentsAt500m: number;
  currentDirection: string;
  chlorophyllSurface: number;
  oxygenAt500m: number;
  availableVariables: OceanVariable[];
}

export interface DepthProfilePoint {
  depth: number;
  observedTemp: number;
  modelTemp: number;
  observedSalinity: number;
  modelSalinity: number;
  observedOxygen: number;
  modelOxygen: number;
  observedChlorophyll: number;
  modelChlorophyll: number;
  density: number;
}

export interface OceanAlert {
  id: string;
  type: 'cyclone' | 'heatwave' | 'tsunami' | 'high-wave' | 'coral-bleaching';
  category?: 'high-wave' | 'marine-heatwave' | 'storm-surge' | 'tsunami' | 'algal-bloom';
  title: string;
  region: string;
  severity: 'critical' | 'warning' | 'watch' | 'advisory';
  statusText?: string;
  description: string;
  safetyAdvice: string;
  timestamp: string;
  issuedTime?: string;
  latitude: number;
  longitude: number;
  coordinates?: [number, number];
  impactMetrics: Record<string, string>;
}

export interface PFZZone {
  id: string;
  landingCenter: string;
  coastalState: string;
  bearingDeg: number;
  direction: string;
  distanceKm: number;
  depthMin: number;
  depthMax: number;
  targetSpecies: string[];
  fuelSavedPct: number;
  validity: string;
  name?: string;
  status?: 'green' | 'yellow' | 'grey' | 'red';
  speciesHints?: string;
  distanceFromCoast?: string;
  depthRange?: string;
  confidence?: 'High' | 'Moderate' | 'Low';
  chlorophyllVal?: string;
  sstVal?: string;
  coordinates?: [number, number];
  advisoryText?: string;
}

export interface GuidedStory {
  id: string;
  title: string;
  tagline: string;
  duration: string;
  chapters: {
    title: string;
    description: string;
    visualContext: string;
    keyFact: string;
  }[];
}

export interface GlossaryItem {
  id: string;
  term: string;
  category: string;
  simpleDefinition: string;
  definition: string;
  funFact?: string;
  relatedTerms?: string[];
}

export type ColormapPreset = 
  | 'viridis' 
  | 'jet' 
  | 'plasma' 
  | 'ocean' 
  | 'rdbu' 
  | 'hot' 
  | 'cool' 
  | 'greys';

export interface ColormapSettings {
  preset: ColormapPreset;
  minValue: number;
  maxValue: number;
  scale: 'linear' | 'log';
  opacity: number; // 0 to 1
  inverted: boolean;
  levels: number;
  nanColor: string;
  legendPosition: 'bottom-right' | 'top-right' | 'bottom-left' | 'off';
}
