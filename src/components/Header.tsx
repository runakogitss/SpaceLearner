import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';
import { useStudyStore } from '../store/useStudyStore';

export const Header: React.FC = () => {
  const { userProfile, isSandboxMode, setActiveTab } = useStudyStore();
  const [greeting, setGreeting] = useState<string>('GOOD EVENING');

  useEffect(() => {
    const updateTimeGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 12) {
        setGreeting('GOOD MORNING');
      } else if (currentHour >= 12 && currentHour < 17) {
        setGreeting('GOOD AFTERNOON');
      } else {
        setGreeting('GOOD EVENING');
      }
    };

    updateTimeGreeting();
    const interval = setInterval(updateTimeGreeting, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const displayName = isSandboxMode 
    ? 'TRAVELLER' 
    : (userProfile.username || userProfile.full_name || 'TRAVELLER').toUpperCase();

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-8 bg-cosmic-bg/60 backdrop-blur-md border-b border-cosmic-border sticky top-0 z-30">
      {/* Greeting Title */}
      <div>
        <h2 className="text-2xl font-bold font-outfit text-white tracking-wide flex items-center gap-2">
          {greeting}, {displayName}! 👋
        </h2>
        <p className="text-xs text-cosmic-textMuted mt-0.5">
          You&apos;ve got goals. Let&apos;s make today count.
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative w-64 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-cosmic-card/80 border border-cosmic-border rounded-full pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
          />
        </div>

        {/* Sandbox Trial Indicator */}
        {isSandboxMode && (
          <span className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-[10px] font-semibold text-purple-300">
            <Sparkles className="w-3 h-3 text-purple-400" />
            TRIAL SANDBOX MODE
          </span>
        )}

        {/* Notification Bell */}
        <button className="relative p-2.5 rounded-full bg-cosmic-card border border-cosmic-border text-slate-300 hover:text-white hover:border-purple-500/40 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        </button>

        {/* Profile Pill Button */}
        <button 
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-cosmic-card border border-cosmic-border hover:border-purple-500/40 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-purple-300/40 flex items-center justify-center text-sm shadow-glow-purple">
            🧑‍🚀
          </div>
          <div className="text-left pr-1 hidden sm:block">
            <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
              {userProfile.username || 'Reynard'}
            </div>
            <div className="text-[10px] text-cosmic-textMuted">
              Focus &amp; Conquer
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
