import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronDown, 
  Plus, 
  Minus, 
  Sliders, 
  PlusCircle, 
  Check, 
  Clock, 
  Coffee, 
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';

export const PomodoroTimerCard: React.FC = () => {
  const { 
    selectedTemplate, 
    systemTemplates, 
    userCustomTemplates,
    selectTemplate, 
    createCustomTemplate,
    deleteCustomTemplate,
    adjustTimerDurations,
    timeLeftSeconds, 
    isTimerRunning, 
    toggleTimer, 
    resetTimer, 
    tickTimer, 
    timerMode,
    completedCycles,
    targetCycles,
    setTargetCycles,
    setCompleteCelebration,
    acknowledgeSetCompletion
  } = useStudyStore();

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Form State for New Custom Preset
  const [customName, setCustomName] = useState('');
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);

  // Quick Adjustment State
  const [adjWork, setAdjWork] = useState(selectedTemplate.work_duration_minutes);
  const [adjBreak, setAdjBreak] = useState(selectedTemplate.break_duration_minutes);

  useEffect(() => {
    setAdjWork(selectedTemplate.work_duration_minutes);
    setAdjBreak(selectedTemplate.break_duration_minutes);
  }, [selectedTemplate]);

  // Auto-dismiss the full-set celebration badge after a few seconds
  useEffect(() => {
    if (setCompleteCelebration) {
      const timer = setTimeout(() => acknowledgeSetCompletion(), 4000);
      return () => clearTimeout(timer);
    }
  }, [setCompleteCelebration, acknowledgeSetCompletion]);

  // Timer Tick Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, tickTimer]);

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  const totalSeconds = (timerMode === 'work' 
    ? selectedTemplate.work_duration_minutes 
    : selectedTemplate.break_duration_minutes) * 60;
  
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - timeLeftSeconds) / totalSeconds) * 100));
  const strokeDashoffset = 565.48 - (565.48 * progressPercent) / 100;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    createCustomTemplate(customName, customWork, customBreak);
    setShowCustomModal(false);
    setCustomName('');
  };

  const handleSaveAdjustments = () => {
    adjustTimerDurations(adjWork, adjBreak);
    setShowAdjustModal(false);
  };

  const allTemplates = [...userCustomTemplates, ...systemTemplates];

  return (
    <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-glow-card">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-glow-gradient opacity-30 pointer-events-none" />

      {/* Card Header & Preset Selector */}
      <div className="flex items-center justify-between z-10 mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold font-outfit text-white tracking-wide uppercase">
            POMODORO TIMER
          </h3>
          <p className="text-[11px] text-cosmic-textMuted">
            {selectedTemplate.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Selector Dropdown */}
          <div className="relative">
            <select 
              value={selectedTemplate.id}
              onChange={(e) => {
                const tpl = allTemplates.find(t => t.id === e.target.value);
                if (tpl) selectTemplate(tpl);
              }}
              className="appearance-none bg-indigo-950/70 border border-purple-500/30 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-purple-300 focus:outline-none focus:border-purple-400 cursor-pointer shadow-sm transition-all"
            >
              {allTemplates.map((template) => (
                <option key={template.id} value={template.id} className="bg-slate-900 text-slate-200">
                  {template.is_system_default ? '⭐ ' : '✏️ '} {template.name} ({template.work_duration_minutes}m)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-purple-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Custom Settings Buttons */}
          <button
            onClick={() => setShowAdjustModal(!showAdjustModal)}
            className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:border-purple-400/50 transition-all"
            title="Adjust Work / Break Durations"
          >
            <Sliders className="w-4 h-4" />
          </button>
          {!selectedTemplate.is_system_default && <button onClick={() => deleteCustomTemplate(selectedTemplate.id)} className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60" title="Delete custom preset"><Trash2 className="w-4 h-4" /></button>}

          <button
            onClick={() => setShowCustomModal(true)}
            className="p-1.5 rounded-xl bg-purple-900/40 border border-purple-500/40 text-purple-300 hover:text-white transition-all flex items-center gap-1 text-xs font-medium"
            title="Create Custom Named Timer Preset"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Quick Adjust Modal */}
      {showAdjustModal && (
        <div className="z-20 bg-slate-900/95 border border-purple-500/30 rounded-2xl p-4 mb-4 space-y-3 shadow-lg">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            ADJUST CURRENT TIMER SETTINGS
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                Work Time (Mins)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdjWork(Math.max(1, adjWork - 5))}
                  className="p-1 rounded bg-slate-800 text-white hover:bg-slate-700"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-white w-8 text-center">{adjWork}m</span>
                <button
                  onClick={() => setAdjWork(adjWork + 5)}
                  className="p-1 rounded bg-slate-800 text-white hover:bg-slate-700"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                Break Time (Mins)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdjBreak(Math.max(1, adjBreak - 1))}
                  className="p-1 rounded bg-slate-800 text-white hover:bg-slate-700"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-white w-8 text-center">{adjBreak}m</span>
                <button
                  onClick={() => setAdjBreak(adjBreak + 1)}
                  className="p-1 rounded bg-slate-800 text-white hover:bg-slate-700"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveAdjustments}
            className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
          >
            APPLY ADJUSTMENTS
          </button>
        </div>
      )}

      {/* Circular Timer Visual Display */}
      <div className="relative flex flex-col items-center justify-center my-4 z-10">
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              className="text-slate-800/80 stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="url(#timerGradient)"
              strokeWidth="10"
              strokeDasharray="565.48"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase mb-1">
              {timerMode === 'work' ? 'FOCUS' : 'BREAK'}
            </span>
            <div className="text-4xl font-extrabold font-outfit text-white tracking-wider">
              {formattedMinutes}:{formattedSeconds}
            </div>
            <span className="text-xs text-cosmic-textMuted mt-1">
              {timerMode === 'work' ? 'Work Session' : 'Rest Block'}
            </span>
          </div>
        </div>

        {/* Start / Pause Controls */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={toggleTimer}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wider shadow-glow-purple transition-all transform active:scale-95"
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>START</span>
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="p-2.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:border-purple-400/50 transition-all"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Next Break Hint */}
        {setCompleteCelebration ? (
          <div className="mt-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 shadow-glow-purple animate-scale-up flex items-center gap-1.5">
            <Check className="w-3 h-3" /> Full Set Complete!
          </div>
        ) : (
          <p className="text-[11px] text-cosmic-textMuted mt-3">
            Next: {selectedTemplate.break_duration_minutes} min Break
          </p>
        )}
      </div>

      {/* Sub Stats Footer with Customizable Cycles */}
      <div className="grid grid-cols-3 gap-2 border-t border-cosmic-border pt-4 z-10 text-center">
        <div className="bg-slate-900/40 rounded-xl p-2 border border-white/5">
          <div className="flex items-center justify-center gap-1 text-[10px] text-cosmic-textMuted mb-0.5">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>WORK</span>
          </div>
          <span className="text-xs font-bold text-white">
            {selectedTemplate.work_duration_minutes} min
          </span>
        </div>

        <div className="bg-slate-900/40 rounded-xl p-2 border border-white/5">
          <div className="flex items-center justify-center gap-1 text-[10px] text-cosmic-textMuted mb-0.5">
            <Coffee className="w-3 h-3 text-purple-400" />
            <span>BREAK</span>
          </div>
          <span className="text-xs font-bold text-white">
            {selectedTemplate.break_duration_minutes} min
          </span>
        </div>

        {/* Cycles Adjustment Controls */}
        <div className="bg-slate-900/40 rounded-xl p-2 border border-white/5">
          <div className="flex items-center justify-center gap-1 text-[10px] text-cosmic-textMuted mb-0.5">
            <RefreshCw className="w-3 h-3 text-pink-400" />
            <span>CYCLES</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setTargetCycles(targetCycles - 1)}
              className="text-slate-400 hover:text-white"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className={`text-xs font-bold ${setCompleteCelebration ? 'text-emerald-400' : 'text-white'}`}>
              {setCompleteCelebration ? 'SET COMPLETE!' : `${completedCycles} / ${targetCycles}`}
            </span>
            <button
              onClick={() => setTargetCycles(targetCycles + 1)}
              className="text-slate-400 hover:text-white"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Custom Preset Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-cosmic-card border border-purple-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold font-outfit text-white uppercase tracking-wider">
              CREATE CUSTOM POMODORO PRESET
            </h3>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                  Preset Name / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., IELTS Speaking Practice, Math Sprint"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                    Work Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={customWork}
                    onChange={(e) => setCustomWork(parseInt(e.target.value, 10) || 25)}
                    className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                    Break Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={customBreak}
                    onChange={(e) => setCustomBreak(parseInt(e.target.value, 10) || 5)}
                    className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>SAVE PRESET</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
