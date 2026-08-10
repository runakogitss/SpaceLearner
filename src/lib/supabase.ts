import { createClient } from '@supabase/supabase-js';
import { Profile, PlannerNote, StudyTemplate, PomodoroSession } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  Boolean(supabaseUrl) && 
  supabaseUrl !== 'https://placeholder-project.supabase.co' &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey !== 'placeholder-anon-key';

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ====================================================================
// SUPABASE DATABASE API HELPERS
// ====================================================================

/**
 * Fetch profile for given user ID
 */
export async function fetchSupabaseProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('Supabase fetch profile error:', error?.message);
    return null;
  }
  return data as Profile;
}

/**
 * Update user profile
 */
export async function updateSupabaseProfile(userId: string, fields: Partial<Profile>): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...fields,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Supabase update profile error:', error.message);
    return null;
  }
  return data as Profile;
}

/**
 * Fetch all planner notes for current user
 */
export async function fetchSupabasePlannerNotes(userId: string): Promise<PlannerNote[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('planner_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('Supabase fetch planner notes error:', error?.message);
    return [];
  }
  return data as PlannerNote[];
}

/**
 * Insert a new planner note
 */
export async function insertSupabasePlannerNote(note: Omit<PlannerNote, 'id' | 'created_at' | 'updated_at'>): Promise<PlannerNote | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('planner_notes')
    .insert([note])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert planner note error:', error.message);
    return null;
  }
  return data as PlannerNote;
}

/**
 * Update a planner note (e.g. reflection notes, duration, completion)
 */
export async function updateSupabasePlannerNote(id: string, fields: Partial<PlannerNote>): Promise<PlannerNote | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('planner_notes')
    .update({
      ...fields,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase update planner note error:', error.message);
    return null;
  }
  return data as PlannerNote;
}

/**
 * Delete a planner note
 */
export async function deleteSupabasePlannerNote(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('planner_notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase delete planner note error:', error.message);
    return false;
  }
  return true;
}

/**
 * Fetch system and user study templates
 */
export async function fetchSupabaseStudyTemplates(userId: string): Promise<StudyTemplate[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('study_templates')
    .select('*')
    .or(`is_system_default.eq.true,user_id.eq.${userId}`)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.warn('Supabase fetch templates error:', error?.message);
    return [];
  }
  return data as StudyTemplate[];
}

/**
 * Insert a custom study template
 */
export async function insertSupabaseStudyTemplate(template: Omit<StudyTemplate, 'id' | 'created_at'>): Promise<StudyTemplate | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('study_templates')
    .insert([template])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert template error:', error.message);
    return null;
  }
  return data as StudyTemplate;
}

/**
 * Insert a completed pomodoro session (Triggers automatic EXP & Level computation in Postgres!)
 */
export async function insertSupabasePomodoroSession(session: Omit<PomodoroSession, 'id' | 'completed_at'>): Promise<PomodoroSession | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert([session])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert pomodoro session error:', error.message);
    return null;
  }
  return data as PomodoroSession;
}

/**
 * Fetch recent pomodoro sessions for user
 */
export async function fetchSupabasePomodoroSessions(userId: string, limit = 10): Promise<PomodoroSession[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.warn('Supabase fetch sessions error:', error?.message);
    return [];
  }
  return data as PomodoroSession[];
}

/**
 * Fetch dashboard view stats for user from `user_study_dashboard`
 */
export async function fetchSupabaseDashboardView(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_study_dashboard')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.warn('Supabase fetch dashboard view error:', error?.message);
    return null;
  }
  return data;
}
