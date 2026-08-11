# 🚀 Space Learner — Database Implementation Context
**Model Context Document · v1.0 · August 2026**

> This document is written for an AI coding assistant to understand the full product, its current database state, what has been implemented, and what remains to be built.
> Always read this file first before making any code changes to this project.

---

## 1. What Is This Product?

**Space Learner** (internal codename: *Reynard*) is a **gamified study productivity web application** built with:

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + TypeScript + Vite |
| Styling | Vanilla CSS with Tailwind-inspired utility classes |
| State Management | Zustand (`src/store/useStudyStore.ts`) |
| Backend / Database | Supabase (PostgreSQL + Auth + RLS) |
| Deployment | Vercel |
| Charts / Analytics | Recharts |

### Core Concept

Space Learner helps students (e.g., IELTS, JLPT, university exams) plan their study sessions, track focus time via a Pomodoro timer, and **level up** as they complete study blocks — like an RPG for studying.

### Key User Flows

1. **User registers / logs in** via `AuthModal.tsx` (email + password, Supabase Auth)
2. Supabase trigger `trg_auth_user_created` → auto-creates `profiles` row for new user
3. On app mount → `syncFromSupabase()` fetches live data from Supabase and populates Zustand store
4. User selects a **Planner Note** (study subject + targets) and starts the **Pomodoro Timer**
5. On session completion → `insertSupabasePomodoroSession()` → PostgreSQL trigger `trg_session_exp` auto-computes EXP and level
6. Dashboard syncs live stats from `user_study_dashboard` Postgres view
7. Offline users work in **Sandbox Mode** (local memory, no Supabase writes)

---

## 2. Frontend Features Implemented

### ✅ Authentication System
- **`src/components/auth/AuthModal.tsx`** — Full login + register modal (email/password)
- **`src/components/Header.tsx`** — Prominent `LOG IN / SIGN UP` button that opens AuthModal
- **`src/components/settings/SettingsModal.tsx`** — Sign Out button + `RESET SANDBOX TO FRESH STATE` button

### ✅ Dashboard Tab
- `QuickStatsBar.tsx` — Level, EXP, streak, daily goal progress at top of every screen
- `PlannerNoteCard.tsx` (compact mode) — Today's plan summary with dropdown plan switcher
- `PomodoroTimerCard.tsx` — Active countdown timer preview on dashboard
- `RecentSessions.tsx` — Last 4 sessions in grid card layout

### ✅ Pomodoro Timer Tab
- Full Pomodoro countdown timer with Work / Break mode auto-switching
- Template selector (Standard Pomodoro, IELTS Simulation, Language Memory Burst, Deep Work)
- Cycle tracker (e.g., 4 cycles × 25 min)
- **Reflection modal** — On session complete, prompts user for a post-study reflection note

### ✅ Planner Notes Tab
- Full CRUD for planner notes (Create, Read, Update, Delete)
- Multiple plans per user, topic switcher tabs
- Fields: Topic, Priority Targets (array), Planned Duration, Content/Goals, Reflection Notes, Completion status
- **Synced with Timer** — Creating a note auto-updates the Pomodoro timer's subject name and duration

### ✅ Statistics Tab
- `FocusOverview.tsx` — Pie chart of subject breakdown + heatmap grid
- `RecentSessions.tsx` — Full session history with icons

### ✅ Sandbox Mode
- Sandbox toggle in Settings — runs entirely on local Zustand memory
- Fresh state guaranteed on first load when no Supabase data exists
- `resetSandboxData()` action resets all local state to clean defaults

### ✅ Reactive Bug Fixes (Latest)
- `PlannerNoteCard.tsx` — Added `activeNote` fallback object; added `useEffect` to sync form state when `currentPlannerNote` changes
- Guaranteed `currentPlannerNote` is never `null` by generating a starter note when Supabase returns 0 rows

---

## 3. Database Features Implemented (Schema v2.0)

> **File:** [`supabase/schema.sql`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/supabase/schema.sql)
> Safe to re-run: uses `IF NOT EXISTS` and migration guards throughout.

### 3.1 Tables

| Table | Purpose |
|---|---|
| `public.profiles` | One row per user. Stores EXP, Level, daily goal, avatar. Mirrors `auth.users`. |
| `public.planner_notes` | User's study plan entries. Array of priority targets. |
| `public.study_templates` | System defaults + user-created Pomodoro timer presets. |
| `public.pomodoro_sessions` | One row per completed focus block. Linked to note and template. |
| `public.ai_evaluations` | Reserved for Phase II AI coaching integration (OpenRouter). |

### 3.2 PostgreSQL Functions (UDFs)

