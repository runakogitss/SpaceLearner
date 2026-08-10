import React from 'react';
import { Clock, Target, Gauge, Flame } from 'lucide-react';
import { useStudyStore } from '../store/useStudyStore';

export const QuickStatsBar: React.FC = () => {
  const { stats } = useStudyStore();

  const hours = Math.floor(stats.totalFocusTimeMinutes / 60);
  const mins = stats.totalFocusTimeMinutes % 60;
  const formattedTime = `${hours}h ${mins}m`;

  const statCards = [
    {
      title: 'TOTAL FOCUS TIME',
      value: formattedTime,
      subtext: 'This Week',
      icon: Clock,
      iconBg: 'bg-indigo-950/80 text-indigo-400 border-indigo-500/30'
    },
    {
      title: 'COMPLETED SESSIONS',
      value: stats.completedSessionsCount.toString(),
      subtext: 'This Week',
      icon: Target,
      iconBg: 'bg-purple-950/80 text-purple-400 border-purple-500/30'
    },
    {
      title: 'FOCUS SCORE',
      value: `${stats.focusScore}%`,
      subtext: stats.focusScore >= 80 ? 'Great Focus!' : 'Needs Push',
      icon: Gauge,
      iconBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'CURRENT STREAK',
      value: `${stats.streakDays} Days`,
      subtext: 'Keep it up!',
      icon: Flame,
      iconBg: 'bg-rose-950/80 text-rose-400 border-rose-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx}
            className="bg-cosmic-card/80 border border-cosmic-border hover:border-cosmic-borderHover rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-glow-card"
          >
            <div className={`p-3 rounded-2xl border ${card.iconBg} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-cosmic-textMuted tracking-wider uppercase block mb-0.5">
                {card.title}
              </span>
              <div className="text-xl font-bold font-outfit text-white">
                {card.value}
              </div>
              <span className="text-[11px] text-purple-400/90 font-medium">
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
