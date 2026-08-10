import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useStudyStore } from '../../store/useStudyStore';

const COLOR_PALETTE = ['#8B5CF6', '#06B6D4', '#EC4899', '#10B981', '#F59E0B'];

export const FocusOverview: React.FC = () => {
  const { stats, allPlannerNotes, recentSessions } = useStudyStore();

  // Dynamically calculate Subject Breakdown from active notes and recent sessions
  const subjectTotals: Record<string, number> = {};
  allPlannerNotes.forEach(n => {
    subjectTotals[n.topic] = (subjectTotals[n.topic] || 0) + n.planned_duration_minutes;
  });

  const grandTotalMins = Object.values(subjectTotals).reduce((a, b) => a + b, 0) || 1;

  const subjectData = Object.entries(subjectTotals).map(([name, mins], idx) => ({
    name,
    value: Math.round((mins / grandTotalMins) * 100),
    color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
  }));

  // Heatmap hourly dataset (12 AM, 6 AM, 12 PM, 6 PM, 12 AM) vs 7 Days (Mon-Sun)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeLabels = ['12 AM', '6 AM', '12 PM', '6 PM', '12 AM'];

  const heatmapMatrix = [
    [1, 0, 1, 0, 2, 1, 0], // 12 AM
    [2, 3, 2, 4, 3, 2, 1], // 6 AM
    [4, 4, 3, 4, 4, 3, 2], // 12 PM
    [3, 4, 4, 3, 4, 4, 3], // 6 PM
    [1, 2, 1, 2, 3, 2, 1], // 12 AM
  ];

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-slate-900/60 border-slate-800';
      case 1: return 'bg-indigo-950/80 border-indigo-800/40';
      case 2: return 'bg-indigo-700/80 border-indigo-500/50';
      case 3: return 'bg-purple-600/90 border-purple-400/60';
      case 4: return 'bg-pink-500 border-pink-300 shadow-glow-purple';
      default: return 'bg-slate-900/60';
    }
  };

  return (
    <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-6 shadow-glow-card mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold font-outfit text-white tracking-wide uppercase">
            FOCUS OVERVIEW
          </h3>
          <p className="text-[11px] text-cosmic-textMuted">
            Comprehensive analytics &amp; study distribution
          </p>
        </div>
        <span className="text-xs font-medium text-purple-300 bg-purple-950/50 border border-purple-500/30 px-3 py-1 rounded-full">
          This Week ▾
        </span>
      </div>

      {/* 3 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Column 1: Dynamic Subject Distribution Donut Chart */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-full">
          <span className="text-xs font-semibold text-slate-300 uppercase block mb-2">
            SUBJECT DISTRIBUTION
          </span>

          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121829', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#F8FAFC', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 text-xs font-medium mt-2 flex-wrap">
            {subjectData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 text-[11px]">{item.value}% {item.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-cosmic-textMuted text-[10px]">TOTAL FOCUS TIME</span>
            <span className="font-bold text-white font-outfit">
              {Math.floor(stats.totalFocusTimeMinutes / 60)}h {stats.totalFocusTimeMinutes % 60}m
            </span>
          </div>
        </div>

        {/* Column 2: Focus Score Gauge */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between items-center text-center h-full">
          <span className="text-xs font-semibold text-slate-300 uppercase block self-start mb-2">
            FOCUS SCORE
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="text-slate-800 stroke-current"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#10B981"
                strokeWidth="8"
                strokeDasharray="314.15"
                strokeDashoffset={314.15 - (314.15 * stats.focusScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-extrabold font-outfit text-white">
                {stats.focusScore}%
              </span>
              <span className="text-[10px] font-semibold text-emerald-400">
                Great Focus!
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mt-2 pt-3 border-t border-white/5 text-center">
            <div>
              <span className="text-[10px] text-cosmic-textMuted uppercase block">Completed</span>
              <span className="text-sm font-bold text-white font-outfit">{stats.completedSessionsCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-cosmic-textMuted uppercase block">Abandoned</span>
              <span className="text-sm font-bold text-rose-400 font-outfit">{stats.abandonedSessionsCount}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Optimal Hours Heatmap Grid */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-full">
          <span className="text-xs font-semibold text-slate-300 uppercase block mb-3">
            OPTIMAL HOURS HEATMAP
          </span>

          <div className="space-y-2">
            {timeLabels.map((timeLabel, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-2">
                <span className="text-[9px] text-cosmic-textMuted w-9 text-right font-medium">
                  {timeLabel}
                </span>
                <div className="flex-1 grid grid-cols-7 gap-1.5">
                  {heatmapMatrix[rowIndex].map((level, colIndex) => (
                    <div
                      key={colIndex}
                      className={`h-5 rounded-md border ${getHeatmapColor(level)} transition-all duration-300 hover:scale-110 cursor-pointer`}
                      title={`${days[colIndex]} @ ${timeLabel}: Focus Level ${level}`}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Days Row */}
            <div className="flex items-center gap-2 pt-1">
              <span className="w-9" />
              <div className="flex-1 grid grid-cols-7 gap-1.5 text-center">
                {days.map((day, idx) => (
                  <span key={idx} className="text-[9px] font-semibold text-cosmic-textMuted">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Intensity Legend Bar */}
          <div className="flex items-center justify-between text-[10px] text-cosmic-textMuted mt-3 pt-2 border-t border-white/5">
            <span>Low Focus</span>
            <div className="flex gap-1">
              <span className="w-3 h-2 rounded bg-indigo-950" />
              <span className="w-3 h-2 rounded bg-indigo-700" />
              <span className="w-3 h-2 rounded bg-purple-600" />
              <span className="w-3 h-2 rounded bg-pink-500" />
            </div>
            <span>High Focus</span>
          </div>
        </div>

      </div>
    </div>
  );
};
