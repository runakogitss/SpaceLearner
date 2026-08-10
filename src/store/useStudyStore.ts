import { create } from 'zustand';
import { 
  Profile, 
  PlannerNote, 
  StudyTemplate, 
  PomodoroSession, 
  FocusStats 
} from '../types';
import {
  isSupabaseConfigured,
  supabase,
  fetchSupabaseProfile,
  updateSupabaseProfile,
  fetchSupabasePlannerNotes,
  insertSupabasePlannerNote,
  updateSupabasePlannerNote,
  deleteSupabasePlannerNote,
  fetchSupabaseStudyTemplates,
  insertSupabaseStudyTemplate,
  fetchSupabasePomodoroSessions,
  insertSupabasePomodoroSession,
  fetchSupabaseDashboardView
} from '../lib/supabase';

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
  createCustomTemplate: (name: string, workMins: number, breakMins: number) => Promise<void>;
  adjustTimerDurations: (workMins: number, breakMins: number) => void;
  setTargetCycles: (cycles: number) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  completeCurrentSession: () => Promise<void>;
  submitReflectionAndFinish: (reflectionText: string) => Promise<void>;
  closeReflectionModal: () => void;
  
  // Planner Notes Actions (Tightly Synced with Timer & Stats)
  createPlannerNote: (topic: string, priorityTargets: string[], durationMins: number, content: string) => Promise<void>;
  selectPlannerNote: (id: string) => void;
  deletePlannerNote: (id: string) => Promise<void>;
  finishStudyPlan: (id: string) => Promise<void>;
  updatePlannerNote: (fields: Partial<PlannerNote>) => Promise<void>;
  updateReflectionNote: (text: string) => Promise<void>;
  
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  toggleSandboxMode: (enabled: boolean) => void;
  resetSandboxData: () => void;
  syncFromSupabase: () => Promise<void>;
}

const DEFAULT_TEMPLATES: StudyTemplate[] = [
  {
    id: 'tpl-1',
    name: 'IELTS / TOEFL Simulation',
    work_duration_minutes: 45,
    break_duration_minutes: 15,
    cycles: 4,
    is_system_default: true
  },
  {
    id: 'tpl-2',
    name: 'Standard Pomodoro',
    work_duration_minutes: 25,
    break_duration_minutes: 5,
    cycles: 4,
    is_system_default: true
  },
  {
    id: 'tpl-3',
    name: 'Language Memory Burst',
    work_duration_minutes: 20,
    break_duration_minutes: 5,
    cycles: 5,
    is_system_default: true
  },
  {
    id: 'tpl-4',
    name: 'Deep Work Block (Math/STEM)',
    work_duration_minutes: 50,
    break_duration_minutes: 10,
    cycles: 2,
    is_system_default: true
  }
];

const DEFAULT_STARTER_NOTE: PlannerNote = {
  id: 'starter-note-default',
  user_id: 'user-default',
  topic: 'General Study Plan',
  priority_targets: ['Focus Practice', 'Target Review'],
  planned_duration_minutes: 60,
  content: 'Set your target study goals and track focus sessions.',
  reflection_notes: '',
  is_completed: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const INITIAL_SANDBOX_NOTES: PlannerNote[] = [
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
  }
];

const INITIAL_SANDBOX_SESSIONS: PomodoroSession[] = [
  {
    id: 'sess-1',
    user_id: 'user-trial-1',
    subject_name: 'IELTS Speaking Practice',
    duration_minutes: 45,
    break_minutes: 15,
    is_completed: true,
    completed_at: '7:00 PM - 7:45 PM'
  }
];

