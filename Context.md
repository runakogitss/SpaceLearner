# 🚀 Space Learner — AI Context & System Architecture Document

> **Document Purpose**: This file serves as a comprehensive context primer for AI models, agents, and developers to instantly understand the business domain, system architecture, database design, feature set, code organization, and development roadmap of the **Space Learner** application.

---

## 📌 Executive Summary

**Space Learner** is a student-first web application designed to help learners plan, execute, analyze, and optimize their study routines. Built around a cosmic space-themed user interface, the application bridges structured time-management (Pomodoro technique with exam-specific presets) with qualitative study planning (Planner & Reflection Notes), gamified motivation (XP & Levels), visual analytics (streaks, heatmap, focus scores), and upcoming AI-driven study advising (Phase II OpenRouter integration).

---

## 🎯 Target Audience & Core Use Cases

- **Exam Preparation Students**: Candidates studying for standardized tests such as **IELTS**, **TOEFL**, **JLPT**, **SAT**, or university exams requiring test-simulated focus blocks (e.g. 45-minute focus intervals).
- **Language Learners**: Students utilizing spaced repetition and short memory bursts (e.g. 20-minute focus blocks).
- **STEM & Math Students**: Learners engaging in deep problem-solving requiring extended focus blocks (e.g. 50-minute work blocks + 10-minute breaks).
- **Self-Directed & General Learners**: Anyone wanting to replace unstructured study sessions with clear targets, reflections, daily streak goals, and gamified progress tracking.

---

## 🧭 System Architecture & Tech Stack

```
                               ┌───────────────────────────────────────────┐
                               │            React 18 + Vite 6              │
                               │      (TypeScript 5.7, Tailwind 3.4)       │
                               └─────────────────────┬─────────────────────┘
                                                     │
                                       ┌─────────────┴─────────────┐
                                       ▼                           ▼
                        ┌──────────────────────────────┐ ┌──────────────────────────────┐
                        │   Zustand 5 State Management │ │      Recharts Analytics      │
                        │ (useStudyStore, Notification)│ │ (Pie, Bar, Custom Heatmap)   │
                        └──────────────┬───────────────┘ └──────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
                ▼ (Supabase Configured)                       ▼ (Sandbox / Fallback Mode)
┌───────────────────────────────────────────────┐ ┌───────────────────────────────────────────┐
│        Supabase Backend Services              │ │     Local Persistence Layer               │
│ - PostgreSQL DB with RLS & Triggers           │ │ - Browser localStorage                    │
│ - Supabase Auth (Email / Password)            │ │   (space_learner_sandbox_state_v1)        │
│ - Supabase Storage (avatars bucket, max 5MB)  │ └───────────────────────────────────────────┘
│ - Realtime Subscriptions (postgres_changes)   │
└──────────────────────┬────────────────────────┘
                       │ (Phase II Roadmap)
                       ▼
┌───────────────────────────────────────────────┐
│          OpenRouter AI Advisor API            │
│ (Study Plan Generator, Debrief Evaluator)     │
└───────────────────────────────────────────────┘
```

| Layer | Technology / Tools | Details & Responsibilities |
|---|---|---|
| **Frontend Framework** | React 18.3 + Vite 6.1 | Single-Page Application (SPA) with fast HMR |
| **Language** | TypeScript 5.7 | Strict type safety for entities (`Profile`, `PlannerNote`, `PomodoroSession`, `StudyTemplate`, `FocusStats`) |
| **Styling & UI Components** | Tailwind CSS 3.4 + Lucide React | Custom cosmic design tokens (`bg-cosmic-bg`, `bg-cosmic-card`, `border-cosmic-border`, `shadow-glow-purple`) |
| **State Management** | Zustand 5 | `useStudyStore.ts` (timer, notes, sessions, stats, profile), `useNotificationStore.ts`, `useSearchStore.ts` |
| **Database & Auth** | Supabase (PostgreSQL 15+) | Multi-tenant PostgreSQL DB with RLS policies, automated triggers, stored procedures, Auth, and Storage |
| **Realtime Engine** | Supabase Realtime | Live `postgres_changes` listener in `App.tsx` keeping profiles, notes, sessions, and templates synced across tabs/devices |
| **Data Visualization** | Recharts 2 | Responsive charts for subject distribution pie chart, weekly focus bar chart, and custom SVG heatmap grid |
| **AI Layer (Phase II)** | OpenRouter API | Configured via `VITE_OPENROUTER_API_KEY` for context-aware study plans & debrief reviews |
| **Deployment** | Vercel | Production static build configured via `vercel.json` SPA routing rewrite |

