export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  daily_goal_minutes: number;
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
  is_completed: boolean;
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
  totalFocusTimeMinutes: number; // e.g. 1122 mins = 18h 42m
  completedSessionsCount: number; // e.g. 24
  abandonedSessionsCount: number; // e.g. 4
  focusScore: number; // percentage completed ratio (e.g. 87%)
  streakDays: number; // e.g. 7
  userLevel: number; // e.g. 12
  userExp: number; // e.g. 1250 / 2000
}

export interface HeatmapCell {
  hour: number; // 0..23
  dayIndex: number; // 0..6 (Mon..Sun)
  intensity: number; // 0..4 level
}
