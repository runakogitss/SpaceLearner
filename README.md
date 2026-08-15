
<div align="center">

# 🚀 Space Learner

**Your Cosmic Study Companion — a student-first productivity app built for focus, planning, and progress.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.49-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)

</div>

---

## 📖 Overview

**Space Learner** is a student productivity web application designed to help you study smarter — not harder. Built on a cosmic space UI theme, it combines a Pomodoro-based focus timer with structured study planning, detailed analytics, and a gamification system that rewards your consistency.

Whether you're preparing for **IELTS**, **JLPT**, cramming for a **university exam**, or following any structured learning goal, Space Learner gives you the tools to plan, execute, and reflect on every study session.

> **Current Phase:** Phase I — Core interface, features, and database integration are complete.

---

## ✨ Features

### 🕐 Pomodoro Timer
A fully-featured focus timer with built-in **study presets** tuned for real exam conditions:

| Template | Work Block | Break | Purpose |
|---|---|---|---|
| **IELTS / TOEFL** | 45 min | 10 min | Simulates real test-section blocks |
| **Language Studies** | 20 min | 5 min | Spaced repetition memory cycles |
| **Mathematics** | 50 min | 10 min | Deep work for problem-solving |
| **Classic Pomodoro** | 25 min | 5 min | Standard productivity technique |
| **Custom Preset** | User-defined | User-defined | Fully configurable |

- ⏯️ Start, pause, and reset at any time
- 🔄 Configurable target cycle count per session
- ➕ Create, save, and delete custom timer presets
- 📈 Completed sessions are automatically saved to the database with EXP rewards

---

### 📓 Planner's Note
A structured study planning journal with pre/post session reflection:

**Planning fields:**
- **Topic / Subject** — e.g., `IELTS`, `JLPT N3`, `Mathematics`
- **Priority Targets** — e.g., `Speaking`, `Listening`, `Grammar`
- **Planned Duration** — target study hours for the session
- **Content Summary** — free-text goal description

**After your session:**
- ✍️ Write a **Reflection Note** — debrief your progress, difficulties, and wins
- ✅ Mark the note as completed when your session is done
- 📚 All notes are stored in Supabase and browsable in the Statistics tab

---

### 📊 Focus Trackers & Analytics

Space Learner tracks everything so you can improve over time:

- **Streak Tracker** — counts consecutive days where you completed at least one study session
- **Subject Distribution Pie Chart** — shows what % of your time went to each subject this week
- **Weekly Focus Bar Chart** — daily minutes breakdown for the current week
- **Optimal Hours Heatmap** — a visual grid showing which time-of-day windows you are most productive across the week
- **Focus Score** — ratio of completed vs. abandoned Pomodoro cycles
- **Today's Progress Bar** — shows daily focus minutes vs. your personal daily goal

---

### 🎮 Gamification System
Stay motivated with a built-in XP and leveling system:

- **EXP earned per session** based on duration (50 / 100 / 150 XP)
- **Level progression** — each level requires `N × 200 EXP` to advance
- **Level-Up Modal** — a celebratory overlay fires every time you level up (`🚀 Achievement Unlocked`)
- **XP progress bar** shown in the header so you always know how close you are to the next level

---

### 🔔 Notifications & Motivation
- **Daily Motivational Modal** — a rotating inspirational quote greets you on your first visit of the day
- **Toast Notifications** — real-time success/info/warning toasts for in-app actions
- **Notification Center** (in Header) — surfaced alerts for streaks, goal achievements, and level-ups

---

### ⚙️ Settings
- 🔐 Authentication via Database Authentication (Email / Password)
- 🖼️ Upload a profile picture (avatar stored in Database Storage (Supabase), max 5 MB)
- 🎯 Set a custom **Daily Goal** (in minutes)
- 👤 Edit your username and display name

---

### 🤖 AI Advisor *(Coming in Phase II)*
An AI-powered study coach, powered by **OpenRouter**, planned for the next release:

| Feature | Description |
|---|---|
| **Study Plan Generator** | Converts vague goals (e.g. *"Pass JLPT N3 in 3 months"*) into a weekly Pomodoro schedule |
| **Session Debrief Evaluator** | Reads your reflection notes and suggests schedule adjustments |
| **Context-Aware Advisor** | Sends recent stats + notes in context so advice is personalised to *your* data |

---

## 🗂️ App Structure (Navigation)

The app has **5 main views** accessible via the left Sidebar and the Shortcuts widget:

| View | Route Key | Contents |
|---|---|---|
| **Dashboard** | `dashboard` | Quick Stats Bar, Timer + Planner side-by-side, Focus Overview, Recent Sessions, Calendar, Streak, Shortcuts, Motivational Quote |
| **Pomodoro Timer** | `timer` | Full-screen timer with all presets |
| **Planner's Note** | `planner` | Full-page planning + reflection note editor |
| **Statistics** | `statistics` | Focus Overview charts, Planner Notes Record, Recent Sessions |
| **Settings** | `settings` | Profile, avatar, daily goal, auth |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + Vite 6 |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS 3.4 (custom `cosmic-*` design tokens) |
| **State Management** | Zustand 5 |
| **Database & Auth** | Supabase (PostgreSQL + Auth + Storage) |
| **Charts** | Recharts 2 |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## 🗄️ Database Schema