---

## 🗄️ Database Schema & Server-Side Logic

The relational database is built on **Supabase PostgreSQL**. The schema script is stored at [`supabase/schema.sql`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/supabase/schema.sql).

### Key Tables

```
                    ┌─────────────────────────┐
                    │      auth.users         │
                    └────────────┬────────────┘
                                 │ (1:1 Cascade)
                                 ▼
                    ┌─────────────────────────┐
                    │     public.profiles     │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │ (1:N)                 │ (1:N)                 │ (1:N)
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  planner_notes   │    │ study_templates  │    │pomodoro_sessions │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │ (0..1:N)              │ (0..1:N)              │
         └───────────────────────┴───────────────────────┘
```

1. **`public.profiles`**: Stores user accounts, daily focus target (`daily_goal_minutes`, default 120), accumulated `exp`, derived `level`, avatar URL, and timestamps.
2. **`public.planner_notes`**: Stores pre-session study plans and post-session reflection debriefs.
   - Core fields: `topic`, `priority_targets` (TEXT array), `planned_duration_minutes`, `content`, `reflection_notes`, `is_completed`.
3. **`public.study_templates`**: Stores Pomodoro preset configurations.
   - System defaults (`user_id IS NULL`, `is_system_default = TRUE`) vs user-created custom presets.
   - Fields: `name`, `work_duration_minutes`, `break_duration_minutes`, `cycles`.
4. **`public.pomodoro_sessions`**: Logs every completed focus block.
   - Fields: `note_id` (FK optional), `template_id` (FK optional), `subject_name`, `duration_minutes`, `break_minutes`, `cycles_completed`, `exp_earned`, `completed_at`.
5. **`public.ai_evaluations`**: Reserved for Phase II OpenRouter prompt and response logs.
   - Fields: `prompt_context`, `ai_response`, `evaluation_type` (`general_advice`, `weekly_summary`, `plan_review`).
6. **`storage.avatars`**: Public Supabase Storage bucket for user profile pictures (max 5 MB; mime types: `jpeg`, `png`, `webp`, `gif`).

### Database Functions & Automated Triggers

- **Level & EXP Calculation**:
  - `exp_for_level(lvl INT)`: Returns `lvl * 200`. (Level 1→2: 200 XP, Level 2→3: 400 XP, etc.)
  - `exp_for_session(duration_mins INT)`: Awards 50 XP (< 25 min), 100 XP (25–44 min), or 150 XP (45+ min).
  - `level_from_exp(total_exp INT)`: Pure immutable function deriving level from total EXP.
  - `exp_in_current_level(total_exp INT)`: Calculates progress within the current level boundary.
- **Live Streak Calculator**:
  - `get_user_current_streak(target_user_id UUID)`: Queries distinct completed session dates, calculates consecutive study days using window functions, and verifies active status (includes today or yesterday).
- **Triggers**:
  - `trg_session_exp`: `AFTER INSERT ON pomodoro_sessions` → automatically calculates earned session EXP, updates `pomodoro_sessions.exp_earned`, and re-computes `profiles.exp` & `profiles.level`.
  - `trg_auth_user_created`: `AFTER INSERT ON auth.users` → auto-creates `public.profiles` entry.
  - `trg_profiles_updated_at` / `trg_planner_notes_updated_at`: Automatically stamps `updated_at = NOW()`.
