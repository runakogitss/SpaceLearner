import React from 'react';
import { Flame, Check } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';

export const StreakTrackerCard: React.FC = () => {
  const { stats } = useStudyStore();
  const weekDays = [
    { day: 'M', active: true },
    { day: 'T', active: true },
    { day: 'W', active: true },
    { day: 'T', active: true },
    { day: 'F', active: true },
    { day: 'S', active: true },
    { day: 'S', active: false },
  ];

  return (
    <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-5 shadow-glow-card mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-rose-500 fill-rose-500/20" />
        <h3 className="text-sm font-bold font-outfit text-white tracking-wide uppercase">
          STREAK TRACKER
        </h3>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-extrabold font-outfit text-white">
          {stats.streakDays}
        </span>
        <span className="text-xs text-cosmic-textMuted font-medium">
          Days Current Streak
        </span>
      </div>

      {/* Week Checkmarks */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {weekDays.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold text-cosmic-textMuted">
              {item.day}
            </span>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                item.active
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-600'
              }`}
            >
              {item.active ? <Check className="w-4 h-4 stroke-[3]" /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
