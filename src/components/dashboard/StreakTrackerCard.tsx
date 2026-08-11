import React from 'react';
import { Flame, Check } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';

export const StreakTrackerCard: React.FC = () => {
  const { stats, recentSessions } = useStudyStore();

  // Get current Monday-Sunday dates of the week
  const today = new Date();
  const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0 = Mon, 6 = Sun
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDayOfWeek);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDays = dayLabels.map((day, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];

    // Check if user completed a session on this date
    const hasSession = recentSessions.some(s => {
      if (!s.is_completed) return false;
      if (s.completed_at && s.completed_at.includes('T')) {
        return s.completed_at.split('T')[0] === dateStr;
      }
      return dateStr === today.toISOString().split('T')[0];
    });

    return {
      day,
      date: dateStr,
      active: hasSession
    };
  });

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
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm ring-2 ring-amber-400/40'
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
