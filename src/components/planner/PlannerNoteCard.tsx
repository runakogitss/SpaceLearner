import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Flag, 
  Clock, 
  Edit3, 
  CheckCircle2, 
  MessageSquareText, 
  Sparkles, 
  X, 
  Send, 
  Plus, 
  Trash2,
  BookOpen,
  Lock,
  Check,
  ChevronDown
} from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';

interface PlannerNoteCardProps {
  compactHeader?: boolean;
}

export const PlannerNoteCard: React.FC<PlannerNoteCardProps> = ({ compactHeader = false }) => {
  const { 
    currentPlannerNote, 
    allPlannerNotes,
    createPlannerNote,
    selectPlannerNote,
    deletePlannerNote,
    finishStudyPlan,
    updatePlannerNote, 
    updateReflectionNote,
    showReflectionModal,
    submitReflectionAndFinish,
    closeReflectionModal
  } = useStudyStore();

  const activeNote = currentPlannerNote || allPlannerNotes[0] || {
    id: 'starter-fallback',
    user_id: 'user-trial-1',
    topic: 'General Study Plan',
    priority_targets: ['Focus Practice', 'Target Review'],
    planned_duration_minutes: 60,
    content: 'Set your focus targets and track your daily study progress.',
    reflection_notes: '',
    is_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showReflectionInput, setShowReflectionInput] = useState(false);

  // New Note Form State
  const [newTopic, setNewTopic] = useState('');
  const [newTargets, setNewTargets] = useState('');
  const [newDuration, setNewDuration] = useState('60');
  const [newContent, setNewContent] = useState('');
  
  // Edit Form State
  const [topic, setTopic] = useState(activeNote.topic);
  const [targetPlan, setTargetPlan] = useState(activeNote.content);
  const [durationPlan, setDurationPlan] = useState((activeNote.planned_duration_minutes || 60).toString());
  const [reflectionText, setReflectionText] = useState(activeNote.reflection_notes || '');

  useEffect(() => {
    if (activeNote) {
      setTopic(activeNote.topic || '');
      setTargetPlan(activeNote.content || '');
      setDurationPlan((activeNote.planned_duration_minutes || 60).toString());
      setReflectionText(activeNote.reflection_notes || '');
    }
  }, [activeNote.id, activeNote.topic, activeNote.content, activeNote.planned_duration_minutes, activeNote.reflection_notes]);

  const handleCreateNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    const targetsArray = newTargets
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    createPlannerNote(
      newTopic,
      targetsArray,
      parseInt(newDuration, 10) || 60,
      newContent
    );

    setShowNewModal(false);
    setNewTopic('');
    setNewTargets('');
    setNewDuration('60');
    setNewContent('');
  };

  const handleSavePlan = () => {
    updatePlannerNote({
      topic,
      content: targetPlan,
      planned_duration_minutes: parseInt(durationPlan, 10) || 60,
    });
    setIsEditing(false);
  };

  const handleFinishPlan = () => {
    finishStudyPlan(activeNote.id);
    setShowReflectionInput(true);
  };

  const handleSaveReflection = () => {
    updateReflectionNote(reflectionText);
    setShowReflectionInput(false);
  };

  return (
    <div className="space-y-4 h-full flex flex-col justify-between">
      {/* Top Toolbar Header (Only rendered when not compact header) */}
      {!compactHeader && (
        <div className="bg-cosmic-card/90 border border-cosmic-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-glow-card">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-cosmic-textMuted uppercase tracking-wider mr-1">
              PLANS:
            </span>
            {allPlannerNotes.map((note) => {
              const isSelected = note.id === activeNote.id;
              return (
                <button
                  key={note.id}
                  onClick={() => selectPlannerNote(note.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-glow-purple border border-purple-300/30'
                      : 'bg-slate-900/80 border border-cosmic-border text-slate-400 hover:text-white hover:border-purple-500/30'
                  }`}
                >
                  {note.is_completed ? (
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  ) : null}
                  <span>{note.topic} ({note.planned_duration_minutes}m)</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold tracking-wider shadow-glow-purple transition-all transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>NEW PLANNER NOTE</span>
          </button>
        </div>
      )}

      {/* Main Planner Note Content Card */}
      <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-6 relative overflow-hidden flex-1 flex flex-col justify-between shadow-glow-card">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-outfit text-white tracking-wide uppercase">
                TODAY&apos;S PLAN
              </h3>

              {/* Compact Plan Switcher Dropdown on Dashboard */}
              {compactHeader && (
                <div className="relative">
                  <select
                    value={activeNote.id}
                    onChange={(e) => selectPlannerNote(e.target.value)}
                    className="appearance-none bg-indigo-950/70 border border-purple-500/30 rounded-lg px-2.5 py-1 pr-6 text-[11px] font-semibold text-purple-300 focus:outline-none cursor-pointer"
                  >
                    {allPlannerNotes.map((n) => (
                      <option key={n.id} value={n.id} className="bg-slate-900 text-slate-200">
                        {n.topic} ({n.planned_duration_minutes}m)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-purple-300 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {activeNote.is_completed ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> COMPLETED
                </span>
              ) : (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 uppercase tracking-wider">
                  IN PROGRESS
                </span>
              )}
            </div>
            <p className="text-[11px] text-cosmic-textMuted mt-0.5">
              Active target goals &amp; post-study debriefs
            </p>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Quick Add Note Button on Dashboard */}
            {compactHeader && (
              <button
                onClick={() => setShowNewModal(true)}
                className="p-1.5 rounded-xl bg-purple-900/40 border border-purple-500/40 text-purple-300 hover:text-white transition-all"
                title="Add New Planner Note"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mark Finished Action Button */}
            {!activeNote.is_completed && (
              <button
                onClick={handleFinishPlan}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold tracking-wider transition-all"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>FINISH</span>
              </button>
            )}

            {/* Edit Goal Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-purple-400/50 text-slate-300 hover:text-white text-[11px] transition-all"
              title="Edit Plan Goals"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete Note Button */}
            {allPlannerNotes.length > 1 && (
              <button
                onClick={() => deletePlannerNote(activeNote.id)}
                className="p-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:text-white transition-all"
                title="Delete Note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {!isEditing ? (
          /* View Mode */
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            {/* Topic / Subject */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
              <div className="p-2 rounded-xl bg-indigo-900/50 border border-indigo-400/30 text-indigo-300">
                <Target className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-cosmic-textMuted uppercase block">
                  TOPIC / SUBJECT
                </span>
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <span className="text-xs font-bold text-white font-outfit">
                    {activeNote.topic}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {(activeNote.priority_targets || []).map((tgt, idx) => (
                      <span key={idx} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300">
                        {tgt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Plan */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20">
              <div className="p-2 rounded-xl bg-purple-900/50 border border-purple-400/30 text-purple-300">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-cosmic-textMuted uppercase block">
                  TARGET PLAN
                </span>
                <p className="text-xs font-medium text-slate-200">
                  {activeNote.content}
                </p>
              </div>
            </div>

            {/* Hour / Duration Plan */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20">
              <div className="p-2 rounded-xl bg-cyan-900/50 border border-cyan-400/30 text-cyan-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-cosmic-textMuted uppercase block">
                  HOUR / DURATION PLAN
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {Math.floor(activeNote.planned_duration_minutes / 60)} - {Math.ceil(activeNote.planned_duration_minutes / 60) + 1} hours ({activeNote.planned_duration_minutes} mins)
                </span>
              </div>
            </div>

            {/* Post-Study Reflection Section */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              activeNote.is_completed 
                ? 'bg-pink-950/30 border-pink-500/30' 
                : 'bg-slate-900/40 border-white/5 opacity-80'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-[10px] font-bold text-pink-300 uppercase tracking-wider">
                    REFLECTION NOTE
                  </span>
                </div>

                {activeNote.is_completed ? (
                  <button
                    onClick={() => setShowReflectionInput(!showReflectionInput)}
                    className="text-[10px] font-semibold text-purple-300 hover:text-white underline"
                  >
                    {showReflectionInput ? 'CLOSE' : 'EDIT REFLECTION'}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] text-slate-400">
                    <Lock className="w-3 h-3 text-slate-500" /> Complete Plan to Unlock
                  </span>
                )}
              </div>

              {activeNote.is_completed ? (
                showReflectionInput || !activeNote.reflection_notes ? (
                  <div className="space-y-2 pt-2">
                    <textarea
                      rows={3}
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder="e.g., After I finish my IELTS, I feel like my speaking section has improved, but my reading feels worse which I need to relearn again."
                      className="w-full bg-slate-900 border border-pink-500/40 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
                    />
                    <button
                      onClick={handleSaveReflection}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-glow-purple"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>SUBMIT REFLECTION NOTE</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 italic mt-1 line-clamp-3">
                    &ldquo;{activeNote.reflection_notes}&rdquo;
                  </p>
                )
              ) : (
                <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-2 bg-slate-950/40 p-2 rounded-xl border border-white/5">
                  <span>💡 Click <strong className="text-emerald-400">FINISH</strong> above to write post-study reflection.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-3 flex-1">
            <div>
              <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                Topic / Subject
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-900 border border-cosmic-border rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                Target Plan Description
              </label>
              <textarea
                rows={3}
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value)}
                className="w-full bg-slate-900 border border-cosmic-border rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                Planned Duration (Minutes)
              </label>
              <input
                type="number"
                value={durationPlan}
                onChange={(e) => setDurationPlan(e.target.value)}
                className="w-full bg-slate-900 border border-cosmic-border rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSavePlan}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all"
              >
                SAVE CHANGES
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-semibold transition-all"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Post-Study Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-cosmic-card border border-purple-500/40 rounded-3xl p-6 shadow-glow-purple">
            <button
              onClick={closeReflectionModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-glow-purple">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit text-white">
                  GREAT FOCUS SESSION! 🎉
                </h3>
                <p className="text-xs text-purple-300 font-medium">
                  Complete your Post-Study Reflection Note for {activeNote.topic}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 mb-4 text-xs text-slate-300">
              <p className="leading-relaxed">
                Reflect on what you achieved, what felt challenging, or what section needs relearning.
              </p>
            </div>

            <textarea
              rows={4}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="e.g., After finishing my session, I feel like my speaking section has improved, but my reading feels worse which I need to relearn again."
              className="w-full bg-slate-900 border border-purple-500/40 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 mb-4"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => submitReflectionAndFinish(reflectionText)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>SAVE REFLECTION &amp; FINISH</span>
              </button>
              <button
                onClick={closeReflectionModal}
                className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold transition-all"
              >
                SKIP FOR NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Planner Note Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-cosmic-card border border-purple-500/40 rounded-3xl p-6 shadow-glow-purple">
            <button
              onClick={() => setShowNewModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-glow-purple">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-outfit text-white">
                  CREATE NEW PLANNER NOTE
                </h3>
                <p className="text-xs text-cosmic-textMuted">
                  Set goals &amp; auto-sync matching Pomodoro timer
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateNewNote} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                  Topic / Subject Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IELTS, JLPT N3, Calculus"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                  Priority Targets (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Speaking practice, Listening comprehension"
                  value={newTargets}
                  onChange={(e) => setNewTargets(e.target.value)}
                  className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                  Planned Study Duration (Minutes)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                  Study Target Goals Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Prioritize Speaking practice and Listening sections."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs tracking-wider transition-all shadow-glow-purple"
                >
                  CREATE &amp; SYNC TIMER
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
