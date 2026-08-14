export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  daily_goal_minutes: number;
  exp?: number;
  level?: number;
  updated_at?: string;
  created_at?: string;
}

export interface PlannerNote {
  id: string;
  user_id: string;
  topic: string; // e.g. 'IELTS', 'JLPT N3', 'Mathematics'
  priority_targets: string[]; // e.g. ['Speaking', 'Listening']
  planned_duration_minutes: number;
  content: string; // Target plan summary
  reflection_notes: string; // Reflection note debrief
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudyTemplate {
  id: string;
  user_id?: string | null;
  name: string;
  work_duration_minutes: number;
  break_duration_minutes: number;
  cycles?: number;
  is_system_default: boolean;
  created_at?: string;
}

export interface PomodoroSession {
  id: string;
  user_id: string;
  note_id?: string | null;
  template_id?: string | null;
  subject_name: string;
  duration_minutes: number;
  break_minutes: number;
  cycles_completed?: number;
  is_completed: boolean;
  exp_earned?: number;
  completed_at: string;
}

export interface AIEvaluation {
  id: string;
  user_id: string;
  prompt_context: string;
  ai_response: string;
  evaluation_type: 'general_advice' | 'weekly_summary' | 'plan_review';
  created_at: string;
}

export interface FocusStats {
  totalFocusTimeMinutes: number;
  completedSessionsCount: number;
  abandonedSessionsCount: number;
  focusScore: number;
  streakDays: number;
  userLevel: number;
  userExp: number;
  expToNextLevel?: number;
  todayFocusMinutes?: number;
  dailyGoalMinutes?: number;
}

export interface HeatmapCell {
  hour: number; // 0..23
  dayIndex: number; // 0..6 (Mon..Sun)
  intensity: number; // 0..4 level
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'goal' | 'streak' | 'level' | 'quote' | 'reminder' | 'system';
  category: 'achievement' | 'reminder' | 'boost';
  timestamp: string;
  is_read: boolean;
  action_tab?: 'dashboard' | 'timer' | 'planner' | 'statistics' | 'settings';
  action_label?: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}
