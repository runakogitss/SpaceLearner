import { create } from 'zustand';
import { 
  Profile, 
  PlannerNote, 
  StudyTemplate, 
  PomodoroSession, 
  FocusStats 
} from '../types';

interface StudyState {
  // Mode & Auth
  isSandboxMode: boolean;
  userProfile: Profile;
  
  // Navigation active tab
  activeTab: 'dashboard' | 'timer' | 'planner' | 'statistics' | 'settings';
  
  // Timer State
  selectedTemplate: StudyTemplate;
  systemTemplates: StudyTemplate[];
  userCustomTemplates: StudyTemplate[];
  timeLeftSeconds: number;
  isTimerRunning: boolean;
  timerMode: 'work' | 'break';
  completedCycles: number;
  targetCycles: number;
  
  // Reflection Modal State
  showReflectionModal: boolean;
  pendingReflectionSession: { topic: string; duration: number } | null;

  // Planner Notes State
  currentPlannerNote: PlannerNote;
  allPlannerNotes: PlannerNote[];
  
  // History & Stats
  recentSessions: PomodoroSession[];
  stats: FocusStats;
  
  // Actions & Reactive Sync
  setActiveTab: (tab: 'dashboard' | 'timer' | 'planner' | 'statistics' | 'settings') => void;
  selectTemplate: (template: StudyTemplate) => void;
  createCustomTemplate: (name: string, workMins: number, breakMins: number) => void;
  adjustTimerDurations: (workMins: number, breakMins: number) => void;
  setTargetCycles: (cycles: number) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  completeCurrentSession: () => void;
  submitReflectionAndFinish: (reflectionText: string) => void;
  closeReflectionModal: () => void;
  
  // Planner Notes Actions (Tightly Synced with Timer & Stats)
  createPlannerNote: (topic: string, priorityTargets: string[], durationMins: number, content: string) => void;
  selectPlannerNote: (id: string) => void;
  deletePlannerNote: (id: string) => void;
  finishStudyPlan: (id: string) => void;
  updatePlannerNote: (fields: Partial<PlannerNote>) => void;
  updateReflectionNote: (text: string) => void;
  
  updateProfile: (profileData: Partial<Profile>) => void;
  toggleSandboxMode: (enabled: boolean) => void;
}

const DEFAULT_TEMPLATES: StudyTemplate[] = [
  {
    id: 'tpl-1',
    name: 'IELTS / TOEFL Simulation',
    work_duration_minutes: 45,
    break_duration_minutes: 15,
    is_system_default: true
  },
  {
    id: 'tpl-2',
    name: 'Standard Pomodoro',
    work_duration_minutes: 25,
    break_duration_minutes: 5,
    is_system_default: true
  },
  {
    id: 'tpl-3',
    name: 'Language Memory Burst',
    work_duration_minutes: 20,
    break_duration_minutes: 5,
    is_system_default: true
  },
  {
    id: 'tpl-4',
    name: 'Deep Work Block (Math/STEM)',
    work_duration_minutes: 50,
    break_duration_minutes: 10,
    is_system_default: true
  }
];

const INITIAL_NOTES: PlannerNote[] = [
  {
    id: 'note-sample-1',
    user_id: 'user-trial-1',
    topic: 'IELTS',
    priority_targets: ['Speaking practice', 'Listening comprehension'],
    planned_duration_minutes: 45,
    content: 'Prioritize on Speaking practice and Listening',
    reflection_notes: 'After finishing my IELTS session, I feel like my speaking section has improved, but my reading feels worse which I need to relearn again.',
    is_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'note-sample-2',
    user_id: 'user-trial-1',
    topic: 'JLPT N3',
    priority_targets: ['Kanji Memorization', 'Grammar Drills'],
    planned_duration_minutes: 20,
    content: 'Master N3 Kanji chapter 4 and practice reading comprehension',
    reflection_notes: '',
    is_completed: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'note-sample-3',
    user_id: 'user-trial-1',
    topic: 'Mathematics',
    priority_targets: ['Calculus', 'Linear Algebra'],
    planned_duration_minutes: 50,
    content: 'Solve 10 differential equations and matrix transformation problems',
    reflection_notes: '',
    is_completed: false,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  }
];

