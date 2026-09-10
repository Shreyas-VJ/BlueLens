import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Waves, 
  Wind, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Share2, 
  Send, 
  Filter, 
  Sliders, 
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Radio,
  FileDown
} from 'lucide-react';
import { OceanAlert, ViewMode } from '../types';
import { MOCK_ALERTS } from '../data/oceanData';

interface AlertsViewProps {
  viewMode: ViewMode;
  onSelectAlertOnGlobe: (alert: OceanAlert) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  viewMode,
  onSelectAlertOnGlobe,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeAlert, setActiveAlert] = useState<OceanAlert>(MOCK_ALERTS[0]);
  const [searchRadius, setSearchRadius] = useState<number>(500); // km

  const filteredAlerts = MOCK_ALERTS.filter((alert) => {
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
    if (selectedType !== 'all' && alert.type !== selectedType) return false;
    return true;
  });

  const getSeverityBadge = (severity: OceanAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'watch':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'advisory':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getTypeIcon = (type: OceanAlert['type']) => {
    switch (type) {
      case 'cyclone':
        return <Wind className="w-4 h-4 text-red-400" />;
      case 'heatwave':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'tsunami':
        return <Radio className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'high-wave':
        return <Waves className="w-4 h-4 text-cyan-400" />;
      case 'coral-bleaching':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-[#00C2FF]" />;
    }
  };

  const handleShareAlert = (alert: OceanAlert) => {
    const text = encodeURIComponent(
      `🚨 INCOIS CRITICAL OCEAN ALERT:\n[${alert.severity.toUpperCase()}] ${alert.title}\nLocation: ${alert.region} (${alert.latitude}°N, ${alert.longitude}°E)\nAdvice: ${alert.safetyAdvice}\nView live telemetry: ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#061220] p-4 sm:p-6 lg:p-8 select-none text-[#E6F4FF]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white glow-cyan">
              DISASTER & ANOMALY ALERT EARLY WARNING SYSTEM
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#00C2FF] font-medium mt-1">
            {viewMode === 'scientist'
              ? 'Operational Early Warnings · Satellite Remote Sensing & Moored Buoy Trigger Network (INCOIS / IMD)'
              : 'Active ocean hazards, marine heatwaves, and coastal safety warnings'}
          </p>
        </div>

        {/* Live Broadcast Status */}
        <div className="flex items-center space-x-2 bg-[#0B1D2E] px-3.5 py-1.5 rounded-xl border border-red-500/40">
          <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-red-400">
            {MOCK_ALERTS.length} ACTIVE BULLETINS
          </span>
        </div>
      </div>

      {/* Filter Bar (Screen 14 from PDF) */}
      <div className="glass-panel p-3.5 rounded-2xl border border-white/10 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-white/60 font-semibold flex items-center mr-1">
            <Filter className="w-3.5 h-3.5 mr-1 text-[#00C2FF]" /> Severity:
          </span>
          {(['all', 'critical', 'warning', 'watch', 'advisory'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                selectedSeverity === sev
                  ? 'bg-[#00C2FF] text-[#061220] font-bold shadow-[0_0_8px_rgba(0,194,255,0.4)]'
                  : 'bg-[#061220] text-white/70 hover:text-white border border-white/5'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-white/60 font-semibold mr-1">Type:</span>
          {(['all', 'cyclone', 'heatwave', 'tsunami', 'high-wave'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                selectedType === t
                  ? 'bg-[#FFB020] text-[#061220] font-bold shadow-[0_0_8px_rgba(255,176,32,0.4)]'
                  : 'bg-[#061220] text-white/70 hover:text-white border border-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Alert List on Left, Deep Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts Feed List (Left) */}
        <div className="lg:col-span-5 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
          {filteredAlerts.map((alert) => {
            const isSelected = activeAlert.id === alert.id;
            return (
              <div
                key={alert.id}
                onClick={() => setActiveAlert(alert)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-[#0B1D2E] border-[#00C2FF] shadow-[0_0_20px_rgba(0,194,255,0.25)] scale-[1.01]'
                    : 'bg-[#0B1D2E]/60 border-white/5 hover:border-white/20 hover:bg-[#0B1D2E]/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-xl bg-[#061220] border border-white/10">
                      {getTypeIcon(alert.type)}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">{alert.title}</h3>
                      <div className="flex items-center space-x-2 text-[11px] text-white/50 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#00C2FF]" />
                        <span>{alert.region}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityBadge(
                      alert.severity
                    )}`}
                  >
                    {alert.severity}
                  </span>
                </div>

                {/* Safety advice snippet */}
                <p className="text-xs text-[#E6F4FF]/75 line-clamp-2 mt-2 leading-relaxed">
                  {alert.safetyAdvice}
                </p>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 text-[10px] text-white/50">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Issued: {alert.timestamp}</span>
                  </div>
                  <span className="text-[#00C2FF] font-semibold flex items-center">
                    Inspect Bulletin <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep Dossier Details (Right) */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 rounded-2xl border border-[#00C2FF]/30 shadow-2xl space-y-5">
            {/* Title & Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getSeverityBadge(
                      activeAlert.severity
                    )}`}
                  >
                    {activeAlert.severity} LEVEL
                  </span>
                  <span className="text-xs font-mono text-white/50">ID: {activeAlert.id}</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">{activeAlert.title}</h2>
                <div className="text-xs text-[#00C2FF] font-medium flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {activeAlert.region} · {activeAlert.latitude}°N, {activeAlert.longitude}°E
                  </span>
                </div>
              </div>

              {/* Share & Locate Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSelectAlertOnGlobe(activeAlert)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#00C2FF] text-[#061220] text-xs font-bold shadow-md hover:bg-[#00E5FF] transition-all"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Locate on Globe</span>
                </button>
                <button
                  onClick={() => handleShareAlert(activeAlert)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold transition-all"
                  title="Forward emergency bulletin to coastal authorities / WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Description & Impact Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">
                Oceanographic Situation Assessment
              </h4>
              <p className="text-xs sm:text-sm text-[#E6F4FF]/90 leading-relaxed bg-[#061220]/60 p-3.5 rounded-xl border border-white/5">
                {activeAlert.description}
              </p>
            </div>

            {/* Safety Advisory Banner (Page 18 from PDF) */}
            <div className="p-4 rounded-xl bg-[#FE5F4E]/15 border border-[#FE5F4E]/40 space-y-1.5">
              <div className="flex items-center space-x-2 text-[#FE5F4E]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Coastal Safety Advisory & Actionable Directives
                </span>
              </div>
              <p className="text-xs text-white font-medium leading-relaxed pl-6">
                "{activeAlert.safetyAdvice}"
              </p>
            </div>

            {/* Quantitative Sensor Evidence (Scientist Mode) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                <span>Quantitative Sensor Telemetry Triggers</span>
                <span className="text-[10px] text-[#00C2FF]">Real-Time Feed</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(activeAlert.impactMetrics).map(([key, val]) => (
                  <div key={key} className="bg-[#061220] p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase text-white/50 block truncate">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-sm font-mono font-bold text-[#00C2FF] mt-0.5 block">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Automated Dispatch Log for Disaster Authorities */}
            <div className="p-3 bg-[#061220]/80 rounded-xl border border-white/10 text-xs flex items-center justify-between text-white/60">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Automated bulletin transmitted to NDMA, Indian Coast Guard & State EOCs.</span>
              </div>
              <span className="font-mono text-[10px] text-white/40">RFC 3880 CAP compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
