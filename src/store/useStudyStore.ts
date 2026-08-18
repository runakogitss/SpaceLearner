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
  deleteSupabaseStudyTemplate,
  fetchSupabasePomodoroSessions,
  insertSupabasePomodoroSession,
  fetchSupabaseDashboardView,
  ensureSupabaseProfile
} from '../lib/supabase';
import { useNotificationStore } from './useNotificationStore';

// ====================================================================
// GAMIFICATION HELPERS & PERSISTENCE
// ====================================================================
const SANDBOX_STORAGE_KEY = 'space_learner_sandbox_state_v1';

export function calculateExpForSession(durationMins: number): number {
  if (durationMins < 25) return 50;
  if (durationMins < 45) return 100;
  return 150;
}

export function calculateLevelFromExp(totalExp: number): { level: number; expInLevel: number; expToNextLevel: number } {
  let lvl = 1;
  let accumulated = 0;
  let threshold = lvl * 200; // Level N -> N+1 requires N * 200 EXP

  while (accumulated + threshold <= totalExp && lvl < 1000) {
    accumulated += threshold;
    lvl++;
    threshold = lvl * 200;
  }

  const expInLevel = totalExp - accumulated;
  const expToNextLevel = threshold;

  return { level: lvl, expInLevel, expToNextLevel };
}

export function calculateStreakFromSessions(sessions: PomodoroSession[]): number {
  const completedSessions = sessions.filter(s => s.is_completed);
  if (completedSessions.length === 0) return 0;

  const datesSet = new Set(
    completedSessions.map(s => {
      if (s.completed_at && s.completed_at.includes('T')) {
        return s.completed_at.split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
    })
  );

  const sortedDates = Array.from(datesSet).sort().reverse();
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(sortedDates[0]);

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr);
    const diffTime = Math.abs(checkDate.getTime() - d.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      streak++;
      checkDate = d;
    } else {
      break;
    }
  }

  return streak;
}

function saveSandboxState(state: Partial<StudyState>) {
  try {
    const payload = {
      userProfile: state.userProfile,
      currentPlannerNote: state.currentPlannerNote,
      allPlannerNotes: state.allPlannerNotes,
      recentSessions: state.recentSessions,
      analyticsSessions: state.analyticsSessions,
      userCustomTemplates: state.userCustomTemplates,
      targetCycles: state.targetCycles,
      stats: state.stats
    };
    localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save sandbox state to localStorage:', err);
  }
}

