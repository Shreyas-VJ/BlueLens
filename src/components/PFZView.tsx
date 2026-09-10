import React, { useState } from 'react';
import { 
  Fish, 
  Compass, 
  Clock, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Fuel, 
  Share2, 
  Send, 
  Languages, 
  Download, 
  CheckCircle2, 
  Info,
  Anchor,
  Layers
} from 'lucide-react';
import { ViewMode } from '../types';
import { MOCK_PFZ_ADVISORIES } from '../data/oceanData';

interface PFZViewProps {
  viewMode: ViewMode;
  onLocateZoneOnGlobe?: (lat: number, lon: number) => void;
}

export const PFZView: React.FC<PFZViewProps> = ({
  viewMode,
  onLocateZoneOnGlobe,
}) => {
  const [selectedZone, setSelectedZone] = useState(MOCK_PFZ_ADVISORIES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'ta' | 'te' | 'ml'>('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'all' | 'sst' | 'chlorophyll'>('all');

  // Translations for coastal fishermen
  const translations: Record<string, Record<string, string>> = {
    en: {
      title: 'INCOIS POTENTIAL FISHING ZONE (PFZ) ADVISORY',
      subtitle: 'Satellite-derived ocean thermal fronts & chlorophyll-a aggregation zones',
      zone: 'Active Advisory Zone',
      bearing: 'Direction / Compass Bearing',
      distance: 'Distance from Landing Center',
      species: 'Abundant Fish Species',
      fuelSaved: 'Fuel & Time Saved',
      listen: 'Listen to Voice Advisory',
      stop: 'Stop Audio',
      share: 'Send via WhatsApp to Fishermen',
    },
    hi: {
      title: 'इन्कॉइस संभावित मत्स्य पालन क्षेत्र (PFZ) परामर्श',
      subtitle: 'उपग्रह आधारित महासागरीय तापीय सीमाएं और क्लोरोफिल केंद्र',
      zone: 'सक्रिय मत्स्य पालन क्षेत्र',
      bearing: 'दिशा और कोण',
      distance: 'तटीय केंद्र से दूरी',
      species: 'प्रमुख मछली प्रजातियां',
      fuelSaved: 'ईंधन और समय की बचत',
      listen: 'ऑडियो परामर्श सुनें',
      stop: 'ऑडियो बंद करें',
      share: 'मछुआरों को व्हाट्सएप भेजें',
    },
    ta: {
      title: 'INCOIS மீன்பிடி சாத்தியமுள்ள மண்டல வழிகாட்டுதல் (PFZ)',
      subtitle: 'செயற்கைக்கோள் வெப்பநிலை மாற்றங்கள் மற்றும் குளோரோபில் மண்டலங்கள்',
      zone: 'மீன்பிடி மண்டலம்',
      bearing: 'திசை மற்றும் கோணம்',
      distance: 'மீன்பிடி தளத்திலிருந்து தூரம்',
      species: 'அதிகளவில் உள்ள மீன் வகைகள்',
      fuelSaved: 'எரிபொருள் மற்றும் நேர சேமிப்பு',
      listen: 'குரல் வழிகாட்டுதல் கேட்க',
      stop: 'ஆடியோ நிறுத்து',
      share: 'வாட்ஸ்அப் மூலம் பகிரவும்',
    },
    ml: {
      title: 'ഇൻകോയിസ് മത്സ്യബന്ധന സാധ്യതാ മേഖല (PFZ) ഉപദേശം',
      subtitle: 'ഉപഗ്രഹ താപനില മാറ്റങ്ങളും ക്ലോറോഫിൽ കേന്ദ്രങ്ങളും',
      zone: 'മത്സ്യബന്ധന മേഖല',
      bearing: 'ദിശ',
      distance: 'തീരത്തുനിന്നുള്ള ദൂരം',
      species: 'ലഭ്യമായ മത്സ്യങ്ങൾ',
      fuelSaved: 'ഇന്ധന സമയ ലാഭം',
      listen: 'വോയ്സ് ഉപദേശം കേൾക്കുക',
      stop: 'ഓഡിയോ നിർത്തുക',
      share: 'വാട്സ്ആപ്പിൽ അയക്കുക',
    },
    te: {
      title: 'INCOIS సంభావ్య చేపల వేట ప్రాంతం (PFZ) సలహా',
      subtitle: 'ఉపగ్రహ ఉష్ణోగ్రత మరియు క్లోరోఫిల్ విశ్లేషణ',
      zone: 'చేపల వేట ప్రాంతం',
      bearing: 'దిశ మరియు కోణం',
      distance: 'తీర కేంద్రం నుండి దూరం',
      species: 'లభ్యమయ్యే చేప రకాలు',
      fuelSaved: 'ఇంధనం మరియు సమయం ఆదా',
      listen: 'వాయిస్ వినండి',
      stop: 'ఆపండి',
      share: 'వాట్సాప్ ద్వారా పంపండి',
    },
  };

  const t = translations[selectedLanguage] || translations.en;

  // Speech synthesis for fishermen audio broadcast
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    const narration = `INCOIS Potential Fishing Zone advisory for ${selectedZone.landingCenter}, ${selectedZone.coastalState}. 
Recommended fishing grounds are located ${selectedZone.distanceKm} kilometres offshore, at compass bearing ${selectedZone.bearingDeg} degrees ${selectedZone.direction}.
Depth of aggregation is between ${selectedZone.depthMin} and ${selectedZone.depthMax} metres.
Target species include ${selectedZone.targetSpecies.join(', ')}.
Valid until ${selectedZone.validity}.`;

    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🐟 INCOIS PFZ ADVISORY — ${selectedZone.coastalState.toUpperCase()}:\nBase: ${selectedZone.landingCenter}\nDirection: ${selectedZone.bearingDeg}° (${selectedZone.direction})\nDistance: ${selectedZone.distanceKm} km (${(selectedZone.distanceKm * 0.5399).toFixed(1)} NM)\nDepth: ${selectedZone.depthMin}–${selectedZone.depthMax} m\nTarget: ${selectedZone.targetSpecies.join(', ')}\nFuel Savings: ${selectedZone.fuelSavedPct}%\nValid Until: ${selectedZone.validity}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#061220] p-4 sm:p-6 lg:p-8 select-none text-[#E6F4FF]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <Fish className="w-6 h-6 text-[#00C2C2]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white glow-cyan">
              {t.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#00C2FF] font-medium mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* Language Switcher for Coastal Fishermen */}
        <div className="flex items-center space-x-1.5 bg-[#0B1D2E] p-1.5 rounded-xl border border-[#00C2FF]/30">
          <Languages className="w-4 h-4 text-[#00C2FF] ml-1 mr-0.5" />
          {[
            { id: 'en', label: 'English' },
            { id: 'hi', label: 'हिन्दी' },
            { id: 'ta', label: 'தமிழ்' },
            { id: 'te', label: 'తెలుగు' },
            { id: 'ml', label: 'മലയാളം' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLanguage(lang.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedLanguage === lang.id
                  ? 'bg-[#00C2FF] text-[#061220] font-bold shadow-[0_0_8px_rgba(0,194,255,0.4)]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Coastal States List on Left, Active Advisory Dashboard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coastal Landing Centers (Left) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2 flex items-center justify-between">
            <span>Coastal Landing Harbours</span>
            <span className="text-[10px] text-[#00C2C2]">{MOCK_PFZ_ADVISORIES.length} Active Feeds</span>
          </h3>

          <div className="space-y-2.5 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
            {MOCK_PFZ_ADVISORIES.map((zone) => {
              const isSelected = selectedZone.id === zone.id;
              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#0B1D2E] border-[#00C2C2] shadow-[0_0_20px_rgba(0,194,194,0.3)] scale-[1.01]'
                      : 'bg-[#0B1D2E]/60 border-white/5 hover:border-white/20 hover:bg-[#0B1D2E]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {zone.landingCenter}
                      </h4>
                      <div className="text-xs text-[#00C2FF] font-medium">{zone.coastalState}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                      -{zone.fuelSavedPct}% Fuel
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-white/5 text-[11px] text-white/60 font-mono">
                    <div>
                      Bearing: <strong className="text-white">{zone.bearingDeg}° {zone.direction}</strong>
                    </div>
                    <div className="text-right">
                      Distance: <strong className="text-[#FFB020]">{zone.distanceKm} km</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Advisory Dossier (Right) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-[#00C2C2]/40 shadow-2xl space-y-6">
            {/* Top Bar: Landing Center & Audio Player */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-[#00C2C2] uppercase font-bold">
                  {selectedZone.coastalState} Coastline · Sector {selectedZone.id}
                </span>
                <h2 className="text-xl font-black text-white tracking-wide mt-0.5">
                  {selectedZone.landingCenter} Fishing Harbour
                </h2>
                <div className="flex items-center space-x-2 text-xs text-white/60 mt-1">
                  <Clock className="w-3.5 h-3.5 text-[#00C2FF]" />
                  <span>Validity: {selectedZone.validity}</span>
                </div>
              </div>

              {/* Action Buttons: Audio & WhatsApp */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleAudio}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                    isPlayingAudio
                      ? 'bg-[#FE5F4E] text-white animate-pulse'
                      : 'bg-[#00C2C2] text-[#061220] hover:bg-[#00E5FF]'
                  }`}
                >
                  {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isPlayingAudio ? t.stop : t.listen}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-xs shadow-md transition-colors"
                  title="Share PFZ coordinates to Fishermen WhatsApp Groups"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Compass Bearing & Distance Highlight Card (Page 19 from PDF) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#061220] p-4 rounded-2xl border border-white/5 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-[#00C2FF]/15 border border-[#00C2FF]/40 flex items-center justify-center shrink-0">
                  <Compass className="w-6 h-6 text-[#00C2FF]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">
                    {t.bearing}
                  </span>
                  <div className="text-lg font-black font-mono text-white mt-0.5">
                    {selectedZone.bearingDeg}° ({selectedZone.direction})
                  </div>
                </div>
              </div>

              <div className="bg-[#061220] p-4 rounded-2xl border border-white/5 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-[#FFB020]/15 border border-[#FFB020]/40 flex items-center justify-center shrink-0">
                  <Anchor className="w-6 h-6 text-[#FFB020]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">
                    {t.distance}
                  </span>
                  <div className="text-lg font-black font-mono text-[#FFB020] mt-0.5">
                    {selectedZone.distanceKm} km <span className="text-xs text-white/50">({(selectedZone.distanceKm * 0.5399).toFixed(1)} NM)</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#061220] p-4 rounded-2xl border border-white/5 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Fuel className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">
                    {t.fuelSaved}
                  </span>
                  <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                    {selectedZone.fuelSavedPct}% Diesel
                  </div>
                </div>
              </div>
            </div>

            {/* Target Species & Fishing Depth */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">
                {t.species} & Aggregation Depth
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedZone.targetSpecies.map((species) => (
                  <span
                    key={species}
                    className="px-3 py-1 rounded-xl bg-[#0B1D2E] text-white text-xs font-semibold border border-white/10 flex items-center space-x-1.5"
                  >
                    <Fish className="w-3.5 h-3.5 text-[#00C2C2]" />
                    <span>{species}</span>
                  </span>
                ))}
                <span className="px-3 py-1 rounded-xl bg-[#00C2FF]/10 text-[#00C2FF] text-xs font-mono font-semibold border border-[#00C2FF]/30">
                  Target Depth: {selectedZone.depthMin}–{selectedZone.depthMax} m
                </span>
              </div>
            </div>

            {/* Oceanographic Front Scientific Drivers */}
            <div className="p-4 rounded-xl bg-[#061220]/80 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-[#00C2C2] font-semibold">
                <Layers className="w-4 h-4" />
                <span>Oceanographic Front Formation Mechanisms</span>
              </div>
              <p className="text-white/80 leading-relaxed">
                Aggregated by co-located Sea Surface Temperature (SST) gradients exceeding 0.75°C/km and ocean colour (Chlorophyll-a) concentrations of 0.4–1.8 mg/m³, driving dense zooplankton foraging grounds for pelagic schooling fish.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
