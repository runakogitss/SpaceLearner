# Statistics Update — Audit and Implementation Guide

## Purpose

This document records the current audit of the EXP and Statistics features. It is an implementation brief for an AI or developer: use it to correct data accuracy without changing the intended product behaviour unnecessarily.

**Audit status:** no application code was changed as part of this audit.

**Primary objective:** ensure every statistic shown to an authenticated user is calculated from the complete set of that user's completed sessions, with no duplicate aggregation and with a clearly defined reporting period.

## Current EXP behaviour

EXP is awarded only when a completed work session is inserted into `public.pomodoro_sessions`.

| Session duration | EXP awarded |
|---|---:|
| Under 25 minutes | 50 |
| 25–44 minutes | 100 |
| 45 minutes or more | 150 |

The PostgreSQL `AFTER INSERT` trigger (`trg_session_exp`) invokes `public.handle_session_exp()`. For a completed session, it:

1. Determines the reward with `public.exp_for_session(NEW.duration_minutes)`.
2. Writes that value to the inserted row's `exp_earned` field.
3. Adds the reward to `profiles.exp`.
4. Recalculates and stores the user's level using `public.level_from_exp()`.

Level requirements scale by the level being left:

| Transition | EXP needed for that transition |
|---|---:|
| Level 1 → 2 | 200 |
| Level 2 → 3 | 400 |
| Level 3 → 4 | 600 |
| Level *N* → *N* + 1 | *N* × 200 |

The canonical database implementation is in [supabase/schema.sql](C:/Users/Reynard%20Runako/Downloads/Space%20Learner/supabase/schema.sql).

### EXP recommendation and security caveat

For legitimate use under the current reward schedule, 45-minute completed focus blocks earn the greatest reward per completed session.

However, the current implementation is **not anti-cheat secure**:

- A custom timer can be configured for one minute and still receive 50 EXP because every duration below 25 minutes receives the same reward.
- The database calculates EXP from the duration submitted by the client; a direct client/API request can claim a completed 45-minute session immediately.
- The trigger is correct for automatic accounting, but it does not prove that the user actually spent the claimed time focusing.

If anti-cheat protection becomes a product requirement, first define the desired trust model. Possible approaches include server-issued timer start tokens, a server timestamp recorded at start and checked at completion, minimum-duration validation, and rate limits. Do not add these controls silently: they change the product's completion workflow and must be designed with offline use and abandoned timers in mind.

## Current Statistics behaviour

The Statistics UI is connected to genuine session records and is therefore visually functional. It is only partially reliable because some client queries use a limited session set and the dashboard SQL view can multiply rows.

### Confirmed working paths

- Session records are fetched from Supabase.
- Subject distribution groups completed sessions by `subject_name`.
- The heatmap groups completed sessions by day and six-hour time window.
- The weekly bar chart derives totals for the previous seven calendar days.
- Current streak, daily-goal progress, and EXP progress are read from `user_study_dashboard`.
- Session history implements a **Load more** mechanism.

## Issues to correct, in priority order

### 1. SQL can inflate focus-minute totals — highest priority

`public.user_study_dashboard` currently joins `planner_notes` and completed `pomodoro_sessions` directly to `profiles`, then aggregates with `SUM`. For a user with multiple planner notes, each matching session can appear once per note in the joined result. This can inflate both `total_focus_minutes` and `today_focus_minutes`.

**Required correction:** aggregate planner-note metrics and session metrics independently, then join the one-row-per-user summaries to `profiles`.

Recommended view shape:

```sql
CREATE OR REPLACE VIEW public.user_study_dashboard AS
WITH note_metrics AS (
  SELECT
    user_id,
    COUNT(*) FILTER (WHERE is_completed) AS completed_notes
  FROM public.planner_notes
  GROUP BY user_id
),
session_metrics AS (
  SELECT
    user_id,
    COALESCE(SUM(duration_minutes), 0) AS total_focus_minutes,
    COALESCE(SUM(duration_minutes) FILTER (
      WHERE completed_at::date = CURRENT_DATE
    ), 0) AS today_focus_minutes,
    COUNT(*) AS completed_sessions
  FROM public.pomodoro_sessions
  WHERE is_completed = TRUE
  GROUP BY user_id
)
SELECT
  p.id AS user_id,
  -- retain the existing profile, EXP, and streak columns here
  COALESCE(nm.completed_notes, 0) AS completed_notes,
  COALESCE(sm.total_focus_minutes, 0) AS total_focus_minutes,
  COALESCE(sm.today_focus_minutes, 0) AS today_focus_minutes,
  COALESCE(sm.completed_sessions, 0) AS completed_sessions
FROM public.profiles p
LEFT JOIN note_metrics nm ON nm.user_id = p.id
LEFT JOIN session_metrics sm ON sm.user_id = p.id;
```

Adapt the selected column names to the existing view and preserve its current EXP, level, goal, and streak columns. The key constraint is that each CTE returns at most one row for each `user_id` before it is joined to `profiles`.

### 2. Analytics are limited to the latest 10 sessions

`syncFromSupabase()` initially loads 10 sessions. The weekly chart, subject chart, heatmap, calendar, and streak-card day indicators use this in-memory `recentSessions` collection. Users with more than 10 recent sessions therefore see incomplete analytics even though dashboard totals may include all history.