const INITIAL_SESSIONS: PomodoroSession[] = [
  {
    id: 'sess-1',
    user_id: 'user-trial-1',
    subject_name: 'IELTS Speaking Practice',
    duration_minutes: 45,
    break_minutes: 15,
    is_completed: true,
    completed_at: '7:00 PM - 7:45 PM'
  },
  {
    id: 'sess-2',
    user_id: 'user-trial-1',
    subject_name: 'IELTS Listening Test',
    duration_minutes: 45,
    break_minutes: 15,
    is_completed: true,
    completed_at: '6:00 PM - 6:45 PM'
  },
  {
    id: 'sess-3',
    user_id: 'user-trial-1',
    subject_name: 'Vocabulary Review (JLPT)',
    duration_minutes: 20,
    break_minutes: 5,
    is_completed: true,
    completed_at: '5:30 PM - 5:50 PM'
  },
  {
    id: 'sess-4',
    user_id: 'user-trial-1',
    subject_name: 'Math Problem Solving',
    duration_minutes: 50,
    break_minutes: 10,
    is_completed: false,
    completed_at: '4:30 PM - 5:20 PM'
  }
];

export const useStudyStore = create<StudyState>((set, get) => ({
  isSandboxMode: true,
  userProfile: {
    id: 'user-trial-1',
    username: 'Reynard',
    full_name: 'Reynard Runako',
    avatar_url: '',
    daily_goal_minutes: 120
  },
  
  activeTab: 'dashboard',
  
  systemTemplates: DEFAULT_TEMPLATES,
  userCustomTemplates: [],
  selectedTemplate: DEFAULT_TEMPLATES[0], // IELTS 45m
  timeLeftSeconds: DEFAULT_TEMPLATES[0].work_duration_minutes * 60,
  isTimerRunning: false,
  timerMode: 'work',
  completedCycles: 3,
  targetCycles: 4,
  
  showReflectionModal: false,
  pendingReflectionSession: null,

  currentPlannerNote: INITIAL_NOTES[0], // IELTS
  allPlannerNotes: INITIAL_NOTES,
  
  recentSessions: INITIAL_SESSIONS,
  
  stats: {
    totalFocusTimeMinutes: 1122,
    completedSessionsCount: 24,
    abandonedSessionsCount: 4,
    focusScore: 87,
    streakDays: 7,
    userLevel: 12,
    userExp: 1250
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Synchronizes Timer Template Selection -> Active Planner Note & Durations
  selectTemplate: (template) => {
    const { allPlannerNotes } = get();

    // Find or sync matching planner note by topic keyword
    const matchedNote = allPlannerNotes.find(n => 
      template.name.toLowerCase().includes(n.topic.toLowerCase()) ||
      n.topic.toLowerCase().includes(template.name.toLowerCase())
    ) || allPlannerNotes[0];

    set({
      selectedTemplate: template,
      currentPlannerNote: matchedNote,
      timeLeftSeconds: template.work_duration_minutes * 60,
      isTimerRunning: false,
      timerMode: 'work'
    });
  },

  createCustomTemplate: (name, workMins, breakMins) => {
    const newTpl: StudyTemplate = {
      id: `custom-tpl-${Date.now()}`,
      user_id: 'user-trial-1',
      name: name.trim() || 'Custom Study Timer',
      work_duration_minutes: workMins,
      break_duration_minutes: breakMins,
      is_system_default: false
    };

    set((state) => ({
      userCustomTemplates: [newTpl, ...state.userCustomTemplates],
      selectedTemplate: newTpl,
      timeLeftSeconds: workMins * 60,
      isTimerRunning: false,
      timerMode: 'work'
    }));
  },

  adjustTimerDurations: (workMins, breakMins) => {
    const { selectedTemplate, timerMode, currentPlannerNote } = get();
    const updatedTpl: StudyTemplate = {
      ...selectedTemplate,
      work_duration_minutes: Math.max(1, workMins),
      break_duration_minutes: Math.max(1, breakMins)
    };

    const updatedNote: PlannerNote = {
      ...currentPlannerNote,
      planned_duration_minutes: Math.max(1, workMins),
      updated_at: new Date().toISOString()
    };

    const newTime = timerMode === 'work' ? updatedTpl.work_duration_minutes * 60 : updatedTpl.break_duration_minutes * 60;

    set((state) => ({
      selectedTemplate: updatedTpl,
      currentPlannerNote: updatedNote,
      allPlannerNotes: state.allPlannerNotes.map(n => n.id === updatedNote.id ? updatedNote : n),
      timeLeftSeconds: newTime,
      isTimerRunning: false
    }));
  },

  setTargetCycles: (cycles) => {
    set({ targetCycles: Math.max(1, cycles) });
  },

  toggleTimer: () => {
    set((state) => ({ isTimerRunning: !state.isTimerRunning }));
  },

  resetTimer: () => {
    const { selectedTemplate, timerMode } = get();
    const durationMins = timerMode === 'work' 
      ? selectedTemplate.work_duration_minutes 
      : selectedTemplate.break_duration_minutes;
    set({
      isTimerRunning: false,
      timeLeftSeconds: durationMins * 60
    });
  },

  tickTimer: () => {
    const { timeLeftSeconds, isTimerRunning } = get();
    if (!isTimerRunning) return;

    if (timeLeftSeconds > 1) {
      set({ timeLeftSeconds: timeLeftSeconds - 1 });
    } else {
      get().completeCurrentSession();
    }
  },

  // Synchronizes Session Completion -> Planner Note Completion + Stats + Reflection Popup
  completeCurrentSession: () => {
    const { selectedTemplate, timerMode, completedCycles, stats, recentSessions, currentPlannerNote } = get();
    
    if (timerMode === 'work') {
      const newSession: PomodoroSession = {
        id: `sess-${Date.now()}`,
        user_id: 'user-trial-1',
        subject_name: `${currentPlannerNote.topic} Practice`,
        duration_minutes: selectedTemplate.work_duration_minutes,
        break_minutes: selectedTemplate.break_duration_minutes,
        is_completed: true,
        completed_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const newTotalMins = stats.totalFocusTimeMinutes + selectedTemplate.work_duration_minutes;
      const newCompletedCount = stats.completedSessionsCount + 1;
      const newScore = Math.round((newCompletedCount / (newCompletedCount + stats.abandonedSessionsCount)) * 100);

      // Auto-finish active study plan when session completes
      const updatedNote: PlannerNote = {
        ...currentPlannerNote,
        is_completed: true,
        updated_at: new Date().toISOString()
      };

      set((state) => ({
        timerMode: 'break',
        timeLeftSeconds: selectedTemplate.break_duration_minutes * 60,
        isTimerRunning: false,
        completedCycles: completedCycles + 1,
        recentSessions: [newSession, ...recentSessions.slice(0, 5)],
        currentPlannerNote: updatedNote,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updatedNote.id ? updatedNote : n),
        showReflectionModal: true,
        pendingReflectionSession: {
          topic: currentPlannerNote.topic,
          duration: selectedTemplate.work_duration_minutes
        },
        stats: {
          ...stats,
          totalFocusTimeMinutes: newTotalMins,
          completedSessionsCount: newCompletedCount,
          focusScore: newScore,
          userExp: stats.userExp + 150
        }
      }));
    } else {
      set({
        timerMode: 'work',
        timeLeftSeconds: selectedTemplate.work_duration_minutes * 60,
        isTimerRunning: false
      });
    }
  },

  submitReflectionAndFinish: (reflectionText) => {
    set((state) => {
      const updatedNote = {
        ...state.currentPlannerNote,
        reflection_notes: reflectionText,
        is_completed: true,
        updated_at: new Date().toISOString()
      };

      return {
        currentPlannerNote: updatedNote,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updatedNote.id ? updatedNote : n),
        showReflectionModal: false,
        pendingReflectionSession: null
      };
    });
  },

  closeReflectionModal: () => {
    set({ showReflectionModal: false, pendingReflectionSession: null });
  },

  // Synchronizes Creating a Planner Note -> Auto-selects & Syncs Pomodoro Timer Template
  createPlannerNote: (topic, priorityTargets, durationMins, content) => {
    const newNote: PlannerNote = {
      id: `note-${Date.now()}`,
      user_id: 'user-trial-1',
      topic: topic.trim() || 'General Study Plan',
      priority_targets: priorityTargets.length > 0 ? priorityTargets : ['Practice', 'Review'],
      planned_duration_minutes: durationMins > 0 ? durationMins : 60,
      content: content.trim() || 'Focus on target goals and practice exercises.',
      reflection_notes: '',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { systemTemplates, userCustomTemplates } = get();
    const allTpls = [...userCustomTemplates, ...systemTemplates];

    // Find or create matching template
    let matchedTpl = allTpls.find(t => t.name.toLowerCase().includes(topic.toLowerCase()));
    if (!matchedTpl) {
      matchedTpl = {
        id: `tpl-synced-${Date.now()}`,
        name: `${newNote.topic} Plan Timer`,
        work_duration_minutes: newNote.planned_duration_minutes,
        break_duration_minutes: Math.max(5, Math.round(newNote.planned_duration_minutes / 4)),
        is_system_default: false
      };
      set((state) => ({
        userCustomTemplates: [matchedTpl!, ...state.userCustomTemplates]
      }));
    }

    set((state) => ({
      allPlannerNotes: [newNote, ...state.allPlannerNotes],
      currentPlannerNote: newNote,
      selectedTemplate: matchedTpl!,
      timeLeftSeconds: matchedTpl!.work_duration_minutes * 60,
      isTimerRunning: false,
      timerMode: 'work'
    }));
  },

  // Synchronizes Selecting a Planner Note -> Syncs Active Timer Preset & Countdown
  selectPlannerNote: (id) => {
    const { allPlannerNotes, systemTemplates, userCustomTemplates } = get();
    const note = allPlannerNotes.find(n => n.id === id);
    if (!note) return;

    const allTpls = [...userCustomTemplates, ...systemTemplates];
    let matchedTpl = allTpls.find(t => 
      t.name.toLowerCase().includes(note.topic.toLowerCase()) ||
      note.topic.toLowerCase().includes(t.name.toLowerCase())
    );

    if (!matchedTpl) {
      matchedTpl = {
        id: `tpl-${note.id}`,
        name: `${note.topic} Timer`,
        work_duration_minutes: note.planned_duration_minutes,
        break_duration_minutes: Math.max(5, Math.round(note.planned_duration_minutes / 4)),
        is_system_default: false
      };
    }

    set({
      currentPlannerNote: note,
      selectedTemplate: matchedTpl,
      timeLeftSeconds: matchedTpl.work_duration_minutes * 60,
      isTimerRunning: false,
      timerMode: 'work'
    });
  },

  deletePlannerNote: (id) => {
    set((state) => {
      const filtered = state.allPlannerNotes.filter(n => n.id !== id);
      const nextNote = filtered[0] || INITIAL_NOTES[0];
      return {
        allPlannerNotes: filtered,
        currentPlannerNote: nextNote
      };
    });
  },

  finishStudyPlan: (id) => {
    set((state) => {
      const updated = {
        ...state.currentPlannerNote,
        is_completed: true,
        updated_at: new Date().toISOString()
      };
      return {
        currentPlannerNote: updated,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updated.id ? updated : n)
      };
    });
  },

  updatePlannerNote: (fields) => {
    set((state) => {
      const updated = {
        ...state.currentPlannerNote,
        ...fields,
        updated_at: new Date().toISOString()
      };

      // Also sync selectedTemplate work duration if duration changed
      let updatedTpl = state.selectedTemplate;
      if (fields.planned_duration_minutes) {
        updatedTpl = {
          ...updatedTpl,
          work_duration_minutes: fields.planned_duration_minutes
        };
      }

      return {
        currentPlannerNote: updated,
        selectedTemplate: updatedTpl,
        timeLeftSeconds: updatedTpl.work_duration_minutes * 60,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updated.id ? updated : n)
      };
    });
  },

  updateReflectionNote: (text) => {
    set((state) => {
      const updated = {
        ...state.currentPlannerNote,
        reflection_notes: text,
        updated_at: new Date().toISOString()
      };
      return {
        currentPlannerNote: updated,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updated.id ? updated : n)
      };
    });
  },

  updateProfile: (profileData) => {
    set((state) => ({
      userProfile: {
        ...state.userProfile,
        ...profileData
      }
    }));
  },

  toggleSandboxMode: (enabled) => {
    set({ isSandboxMode: enabled });
  }
}));