- **View**:
  - `public.user_study_dashboard`: Aggregates user profile metrics, planner note counts (total, completed, pending), total focus time, and today's focus minutes in a single query.

---

## 🎨 UI Theme & Navigation Structure

### Cosmic Theme Palette
- **Background**: Deep space obsidian `#0B0F19` (`bg-cosmic-bg`)
- **Card Surfaces**: Translucent cosmic navy `#111827` / `#161F33` (`bg-cosmic-card`)
- **Borders & Accents**: Neon violet / purple glow (`border-cosmic-border`, `shadow-glow-purple`, `text-purple-400`)
- **Typography**: Clean sans-serif with Outfit display headings (`font-outfit`)

### Navigation Architecture (`activeTab` in Store)

The application features 5 primary views accessible via the persistent `Sidebar` and `ShortcutsCard`:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                               Sidebar Nav                               │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│  Dashboard   │  Timer View  │ Planner View │  Statistics  │  Settings   │
│ (`dashboard`)│  (`timer`)   │ (`planner`)  │(`statistics`)│(`settings`) │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴──────┬──────┘
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
 Quick Stats,    Full-screen    Full-page      Focus charts,  Profile, avatar,
 Timer+Planner,  presets with   planner with   notes history, daily goals,
 Overview,       custom creator pre/post notes session logs  auth controls
 Calendar,                      & reflection
 Streak & Quote