**Required correction:** separate the data source used for session history from the data source used for analytics.

- Keep paginated `recentSessions` for the session-history interface.
- Fetch the complete period required by each chart, or query pre-aggregated analytics from Supabase.
- Never treat the first page of session history as the complete analytics dataset.

For small datasets, a bounded query covering the selected reporting period is acceptable. For larger datasets, prefer database RPCs/views that return already-aggregated daily, subject, and heatmap values.

### 3. “This Week” is not consistently filtered

The subject distribution and heatmap use whatever sessions are currently loaded, regardless of their dates. Only the weekly bar chart applies a last-seven-days filter.

**Required correction:** define one reporting-period predicate and apply it to every chart labelled “This Week.” Use completed sessions only, and make the timezone explicit.

Suggested definition: from the start of the user's current calendar week (Monday at 00:00 in the selected/user timezone) through the current instant. If the UI is meant to display a rolling seven-day period instead, rename it from “This Week” to “Last 7 Days.”

### 4. Focus Score has no meaningful calculation

During database sync, `focusScore` is assigned `100`; abandoned sessions are assigned `0`. Consequently the gauge is usually “Great Focus!” regardless of actual behaviour.

**Required correction:** choose and document a deterministic formula, then calculate it from the same reporting-period dataset as the chart.

One simple initial formula is:

```text
focus score = round(100 × completed_sessions / total_sessions)
```

This requires retaining abandoned session records. If abandoned sessions are not persisted, label the metric differently or defer it rather than presenting it as a behavioural score. Any formula should define its period, treatment of zero sessions, and display thresholds.

### 5. Calendar and streak dots inherit the 10-session limit

The calendar and day-by-day streak indicators derive from `recentSessions`, so their marked days can be incomplete. The numeric current-streak value is calculated server-side by `public.get_user_current_streak()` and is more reliable.

**Required correction:** fetch all completed study dates within the calendar's visible range (and enough preceding dates to calculate a streak), or expose a server-side daily-activity query. Continue using the server-side streak function for the headline streak until a fully equivalent, tested client calculation is required.

### 6. Verify dashboard-view access under Supabase RLS

The frontend selects from `user_study_dashboard`. Tables have RLS policies, but views have their own security behaviour depending on the Postgres/Supabase configuration.

**Required verification:** sign in as a normal authenticated user and execute the exact frontend query against the view. Confirm that it returns only that user's row and does not fail with a permission error. If changes are needed, use the least-privilege configuration supported by the deployed Supabase/Postgres version; do not expose cross-user dashboard data merely to make the view query work.

## Suggested implementation order

1. Fix and deploy the dashboard view aggregation.
2. Add regression data: one user with multiple planner notes and multiple completed sessions; verify dashboard totals equal the raw session totals exactly.
3. Define a single reporting-period utility (including timezone) for all “This Week” UI.
4. Introduce a dedicated analytics query/state, distinct from paginated session history.
5. Update subject, heatmap, weekly, calendar, and streak-dot components to use the appropriate period data.
6. Define, implement, and test the Focus Score formula—or hide/defer it until meaningful data exists.
7. Verify authenticated access to `user_study_dashboard` in the deployed Supabase project.

## Acceptance checks

Before marking the work complete, verify all of the following:

- A user with 3 planner notes and 2 completed sessions sees a focus total equal to the sum of those 2 session durations, not three times that sum.
- A user with more than 10 sessions sees the same weekly, subject, heatmap, and calendar results as an equivalent direct database query for the displayed date range.
- Every chart labelled “This Week” uses the same start/end dates and timezone.
- Incomplete sessions do not contribute to focus minutes, subject distribution, heatmap, weekly totals, calendar study-day marks, or streaks.
- The Focus Score has an explicit formula and produces a documented result when there are no sessions.
- An authenticated user can read exactly their own dashboard-view row without bypassing RLS.
- Existing EXP rewards and level progression remain unchanged unless anti-cheat work is explicitly included in scope.

## Files and code paths to inspect during implementation

- [supabase/schema.sql](C:/Users/Reynard%20Runako/Downloads/Space%20Learner/supabase/schema.sql): session table, EXP functions/trigger, analytics view, and RLS policies.
- [src/store/useStudyStore.ts](C:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/store/useStudyStore.ts): Supabase sync, paginated session state, dashboard mapping, and the current placeholder Focus Score.
- [src/lib/supabase.ts](C:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/lib/supabase.ts): session-fetch and dashboard-view queries.
- [src/components/stats/FocusOverview.tsx](C:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/stats/FocusOverview.tsx): Statistics charts and their filtering/grouping logic.
- [src/components/dashboard/CalendarWidget.tsx](C:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/dashboard/CalendarWidget.tsx) and [src/components/dashboard/StreakTrackerCard.tsx](C:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/dashboard/StreakTrackerCard.tsx): session-derived day indicators.

## Final assessment

The Statistics page is visually operational and uses real session data, but it is not yet fully reliable for users with several planner notes or more than 10 sessions. Correcting the SQL aggregation is the most important immediate change. EXP accounting is functional and automatic, but should not be treated as anti-cheat secure without a separately designed server-authoritative timer flow.
