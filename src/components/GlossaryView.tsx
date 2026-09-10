import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  Filter, 
  ExternalLink, 
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react';
import { ViewMode } from '../types';
import { OCEAN_GLOSSARY } from '../data/oceanData';

interface GlossaryViewProps {
  viewMode: ViewMode;
}

export const GlossaryView: React.FC<GlossaryViewProps> = ({ viewMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const filteredTerms = OCEAN_GLOSSARY.filter((term) => {
    if (selectedCategory !== 'all' && term.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        term.term.toLowerCase().includes(q) ||
        term.definition.toLowerCase().includes(q) ||
        term.simpleDefinition.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePronounce = (term: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(term);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#061220] p-4 sm:p-6 lg:p-8 select-none text-[#E6F4FF]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-6 h-6 text-[#00C2FF]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white glow-cyan">
              OCEANOGRAPHIC GLOSSARY & EDUCATION
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#00C2FF] font-medium mt-1">
            {viewMode === 'scientist'
              ? 'Standard Oceanographic Lexicon · UNESCO-IOC / WMO Terminology Definitions'
              : 'Learn ocean science terms with everyday analogies and audio pronunciations'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search thermocline, argo, PSU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B1D2E] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00C2FF] transition-colors"
          />
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-white/50 font-semibold mr-1 flex items-center">
          <Filter className="w-3.5 h-3.5 mr-1 text-[#00C2FF]" /> Category:
        </span>
        {[
          { id: 'all', label: 'All Terms' },
          { id: 'instruments', label: 'Robotics & Instruments' },
          { id: 'physics', label: 'Physical Oceanography' },
          { id: 'biology', label: 'Marine Biology & Ecosystems' },
          { id: 'disasters', label: 'Hazards & Extreme Events' },
          { id: 'modeling', label: 'Numerical Modeling' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#00C2FF] text-[#061220] font-bold shadow-[0_0_10px_rgba(0,194,255,0.4)]'
                : 'bg-[#0B1D2E] text-white/70 hover:text-white border border-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Glossary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTerms.map((item) => {
          const isBookmarked = bookmarkedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-[#00C2FF]/40 shadow-xl transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Top Row: Term, Pronounce & Bookmark */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#00C2FF] uppercase font-bold tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-wide mt-0.5">
                      {item.term}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePronounce(item.term)}
                      className="p-2 rounded-lg bg-[#061220] hover:bg-white/10 text-[#00C2FF] transition-colors"
                      title="Hear audio pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleBookmark(item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isBookmarked ? 'text-[#FFB020] bg-[#FFB020]/15' : 'text-white/40 hover:text-white bg-[#061220]'
                      }`}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark term'}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Definition (Explorer mode shows simple analogy, Scientist mode shows formal definition) */}
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-[#061220]/80 rounded-xl border border-white/5">
                    <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-[#FFB020] mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Everyday Analogy</span>
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed font-medium">
                      "{item.simpleDefinition}"
                    </p>
                  </div>

                  <div className="text-xs text-white/70 leading-relaxed pt-1">
                    <strong className="text-white/90">Formal Definition: </strong>
                    {item.definition}
                  </div>
                </div>
              </div>

              {/* Related Terms cross-links */}
              {item.relatedTerms && item.relatedTerms.length > 0 && (
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
                  <span>Related concepts:</span>
                  <div className="flex space-x-1">
                    {item.relatedTerms.map((rt) => (
                      <span
                        key={rt}
                        onClick={() => setSearchQuery(rt)}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-[#00C2FF]/20 text-[#00C2FF] cursor-pointer"
                      >
                        {rt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
