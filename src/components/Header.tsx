import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, LogIn } from 'lucide-react';
import { useStudyStore } from '../store/useStudyStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSearchStore } from '../store/useSearchStore';
import { AuthModal } from './auth/AuthModal';
import { NotificationDropdown } from './header/NotificationDropdown';
import { BusinessCardPopover } from './header/BusinessCardPopover';
import { CommandPaletteModal } from './header/CommandPaletteModal';

export const Header: React.FC = () => {
  const { userProfile, isSandboxMode } = useStudyStore();
  const { unreadCount } = useNotificationStore();
  const { isOpen: isSearchOpen, openSearch, toggleSearch } = useSearchStore();

  const [greeting, setGreeting] = useState<string>('GOOD EVENING');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Ctrl + K or Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch]);

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
    const interval = setInterval(updateTimeGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fullName = userProfile.full_name || 'Reynard Runako';
  const usernameHandle = `@${(userProfile.username || 'reynard').toLowerCase()}`;
  const greetingName = (userProfile.full_name?.split(' ')[0] || userProfile.username || 'REYNARD').toUpperCase();

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-8 bg-cosmic-bg/60 backdrop-blur-md border-b border-cosmic-border sticky top-0 z-30">
        {/* Greeting Title */}
        <div>
          <h2 className="text-2xl font-bold font-outfit text-white tracking-wide flex items-center gap-2">
            {greeting}, {greetingName}! 👋
          </h2>
          <p className="text-xs text-cosmic-textMuted mt-0.5">
            You&apos;ve got goals. Let&apos;s make today count.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-4">
          {/* Interactive Glowing Search Bar Trigger */}
          <div className="relative w-64 md:w-80">
            <button
              onClick={openSearch}
              className={`w-full flex items-center justify-between bg-cosmic-card/80 border rounded-full pl-10 pr-3 py-2 text-xs text-slate-300 placeholder-slate-500 transition-all cursor-pointer group ${
                isSearchOpen 
                  ? 'search-bar-active-glow ring-2 ring-purple-500/40 bg-purple-950/40 border-purple-400' 
                  : 'search-bar-idle-glow search-bar-hover-glow'
              }`}
              title="Open Command Palette (Ctrl + K)"
            >
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                isSearchOpen ? 'text-purple-300 animate-pulse' : 'text-purple-400/80 group-hover:text-purple-300'
              }`} />
              
              <span className="text-slate-400 group-hover:text-slate-200 transition-colors truncate pr-2">
                Search anything or type &apos;/&apos;...
              </span>

              <div className="flex items-center gap-1">
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-purple-300 bg-purple-950/70 border border-purple-500/40 rounded-full shadow-sm group-hover:border-purple-400 transition-colors">
                  Ctrl K
                </kbd>
              </div>
            </button>
          </div>

          {/* Log In Button (Prominent) */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-purple transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isSandboxMode ? 'LOG IN / SIGN UP' : 'ACCOUNT'}</span>
          </button>

          {/* Notification Bell Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileOpen(false);
              }}
              className={`relative p-2.5 rounded-full border transition-all cursor-pointer ${
                isNotifOpen 
                  ? 'bg-purple-900/50 border-purple-400 text-white' 
                  : 'bg-cosmic-card border-cosmic-border text-slate-300 hover:text-white hover:border-purple-500/40'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center border border-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <NotificationDropdown 
              isOpen={isNotifOpen} 
              onClose={() => setIsNotifOpen(false)} 
            />
          </div>

          {/* Header Profile Card Button (FULL NAME FIRST) */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotifOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all cursor-pointer group shadow-glow-card ${
                isProfileOpen 
                  ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-500/30' 
                  : 'bg-cosmic-card border-cosmic-border hover:border-purple-500/50'
              }`}
              title="View Executive Business Card"
            >
              <div className="w-8 h-8 overflow-hidden rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-purple-300/40 flex items-center justify-center text-sm shadow-glow-purple">
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  '🧑‍🚀'
                )}
              </div>
              
              <div className="text-left pr-1 hidden sm:block">
                {/* FULL NAME FIRST */}
                <div className="text-xs font-extrabold text-white group-hover:text-purple-300 transition-colors leading-tight">
                  {fullName}
                </div>
                {/* DISPLAY NAME / USERNAME SECOND */}
                <div className="text-[10px] text-purple-300/80 font-medium">
                  {usernameHandle}
                </div>
              </div>
            </button>

            {/* Executive Business Card Popover */}
            <BusinessCardPopover 
              isOpen={isProfileOpen} 
              onClose={() => setIsProfileOpen(false)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal />

      {/* Auth Modal Overlay */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

