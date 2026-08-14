import React from 'react';
import { Shield, Sparkles, Flame, Clock, Trophy, Settings, User, LogOut, ExternalLink, Zap } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';

interface BusinessCardPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal?: () => void;
}

export const BusinessCardPopover: React.FC<BusinessCardPopoverProps> = ({ 
  isOpen, 
  onClose,
  onOpenAuthModal 
}) => {
  const { userProfile, isSandboxMode, stats, setActiveTab } = useStudyStore();

  if (!isOpen) return null;

  const fullName = userProfile.full_name || 'Reynard Runako';
  const username = userProfile.username || 'reynard';
  const level = stats.userLevel || userProfile.level || 1;
  const currentExp = stats.userExp || userProfile.exp || 0;
  const expToNextLevel = stats.expToNextLevel || 200;
  const expPercentage = Math.min(100, Math.round((currentExp / expToNextLevel) * 100));

  const handleAction = (tab?: 'settings' | 'statistics') => {
    onClose();
    if (tab) setActiveTab(tab);
  };

  return (
    <div 
      className="absolute right-0 top-12 w-80 md:w-96 bg-gradient-to-br from-slate-900 via-indigo-950/95 to-purple-950 border border-purple-400/40 rounded-3xl p-6 shadow-2xl shadow-purple-950/80 backdrop-blur-2xl z-50 overflow-hidden animate-scale-up"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Top Banner / Identity Badge */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          {/* Avatar with Status Indicator */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-900/50">
              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-2xl overflow-hidden">
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  '🧑‍🚀'
                )}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          <div>
            {/* FULL NAME FIRST */}
            <h3 className="text-base font-extrabold font-outfit text-white tracking-tight leading-tight">
              {fullName}
            </h3>
            {/* USERNAME / HANDLE SECOND */}
            <p className="text-xs font-semibold text-purple-300">
              @{username.toLowerCase()}
            </p>
            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-500/30 text-[10px] font-bold text-yellow-300">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>Cosmic Focus Specialist</span>
            </div>
          </div>
        </div>
      </div>

      {/* Level & EXP Section */}
      <div className="bg-slate-950/60 border border-purple-500/20 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            Level {level}
          </span>
          <span className="text-[11px] text-purple-300 font-semibold">
            {currentExp} / {expToNextLevel} EXP
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${expPercentage}%` }}
          />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
        <div className="p-3 rounded-2xl bg-indigo-950/50 border border-purple-500/20">
          <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <span className="block text-xs font-extrabold text-white">
            {stats.todayFocusMinutes || 0}m
          </span>
          <span className="text-[10px] text-slate-400">Today</span>
        </div>

        <div className="p-3 rounded-2xl bg-indigo-950/50 border border-purple-500/20">
          <Flame className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <span className="block text-xs font-extrabold text-white">
            {stats.streakDays || 0} Days
          </span>
          <span className="text-[10px] text-slate-400">Streak</span>
        </div>

        <div className="p-3 rounded-2xl bg-indigo-950/50 border border-purple-500/20">
          <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <span className="block text-xs font-extrabold text-white">
            {stats.completedSessionsCount || 0}
          </span>
          <span className="text-[10px] text-slate-400">Sessions</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => handleAction('settings')}
          className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 transition-all cursor-pointer"
        >
          <User className="w-3.5 h-3.5" />
          <span>Edit Profile &amp; Goals</span>
        </button>

        <button
          onClick={() => {
            onClose();
            if (onOpenAuthModal) onOpenAuthModal();
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{isSandboxMode ? 'Sign In / Account Setup' : 'Account Settings'}</span>
        </button>
      </div>
    </div>
  );
};