export const useStudyStore = create<StudyState>((set, get) => ({
  isSandboxMode: !isSupabaseConfigured,
  userProfile: {
    id: 'user-trial-1',
    username: 'Reynard',
    full_name: 'Reynard Runako',
    avatar_url: '',
    daily_goal_minutes: 120,
    exp: 1250,
    level: 12
  },
  
  activeTab: 'dashboard',
  
  systemTemplates: DEFAULT_TEMPLATES,
  userCustomTemplates: [],
  selectedTemplate: DEFAULT_TEMPLATES[0],
  timeLeftSeconds: DEFAULT_TEMPLATES[0].work_duration_minutes * 60,
  isTimerRunning: false,
  timerMode: 'work',
  completedCycles: 1,
  targetCycles: 4,
  
  showReflectionModal: false,
  pendingReflectionSession: null,

  currentPlannerNote: INITIAL_SANDBOX_NOTES[0],
  allPlannerNotes: INITIAL_SANDBOX_NOTES,
  
  recentSessions: INITIAL_SANDBOX_SESSIONS,
  
  stats: {
    totalFocusTimeMinutes: 45,
    completedSessionsCount: 1,
    abandonedSessionsCount: 0,
    focusScore: 100,
    streakDays: 1,
    userLevel: 1,
    userExp: 150
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Synchronizes Timer Template Selection -> Active Planner Note & Durations
  selectTemplate: (template) => {
    const { allPlannerNotes } = get();
    const matchedNote = allPlannerNotes.find(n => 
      template.name.toLowerCase().includes(n.topic.toLowerCase()) ||
      n.topic.toLowerCase().includes(template.name.toLowerCase())
    ) || allPlannerNotes[0] || DEFAULT_STARTER_NOTE;

    set({
      selectedTemplate: template,
      currentPlannerNote: matchedNote,
      timeLeftSeconds: template.work_duration_minutes * 60,
      isTimerRunning: false,
      timerMode: 'work'
    });
  },

  createCustomTemplate: async (name, workMins, breakMins) => {
    const { isSandboxMode, userProfile } = get();
    const templateData = {
      user_id: isSandboxMode ? 'user-trial-1' : userProfile.id,
      name: name.trim() || 'Custom Study Timer',
      work_duration_minutes: workMins,
      break_duration_minutes: breakMins,
      cycles: 4,
      is_system_default: false
    };

    let newTpl: StudyTemplate;

    if (!isSandboxMode && isSupabaseConfigured) {
      const inserted = await insertSupabaseStudyTemplate(templateData);
      if (inserted) {
        newTpl = inserted;
      } else {
        newTpl = { ...templateData, id: `custom-tpl-${Date.now()}` };
      }
    } else {
      newTpl = { ...templateData, id: `custom-tpl-${Date.now()}` };
    }

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

    const noteToUpdate = currentPlannerNote || DEFAULT_STARTER_NOTE;
    const updatedNote: PlannerNote = {
      ...noteToUpdate,
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
  completeCurrentSession: async () => {
    const { selectedTemplate, timerMode, completedCycles, stats, recentSessions, currentPlannerNote, isSandboxMode, userProfile } = get();
    
    if (timerMode === 'work') {
      const activeNote = currentPlannerNote || DEFAULT_STARTER_NOTE;
      const topicName = activeNote.topic;

      const sessionData = {
        user_id: isSandboxMode ? 'user-trial-1' : userProfile.id,
        note_id: activeNote.id.startsWith('note-sample-') || activeNote.id.startsWith('starter-note-') ? null : activeNote.id,
        template_id: selectedTemplate.id.startsWith('tpl-') ? null : selectedTemplate.id,
        subject_name: `${topicName} Practice`,
        duration_minutes: selectedTemplate.work_duration_minutes,
        break_minutes: selectedTemplate.break_duration_minutes,
        cycles_completed: 1,
        is_completed: true
      };

      let newSession: PomodoroSession;

      if (!isSandboxMode && isSupabaseConfigured) {
        const inserted = await insertSupabasePomodoroSession(sessionData);
        if (inserted) {
          newSession = inserted;
          await get().syncFromSupabase();
        } else {
          newSession = {
            ...sessionData,
            id: `sess-${Date.now()}`,
            completed_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
      } else {
        newSession = {
          ...sessionData,
          id: `sess-${Date.now()}`,
          completed_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }

      const newTotalMins = stats.totalFocusTimeMinutes + selectedTemplate.work_duration_minutes;
      const newCompletedCount = stats.completedSessionsCount + 1;
      const newScore = Math.round((newCompletedCount / (newCompletedCount + stats.abandonedSessionsCount)) * 100);

      const updatedNote: PlannerNote = {
        ...activeNote,
        is_completed: true,
        updated_at: new Date().toISOString()
      };

      if (!isSandboxMode && isSupabaseConfigured && !activeNote.id.startsWith('note-sample-') && !activeNote.id.startsWith('starter-note-')) {
        await updateSupabasePlannerNote(activeNote.id, { is_completed: true });
      }

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
          topic: topicName,
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

  submitReflectionAndFinish: async (reflectionText) => {
    const { currentPlannerNote, isSandboxMode } = get();
    const activeNote = currentPlannerNote || DEFAULT_STARTER_NOTE;

    const updatedNote = {
      ...activeNote,
      reflection_notes: reflectionText,
      is_completed: true,
      updated_at: new Date().toISOString()
    };

    if (!isSandboxMode && isSupabaseConfigured && !activeNote.id.startsWith('note-sample-') && !activeNote.id.startsWith('starter-note-')) {
      await updateSupabasePlannerNote(activeNote.id, {
        reflection_notes: reflectionText,
        is_completed: true
      });
    }

    set((state) => ({
      currentPlannerNote: updatedNote,
      allPlannerNotes: state.allPlannerNotes.map(n => n.id === updatedNote.id ? updatedNote : n),
      showReflectionModal: false,
      pendingReflectionSession: null
    }));
  },

  closeReflectionModal: () => {
    set({ showReflectionModal: false, pendingReflectionSession: null });
  },

  // Synchronizes Creating a Planner Note -> Auto-selects & Syncs Pomodoro Timer Template
  createPlannerNote: async (topic, priorityTargets, durationMins, content) => {
    const { isSandboxMode, userProfile, systemTemplates, userCustomTemplates } = get();

    const notePayload = {
      user_id: isSandboxMode ? 'user-trial-1' : userProfile.id,
      topic: topic.trim() || 'General Study Plan',
      priority_targets: priorityTargets.length > 0 ? priorityTargets : ['Practice', 'Review'],
      planned_duration_minutes: durationMins > 0 ? durationMins : 60,
      content: content.trim() || 'Focus on target goals and practice exercises.',
      reflection_notes: '',
      is_completed: false
    };

    let newNote: PlannerNote;

    if (!isSandboxMode && isSupabaseConfigured) {
      const inserted = await insertSupabasePlannerNote(notePayload);
      if (inserted) {
        newNote = inserted;
      } else {
        newNote = {
          ...notePayload,
          id: `note-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    } else {
      newNote = {
        ...notePayload,
        id: `note-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const allTpls = [...userCustomTemplates, ...systemTemplates];
    let matchedTpl = allTpls.find(t => t.name.toLowerCase().includes(topic.toLowerCase()));
    
    if (!matchedTpl) {
      matchedTpl = {
        id: `tpl-synced-${Date.now()}`,
        name: `${newNote.topic} Plan Timer`,
        work_duration_minutes: newNote.planned_duration_minutes,
        break_duration_minutes: Math.max(5, Math.round(newNote.planned_duration_minutes / 4)),
        cycles: 4,
        is_system_default: false
      };
      set((state) => ({
        userCustomTemplates: [matchedTpl!, ...state.userCustomTemplates]
      }));
    }

    set((state) => ({
      allPlannerNotes: [newNote, ...state.allPlannerNotes.filter(n => !n.id.startsWith('starter-note-'))],
      currentPlannerNote: newNote,
      selectedTemplate: matchedTpl!,
      timeLeftSeconds: matchedTpl!.work_duration_minutes * 60,
      isTimerRunning: false,
      timerMode: 'work'
    }));
  },

  selectPlannerNote: (id) => {
    const { allPlannerNotes, systemTemplates, userCustomTemplates } = get();
    const note = allPlannerNotes.find(n => n.id === id) || allPlannerNotes[0] || DEFAULT_STARTER_NOTE;

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
        cycles: 4,
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

  deletePlannerNote: async (id) => {
    const { isSandboxMode } = get();
    if (!isSandboxMode && isSupabaseConfigured && !id.startsWith('note-sample-') && !id.startsWith('starter-note-')) {
      await deleteSupabasePlannerNote(id);
    }

    set((state) => {
      const filtered = state.allPlannerNotes.filter(n => n.id !== id);
      const nextNote = filtered[0] || DEFAULT_STARTER_NOTE;
      const finalNotes = filtered.length > 0 ? filtered : [DEFAULT_STARTER_NOTE];
      return {
        allPlannerNotes: finalNotes,
        currentPlannerNote: nextNote
      };
    });
  },

  finishStudyPlan: async (id) => {
    const { isSandboxMode, currentPlannerNote } = get();
    const activeNote = currentPlannerNote || DEFAULT_STARTER_NOTE;

    if (!isSandboxMode && isSupabaseConfigured && !id.startsWith('note-sample-') && !id.startsWith('starter-note-')) {
      await updateSupabasePlannerNote(id, { is_completed: true });
    }

    set((state) => {
      const updated = {
        ...activeNote,
        is_completed: true,
        updated_at: new Date().toISOString()
      };
      return {
        currentPlannerNote: updated,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updated.id ? updated : n)
      };
    });
  },

  updatePlannerNote: async (fields) => {
    const { isSandboxMode, currentPlannerNote } = get();
    const activeNote = currentPlannerNote || DEFAULT_STARTER_NOTE;

    if (!isSandboxMode && isSupabaseConfigured && !activeNote.id.startsWith('note-sample-') && !activeNote.id.startsWith('starter-note-')) {
      await updateSupabasePlannerNote(activeNote.id, fields);
    }

    set((state) => {
      const updated = {
        ...activeNote,
        ...fields,
        updated_at: new Date().toISOString()
      };

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

  updateReflectionNote: async (text) => {
    const { isSandboxMode, currentPlannerNote } = get();
    const activeNote = currentPlannerNote || DEFAULT_STARTER_NOTE;

    if (!isSandboxMode && isSupabaseConfigured && !activeNote.id.startsWith('note-sample-') && !activeNote.id.startsWith('starter-note-')) {
      await updateSupabasePlannerNote(activeNote.id, { reflection_notes: text });
    }

    set((state) => {
      const updated = {
        ...activeNote,
        reflection_notes: text,
        updated_at: new Date().toISOString()
      };
      return {
        currentPlannerNote: updated,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updated.id ? updated : n)
      };
    });
  },

  updateProfile: async (profileData) => {
    const { isSandboxMode, userProfile } = get();
    if (!isSandboxMode && isSupabaseConfigured && userProfile.id && !userProfile.id.startsWith('user-trial-')) {
      await updateSupabaseProfile(userProfile.id, profileData);
    }

    set((state) => ({
      userProfile: {
        ...state.userProfile,
        ...profileData
      }
    }));
  },

  toggleSandboxMode: (enabled) => {
    set({ isSandboxMode: enabled });
    if (!enabled && isSupabaseConfigured) {
      get().syncFromSupabase();
    }
  },

  resetSandboxData: () => {
    set({
      userProfile: {
        id: 'user-trial-1',
        username: 'Reynard',
        full_name: 'Reynard Runako',
        avatar_url: '',
        daily_goal_minutes: 120,
        exp: 0,
        level: 1
      },
      currentPlannerNote: INITIAL_SANDBOX_NOTES[0],
      allPlannerNotes: INITIAL_SANDBOX_NOTES,
      recentSessions: INITIAL_SANDBOX_SESSIONS,
      userCustomTemplates: [],
      selectedTemplate: DEFAULT_TEMPLATES[0],
      timeLeftSeconds: DEFAULT_TEMPLATES[0].work_duration_minutes * 60,
      isTimerRunning: false,
      timerMode: 'work',
      completedCycles: 0,
      stats: {
        totalFocusTimeMinutes: 45,
        completedSessionsCount: 1,
        abandonedSessionsCount: 0,
        focusScore: 100,
        streakDays: 1,
        userLevel: 1,
        userExp: 0
      }
    });
  },

  // Pull latest real user data directly from Supabase Database schema v2.0
  syncFromSupabase: async () => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser.user?.id;

      if (!userId) return;

      const [profile, notes, templates, sessions, dashboardView] = await Promise.all([
        fetchSupabaseProfile(userId),
        fetchSupabasePlannerNotes(userId),
        fetchSupabaseStudyTemplates(userId),
        fetchSupabasePomodoroSessions(userId),
        fetchSupabaseDashboardView(userId)
      ]);

      set((state) => {
        const usernameFromAuth = authUser.user?.user_metadata?.username || authUser.user?.email?.split('@')[0] || 'Explorer';
        const fullNameFromAuth = authUser.user?.user_metadata?.full_name || usernameFromAuth;

        const updatedProfile: Profile = profile ? {
          ...profile,
          username: profile.username || usernameFromAuth,
          full_name: profile.full_name || fullNameFromAuth,
          exp: dashboardView?.exp ?? profile.exp ?? 0,
          level: dashboardView?.level ?? profile.level ?? 1
        } : {
          id: userId,
          username: usernameFromAuth,
          full_name: fullNameFromAuth,
          daily_goal_minutes: 120,
          exp: dashboardView?.exp ?? 0,
          level: dashboardView?.level ?? 1
        };

        const starterNote: PlannerNote = {
          id: `starter-note-${userId}`,
          user_id: userId,
          topic: 'General Study Plan',
          priority_targets: ['Focus Practice', 'Target Review'],
          planned_duration_minutes: 60,
          content: 'Create your study plan to track focus sessions and record reflection notes.',
          reflection_notes: '',
          is_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const updatedNotes = notes.length > 0 ? notes : [starterNote];
        const updatedTemplates = templates;
        const updatedSessions = sessions;

        const updatedStats: FocusStats = {
          totalFocusTimeMinutes: dashboardView?.total_focus_minutes || 0,
          completedSessionsCount: dashboardView?.total_sessions || 0,
          abandonedSessionsCount: 0,
          focusScore: 100,
          streakDays: dashboardView?.streak_days || 0,
          userLevel: dashboardView?.level || 1,
          userExp: dashboardView?.exp_in_level || 0
        };

        return {
          isSandboxMode: false,
          userProfile: updatedProfile,
          allPlannerNotes: updatedNotes,
          currentPlannerNote: updatedNotes[0],
          systemTemplates: updatedTemplates.length > 0 ? updatedTemplates.filter(t => t.is_system_default) : state.systemTemplates,
          userCustomTemplates: updatedTemplates.filter(t => !t.is_system_default),
          recentSessions: updatedSessions,
          stats: updatedStats
        };
      });
    } catch (err) {
      console.warn('Supabase sync error:', err);
    }
  }
}));
