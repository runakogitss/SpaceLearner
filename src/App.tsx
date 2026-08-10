import React from 'react';
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

export const App: React.FC = () => {
  const { activeTab } = useStudyStore();

  return (
    <div className="flex min-h-screen bg-cosmic-bg text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
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
    </div>
  );
};

export default App;
