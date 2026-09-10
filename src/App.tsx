import React, { useState, useEffect } from 'react';
import { ScreenId, ViewMode, ObservationMarker, OceanAlert } from './types';
import { MOCK_OBSERVATIONS, MOCK_ALERTS } from './data/oceanData';

// Component Views
import { Navigation } from './components/Navigation';
import { SplashView } from './components/SplashView';
import { GlobeView } from './components/GlobeView';
import { ObservationDetailModal } from './components/ObservationDetailModal';
import { DiveTransition } from './components/DiveTransition';
import { UnderwaterView } from './components/UnderwaterView';
import { DepthSliceView } from './components/DepthSliceView';
import { ScientificProfilesView } from './components/ScientificProfilesView';
import { ModelVsObsView } from './components/ModelVsObsView';
import { AlertsView } from './components/AlertsView';
import { PFZView } from './components/PFZView';
import { GuidedStoriesView } from './components/GuidedStoriesView';
import { DecisionHubView } from './components/DecisionHubView';
import { GlossaryView } from './components/GlossaryView';
import { ArchitectureView } from './components/ArchitectureView';
import { InteractiveGuideModal } from './components/InteractiveGuideModal';

export default function App() {
  // Restore last active screen from localStorage to prevent 30-second idle refresh reset
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    try {
      const saved = localStorage.getItem('bluelens_active_screen');
      if (saved && ['earth', 'dive', 'underwater', 'depth-slice', 'profiles', 'comparison', 'alerts', 'pfz', 'decision', 'glossary', 'architecture', 'splash'].includes(saved)) {
        return saved as ScreenId;
      }
    } catch {}
    return 'earth';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('bluelens_view_mode');
      if (saved === 'explorer' || saved === 'scientist') return saved;
    } catch {}
    return 'scientist';
  });

  const [selectedObservation, setSelectedObservation] = useState<ObservationMarker>(() => {
    try {
      const savedId = localStorage.getItem('bluelens_selected_obs_id');
      if (savedId) {
        const found = MOCK_OBSERVATIONS.find((o) => o.id === savedId);
        if (found) return found;
      }
    } catch {}
    return MOCK_OBSERVATIONS[0];
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Persist screen, view mode, and observation to prevent idle unload/reconnect reset
  useEffect(() => {
    try {
      localStorage.setItem('bluelens_active_screen', currentScreen);
    } catch {}
  }, [currentScreen]);

  useEffect(() => {
    try {
      localStorage.setItem('bluelens_view_mode', viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('bluelens_selected_obs_id', selectedObservation.id);
    } catch {}
  }, [selectedObservation]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        if (detailModalOpen) setDetailModalOpen(false);
        if (guideModalOpen) setGuideModalOpen(false);
      } else if (e.key === '1') {
        setCurrentScreen('earth');
      } else if (e.key === '2') {
        setCurrentScreen('depth-slice');
      } else if (e.key === '3') {
        setCurrentScreen('profiles');
      } else if (e.key === '4') {
        setCurrentScreen('comparison');
      } else if (e.key === '5') {
        setCurrentScreen('alerts');
      } else if (e.key === '6') {
        setCurrentScreen('pfz');
      } else if (e.key === '7') {
        setCurrentScreen('decision');
      } else if (e.key === '8') {
        setCurrentScreen('glossary');
      } else if (e.key === '9') {
        setCurrentScreen('architecture');
      } else if (e.key === 'm' || e.key === 'M') {
        setViewMode((prev) => (prev === 'scientist' ? 'explorer' : 'scientist'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailModalOpen, guideModalOpen]);

  // Handlers
  const handleSelectObservationFromGlobe = (obs: ObservationMarker) => {
    setSelectedObservation(obs);
    setDetailModalOpen(true);
  };

  const handleStartDive = () => {
    setDetailModalOpen(false);
    setCurrentScreen('dive');
  };

  const handleDiveComplete = () => {
    setCurrentScreen('underwater');
  };

  const handleSelectAlertOnGlobe = (alert: OceanAlert) => {
    // Navigate to globe and center on coordinates
    setCurrentScreen('earth');
  };

  return (
    <div className="w-full min-h-screen bg-[#061220] text-[#E6F4FF] flex flex-col relative overflow-x-hidden">
      {/* Top and Bottom Navigation Bar (Hidden during full-screen splash, dive, earth, underwater, and depth-slice for Image 1/2 layout) */}
      {currentScreen !== 'splash' && currentScreen !== 'dive' && currentScreen !== 'earth' && currentScreen !== 'underwater' && currentScreen !== 'depth-slice' && (
        <Navigation
          currentScreen={currentScreen}
          onSelectScreen={(screen) => setCurrentScreen(screen)}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode((prev) => (prev === 'scientist' ? 'explorer' : 'scientist'))}
          onOpenGuide={() => setGuideModalOpen(true)}
          alertCount={MOCK_ALERTS.length}
          onReturnToSplash={() => setCurrentScreen('splash')}
        />
      )}

      {/* Primary View Routing */}
      <main className="flex-1 w-full flex flex-col pb-16 lg:pb-0">
        {currentScreen === 'splash' && (
          <SplashView
            onEnter={() => setCurrentScreen('earth')}
            viewMode={viewMode}
            onSelectViewMode={(mode) => setViewMode(mode)}
          />
        )}

        {currentScreen === 'earth' && (
          <GlobeView
            onSelectObservation={handleSelectObservationFromGlobe}
            selectedObsId={selectedObservation.id}
            viewMode={viewMode}
            onNavigateToDepthSlice={() => setCurrentScreen('depth-slice')}
            onNavigateToAlerts={() => setCurrentScreen('alerts')}
            onSelectScreen={(screen) => setCurrentScreen(screen)}
            onToggleViewMode={() => setViewMode((prev) => (prev === 'scientist' ? 'explorer' : 'scientist'))}
            onOpenGuide={() => setGuideModalOpen(true)}
            onReturnToSplash={() => setCurrentScreen('splash')}
            alertCount={MOCK_ALERTS.length}
          />
        )}

        {currentScreen === 'dive' && (
          <DiveTransition
            observation={selectedObservation}
            viewMode={viewMode}
            onCompleteDive={handleDiveComplete}
            onCancelDive={() => setCurrentScreen('earth')}
          />
        )}

        {currentScreen === 'underwater' && (
          <UnderwaterView
            observation={selectedObservation}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode((prev) => (prev === 'scientist' ? 'explorer' : 'scientist'))}
            onOpenGuide={() => setGuideModalOpen(true)}
            onEnterDepthSlice={() => setCurrentScreen('depth-slice')}
            onBackToSurface={() => setCurrentScreen('earth')}
            onNavigateToProfiles={() => setCurrentScreen('profiles')}
            onOpenObservationDetails={() => setDetailModalOpen(true)}
          />
        )}

        {currentScreen === 'depth-slice' && (
          <DepthSliceView
            observation={selectedObservation}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode((prev) => (prev === 'scientist' ? 'explorer' : 'scientist'))}
            onOpenGuide={() => setGuideModalOpen(true)}
            onBackToEarth={() => setCurrentScreen('earth')}
            onBackToUnderwater={() => setCurrentScreen('underwater')}
            onNavigateToProfiles={() => setCurrentScreen('profiles')}
            onNavigateToComparison={() => setCurrentScreen('comparison')}
          />
        )}

        {currentScreen === 'profiles' && (
          <ScientificProfilesView
            observation={selectedObservation}
            viewMode={viewMode}
            onNavigateToComparison={() => setCurrentScreen('comparison')}
            onNavigateToDepthSlice={() => setCurrentScreen('depth-slice')}
          />
        )}

        {currentScreen === 'comparison' && (
          <ModelVsObsView
            observation={selectedObservation}
            viewMode={viewMode}
            onNavigateToProfiles={() => setCurrentScreen('profiles')}
          />
        )}

        {currentScreen === 'alerts' && (
          <AlertsView
            viewMode={viewMode}
            onSelectAlertOnGlobe={handleSelectAlertOnGlobe}
          />
        )}

        {currentScreen === 'pfz' && (
          <PFZView
            viewMode={viewMode}
            onLocateZoneOnGlobe={() => setCurrentScreen('earth')}
          />
        )}

        {currentScreen === 'tours' && (
          <GuidedStoriesView
            viewMode={viewMode}
            onNavigateToGlobe={() => setCurrentScreen('earth')}
            onNavigateToDepthSlice={() => setCurrentScreen('depth-slice')}
          />
        )}

        {currentScreen === 'decision' && (
          <DecisionHubView
            viewMode={viewMode}
            onNavigateToPFZ={() => setCurrentScreen('pfz')}
            onNavigateToAlerts={() => setCurrentScreen('alerts')}
            onNavigateToProfiles={() => setCurrentScreen('profiles')}
          />
        )}

        {currentScreen === 'glossary' && (
          <GlossaryView viewMode={viewMode} />
        )}

        {currentScreen === 'architecture' && (
          <ArchitectureView viewMode={viewMode} />
        )}
      </main>

      {/* Observation Detail Card Modal (Screen 4 from PDF) */}
      {detailModalOpen && (
        <ObservationDetailModal
          observation={selectedObservation}
          onClose={() => setDetailModalOpen(false)}
          onStartDive={handleStartDive}
          onViewProfile={() => {
            setDetailModalOpen(false);
            setCurrentScreen('profiles');
          }}
          onViewDepthSlice={() => {
            setDetailModalOpen(false);
            setCurrentScreen('depth-slice');
          }}
          viewMode={viewMode}
        />
      )}

      {/* Interactive Guide & Keyboard Controls Modal */}
      {guideModalOpen && (
        <InteractiveGuideModal
          onClose={() => setGuideModalOpen(false)}
          onNavigate={(screen) => setCurrentScreen(screen)}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode((prev) => (prev === 'scientist' ? 'explorer' : 'scientist'))}
        />
      )}
    </div>
  );
}
