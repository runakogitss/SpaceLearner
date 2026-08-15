import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Clock, 
  BookOpen, 
  FileText, 
  BarChart2, 
  Settings as SettingsIcon, 
  Zap, 
  CornerDownLeft, 
  History,
  Sparkles,
  Play,
  PlusCircle,
  Compass
} from 'lucide-react';
import { useSearchStore } from '../../store/useSearchStore';
import { useStudyStore } from '../../store/useStudyStore';
import { useNotificationStore } from '../../store/useNotificationStore';

interface SearchResultItem {
  id: string;
  type: 'action' | 'note' | 'timer' | 'navigation' | 'slash';
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC = () => {
  const { isOpen, closeSearch, recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useSearchStore();
  const { 
    setActiveTab, 
    allPlannerNotes, 
    systemTemplates = [], 
    userCustomTemplates = [],
    adjustTimerDurations, 
    toggleTimer, 
    createPlannerNote 
  } = useStudyStore();
  const { addNotification } = useNotificationStore();

  const studyTemplates = [...systemTemplates, ...userCustomTemplates];

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown listeners for Esc, Arrow keys, Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch]);

  if (!isOpen) return null;

  // 1. Build search items based on current query
  const trimmedQuery = query.trim().toLowerCase();
  const isSlashCommand = trimmedQuery.startsWith('/');

  const searchResults: SearchResultItem[] = [];

  // --- A. Navigation & Tab Actions ---
  const navItems = [
    { name: 'Dashboard Overview', tab: 'dashboard' as const, icon: <Compass className="w-4 h-4 text-purple-400" /> },
    { name: 'Pomodoro Timer Presets', tab: 'timer' as const, icon: <Clock className="w-4 h-4 text-cyan-400" /> },
    { name: 'Study Planner & Reflections', tab: 'planner' as const, icon: <FileText className="w-4 h-4 text-indigo-400" /> },
    { name: 'Focus Tracker & Statistics', tab: 'statistics' as const, icon: <BarChart2 className="w-4 h-4 text-emerald-400" /> },
    { name: 'Account & Settings', tab: 'settings' as const, icon: <SettingsIcon className="w-4 h-4 text-pink-400" /> }
  ];

  navItems.forEach((nav) => {
    if (!trimmedQuery || nav.name.toLowerCase().includes(trimmedQuery) || nav.tab.includes(trimmedQuery)) {
      searchResults.push({
        id: `nav-${nav.tab}`,
        type: 'navigation',
        category: '🧭 Quick Navigation',
        title: nav.name,
        subtitle: `Jump to ${nav.tab} page`,
        icon: nav.icon,
        action: () => {
          addRecentSearch(nav.name);
          setActiveTab(nav.tab);
          closeSearch();
        }
      });
    }
  });

  // --- B. Slash Commands ---
  if (isSlashCommand || !trimmedQuery) {
    const slashActions = [
      {
        cmd: '/timer 25',
        desc: 'Start a 25-minute Pomodoro focus session',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        act: () => {
          adjustTimerDurations(25, 5);
          setActiveTab('timer');
          toggleTimer();
          addNotification({
            title: '⏱️ Timer Launched',
            message: 'Started a 25-minute focus session via Quick Search command.',
            type: 'system',
            category: 'boost'
          });
        }
      },
      {
        cmd: '/timer 50',
        desc: 'Start a 50-minute Deep Work focus block',
        icon: <Zap className="w-4 h-4 text-purple-400" />,
        act: () => {
          adjustTimerDurations(50, 10);
          setActiveTab('timer');
          toggleTimer();
          addNotification({
            title: '🚀 Deep Work Started',
            message: 'Launched a 50-minute study session via Quick Search.',
            type: 'system',
            category: 'boost'
          });
        }
      },
      {
        cmd: '/note Spanish',
        desc: 'Quick create a new study planner note for Spanish',
        icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
        act: () => {
          createPlannerNote('Spanish Daily Practice', ['Speaking', 'Listening'], 30, 'Daily vocabulary and oral exercises');
          setActiveTab('planner');
          addNotification({
            title: '📝 Planner Note Created',
            message: 'Created Spanish daily study plan via Command Palette.',
            type: 'goal',
            category: 'achievement'
          });
        }
      }
    ];

    slashActions.forEach((sa, idx) => {
      if (!trimmedQuery || sa.cmd.toLowerCase().includes(trimmedQuery) || 'slash commands'.includes(trimmedQuery)) {
        searchResults.push({
          id: `slash-${idx}`,
          type: 'slash',
          category: '⚡ Direct Slash Commands',
          title: sa.cmd,
          subtitle: sa.desc,
          icon: sa.icon,
          action: () => {
            addRecentSearch(sa.cmd);
            sa.act();
            closeSearch();
          }
        });
      }
    });
  }

  // --- C. Planner Notes & Reflections Search ---
  allPlannerNotes.forEach((note) => {
    const matchesTopic = note.topic.toLowerCase().includes(trimmedQuery);
    const matchesContent = note.content.toLowerCase().includes(trimmedQuery);
    const matchesReflection = note.reflection_notes?.toLowerCase().includes(trimmedQuery);

    if (trimmedQuery && (matchesTopic || matchesContent || matchesReflection)) {
      searchResults.push({
        id: `note-${note.id}`,
        type: 'note',
        category: '📝 Planner Notes & Reflections',
        title: note.topic,
        subtitle: note.reflection_notes ? `Reflection: "${note.reflection_notes.slice(0, 50)}..."` : note.content,
        icon: <BookOpen className="w-4 h-4 text-purple-400" />,
        action: () => {
          addRecentSearch(note.topic);
          setActiveTab('planner');
          closeSearch();
        }
      });
    }
  });