| Function | Type | Purpose |
|---|---|---|
| `exp_for_level(lvl INT)` | IMMUTABLE | EXP required to reach next level: `lvl × 200` |
| `exp_for_session(mins INT)` | IMMUTABLE | EXP awarded per session: 50 / 100 / 150 by duration |
| `level_from_exp(total_exp INT)` | IMMUTABLE | Derives level from total EXP. Safety cap at lvl 1000. |
| `exp_in_current_level(total_exp INT)` | IMMUTABLE | Progress bar numerator (EXP within current level) |
| `get_user_current_streak(user_id UUID)` | STABLE | Live streak calculator from session log. Never drifts. |
| `set_updated_at()` | Trigger UDF | Auto-sets `updated_at` on profile + note updates |
| `handle_session_exp()` | Trigger UDF | On session insert: computes EXP, stamps `exp_earned`, updates profile |
| `handle_new_user()` | Trigger UDF | On `auth.users` INSERT: auto-creates a `profiles` row |

### 3.3 Triggers

| Trigger | Table | When | Effect |
|---|---|---|---|
| `trg_auth_user_created` | `auth.users` | AFTER INSERT | Creates `profiles` row for new sign-up |
| `trg_session_exp` | `pomodoro_sessions` | AFTER INSERT | Awards EXP + updates level on profile |
| `trg_profiles_updated_at` | `profiles` | BEFORE UPDATE | Stamps `updated_at` |
| `trg_planner_notes_updated_at` | `planner_notes` | BEFORE UPDATE | Stamps `updated_at` |

### 3.4 Analytics View

| View | Columns | Purpose |
|---|---|---|
| `public.user_study_dashboard` | `user_id, level, exp, exp_to_next_level, exp_in_level, streak_days, daily_goal_minutes, total_notes, completed_notes, pending_notes, total_sessions, total_focus_minutes, today_focus_minutes` | Single-query dashboard aggregation for stats panel |

### 3.5 Row Level Security (RLS)

All tables have RLS enabled. Policies:
- `profiles` — SELECT + UPDATE own row only
- `planner_notes` — ALL ops on own rows
- `study_templates` — SELECT system defaults OR own; INSERT/UPDATE/DELETE own (non-system) only
- `pomodoro_sessions` — ALL ops on own rows
- `ai_evaluations` — ALL ops on own rows

### 3.6 Supabase API Helpers

> **File:** [`src/lib/supabase.ts`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/lib/supabase.ts)

| Helper Function | Operation |
|---|---|
| `fetchSupabaseProfile(userId)` | SELECT profile |
| `updateSupabaseProfile(userId, fields)` | UPDATE profile |
| `fetchSupabasePlannerNotes(userId)` | SELECT all notes |
| `insertSupabasePlannerNote(note)` | INSERT note |
| `updateSupabasePlannerNote(id, fields)` | UPDATE note |
| `deleteSupabasePlannerNote(id)` | DELETE note |
| `fetchSupabaseStudyTemplates(userId)` | SELECT system + user templates |
| `insertSupabaseStudyTemplate(template)` | INSERT custom template |
| `insertSupabasePomodoroSession(session)` | INSERT session (triggers EXP) |
| `fetchSupabasePomodoroSessions(userId, limit)` | SELECT recent sessions |
| `fetchSupabaseDashboardView(userId)` | SELECT from `user_study_dashboard` |

---

## 4. What Remains To Be Implemented

### 4.1 🔴 HIGH PRIORITY — Sandbox UI Contamination (Must Fix)

The sandbox mode sandbox data still visually bleeds into the live Supabase interface. Specifically:

- [ ] **Remove placeholder/hardcoded mock sessions** from `RecentSessions.tsx` when `isSandboxMode = false` and `recentSessions` is empty — show an **empty state UI** instead of fake data
- [ ] **Clear heatmap mock data** in `FocusOverview.tsx` — the heatmap matrix (`heatmapMatrix`) is currently hardcoded. Wire it to real session timestamps from `recentSessions` store
- [ ] **Clear placeholder subject breakdown** in `FocusOverview.tsx` — show empty state when user has no sessions
- [ ] **Sandbox badge indicator** — when `isSandboxMode = true`, show a clear orange `SANDBOX MODE` badge in the Header or QuickStatsBar so users know they're not connected to the database

### 4.2 🔴 HIGH PRIORITY — Database Features Not Yet Wired

