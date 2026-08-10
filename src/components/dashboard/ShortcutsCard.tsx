import React from 'react';
import { Timer, BookOpen, BarChart3, Settings } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';

export const ShortcutsCard: React.FC = () => {
  const { setActiveTab } = useStudyStore();

  const shortcuts = [
    {
      id: 'timer',
      label: 'Pomodoro Timer',
      icon: Timer,
      gradient: 'from-purple-900/60 to-indigo-900/60 border-purple-500/30 text-purple-300'
    },
    {
      id: 'planner',
      label: "Planner's Note",
      icon: BookOpen,
      gradient: 'from-blue-900/60 to-cyan-900/60 border-cyan-500/30 text-cyan-300'
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: BarChart3,
      gradient: 'from-emerald-900/60 to-teal-900/60 border-emerald-500/30 text-emerald-300'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      gradient: 'from-pink-900/60 to-purple-900/60 border-pink-500/30 text-pink-300'
    }
  ] as const;

  return (
    <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-5 shadow-glow-card mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold font-outfit text-white tracking-wide uppercase">
          SHORTCUTS
        </h3>
        <button className="text-[11px] text-cosmic-textMuted hover:text-white transition-colors">
          Edit
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.id}
              onClick={() => setActiveTab(shortcut.id)}
              className={`p-3.5 rounded-2xl bg-gradient-to-br ${shortcut.gradient} border hover:border-purple-400/60 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] text-left`}
            >
              <div className="p-2 rounded-xl bg-slate-950/40 border border-white/10">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">
                {shortcut.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