Space Learner uses **Supabase (PostgreSQL)** with the following core tables:

```
public.profiles          — User account, daily goal, EXP, level, avatar
public.planner_notes     — Study plan entries with reflection notes
public.study_templates   — Pomodoro presets (system defaults + user custom)
public.pomodoro_sessions — Individual focus session records with EXP tracking
public.ai_evaluations    — (Phase II) AI advisor prompt/response history
storage.avatars          — Profile picture uploads (public bucket)
```

> The schema file is located at [`supabase/schema.sql`](supabase/schema.sql). It is idempotent — safe to re-run at any time.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) project

### 1. Clone & install

```bash
git clone https://github.com/your-username/space-learner.git
cd space-learner
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your credentials:

```bash
cp "env keys placeholder.example" .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENROUTER_API_KEY=           # Leave blank — used in Phase II
VITE_ENABLE_SANDBOX_MODE=false     # Set to true for offline demo mode
```

> **Sandbox Mode**: Setting `VITE_ENABLE_SANDBOX_MODE=true` lets you run the app without Supabase. Data is persisted in `localStorage` only.

### 3. Apply the database schema

1. Open your **Supabase Dashboard → SQL Editor → New Query**
2. Paste the full contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Click **Run**

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Build & Deploy

### Build production bundle
```bash
npm run build
```
Output is placed in the `dist/` folder.

### Deploy to Vercel

The project includes a [`vercel.json`](vercel.json) with SPA routing configuration:

```json
{
  "version": 2,
  "builds": [{ "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } }],
  "routes": [{ "src": "/(.*)", "dest": "/index.html" }]
}
```

**Steps:**
1. Push your repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add your environment variables in **Project Settings → Environment Variables**
4. Deploy 🚀

---

## 📁 Project Structure

```
space-learner/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── vercel.json
├── supabase/
│   └── schema.sql               # Full PostgreSQL schema
├── src/
│   ├── App.tsx                  # Root layout + tab routing
│   ├── main.tsx
│   ├── index.css                # Tailwind base + cosmic design tokens
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces (Profile, PlannerNote, PomodoroSession…)
│   ├── lib/
│   │   └── supabase.ts          # Supabase client + all DB/Storage helpers
│   ├── store/
│   │   ├── useStudyStore.ts     # Core Zustand store (timer, notes, sessions, stats)
│   │   ├── useNotificationStore.ts
│   │   └── useSearchStore.ts
│   ├── data/
│   │   └── quotes.ts            # Motivational quote pool
│   └── components/
│       ├── Header.tsx           # Sticky greeting header + XP bar + notification bell
│       ├── Sidebar.tsx          # Left nav with tab icons
│       ├── QuickStatsBar.tsx    # Top row of metric cards on Dashboard
│       ├── timer/
│       │   └── PomodoroTimerCard.tsx
│       ├── planner/
│       │   └── PlannerNoteCard.tsx
│       ├── stats/
│       │   ├── FocusOverview.tsx      # Charts: pie, bar, heatmap
│       │   └── PlannerNotesRecord.tsx
│       ├── dashboard/
│       │   ├── CalendarWidget.tsx
│       │   ├── StreakTrackerCard.tsx
│       │   ├── ShortcutsCard.tsx      # Quick navigation shortcuts
│       │   ├── MotivationalQuoteCard.tsx
│       │   └── RecentSessions.tsx
│       ├── auth/
│       │   └── AuthModal.tsx
│       ├── settings/
│       │   └── SettingsModal.tsx
│       ├── modals/
│       │   └── DailyMotivationalModal.tsx
│       └── notifications/
│           └── ToastContainer.tsx
└── markdown phases for implementation/
    ├── database_implementation.md
    └── statistics_update.md
```

---

## 🗺️ Development Roadmap

| Phase | Status | Goal |
|---|---|---|
| **Phase I** | ✅ Complete | Core UI, Pomodoro Timer, Planner Notes, Statistics, Gamification, Supabase integration |
| **Phase II** | 🔜 Planned | AI Advisor via OpenRouter — Study Plan Generator & Session Debrief Evaluator |
| **Phase III** | 🔜 Planned | UI revisions, polish, and production deployment to Vercel |

---

## 🤝 Contributing

This is currently a personal/educational project. Contributions, feedback, and suggestions are welcome via GitHub Issues.

---

## 📄 License

MIT License — see `LICENSE` for details.

---

<div align="center">
  Made with 💜 and ☕ — built to help students reach orbit.
</div>