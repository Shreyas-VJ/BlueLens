import React, { useState } from 'react';
import { 
  Compass, 
  Play, 
  Pause, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft, 
  Globe, 
  Box, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { ViewMode, GuidedStory } from '../types';
import { GUIDED_STORIES } from '../data/oceanData';

interface GuidedStoriesViewProps {
  viewMode: ViewMode;
  onNavigateToGlobe: () => void;
  onNavigateToDepthSlice: () => void;
}

export const GuidedStoriesView: React.FC<GuidedStoriesViewProps> = ({
  viewMode,
  onNavigateToGlobe,
  onNavigateToDepthSlice,
}) => {
  const [selectedStory, setSelectedStory] = useState<GuidedStory>(GUIDED_STORIES[0]);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const currentChapter = selectedStory.chapters[activeChapterIndex];

  const handleNextChapter = () => {
    if (activeChapterIndex < selectedStory.chapters.length - 1) {
      setActiveChapterIndex((prev) => prev + 1);
    }
  };

  const handlePrevChapter = () => {
    if (activeChapterIndex > 0) {
      setActiveChapterIndex((prev) => prev - 1);
    }
  };

  const toggleNarration = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const textToSpeak = `${currentChapter.title}. ${currentChapter.description}. Key Fact: ${currentChapter.keyFact}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#061220] p-4 sm:p-6 lg:p-8 select-none text-[#E6F4FF]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <Compass className="w-6 h-6 text-[#00C2FF]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white glow-cyan">
              GUIDED OCEAN STORIES & PHENOMENA
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#00C2FF] font-medium mt-1">
            Curated interactive journeys explaining the dynamic Indian Ocean basin
          </p>
        </div>

        {/* Quick Audio Narration Button */}
        <button
          onClick={toggleNarration}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
            isPlayingAudio
              ? 'bg-[#00C2FF] text-[#061220] border-[#00C2FF] shadow-[0_0_15px_rgba(0,194,255,0.5)]'
              : 'bg-[#0B1D2E] text-white border-white/10 hover:border-[#00C2FF]/40'
          }`}
        >
          <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
          <span>{isPlayingAudio ? 'Stop Audio Narration' : 'Play Voice Narration'}</span>
        </button>
      </div>

      {/* Story Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {GUIDED_STORIES.map((story) => {
          const isSelected = selectedStory.id === story.id;
          return (
            <div
              key={story.id}
              onClick={() => {
                setSelectedStory(story);
                setActiveChapterIndex(0);
                if (isPlayingAudio) {
                  window.speechSynthesis.cancel();
                  setIsPlayingAudio(false);
                }
              }}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-[#0B1D2E] border-[#00C2FF] shadow-[0_0_20px_rgba(0,194,255,0.25)] scale-[1.01]'
                  : 'bg-[#0B1D2E]/60 border-white/5 hover:border-white/20 hover:bg-[#0B1D2E]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#00C2FF] mb-1 font-bold">
                <span>{story.duration}</span>
                <span>{story.chapters.length} Chapters</span>
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base tracking-wide">
                {story.title}
              </h3>
              <p className="text-xs text-white/60 mt-1 line-clamp-2">
                {story.tagline}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Story Interactive Stage */}
      <div className="glass-panel p-6 rounded-2xl border border-[#00C2FF]/40 shadow-2xl space-y-6">
        {/* Story Title & Progress Tracker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
          <div>
            <span className="text-xs font-mono font-bold text-[#00C2FF] uppercase tracking-wider">
              {selectedStory.title}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              {currentChapter.title}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-white/50">
              Chapter {activeChapterIndex + 1} of {selectedStory.chapters.length}
            </span>
            <div className="flex space-x-1">
              {selectedStory.chapters.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setActiveChapterIndex(i)}
                  className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                    i === activeChapterIndex
                      ? 'bg-[#00C2FF] scale-125 shadow-[0_0_8px_rgba(0,194,255,0.8)]'
                      : i < activeChapterIndex
                      ? 'bg-[#00C2FF]/40'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Chapter Narrative Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 rounded-2xl bg-[#061220]/80 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">
                Oceanographic Mechanism & Narrative
              </h4>
              <p className="text-sm text-[#E6F4FF]/90 leading-relaxed font-medium">
                {currentChapter.description}
              </p>
            </div>

            {/* Key Fact Highlight Card */}
            <div className="p-4 rounded-xl bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-[#00C2FF] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C2FF] block">
                  Key Scientific Takeaway
                </span>
                <p className="text-xs text-white/90 mt-0.5 leading-relaxed font-semibold">
                  {currentChapter.keyFact}
                </p>
              </div>
            </div>
          </div>

          {/* Visual Context Box & Direct Exploration CTAs */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-xl bg-[#0B1D2E] border border-white/10 space-y-2">
              <span className="text-[10px] font-mono text-white/50 uppercase font-semibold">
                SIMULATED VISUAL CONTEXT
              </span>
              <p className="text-xs text-white/80 font-mono leading-relaxed">
                {currentChapter.visualContext}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] uppercase font-bold text-white/50 block">
                Interact with this phenomenon
              </span>
              <button
                onClick={onNavigateToGlobe}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#061220] hover:bg-[#00C2FF]/20 border border-[#00C2FF]/30 text-xs text-white font-semibold transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-[#00C2FF]" />
                  <span>View on 3D Earth Globe</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#00C2FF] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onNavigateToDepthSlice}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#061220] hover:bg-[#FE5F4E]/20 border border-[#FE5F4E]/30 text-xs text-white font-semibold transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <Box className="w-4 h-4 text-[#FE5F4E]" />
                  <span>Inspect in 3D Depth Box</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#FE5F4E] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={handlePrevChapter}
            disabled={activeChapterIndex === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeChapterIndex === 0
                ? 'opacity-30 cursor-not-allowed text-white/40'
                : 'bg-white/5 hover:bg-white/10 text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Chapter</span>
          </button>

          <button
            onClick={handleNextChapter}
            disabled={activeChapterIndex === selectedStory.chapters.length - 1}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeChapterIndex === selectedStory.chapters.length - 1
                ? 'opacity-30 cursor-not-allowed text-white/40'
                : 'bg-[#00C2FF] text-[#061220] shadow-[0_0_15px_rgba(0,194,255,0.4)] hover:bg-[#00C2FF]/90'
            }`}
          >
            <span>Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
