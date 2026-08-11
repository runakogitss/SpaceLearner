import React, { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { QuickStatsBar } from './components/QuickStatsBar';
import { PomodoroTimerCard } from './components/timer/PomodoroTimerCard';
import { PlannerNoteCard } from './components/planner/PlannerNoteCard';
import { FocusOverview } from './components/stats/FocusOverview';
import { CalendarWidget } from './components/dashboard/CalendarWidget';
import { StreakTrackerCard } from './components/dashboard/StreakTrackerCard';
import { ShortcutsCard } from './components/dashboard/ShortcutsCard';
import { MotivationalQuoteCard } from './components/dashboard/MotivationalQuoteCard';
import { RecentSessions } from './components/dashboard/RecentSessions';
import { SettingsModal } from './components/settings/SettingsModal';
import { useStudyStore } from './store/useStudyStore';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export const App: React.FC = () => {
  const { activeTab, syncFromSupabase } = useStudyStore();
  const profileLevel = useStudyStore((state) => state.userProfile.level || 1);
  const previousLevel = useRef(profileLevel);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  useEffect(() => {
    syncFromSupabase();
  }, [syncFromSupabase]);

  useEffect(() => {
    if (profileLevel > previousLevel.current) setLevelUp(profileLevel);
    previousLevel.current = profileLevel;
  }, [profileLevel]);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;
    let channel: ReturnType<typeof client.channel> | undefined;
    client.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      channel = client.channel(`study-data-${data.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${data.user.id}` }, syncFromSupabase)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'planner_notes', filter: `user_id=eq.${data.user.id}` }, syncFromSupabase)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pomodoro_sessions', filter: `user_id=eq.${data.user.id}` }, syncFromSupabase)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_templates', filter: `user_id=eq.${data.user.id}` }, syncFromSupabase)
        .subscribe();
    });
    return () => { if (channel) client.removeChannel(channel); };
  }, [syncFromSupabase]);

  return (
    <div className="flex items-start min-h-screen bg-cosmic-bg text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Dynamic Greeting Header */}
        <Header />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Quick Stats Metrics */}
              <QuickStatsBar />

              {/* Grid Layout matching UI Mockup */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (8 cols): Timer + Planner */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    <PomodoroTimerCard />
                    <PlannerNoteCard compactHeader={true} />
                  </div>
                  
                  <FocusOverview />
                  <RecentSessions />
                </div>

                {/* Right Column (4 cols): Calendar, Streak, Shortcuts, Quote */}
                <div className="lg:col-span-4 space-y-4">
                  <CalendarWidget />
                  <StreakTrackerCard />
                  <ShortcutsCard />
                  <MotivationalQuoteCard />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timer' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-xl font-bold font-outfit text-white tracking-wide uppercase">
                POMODORO TIMER PRESETS
              </h2>
              <PomodoroTimerCard />
            </div>
          )}

          {activeTab === 'planner' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-xl font-bold font-outfit text-white tracking-wide uppercase">
                STUDY PLANNER &amp; REFLECTION NOTES
              </h2>
              <PlannerNoteCard compactHeader={false} />
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-outfit text-white tracking-wide uppercase">
                FOCUS TRACKERS &amp; ANALYTICS
              </h2>
              <FocusOverview />
              <RecentSessions />
            </div>
          )}

          {activeTab === 'settings' && <SettingsModal />}
        </main>
      </div>
      {levelUp && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-3xl border border-purple-400/40 bg-cosmic-card p-8 text-center shadow-glow-purple"><div className="text-5xl">🚀</div><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Achievement unlocked</p><h3 className="mt-2 text-2xl font-bold text-white">LEVEL {levelUp}</h3><p className="mt-2 text-sm text-cosmic-textMuted">Your focused work is paying off. Keep your momentum going.</p><button onClick={() => setLevelUp(null)} className="mt-6 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white">KEEP EXPLORING</button></div></div>}
    </div>
  );
};

export default App;