```

---

## 💡 Feature Breakdown

### 1. 🕐 Pomodoro Focus Timer & Presets
- **Built-in Exam Presets**:
  - **Standard Pomodoro**: 25 min work / 5 min break (4 cycles)
  - **IELTS / TOEFL Simulation**: 45 min work / 10 min break (3–4 cycles) — simulates real test sections.
  - **Language Memory Burst**: 20 min work / 5 min break (5 cycles) — optimized for spaced repetition memory.
  - **Deep Work Block (Math/STEM)**: 50 min work / 10 min break (2 cycles) — deep problem solving.
- **Custom Presets**: Users can create, save, and delete custom timers with specific work/break durations and target cycles.
- **Live Control**: Play, pause, reset, mode toggle (work vs break), cycle counter.
- **Completion Flow**: Finishing a focus session opens the **Reflection Note Modal**, persists the session to Supabase / localStorage, and awards XP.

### 2. 📓 Planner's Note & Reflection System
- **Pre-Study Setup**:
  - **Topic/Subject**: e.g., `IELTS`, `JLPT N3`, `Mathematics`.
  - **Priority Targets**: Array tags (e.g. `['Speaking', 'Listening', 'Grammar']`).
  - **Planned Duration**: Estimated time in minutes.
  - **Content Summary**: Free-text goal statement.
- **Post-Study Reflection**:
  - **Reflection Notes**: Debrief field for recording notes on what went well, difficulties encountered, and takeaways.
  - **Completion Toggle**: Marks note as complete (`is_completed = true`).
- **Integration**: Active planner note auto-populates the timer card's subject context.

### 3. 📊 Analytics & Trackers
- **Streak Tracker**: Tracks consecutive study days with active status checking.
- **Subject Distribution (Pie Chart)**: Shows percent split of focus time across subjects.
- **Weekly Focus Breakdown (Bar Chart)**: Visualizes focus minutes per day for the current week.
- **Optimal Hours Heatmap**: 24-hour x 7-day grid showing peak focus hours based on historical completed session timestamps.
- **Focus Score**: Calculates ratio of completed vs. abandoned Pomodoro sessions (`(completed / total) * 100`).
- **Daily Progress Bar**: Tracks today's total focus minutes against the user's personal `daily_goal_minutes`.

### 4. 🎮 Gamification & Leveling
- **XP Calculation**: Awarded upon session completion based on duration.
- **Leveling Curve**: Threshold formula `Level N -> N+1 = N * 200 EXP`.
- **Level-Up Overlay**: Triggers a celebratory `🚀 Achievement Unlocked` modal when advancing levels.
- **Header XP Bar**: Persistent level & XP progress indicator in the top header.

### 5. 🔔 Notifications & Daily Motivation
- **Daily Motivational Modal**: Pops up on first daily visit with inspirational quote pool ([`data/quotes.ts`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/data/quotes.ts)).
- **Toast Notifications**: In-app feedback for actions (saving notes, creating presets, leveling up).
- **Header Notification Center**: Bell icon dropdown listing achievements, streak updates, and system alerts.

### 6. ⚙️ Settings & User Management
- Profile editing (username, full name, daily goal minutes).
- Avatar picture upload to Supabase Storage `avatars` bucket with preview caching.
- Auth Modal for Email/Password sign-up and login via Supabase Auth.
- Dual Operating Modes:
  - **Supabase Mode**: When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present.
  - **Sandbox Fallback Mode**: When Supabase is unconfigured, stores data locally in `localStorage` (`space_learner_sandbox_state_v1`).

---

## 📁 Source Code Organization

```
space-learner/
├── index.html                           # Entry HTML template
├── package.json                         # Dependencies & scripts
├── vite.config.ts                       # Vite bundler configuration
├── tailwind.config.js                   # Tailwind CSS cosmic theme extensions
├── vercel.json                          # Vercel deployment & routing config
├── .env                                 # Environment keys (Supabase & OpenRouter)
├── env keys placeholder.example         # Template env file
├── supabase/
│   └── schema.sql                       # Complete PostgreSQL schema, tables, RLS & triggers
├── src/
│   ├── App.tsx                          # Core application shell, grid layout, tab switcher & realtime listener
│   ├── main.tsx                         # React root entry point
│   ├── index.css                        # Tailwind CSS imports & global design tokens
│   ├── vite-env.d.ts                    # Vite TypeScript environment declarations
│   ├── types/
│   │   └── index.ts                     # TypeScript interfaces (Profile, PlannerNote, PomodoroSession, etc.)
│   ├── lib/
│   │   └── supabase.ts                  # Supabase client initializer & database/storage API helper functions
│   ├── store/
│   │   ├── useStudyStore.ts             # Central Zustand store (Timer, Planner, Sessions, Stats, Sandbox fallback)
│   │   ├── useNotificationStore.ts      # Notifications state & toast manager
│   │   └── useSearchStore.ts            # Global search & filter state
│   ├── data/
│   │   └── quotes.ts                    # Daily motivational quotes data pool
│   └── components/
│       ├── Header.tsx                   # Top navigation header with user level, XP progress & notifications
│       ├── Sidebar.tsx                  # Left navigation bar with main view icons
│       ├── QuickStatsBar.tsx            # Metric cards row (Streak, Focus Time, Focus Score, Daily Goal)
│       ├── timer/
│       │   └── PomodoroTimerCard.tsx    # Interactive focus timer widget & preset selector
│       ├── planner/
│       │   └── PlannerNoteCard.tsx      # Planner note editor & reflection debrief input
│       ├── stats/
│       │   ├── FocusOverview.tsx        # Recharts visual analytics (Pie, Bar, Heatmap)
│       │   └── PlannerNotesRecord.tsx   # Browsable record list of completed & active planner notes
│       ├── dashboard/
│       │   ├── CalendarWidget.tsx       # Mini study calendar widget
│       │   ├── StreakTrackerCard.tsx    # Streak count display card
│       │   ├── ShortcutsCard.tsx        # Quick view navigation shortcuts
│       │   ├── MotivationalQuoteCard.tsx# Daily quote widget
│       │   └── RecentSessions.tsx       # List of recent completed Pomodoro sessions
│       ├── auth/
│       │   └── AuthModal.tsx            # Supabase Email/Password authentication modal
│       ├── settings/
│       │   └── SettingsModal.tsx        # Profile settings & avatar uploader modal
│       ├── header/
│       │   ├── BusinessCardPopover.tsx  # User profile summary popover
│       │   ├── CommandPaletteModal.tsx  # Quick command launcher
│       │   └── NotificationDropdown.tsx# Notification bell menu dropdown
│       ├── modals/
│       │   └── DailyMotivationalModal.tsx# Startup daily motivational popup
│       └── notifications/
│           └── ToastContainer.tsx       # Floating toast alert manager
└── markdown phases for implementation/
    ├── database_implementation.md      # Detailed DB integration notes
    └── statistics_update.md            # Statistical calculations reference
