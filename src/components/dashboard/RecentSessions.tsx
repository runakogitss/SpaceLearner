import React from 'react';
import { Headphones, BookOpen, Calculator, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';

export const RecentSessions: React.FC = () => {
  const { recentSessions } = useStudyStore();

  const getSubjectIcon = (name: string) => {
    if (name.toLowerCase().includes('speaking')) return MessageSquare;
    if (name.toLowerCase().includes('listening')) return Headphones;
    if (name.toLowerCase().includes('vocabulary') || name.toLowerCase().includes('jlpt')) return BookOpen;
    if (name.toLowerCase().includes('math')) return Calculator;
    return BookOpen;
  };

  return (
    <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-6 shadow-glow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold font-outfit text-white tracking-wide uppercase">
            RECENT SESSIONS
          </h3>
          <p className="text-[11px] text-cosmic-textMuted">
            History of recent Pomodoro study blocks
          </p>
        </div>
        <button className="text-xs font-semibold text-purple-300 hover:text-white transition-colors">
          View all
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentSessions.map((session) => {
          const Icon = getSubjectIcon(session.subject_name);
          return (
            <div
              key={session.id}
              className="bg-slate-900/60 border border-white/5 hover:border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/20 text-purple-300">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold font-outfit text-white block">
                    {session.duration_minutes}:00
                  </span>
                  <span className="text-[10px] text-cosmic-textMuted block">
                    {session.completed_at}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white mb-2 line-clamp-1">
                  {session.subject_name}
                </h4>
                
                {session.is_completed ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" />
                    Abandoned
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