function loadSandboxState() {
  try {
    const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load sandbox state from localStorage:', err);
    return null;
  }
}

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
  hasMoreSessions: boolean;
  timeLeftSeconds: number;
  isTimerRunning: boolean;
  timerMode: 'work' | 'break';
  completedCycles: number;
  targetCycles: number;
  setCompleteCelebration: boolean;
  
  // Reflection Modal State
  showReflectionModal: boolean;
  pendingReflectionSession: { topic: string; duration: number } | null;

  // Planner Notes State
  currentPlannerNote: PlannerNote;
  allPlannerNotes: PlannerNote[];
  
  // History & Stats
  recentSessions: PomodoroSession[];
  analyticsSessions: PomodoroSession[];
  stats: FocusStats;
  
  // Actions & Reactive Sync
  setActiveTab: (tab: 'dashboard' | 'timer' | 'planner' | 'statistics' | 'settings') => void;
  selectTemplate: (template: StudyTemplate) => void;
  createCustomTemplate: (name: string, workMins: number, breakMins: number) => Promise<void>;
  deleteCustomTemplate: (id: string) => Promise<void>;
  loadMoreSessions: () => Promise<void>;
  adjustTimerDurations: (workMins: number, breakMins: number) => void;
  setTargetCycles: (cycles: number) => void;
  acknowledgeSetCompletion: () => void;
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
    name: 'Standard Pomodoro',
    work_duration_minutes: 25,
    break_duration_minutes: 5,
    cycles: 4,
    is_system_default: true
  },
  {
    id: 'tpl-2',
    name: 'IELTS / TOEFL Simulation',
    work_duration_minutes: 45,
    break_duration_minutes: 15,
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

const guestStarterNote = (): PlannerNote => ({ ...DEFAULT_STARTER_NOTE, id: 'starter-note-guest', user_id: 'guest-traveller', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
const guestProfile = (): Profile => ({ id: 'guest-traveller', username: 'reynard', full_name: 'Reynard Runako', avatar_url: '', daily_goal_minutes: 120, exp: 0, level: 1 });

const savedSandbox = loadSandboxState();

export const useStudyStore = create<StudyState>((set, get) => ({
  isSandboxMode: !isSupabaseConfigured,
  userProfile: savedSandbox?.userProfile || {
    id: 'user-trial-1',
    username: 'reynard',
    full_name: 'Reynard Runako',
    avatar_url: '',
    daily_goal_minutes: 120,
    exp: 0,
    level: 1
  },
  
  activeTab: 'dashboard',
  
  systemTemplates: DEFAULT_TEMPLATES,
  userCustomTemplates: savedSandbox?.userCustomTemplates || [],
  selectedTemplate: DEFAULT_TEMPLATES[0],
  timeLeftSeconds: DEFAULT_TEMPLATES[0].work_duration_minutes * 60,
  isTimerRunning: false,
  timerMode: 'work',
  completedCycles: 0,
  targetCycles: 4,
  setCompleteCelebration: false,
  
  showReflectionModal: false,
  pendingReflectionSession: null,

  currentPlannerNote: savedSandbox?.currentPlannerNote || guestStarterNote(),
  allPlannerNotes: savedSandbox?.allPlannerNotes || [guestStarterNote()],
  
  recentSessions: savedSandbox?.recentSessions || [],
  analyticsSessions: savedSandbox?.analyticsSessions || savedSandbox?.recentSessions || [],
  hasMoreSessions: false,
  
  stats: savedSandbox?.stats || {
    totalFocusTimeMinutes: 0,
    completedSessionsCount: 0,
    abandonedSessionsCount: 0,
    focusScore: 100,
    streakDays: 0,
    userLevel: 1,
    userExp: 0,
    expToNextLevel: 200,
    todayFocusMinutes: 0,
    dailyGoalMinutes: 120,
    totalCompletedCycles: 0
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Synchronizes Timer Template Selection -> Active Planner Note & Durations
  selectTemplate: (template) => {
    const { allPlannerNotes } = get();
    const matchedNote = allPlannerNotes.find(n => 
      template.name.toLowerCase().includes(n.topic.toLowerCase()) ||
      n.topic.toLowerCase().includes(template.name.toLowerCase())
    ) || allPlannerNotes[0] || DEFAULT_STARTER_NOTE;

    set((state) => {
      const nextState = {
        selectedTemplate: template,
        currentPlannerNote: matchedNote,
        timeLeftSeconds: template.work_duration_minutes * 60,
        isTimerRunning: false,
        timerMode: 'work' as const,
        setCompleteCelebration: false
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
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

    set((state) => {
      const nextState = {
        userCustomTemplates: [newTpl, ...state.userCustomTemplates],
        selectedTemplate: newTpl,
        timeLeftSeconds: workMins * 60,
        isTimerRunning: false,
        timerMode: 'work' as const
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
    });
  },

  deleteCustomTemplate: async (id) => {
    const { isSandboxMode } = get();
    if (!isSandboxMode && isSupabaseConfigured) await deleteSupabaseStudyTemplate(id);
    set((state) => {
      const userCustomTemplates = state.userCustomTemplates.filter((template) => template.id !== id);
      const selectedTemplate = state.selectedTemplate.id === id ? state.systemTemplates[0] : state.selectedTemplate;
      const nextState = { userCustomTemplates, selectedTemplate, timeLeftSeconds: selectedTemplate.work_duration_minutes * 60, isTimerRunning: false };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
    });
  },

  loadMoreSessions: async () => {
    const { isSandboxMode, userProfile, recentSessions, hasMoreSessions } = get();
    if (isSandboxMode || !isSupabaseConfigured || !hasMoreSessions) return;
    const nextPage = await fetchSupabasePomodoroSessions(userProfile.id, 10, recentSessions.length);
    set((state) => ({ recentSessions: [...state.recentSessions, ...nextPage], hasMoreSessions: nextPage.length === 10 }));
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

    set((state) => {
      const nextState = {
        selectedTemplate: updatedTpl,
        currentPlannerNote: updatedNote,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updatedNote.id ? updatedNote : n),
        timeLeftSeconds: newTime,
        isTimerRunning: false
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
    });
  },

  setTargetCycles: (cycles) => {
    set((state) => {
      const nextState = { targetCycles: Math.max(1, cycles) };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
    });
  },

  acknowledgeSetCompletion: () => {
    set({ setCompleteCelebration: false });
  },

  toggleTimer: () => {
    set((state) => ({ isTimerRunning: !state.isTimerRunning }));
  },

  resetTimer: () => {
    const { selectedTemplate, timerMode } = get();
    const durationMins = timerMode === 'work' 
      ? selectedTemplate.work_duration_minutes 
      : selectedTemplate.break_duration_minutes;
    set((state) => {
      const nextState = {
        isTimerRunning: false,
        timeLeftSeconds: durationMins * 60
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
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

  // Synchronizes Session Completion -> Single Source of EXP
  completeCurrentSession: async () => {
    const { selectedTemplate, timerMode, completedCycles, targetCycles, stats, recentSessions, currentPlannerNote, isSandboxMode, userProfile } = get();
    
    if (timerMode === 'work') {
      const activeNote = currentPlannerNote || DEFAULT_STARTER_NOTE;
      const topicName = activeNote.topic;
      const workDurationMins = selectedTemplate.work_duration_minutes;
      
      // EXP is calculated strictly by exp_for_session(duration):
      // < 25m -> 50 EXP, 25-44m -> 100 EXP, 45+m -> 150 EXP
      const earnedExp = calculateExpForSession(workDurationMins);

      // Cycle tracking: each completed work block counts as one completed cycle.
      const newCycleCount = completedCycles + 1;
      const setComplete = newCycleCount >= targetCycles;

      const sessionData = {
        user_id: isSandboxMode ? 'user-trial-1' : userProfile.id,
        note_id: activeNote.id.startsWith('note-sample-') || activeNote.id.startsWith('starter-note-') ? null : activeNote.id,
        template_id: selectedTemplate.id.startsWith('tpl-') ? null : selectedTemplate.id,
        subject_name: `${topicName} Practice`,
        duration_minutes: workDurationMins,
        break_minutes: selectedTemplate.break_duration_minutes,
        cycles_completed: 1,
        is_completed: true,
        exp_earned: earnedExp,
        completed_at: new Date().toISOString()
      };

      let newSession: PomodoroSession;
      let shouldResync = false;

      if (!isSandboxMode && isSupabaseConfigured) {
        const result = await insertSupabasePomodoroSession(sessionData);
        if (result.session) {
          newSession = result.session;
          shouldResync = true;
        } else {
          newSession = {
            ...sessionData,
            id: `sess-${Date.now()}`
          };
          useNotificationStore.getState().addNotification({
            title: 'Session not saved to cloud',
            message: `Supabase rejected the session save: ${result.error || 'unknown error'}. Re-run supabase/schema.sql in the SQL editor, then retry.`,
            type: 'system',
            category: 'reminder',
            action_tab: 'settings',
            action_label: 'Check Settings'
          });
        }
      } else {
        newSession = {
          ...sessionData,
          id: `sess-${Date.now()}`
        };
      }

      const updatedRecentSessions = [newSession, ...recentSessions];
      const newTotalMins = stats.totalFocusTimeMinutes + workDurationMins;
      const newCompletedCount = stats.completedSessionsCount + 1;
      const newTotalCycles = (stats.totalCompletedCycles || 0) + 1;
      const newScore = Math.round((newCompletedCount / (newCompletedCount + stats.abandonedSessionsCount)) * 100);

      const updatedNote: PlannerNote = {
        ...activeNote,
        is_completed: true,
        updated_at: new Date().toISOString()
      };

      if (!isSandboxMode && isSupabaseConfigured && !activeNote.id.startsWith('note-sample-') && !activeNote.id.startsWith('starter-note-')) {
        await updateSupabasePlannerNote(activeNote.id, { is_completed: true });
      }

      // Calculate total EXP & Level strictly according to exp_for_level()
      const currentTotalExp = (userProfile.exp || 0) + earnedExp;
      const levelInfo = calculateLevelFromExp(currentTotalExp);
      const newStreak = calculateStreakFromSessions(updatedRecentSessions);

      const updatedProfile: Profile = {
        ...userProfile,
        exp: currentTotalExp,
        level: levelInfo.level
      };

      const updatedStats: FocusStats = {
        ...stats,
        totalFocusTimeMinutes: newTotalMins,
        todayFocusMinutes: (stats.todayFocusMinutes || 0) + workDurationMins,
        completedSessionsCount: newCompletedCount,
        focusScore: newScore,
        streakDays: newStreak,
        userLevel: levelInfo.level,
        userExp: levelInfo.expInLevel,
        expToNextLevel: levelInfo.expToNextLevel,
        totalCompletedCycles: newTotalCycles
      };

      if (setComplete) {
        useNotificationStore.getState().addNotification({
          title: 'FULL POMODORO SET COMPLETE 🚀',
          message: `You completed all ${targetCycles} focus cycles. Outstanding consistency!`,
          type: 'streak',
          category: 'achievement',
          action_tab: 'statistics',
          action_label: 'View Stats'
        });
      }

      set((state) => {
        const nextState = {
          timerMode: 'break' as const,
          timeLeftSeconds: selectedTemplate.break_duration_minutes * 60,
          isTimerRunning: false,
          completedCycles: setComplete ? 0 : newCycleCount,
          setCompleteCelebration: setComplete,
          recentSessions: [newSession, ...state.recentSessions.filter(s => s.id !== newSession.id)].slice(0, 10),
          analyticsSessions: [newSession, ...state.analyticsSessions.filter(s => s.id !== newSession.id)],
          currentPlannerNote: updatedNote,
          allPlannerNotes: state.allPlannerNotes.map(n => n.id === updatedNote.id ? updatedNote : n),
          showReflectionModal: true,
          pendingReflectionSession: {
            topic: topicName,
            duration: workDurationMins
          },
          userProfile: updatedProfile,
          stats: updatedStats
        };

        if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
        return nextState;
      });

      // Pull authoritative DB state (EXP/level computed by the trigger) in the
      // background so the cloud and UI stay in lockstep without blocking the
      // timer's transition to break mode.
      if (shouldResync) {
        void get().syncFromSupabase();
      }
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

    set((state) => {
      const nextState = {
        currentPlannerNote: updatedNote,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updatedNote.id ? updatedNote : n),
        showReflectionModal: false,
        pendingReflectionSession: null
      };

      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
    });
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

    const allTemplates = [...systemTemplates, ...userCustomTemplates];
    const matchingTemplate = allTemplates.find(t => 
      t.name.toLowerCase().includes(topic.toLowerCase()) || 
      topic.toLowerCase().includes(t.name.toLowerCase())
    ) || {
      id: `custom-synced-${Date.now()}`,
      name: `${newNote.topic} Practice`,
      work_duration_minutes: newNote.planned_duration_minutes,
      break_duration_minutes: 5,
      cycles: 4,
      is_system_default: false
    };

    set((state) => {
      const nextState = {
        allPlannerNotes: [newNote, ...state.allPlannerNotes],
        currentPlannerNote: newNote,
        selectedTemplate: matchingTemplate,
        timeLeftSeconds: matchingTemplate.work_duration_minutes * 60,
        isTimerRunning: false,
        timerMode: 'work' as const
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
    });
  },

  selectPlannerNote: (id) => {
    const { allPlannerNotes, systemTemplates, userCustomTemplates } = get();
    const note = allPlannerNotes.find(n => n.id === id);
    if (!note) return;

    const allTemplates = [...systemTemplates, ...userCustomTemplates];
    const matchingTemplate = allTemplates.find(t => 
      t.name.toLowerCase().includes(note.topic.toLowerCase()) || 
      note.topic.toLowerCase().includes(t.name.toLowerCase())
    ) || {
      id: `custom-selected-${Date.now()}`,
      name: `${note.topic} Practice`,
      work_duration_minutes: note.planned_duration_minutes,
      break_duration_minutes: 5,
      cycles: 4,
      is_system_default: false
    };

    set({
      currentPlannerNote: note,
      selectedTemplate: matchingTemplate,
      timeLeftSeconds: matchingTemplate.work_duration_minutes * 60,
      isTimerRunning: false,
      timerMode: 'work'
    });
  },

  deletePlannerNote: async (id) => {
    const { isSandboxMode, allPlannerNotes, currentPlannerNote } = get();
    if (allPlannerNotes.length <= 1) return;

    if (!isSandboxMode && isSupabaseConfigured && !id.startsWith('note-sample-') && !id.startsWith('starter-note-')) {
      await deleteSupabasePlannerNote(id);
    }

    const remaining = allPlannerNotes.filter(n => n.id !== id);
    const newCurrent = currentPlannerNote.id === id ? remaining[0] : currentPlannerNote;

    set((state) => {
      const nextState = {
        allPlannerNotes: remaining,
        currentPlannerNote: newCurrent
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
    });
  },

  finishStudyPlan: async (id) => {
    const { isSandboxMode, currentPlannerNote } = get();
    const noteToFinish = currentPlannerNote.id === id ? currentPlannerNote : DEFAULT_STARTER_NOTE;
    
    const updated = {
      ...noteToFinish,
      is_completed: true,
      updated_at: new Date().toISOString()
    };

    if (!isSandboxMode && isSupabaseConfigured && !id.startsWith('note-sample-') && !id.startsWith('starter-note-')) {
      await updateSupabasePlannerNote(id, { is_completed: true });
    }

    set((state) => {
      const nextState = {
        currentPlannerNote: updated,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === id ? updated : n)
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
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
      const nextState = {
        currentPlannerNote: updated,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updated.id ? updated : n)
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
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
      const nextState = {
        currentPlannerNote: updated,
        allPlannerNotes: state.allPlannerNotes.map(n => n.id === updated.id ? updated : n)
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
    });
  },

  updateProfile: async (profileData) => {
    const { isSandboxMode, userProfile } = get();
    if (!isSandboxMode && isSupabaseConfigured && userProfile.id && !userProfile.id.startsWith('user-trial-')) {
      await updateSupabaseProfile(userProfile.id, profileData);
    }

    set((state) => {
      const nextState = {
        userProfile: {
          ...state.userProfile,
          ...profileData
        }
      };
      if (state.isSandboxMode) saveSandboxState({ ...state, ...nextState });
      return nextState;
    });
  },

  toggleSandboxMode: (enabled) => {
    set({ isSandboxMode: enabled });
    if (!enabled && isSupabaseConfigured) {
      get().syncFromSupabase();
    }
  },

  resetSandboxData: () => {
    try {
      localStorage.removeItem(SANDBOX_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear sandbox storage:', e);
    }

    set({
      userProfile: guestProfile(),
      currentPlannerNote: guestStarterNote(),
      allPlannerNotes: [guestStarterNote()],
      recentSessions: [],
      analyticsSessions: [],
      hasMoreSessions: false,
      userCustomTemplates: [],
      selectedTemplate: DEFAULT_TEMPLATES[0],
      timeLeftSeconds: DEFAULT_TEMPLATES[0].work_duration_minutes * 60,
      isTimerRunning: false,
      timerMode: 'work',
      completedCycles: 0,
      setCompleteCelebration: false,
      stats: {
        totalFocusTimeMinutes: 0,
        completedSessionsCount: 0,
        abandonedSessionsCount: 0,
        focusScore: 100,
        streakDays: 0,
        userLevel: 1,
        userExp: 0,
        expToNextLevel: 200,
        todayFocusMinutes: 0,
        dailyGoalMinutes: 120,
        totalCompletedCycles: 0
      }
    });
  },

  // Pull latest real user data directly from Supabase Database schema v2.0
  syncFromSupabase: async () => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser.user?.id;

      // Not signed in → behave like sandbox (local persistence) instead of
      // attempting cloud writes that RLS would silently reject and lose data.
      if (!userId) {
        set({ isSandboxMode: true });
        return;
      }

      let profile = await fetchSupabaseProfile(userId);
      const usernameFromAuth = authUser.user?.user_metadata?.username || authUser.user?.email?.split('@')[0] || 'Traveller';
      const fullNameFromAuth = authUser.user?.user_metadata?.full_name || usernameFromAuth;
      if (!profile) {
        profile = await ensureSupabaseProfile({ id: userId, username: usernameFromAuth, full_name: fullNameFromAuth, daily_goal_minutes: 120, exp: 0, level: 1 });
      }

      const [notes, templates, sessions, analyticsSessions, dashboardView] = await Promise.all([
        fetchSupabasePlannerNotes(userId),
        fetchSupabaseStudyTemplates(userId),
        fetchSupabasePomodoroSessions(userId, 10),
        fetchSupabasePomodoroSessions(userId, 1000),
        fetchSupabaseDashboardView(userId)
      ]);

      // EXP reconciliation: the completed-session log is the authoritative
      // source. The DB trigger normally accumulates EXP onto profiles, but if
      // the trigger is missing (schema not applied), profiles can lag behind
      // the log — which makes EXP appear to reset on page refresh. Repair it.
      const completedAnalyticsSessions = analyticsSessions.filter((session) => session.is_completed);
      const totalExpFromSessions = completedAnalyticsSessions.reduce(
        (sum, session) => sum + (session.exp_earned ?? calculateExpForSession(session.duration_minutes)),
        0
      );
      const profileExp = dashboardView?.exp ?? profile?.exp ?? 0;
      const reconciledExp = Math.max(profileExp, totalExpFromSessions);
      const levelInfo = calculateLevelFromExp(reconciledExp);

      if (reconciledExp > profileExp) {
        await updateSupabaseProfile(userId, { exp: reconciledExp, level: levelInfo.level });
      }

      set((state) => {
        const updatedProfile: Profile = profile ? {
          ...profile,
          username: profile.username || usernameFromAuth,
          full_name: profile.full_name || fullNameFromAuth,
          exp: reconciledExp,
          level: levelInfo.level
        } : {
          id: userId,
          username: usernameFromAuth,
          full_name: fullNameFromAuth,
          daily_goal_minutes: 120,
          exp: reconciledExp,
          level: levelInfo.level
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
        const abandonedSessionsCount = analyticsSessions.length - completedAnalyticsSessions.length;
        const focusScore = analyticsSessions.length === 0
          ? 0
          : Math.round((completedAnalyticsSessions.length / analyticsSessions.length) * 100);
        const totalCompletedCycles = completedAnalyticsSessions.reduce((sum, session) => sum + (session.cycles_completed || 1), 0);

        const updatedStats: FocusStats = {
          totalFocusTimeMinutes: dashboardView?.total_focus_minutes || 0,
          completedSessionsCount: dashboardView?.total_sessions || 0,
          abandonedSessionsCount,
          focusScore,
          streakDays: dashboardView?.streak_days || 0,
          userLevel: levelInfo.level,
          userExp: levelInfo.expInLevel,
          expToNextLevel: levelInfo.expToNextLevel,
          todayFocusMinutes: dashboardView?.today_focus_minutes || 0,
          dailyGoalMinutes: dashboardView?.daily_goal_minutes || updatedProfile.daily_goal_minutes,
          totalCompletedCycles
        };

        const newSystemTemplates = updatedTemplates.length > 0 ? updatedTemplates.filter(t => t.is_system_default) : state.systemTemplates;
        const newUserCustomTemplates = updatedTemplates.filter(t => !t.is_system_default);
        const allTemplates = [...newUserCustomTemplates, ...newSystemTemplates];

        const matchedSelected = allTemplates.find(t => t.id === state.selectedTemplate.id || t.name === state.selectedTemplate.name) || newSystemTemplates[0] || DEFAULT_TEMPLATES[0];

        return {
          isSandboxMode: false,
          userProfile: updatedProfile,
          allPlannerNotes: updatedNotes,
          currentPlannerNote: updatedNotes[0],
          systemTemplates: newSystemTemplates,
          userCustomTemplates: newUserCustomTemplates,
          selectedTemplate: matchedSelected,
          timeLeftSeconds: state.isTimerRunning ? state.timeLeftSeconds : matchedSelected.work_duration_minutes * 60,
          recentSessions: updatedSessions,
          analyticsSessions,
          hasMoreSessions: updatedSessions.length === 10,
          stats: updatedStats
        };
      });
    } catch (err) {
      console.warn('Supabase sync error:', err);
    }
  }
}));