```

---

## 🗺️ Product Roadmap & Development Phases

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE I — Core Infrastructure & Features (COMPLETE ✅)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ • React 18 + Vite 6 + Tailwind CSS cosmic theme                                │
│ • Pomodoro Timer with exam presets (IELTS, TOEFL, Language, Deep Work)          │
│ • Planner Notes with pre-study goals and post-study reflection debriefs         │
│ • Focus stats (Streak counter, Pie chart, Bar chart, Heatmap, Focus score)      │
│ • Gamification engine (XP rewards, level-up trigger & celebration modal)       │
│ • Full Supabase DB schema, RLS policies, Storage avatar bucket, Realtime sync  │
│ • Local Sandbox mode fallback for offline / unconfigured operation               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE II — AI Advisor Integration (NEXT RELEASE 🔜)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ • Integration with OpenRouter API using VITE_OPENROUTER_API_KEY                │
│ • Study Plan Generator: Converts vague goals ("Pass JLPT N3 in 3 months") into  │
│   weekly Pomodoro schedule templates                                            │
│ • Session Debrief Evaluator: Analyzes reflection notes and suggests schedule    │
│   adjustments based on student fatigue / performance                            │
│ • Context-Aware Payload: Bundles recent focus stats and planner notes into the   │
│   AI prompt payload for personalized coaching                                   │
│ • AI Evaluation Log table (`public.ai_evaluations`) integration                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE III — UI Refinements & Production Deployment (PLANNED 🔜)                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ • Final UI polish & accessibility enhancements                                 │
│ • Full end-to-end testing across browser viewports                              │
│ • Production deployment to Vercel via vercel.json SPA configuration             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Instructions for AI Models Working on this Repository

When inspecting or modifying this codebase, follow these rules:

1. **State Modifications**:
   - Primary application state is managed centrally via Zustand in [`src/store/useStudyStore.ts`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/store/useStudyStore.ts).
   - Any modifications to session completions, timer logic, notes, or profile fields should execute through store actions to maintain synchronization between reactive state, Supabase database, and Sandbox `localStorage`.

2. **Database Integrity**:
   - Table schemas, constraints, and stored procedures reside in [`supabase/schema.sql`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/supabase/schema.sql).
   - Note that EXP and Level logic is mirrored in both Postgres PL/pgSQL triggers (`handle_session_exp`) and TypeScript helper functions (`calculateExpForSession`, `calculateLevelFromExp`) to support both Supabase and Sandbox modes seamlessly.

3. **Styling Guidelines**:
   - Maintain the cosmic space theme palette using Tailwind tokens: `bg-cosmic-bg`, `bg-cosmic-card`, `border-cosmic-border`, `text-slate-100`, `text-cosmic-textMuted`, and `shadow-glow-purple`.
   - Use `Lucide React` icons for visual elements.

4. **Phase II AI Extensions**:
   - Place any upcoming OpenRouter API helper routines under `src/lib/openrouter.ts` or `src/lib/ai.ts`.
   - Ensure AI responses are logged to `public.ai_evaluations` when Supabase is connected.
