import React from 'react';
import { 
  LayoutDashboard, 
  Timer, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Sparkles,
  Rocket
} from 'lucide-react';
import { useStudyStore } from '../store/useStudyStore';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, stats } = useStudyStore();

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'timer', label: 'POMODORO TIMER', icon: Timer },
    { id: 'planner', label: "PLANNER'S NOTE", icon: BookOpen },
    { id: 'statistics', label: 'STATISTICS', icon: BarChart3 },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ] as const;

  const expToNext = stats.expToNextLevel || 200;
  const expPercent = Math.min(100, Math.max(0, (stats.userExp / expToNext) * 100));

  return (
    <aside className="w-64 bg-cosmic-card/90 backdrop-blur-xl border-r border-cosmic-border flex flex-col justify-between p-5 h-screen sticky top-0 shrink-0 overflow-y-auto">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-glow-purple">
            <Rocket className="w-6 h-6 text-white transform -rotate-12" />
          </div>
          <div>
            <h1 className="font-outfit text-lg font-bold tracking-wider text-white flex items-center gap-1.5">
              SPACE
              <span className="text-purple-400 font-extrabold">LEARNER</span>
            </h1>
            <p className="text-[10px] text-cosmic-textMuted tracking-widest uppercase font-semibold">
              Cosmic Study Suite
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-xs tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-glow-purple border border-purple-400/30'
                    : 'text-cosmic-textMuted hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Gamification Mascot Card */}
      <div className="bg-gradient-to-b from-indigo-950/40 to-purple-950/40 border border-purple-500/20 rounded-2xl p-4 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-glow-gradient opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Mascot Avatar Illustration */}
        <div className="relative z-10 mx-auto w-20 h-20 mb-3 rounded-full bg-indigo-900/50 border border-purple-400/40 flex items-center justify-center shadow-glow-purple">
          <div className="relative">
            <span className="text-3xl">🧑‍🚀</span>
            <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="text-sm font-semibold text-white mb-0.5">KEEP GOING!</h3>
          <p className="text-[11px] text-cosmic-textMuted mb-3">Every small step counts.</p>

          {/* Level Progress */}
          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-white/5">
            <div className="flex justify-between items-center text-[10px] font-semibold mb-1.5">
              <span className="text-purple-300">LEVEL {stats.userLevel}</span>
              <span className="text-slate-400">{stats.userExp.toLocaleString()} / {expToNext.toLocaleString()} EXP</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
