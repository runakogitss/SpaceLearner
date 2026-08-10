-- ====================================================================
-- SPACE LEARNER — SUPABASE POSTGRESQL SCHEMA  v2.0
-- ====================================================================
-- HOW TO USE:
--   Paste the entire file into Supabase Dashboard → SQL Editor → New Query
--   Safe to re-run: every statement uses IF NOT EXISTS / DROP … IF EXISTS
--   Migration guards (ALTER TABLE … ADD COLUMN IF NOT EXISTS) handle
--   existing databases from a previous schema version.
-- ====================================================================


-- ====================================================================
-- 1. EXTENSIONS
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ====================================================================
-- 2. TABLES
-- ====================================================================

-- --------------------------------------------------------------------
-- 2.1  Profiles  (mirrors auth.users, extended with gamification data)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            TEXT        UNIQUE,
  full_name           TEXT,
  avatar_url          TEXT,

  -- Study settings
  daily_goal_minutes  INT         NOT NULL DEFAULT 120
                                  CHECK (daily_goal_minutes > 0),

  -- Gamification — leveling
  exp                 INT         NOT NULL DEFAULT 0   CHECK (exp >= 0),
  level               INT         NOT NULL DEFAULT 1   CHECK (level >= 1),

  -- NOTE: exp_to_next_level is NOT stored here.
  --       Use the function public.exp_for_level(level) instead.
  --       Storing it would create a second source of truth that can drift.

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration guard: add new columns to an existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exp   INT NOT NULL DEFAULT 0   CHECK (exp >= 0);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 1   CHECK (level >= 1);
-- Remove the old drifting column if it exists (safe no-op if absent)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS exp_to_next_level;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS streak_count;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_studied_date;

-- --------------------------------------------------------------------
-- 2.2  Planner Notes
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_notes (
  id                       UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic                    TEXT        NOT NULL,
  priority_targets         TEXT[]      NOT NULL DEFAULT '{}',
  planned_duration_minutes INT         NOT NULL DEFAULT 60  CHECK (planned_duration_minutes > 0),
  content                  TEXT,
  reflection_notes         TEXT,
  is_completed             BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2.3  Study Templates  (system defaults + user-created custom timers)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_templates (
  id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- NULL user_id → system default (visible to everyone)
  user_id                UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                   TEXT        NOT NULL,
  work_duration_minutes  INT         NOT NULL CHECK (work_duration_minutes > 0),
  break_duration_minutes INT         NOT NULL CHECK (break_duration_minutes >= 0),
  cycles                 INT         NOT NULL DEFAULT 4 CHECK (cycles > 0),
  is_system_default      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.study_templates ADD COLUMN IF NOT EXISTS cycles INT NOT NULL DEFAULT 4 CHECK (cycles > 0);

-- --------------------------------------------------------------------
-- 2.4  Pomodoro Sessions  (one row per completed focus block)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Optional links — preserved as references even if the parent is deleted
  note_id          UUID        REFERENCES public.planner_notes(id) ON DELETE SET NULL,
  template_id      UUID        REFERENCES public.study_templates(id) ON DELETE SET NULL,
  subject_name     TEXT,
  duration_minutes INT         NOT NULL CHECK (duration_minutes > 0),
  break_minutes    INT         NOT NULL DEFAULT 5 CHECK (break_minutes >= 0),
  cycles_completed INT         NOT NULL DEFAULT 1 CHECK (cycles_completed >= 0),
  is_completed     BOOLEAN     NOT NULL DEFAULT TRUE,
  exp_earned       INT         NOT NULL DEFAULT 0 CHECK (exp_earned >= 0),
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pomodoro_sessions ADD COLUMN IF NOT EXISTS subject_name     TEXT;
ALTER TABLE public.pomodoro_sessions ADD COLUMN IF NOT EXISTS exp_earned       INT NOT NULL DEFAULT 0 CHECK (exp_earned >= 0);
ALTER TABLE public.pomodoro_sessions ADD COLUMN IF NOT EXISTS cycles_completed INT NOT NULL DEFAULT 1 CHECK (cycles_completed >= 0);

-- --------------------------------------------------------------------
-- 2.5  AI Evaluations  (reserved for Phase II — OpenRouter integration)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_evaluations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_context  TEXT        NOT NULL,
  ai_response     TEXT        NOT NULL,
  evaluation_type TEXT        NOT NULL DEFAULT 'general_advice',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ====================================================================
-- 3. SEED: SYSTEM-DEFAULT STUDY TEMPLATES
-- ====================================================================
INSERT INTO public.study_templates (name, work_duration_minutes, break_duration_minutes, cycles, is_system_default)
SELECT 'Standard Pomodoro',       25, 5,  4, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.study_templates WHERE name = 'Standard Pomodoro'       AND is_system_default = TRUE);

INSERT INTO public.study_templates (name, work_duration_minutes, break_duration_minutes, cycles, is_system_default)
SELECT 'IELTS / TOEFL Simulation', 45, 10, 3, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.study_templates WHERE name = 'IELTS / TOEFL Simulation' AND is_system_default = TRUE);

