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

/** Uploads an image chosen from the local computer and returns its stable URL. */
export async function uploadSupabaseAvatar(userId: string, file: File): Promise<string | null> {
  if (!supabase) return null;
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const isJpeg = extension === 'jpg' || extension === 'jpeg';
  const isAllowedImage = isJpeg || ['png', 'webp', 'gif'].includes(extension);
  if (!isAllowedImage || file.size > 5 * 1024 * 1024) return null;
  const path = `${userId}/avatar.${extension}`;
  const contentType = isJpeg ? 'image/jpeg' : (file.type || `image/${extension}`);
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType, cacheControl: '3600' });
  if (error) {
    console.error('Supabase avatar upload error:', error.message);
    return null;
  }
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

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
    .limit(1);

  if (error || !data) {
    console.warn('Supabase fetch profile error:', error?.message);
    return null;
  }
  return (data?.[0] as Profile) ?? null;
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
    .limit(1);

  if (error) {
    console.error('Supabase update profile error:', error.message);
    return null;
  }
  return (data?.[0] as Profile) ?? null;
}

/** Create a missing profile row for an authenticated account (the auth trigger is the
 * normal path, but this safely repairs accounts created before the trigger existed). */
export async function ensureSupabaseProfile(profile: Profile): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id', ignoreDuplicates: true })
    .select()
    .limit(1);

  if (error) {
    console.error('Supabase ensure profile error:', error.message);
    return null;
  }
  return (data?.[0] as Profile) ?? null;
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
    .limit(1);

  if (error) {
    console.error('Supabase insert planner note error:', error.message);
    return null;
  }
  return (data?.[0] as PlannerNote) ?? null;
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
    .limit(1);

  if (error) {
    console.error('Supabase update planner note error:', error.message);
    return null;
  }
  return (data?.[0] as PlannerNote) ?? null;
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
    .limit(1);

  if (error) {
    console.error('Supabase insert template error:', error.message);
    return null;
  }
  return (data?.[0] as StudyTemplate) ?? null;
}

export async function deleteSupabaseStudyTemplate(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('study_templates').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete template error:', error.message);
    return false;
  }
  return true;
}

/**
 * Insert a completed pomodoro session (Triggers automatic EXP & Level computation in Postgres!)
 * Returns the inserted row plus the raw error so the UI can surface diagnostics.
 */
export async function insertSupabasePomodoroSession(session: Omit<PomodoroSession, 'id' | 'completed_at'>): Promise<{ session: PomodoroSession | null; error: string | null }> {
  if (!supabase) return { session: null, error: 'Supabase is not configured.' };
  // No `.select()` / RETURNING here: some database setups (stray triggers,
  // INSTEAD OF rules) make INSERT ... RETURNING report extra rows, which
  // breaks `.single()` with "Cannot coerce the result to a single JSON
  // object". The row is still written; the next sync() returns real values.
  const { error } = await supabase
    .from('pomodoro_sessions')
    .insert([session]);

  if (error) {
    console.error('Supabase insert pomodoro session error:', error.message);
    return { session: null, error: error.message };
  }
  return {
    session: { ...session, id: `sess-${Date.now()}`, completed_at: new Date().toISOString() } as PomodoroSession,
    error: null
  };
}

/**
 * Fetch recent pomodoro sessions for user
 */
export async function fetchSupabasePomodoroSessions(userId: string, limit = 10, offset = 0): Promise<PomodoroSession[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1);

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
    .limit(1);

  if (error || !data) {
    console.warn('Supabase fetch dashboard view error:', error?.message);
    return null;
  }
  return data?.[0] ?? null;
}