  // --- D. Timer Presets ---
  studyTemplates.forEach((template) => {
    if (trimmedQuery && (template.name.toLowerCase().includes(trimmedQuery) || 'timer'.includes(trimmedQuery))) {
      searchResults.push({
        id: `tpl-${template.id}`,
        type: 'timer',
        category: '⏱️ Study Timer Presets',
        title: template.name,
        subtitle: `${template.work_duration_minutes} mins work · ${template.break_duration_minutes} mins break`,
        icon: <Play className="w-4 h-4 text-cyan-400" />,
        action: () => {
          addRecentSearch(template.name);
          adjustTimerDurations(template.work_duration_minutes, template.break_duration_minutes);
          setActiveTab('timer');
          closeSearch();
        }
      });
    }
  });

  // Group search results by category
  const groupedResults: { [category: string]: SearchResultItem[] } = {};
  searchResults.forEach((item) => {
    if (!groupedResults[item.category]) {
      groupedResults[item.category] = [];
    }
    groupedResults[item.category].push(item);
  });

  const flatItemList = searchResults;

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (flatItemList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItemList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItemList.length) % flatItemList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItemList[selectedIndex]) {
        flatItemList[selectedIndex].action();
      }
    }
  };

  const handleExecuteRecent = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={closeSearch}
    >
      <div 
        className="relative w-full max-w-2xl bg-cosmic-card/95 border border-purple-500/50 rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.3)] overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownList}
      >
        {/* Top Input Bar with Cosmic Pulse Glow */}
        <div className="relative flex items-center border-b border-cosmic-border px-4 py-3.5 bg-slate-900/60">
          <Search className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search notes, topics, presets or type '/' for slash commands..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mr-2"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 pl-2 border-l border-cosmic-border">
            <kbd className="px-2 py-0.5 text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/40 rounded shadow-sm">
              ESC
            </kbd>
          </div>
        </div>

        {/* Search Content Body */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Empty Query State: Show Recent Searches & Suggestion Chips */}
          {!query && (
            <div className="space-y-4 p-2">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-purple-400" />
                      Recent Searches
                    </span>
                    <button 
                      onClick={clearRecentSearches}
                      className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={`recent-${idx}`}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-cosmic-border hover:border-purple-500/50 hover:bg-purple-950/40 text-xs text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                        onClick={() => handleExecuteRecent(term)}
                      >
                        <span>{term}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions Suggestions */}
              <div>
                <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick Action Chips
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      addRecentSearch('Start 25m Timer');
                      adjustTimerDurations(25, 5);
                      setActiveTab('timer');
                      toggleTimer();
                      closeSearch();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-cosmic-border hover:border-purple-500/40 hover:bg-purple-950/30 text-left text-xs text-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Start 25m Pomodoro</div>
                      <div className="text-[10px] text-slate-400">Launch standard focus timer instantly</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      addRecentSearch('Spanish Practice Note');
                      createPlannerNote('Spanish Vocabulary & Oral', ['Speaking', 'Grammar'], 45, 'Practice Spanish daily conversation skills');
                      setActiveTab('planner');
                      closeSearch();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-cosmic-border hover:border-purple-500/40 hover:bg-purple-950/30 text-left text-xs text-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-500/30 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Quick Spanish Note</div>
                      <div className="text-[10px] text-slate-400">Pre-fill today&apos;s Spanish study plan</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categorized Search Results */}
          {Object.keys(groupedResults).length > 0 ? (
            Object.entries(groupedResults).map(([catTitle, items]) => (
              <div key={catTitle} className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-bold text-purple-300/80 tracking-wider uppercase">
                  {catTitle}
                </div>

                {items.map((item) => {
                  const globalIdx = flatItemList.findIndex((i) => i.id === item.id);
                  const isSelected = globalIdx === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border-purple-400 text-white shadow-glow-purple scale-[1.005]'
                          : 'bg-slate-900/40 border-transparent text-slate-300 hover:bg-slate-900 hover:border-purple-500/30 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg border ${
                          isSelected 
                            ? 'bg-purple-600 text-white border-purple-300/50 shadow-glow-purple' 
                            : 'bg-slate-800 text-slate-400 border-cosmic-border'
                        }`}>
                          {item.icon}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-2 truncate">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <CornerDownLeft className={`w-4 h-4 transition-opacity flex-shrink-0 ml-2 ${
                        isSelected ? 'opacity-100 text-purple-300' : 'opacity-0'
                      }`} />
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            query && (
              <div className="p-8 text-center text-slate-400">
                <div className="text-3xl mb-2">🔭</div>
                <div className="text-sm font-semibold text-slate-200">No cosmic results found</div>
                <div className="text-xs text-slate-500 mt-1">
                  Try searching for &quot;Spanish&quot;, &quot;Pomodoro&quot;, or type &quot;/&quot; for slash commands.
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-cosmic-border text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-300">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-300">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-300">ESC</kbd> Close
            </span>
          </div>

          <div className="text-purple-400/80 font-mono text-[10px] hidden sm:block">
            SPACE LEARNER SPOTLIGHT
          </div>
        </div>
      </div>
    </div>
  );
};
