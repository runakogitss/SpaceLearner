import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle, Clock, FileText, ChevronDown, ChevronUp, MessageSquare, Filter, ArrowUpRight, Target, RefreshCw } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';
import { PlannerNote } from '../../types';

export const PlannerNotesRecord: React.FC = () => {
  const { allPlannerNotes, selectPlannerNote, setActiveTab, analyticsSessions } = useStudyStore();
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Sum completed cycles per planner note from linked focus sessions.
  const cyclesByNote = useMemo(() => {
    const map: Record<string, number> = {};
    analyticsSessions.forEach((session) => {
      if (session.note_id) {
        map[session.note_id] = (map[session.note_id] || 0) + (session.cycles_completed || 1);
      }
    });
    return map;
  }, [analyticsSessions]);

  const totalNotes = allPlannerNotes.length;
  const completedNotes = allPlannerNotes.filter(n => n.is_completed);
  const activeNotes = allPlannerNotes.filter(n => !n.is_completed);
  const completionRate = totalNotes > 0 ? Math.round((completedNotes.length / totalNotes) * 100) : 0;
  const totalPlannedMins = allPlannerNotes.reduce((sum, n) => sum + (n.planned_duration_minutes || 0), 0);
  const notesWithReflections = allPlannerNotes.filter(n => n.reflection_notes && n.reflection_notes.trim().length > 0);

  const filteredNotes = allPlannerNotes.filter((note) => {
    if (filter === 'completed') return note.is_completed;
    if (filter === 'active') return !note.is_completed;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedNoteId(expandedNoteId === id ? null : id);
  };

  const handleOpenInPlanner = (id: string) => {
    selectPlannerNote(id);
    setActiveTab('planner');
  };

  return (
    <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-6 shadow-glow-card mb-6">
      {/* Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold font-outfit text-white tracking-wide uppercase flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            PLANNER NOTE RECORDS &amp; REFLECTIONS
          </h3>
          <p className="text-[11px] text-cosmic-textMuted mt-0.5">
            History of study plans, target goals, and post-session reflection debriefs
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-cosmic-border">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({totalNotes})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed ({completedNotes.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === 'active'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            In Progress ({activeNotes.length})
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-cosmic-textMuted uppercase tracking-wider block mb-1">
            Total Notes
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-white font-outfit">
              {totalNotes}
            </span>
            <FileText className="w-5 h-5 text-purple-400 opacity-80" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-cosmic-textMuted uppercase tracking-wider block mb-1">
            Completion Rate
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-400 font-outfit">
              {completionRate}%
            </span>
            <CheckCircle className="w-5 h-5 text-emerald-400 opacity-80" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-cosmic-textMuted uppercase tracking-wider block mb-1">
            Planned Duration
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-indigo-300 font-outfit">
              {Math.round(totalPlannedMins / 60 * 10) / 10}h
            </span>
            <Clock className="w-5 h-5 text-indigo-400 opacity-80" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-cosmic-textMuted uppercase tracking-wider block mb-1">
            Reflections Logged
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-yellow-300 font-outfit">
              {notesWithReflections.length}
            </span>
            <MessageSquare className="w-5 h-5 text-yellow-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* Note Records List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p>No planner note records found in this category.</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isExpanded = expandedNoteId === note.id;
            const hasReflection = note.reflection_notes && note.reflection_notes.trim().length > 0;

            return (
              <div 
                key={note.id}
                className={`border rounded-2xl p-4 transition-all ${
                  note.is_completed 
                    ? 'bg-slate-950/40 border-emerald-500/20 hover:border-emerald-500/40' 
                    : 'bg-indigo-950/20 border-purple-500/20 hover:border-purple-400/40'
                }`}
              >
                {/* Note Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                      note.is_completed 
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' 
                        : 'bg-purple-950/60 border-purple-500/30 text-purple-300'
                    }`}>
                      {note.is_completed ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-bold text-white font-outfit">
                          {note.topic}
                        </h4>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                          note.is_completed
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        }`}>
                          {note.is_completed ? 'Completed' : 'In Progress'}
                        </span>
                        <span className="text-[11px] text-purple-300 font-semibold bg-purple-950/50 border border-purple-500/30 px-2 py-0.5 rounded-md">
                          ⏱️ {note.planned_duration_minutes || 60}m
                        </span>
                        {cyclesByNote[note.id] > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-pink-300 font-semibold bg-pink-950/50 border border-pink-500/30 px-2 py-0.5 rounded-md">
                            <RefreshCw className="w-2.5 h-2.5" />
                            {cyclesByNote[note.id]} cycle{cyclesByNote[note.id] === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>

                      {/* Priority Targets Badges */}
                      {note.priority_targets && note.priority_targets.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {note.priority_targets.map((target, idx) => (
                            <span 
                              key={idx}
                              className="text-[10px] text-slate-300 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <Target className="w-2.5 h-2.5 text-purple-400" />
                              {target}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Expand Toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenInPlanner(note.id)}
                      className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-purple-900/60 border border-slate-700 hover:border-purple-400/50 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1"
                      title="Open note in Planner tab"
                    >
                      <span>Open Planner</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-purple-300" />
                    </button>

                    <button
                      onClick={() => toggleExpand(note.id)}
                      className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-all"
                      title={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-purple-500/15 space-y-3 animate-fade-in">
                    {/* Focus Cycles Completed */}
                    <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-cosmic-textMuted uppercase tracking-wider flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 text-pink-400" />
                        Focus Cycles Completed
                      </span>
                      <span className="text-xs font-bold text-white font-outfit">
                        {cyclesByNote[note.id] || 0} cycle{cyclesByNote[note.id] === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Note Content Summary */}
                    <div>
                      <span className="text-[10px] font-bold text-cosmic-textMuted uppercase tracking-wider block mb-1">
                        Study Target Summary
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        {note.content || 'No summary specified.'}
                      </p>
                    </div>

                    {/* Reflection Debrief Notes */}
                    <div>
                      <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <MessageSquare className="w-3 h-3 text-yellow-400" />
                        Post-Study Reflection Debrief
                      </span>
                      <div className="bg-purple-950/30 border border-purple-500/20 p-3 rounded-xl">
                        {hasReflection ? (
                          <p className="text-xs text-slate-200 italic leading-relaxed">
                            &ldquo;{note.reflection_notes}&rdquo;
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            No reflection logged yet. Complete focus session to add reflection notes.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