- [ ] **Session history pagination** — `fetchSupabasePomodoroSessions` only fetches last 10. Add a "Load More" or paginated view in Statistics tab
- [ ] **Real streak display** — QuickStatsBar shows a hardcoded streak. Wire it to `streak_days` from `user_study_dashboard` view
- [ ] **Real daily goal progress** — Wire `today_focus_minutes` and `daily_goal_minutes` from dashboard view to the progress bar in `QuickStatsBar.tsx`
- [ ] **Real EXP progress bar** — Wire `exp_in_level` and `exp_to_next_level` from dashboard view to the XP bar in `QuickStatsBar.tsx`
- [ ] **Delete custom study template** — There is no UI button to delete user-created templates. Add one in the Timer tab template list
- [ ] **Planner note → session auto-link** — When a session is saved, `note_id` is not currently passed to `insertSupabasePomodoroSession`. Wire `currentPlannerNote.id` → `note_id` on session insert

### 4.3 🟡 MEDIUM PRIORITY — Analytics Upgrades

- [ ] **Real heatmap from session data** — Replace `heatmapMatrix` hardcoded array with a query grouping `recentSessions` by day-of-week and hour-of-day
- [ ] **Weekly focus minutes chart** — Add a `LineChart` or `BarChart` in Statistics for total focus minutes per day over the past 7 days
- [ ] **Per-subject session breakdown** — Group `recentSessions` by `subject_name` for the pie chart, rather than using planner note planned durations
- [ ] **Level-up celebration animation** — Detect level increase after `syncFromSupabase()` post-session and show a modal or confetti burst

### 4.4 🟡 MEDIUM PRIORITY — Profile & Settings

- [ ] **Username save to database** — `SettingsModal.tsx` has a username field but it is not wired to `updateSupabaseProfile()`
- [ ] **Avatar URL field** — Add an avatar URL input in Settings and wire to `profiles.avatar_url`
- [ ] **Daily goal minutes save** — The daily goal slider/input in Settings should call `updateSupabaseProfile({ daily_goal_minutes })` on save
- [ ] **Profile insert on first login** — If `fetchSupabaseProfile` returns null (profile row missing), auto-insert one using the session user's metadata before proceeding

### 4.5 🟢 LOW PRIORITY / PHASE II — AI Integration (JUST DO IT LATER)

- [ ] **AI Evaluation calls** — `public.ai_evaluations` table is already created. Wire a backend edge function or OpenRouter API call to analyze planner reflection notes and return feedback
- [ ] **AI Study Coach modal** — Display AI feedback in a new coach modal (similar to the reflection modal pattern)

---

## 5. Key File Map

| File | Role |
|---|---|
| [`supabase/schema.sql`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/supabase/schema.sql) | Full PostgreSQL schema v2.0 |
| [`src/lib/supabase.ts`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/lib/supabase.ts) | All Supabase API helper functions |
| [`src/store/useStudyStore.ts`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/store/useStudyStore.ts) | Zustand state, `syncFromSupabase()`, all actions |
| [`src/types/index.ts`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/types/index.ts) | TypeScript interfaces: Profile, PlannerNote, StudyTemplate, PomodoroSession |
| [`src/App.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/App.tsx) | Root app, calls `syncFromSupabase()` on mount |
| [`src/components/auth/AuthModal.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/auth/AuthModal.tsx) | Login / Register modal |
| [`src/components/Header.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/Header.tsx) | Top bar with auth trigger |
| [`src/components/planner/PlannerNoteCard.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/planner/PlannerNoteCard.tsx) | Full planner notes CRUD UI |
| [`src/components/dashboard/RecentSessions.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/dashboard/RecentSessions.tsx) | Recent sessions grid |
| [`src/components/stats/FocusOverview.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/stats/FocusOverview.tsx) | Pie chart + heatmap (partially hardcoded) |
| [`src/components/QuickStatsBar.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/QuickStatsBar.tsx) | Level / EXP / streak bar (partially hardcoded) |
| [`src/components/settings/SettingsModal.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/settings/SettingsModal.tsx) | Settings panel with auth + sandbox controls |

---

## 6. Design & Coding Constraints

> Always follow these rules when implementing changes:

1. **ALL CAPS MUST BE STRUCTURED** — any label, button text, or section heading shown in ALL CAPS must use proper tracking/letter-spacing classes.
2. **No placeholder data in live mode** — when `isSandboxMode = false`, components must show real data or a proper empty state. Never show mock arrays in production.
3. **Dual-mode compatibility** — every data mutation must branch on `isSandboxMode`:
   - `true` → update Zustand state only (local memory)
   - `false` → call Supabase helper, then sync back via `syncFromSupabase()`
4. **Never mutate `currentPlannerNote` directly** — always go through store actions (`updatePlannerNote`, `selectPlannerNote`, etc.)
5. **Build verification** — always run `npm run build` after file changes to confirm TypeScript and bundling pass before reporting completion.

---

## 7. Environment Variables

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

> Stored in `.env` at project root. Never commit to git.
> `isSupabaseConfigured` in `src/lib/supabase.ts` guards against placeholder values.

---

*Last updated: 2026-08-10 · Space Learner Database Implementation Context v1.0*