INSERT INTO public.study_templates (name, work_duration_minutes, break_duration_minutes, cycles, is_system_default)
SELECT 'Language Memory Burst',    20, 5,  5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.study_templates WHERE name = 'Language Memory Burst'    AND is_system_default = TRUE);

INSERT INTO public.study_templates (name, work_duration_minutes, break_duration_minutes, cycles, is_system_default)
SELECT 'Deep Work Block',          50, 10, 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.study_templates WHERE name = 'Deep Work Block'          AND is_system_default = TRUE);


-- ====================================================================
-- 4. INDEXES  (high-performance query support)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_planner_notes_user         ON public.planner_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_notes_completed     ON public.planner_notes(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user      ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_date      ON public.pomodoro_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_note      ON public.pomodoro_sessions(note_id);
CREATE INDEX IF NOT EXISTS idx_study_templates_user        ON public.study_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_study_templates_default     ON public.study_templates(is_system_default) WHERE is_system_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_level              ON public.profiles(level);


-- ====================================================================
-- 5. PURE HELPER FUNCTIONS  (no side effects, IMMUTABLE / STABLE)
-- ====================================================================

-- --------------------------------------------------------------------
-- 5.1  EXP threshold to reach the next level
--      Level N → N+1 requires  N × 200  EXP
--      Level 1→2 = 200 · Level 2→3 = 400 · Level 5→6 = 1000 ...
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.exp_for_level(lvl INT)
RETURNS INT AS $$
BEGIN
  -- Guard: level must be positive
  IF lvl < 1 THEN lvl := 1; END IF;
  RETURN lvl * 200;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- --------------------------------------------------------------------
-- 5.2  EXP awarded for a single Pomodoro session (by focus duration)
--        < 25 min  →  50 EXP
--       25–44 min  → 100 EXP
--       45+  min   → 150 EXP
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.exp_for_session(duration_mins INT)
RETURNS INT AS $$
BEGIN
  IF    duration_mins < 25 THEN RETURN 50;
  ELSIF duration_mins < 45 THEN RETURN 100;
  ELSE                          RETURN 150;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- --------------------------------------------------------------------
-- 5.3  Current level derived purely from total EXP
--      Safer than storing level — always consistent with stored exp.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.level_from_exp(total_exp INT)
RETURNS INT AS $$
DECLARE
  lvl        INT := 1;
  accumulated INT := 0;
  threshold   INT;
BEGIN
  LOOP
    threshold := public.exp_for_level(lvl);
    EXIT WHEN accumulated + threshold > total_exp OR lvl >= 1000; -- safety cap
    accumulated := accumulated + threshold;
    lvl         := lvl + 1;
  END LOOP;
  RETURN lvl;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- --------------------------------------------------------------------
-- 5.4  EXP within the current level (progress bar numerator)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.exp_in_current_level(total_exp INT)
RETURNS INT AS $$
DECLARE
  lvl        INT := 1;
  accumulated INT := 0;
  threshold   INT;
BEGIN
  LOOP
    threshold := public.exp_for_level(lvl);
    EXIT WHEN accumulated + threshold > total_exp OR lvl >= 1000;
    accumulated := accumulated + threshold;
    lvl         := lvl + 1;
  END LOOP;
  RETURN total_exp - accumulated;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- --------------------------------------------------------------------
-- 5.5  Live streak calculator  (reads from actual session log data)
--      More reliable than a stored column — never drifts on deletion.
--      Borrowed and adapted from the Hobby App pattern.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_current_streak(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER := 0;
BEGIN
  WITH
  -- One row per distinct study day
  logged_days AS (
    SELECT DISTINCT completed_at::DATE AS study_date
    FROM   public.pomodoro_sessions
    WHERE  user_id = target_user_id
      AND  is_completed = TRUE
  ),
  -- Subtract row-number (days back) to group consecutive dates into one bucket
  day_groups AS (
    SELECT
      study_date,
      study_date - (ROW_NUMBER() OVER (ORDER BY study_date DESC) * INTERVAL '1 day')::INT AS bucket
    FROM logged_days
  ),
  -- Count how many consecutive days are in each group
  streaks AS (
    SELECT
      MIN(study_date) AS streak_start,
      MAX(study_date) AS streak_end,
      COUNT(*)        AS streak_length
    FROM   day_groups
    GROUP  BY bucket
  )
  SELECT COALESCE(streak_length, 0) INTO current_streak
  FROM   streaks
  -- Only valid if the streak includes today or yesterday (still active)
  WHERE  streak_end >= CURRENT_DATE - INTERVAL '1 day'
  ORDER  BY streak_end DESC
  LIMIT  1;

  RETURN COALESCE(current_streak, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ====================================================================
-- 6. AUTO-UPDATE TRIGGERS  (keep updated_at accurate)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at      ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_planner_notes_updated_at ON public.planner_notes;
CREATE TRIGGER trg_planner_notes_updated_at
  BEFORE UPDATE ON public.planner_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ====================================================================
-- 7. LEVELING TRIGGER  (AFTER INSERT on pomodoro_sessions)
-- ====================================================================
-- Design notes:
--  • AFTER trigger avoids mutating NEW (safer pattern).
--  • Level is re-derived from total EXP via level_from_exp() —
--    no separate level column needed; profiles.level stays as a
--    denormalized cache that is always recomputed on session insert.
--  • Safety cap in level_from_exp() prevents infinite loop.
--  • Streak is read from the live function rather than a stored column.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_session_exp()
RETURNS TRIGGER AS $$
DECLARE
  v_earned_exp INT;
  v_new_total  INT;
  v_new_level  INT;
BEGIN
  -- Only process completed sessions
  IF NEW.is_completed = FALSE THEN
    RETURN NULL;
  END IF;

  -- How much EXP this session awards
  v_earned_exp := public.exp_for_session(NEW.duration_minutes);

  -- Stamp exp_earned on the freshly-inserted row
  UPDATE public.pomodoro_sessions
  SET    exp_earned = v_earned_exp
  WHERE  id = NEW.id;

  -- Compute new total EXP and derive level from it
  SELECT exp + v_earned_exp
  INTO   v_new_total
  FROM   public.profiles
  WHERE  id = NEW.user_id;

  v_new_level := public.level_from_exp(v_new_total);

  -- Persist to profile (level is a fast-read cache; streak is computed live)
  UPDATE public.profiles
  SET
    exp        = v_new_total,
    level      = v_new_level,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NULL; -- AFTER trigger ignores return value
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_session_exp ON public.pomodoro_sessions;
CREATE TRIGGER trg_session_exp
  AFTER INSERT ON public.pomodoro_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_session_exp();


-- ====================================================================
-- 8. AUTO PROFILE CREATION  (fires when a new auth user signs up)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING; -- safe on duplicate sign-up events
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auth_user_created ON auth.users;
CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ====================================================================
-- 9. ANALYTICS VIEW  (materialises common dashboard queries in one go)
-- ====================================================================
CREATE OR REPLACE VIEW public.user_study_dashboard AS
SELECT
  p.id                                                          AS user_id,
  p.full_name,
  p.level,
  p.exp,
  public.exp_for_level(p.level)                                 AS exp_to_next_level,
  public.exp_in_current_level(p.exp)                            AS exp_in_level,
  public.get_user_current_streak(p.id)                          AS streak_days,
  p.daily_goal_minutes,

  -- Planner stats
  COUNT(DISTINCT pn.id)                                          AS total_notes,
  COUNT(DISTINCT pn.id) FILTER (WHERE pn.is_completed = TRUE)   AS completed_notes,
  COUNT(DISTINCT pn.id) FILTER (WHERE pn.is_completed = FALSE)  AS pending_notes,

  -- Session stats
  COUNT(DISTINCT ps.id)                                          AS total_sessions,
  COALESCE(SUM(ps.duration_minutes), 0)                          AS total_focus_minutes,
  COALESCE(SUM(ps.duration_minutes)
    FILTER (WHERE ps.completed_at::DATE = CURRENT_DATE), 0)      AS today_focus_minutes

FROM       public.profiles p
LEFT JOIN  public.planner_notes     pn ON pn.user_id = p.id
LEFT JOIN  public.pomodoro_sessions ps ON ps.user_id = p.id AND ps.is_completed = TRUE
GROUP BY   p.id, p.full_name, p.level, p.exp, p.daily_goal_minutes;


-- ====================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_evaluations    ENABLE ROW LEVEL SECURITY;

-- ── Profiles ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING      (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Planner Notes ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "planner_notes_all_own" ON public.planner_notes;
CREATE POLICY "planner_notes_all_own"
  ON public.planner_notes FOR ALL
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Study Templates ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "study_templates_select" ON public.study_templates;
CREATE POLICY "study_templates_select"
  ON public.study_templates FOR SELECT
  TO authenticated
  USING (is_system_default = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "study_templates_insert_own" ON public.study_templates;
CREATE POLICY "study_templates_insert_own"
  ON public.study_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_system_default = FALSE);

DROP POLICY IF EXISTS "study_templates_modify_own" ON public.study_templates;
CREATE POLICY "study_templates_modify_own"
  ON public.study_templates FOR ALL
  TO authenticated
  USING      (auth.uid() = user_id AND is_system_default = FALSE)
  WITH CHECK (auth.uid() = user_id AND is_system_default = FALSE);

-- ── Pomodoro Sessions ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "pomodoro_sessions_all_own" ON public.pomodoro_sessions;
CREATE POLICY "pomodoro_sessions_all_own"
  ON public.pomodoro_sessions FOR ALL
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── AI Evaluations ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ai_evaluations_all_own" ON public.ai_evaluations;
CREATE POLICY "ai_evaluations_all_own"
  ON public.ai_evaluations FOR ALL
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
