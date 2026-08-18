# 📊 Space Learner — Statistics & Pomodoro Engine Rebuild Specifications

> **Document Focus**: Technical specification and issue resolution plan for rebuilding the Statistics tracking module, fixing Pomodoro cycle recording, resolving the Leveling/EXP reset bug, and synchronizing the Profile Business Card with the Supabase database.

---

## 📋 Reported Issues & Functional Scope

### Issue 1: Leveling & EXP Reset Bug
- **Symptom**: After earning 100+ EXP, resetting the timer, changing presets, or refreshing the app causes EXP and level progress to be lost or reset back to initial defaults.
- **Impact**: Distorts user progress metrics, breaks streak/level gamification, and corrupts statistics dashboards.
- **Root Cause Analysis**:
  - **Metric Confusion**: `userProfile.exp` stores lifetime cumulative EXP (e.g. 850 total EXP), while `stats.userExp` stores level-relative EXP (`exp_in_level`, e.g. 50/400 EXP). Component fallbacks like `stats.userExp || userProfile.exp` misinterpreted these numbers.
  - **Sandbox Persistence Gaps**: `saveSandboxState()` in [`useStudyStore.ts`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/store/useStudyStore.ts) was missing from store state transitions (`selectTemplate`, `resetTimer`, `adjustTimerDurations`).
  - **Database Sync Overwrite**: `syncFromSupabase()` in Supabase mode asynchronously fetched profile data before the Postgres trigger `trg_session_exp` finished executing, temporarily overwriting optimistic store updates.

### Issue 2: Pomodoro Timer Cycles & Statistics Recap
- **Symptom**: Completed cycles increment in temporary timer state (`completedCycles`), but individual cycle completions and full set recaps are not saved or visualized in Statistics.
- **Requirement**: "If I finish a cycle, the records is kept in!" Ensure cycle records are logged per session and summarized in the Statistics tab.
- **Root Cause Analysis**:
  - `completeCurrentSession()` inserted `cycles_completed: 1` into `pomodoro_sessions` without updating set progress or tracking total completed cycles.
  - Statistics charts ([`FocusOverview.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/stats/FocusOverview.tsx), [`PlannerNotesRecord.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/stats/PlannerNotesRecord.tsx)) only calculated focus minutes and session counts, omitting cycle analytics.

### Issue 3: Profile Picture Business Card Database Synchronization
- **Symptom**: The Business Card popover menu accessed from the top header avatar displays stats (focus time, level, day streak, completed sessions) that drift out of sync with the Supabase database and Main Dashboard.
- **Requirement**: Ensure time, level, day streaks, and sessions on the business card remain in 100% real-time sync with the database.
- **Root Cause Analysis**:
  - `BusinessCardPopover.tsx` displayed `stats.todayFocusMinutes` without offering visibility for total lifetime study time.
  - Profile state updates in `useStudyStore` were not triggering reactive UI re-renders for popover components when Supabase Realtime fired events.

---

## 🛠️ Step-by-Step Resolution Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Unified Store State Pipeline                       │
│                        (src/store/useStudyStore.ts)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  Level & EXP Engine  │    │  Cycle Record Engine │    │ DB Sync & Business   │
│ - Lifetime EXP       │    │ - Log each cycle     │    │   Card Data Pipeline │
│ - Level-in-EXP       │    │ - Recap in Stats     │    │ - Realtime DB sync   │
│ - Persistent Sandbox │    │ - Aggregate set count│    │ - Unified popover    │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

### 1. Leveling & EXP Engine Fixes
- Standardize helper function `calculateLevelFromExp(totalExp)`:
  - `level`: Current level number ($N$)
  - `expInLevel`: $TotalEXP - \sum_{i=1}^{N-1} (i \times 200)$
  - `expToNextLevel`: $N \times 200$
- Ensure `completeCurrentSession()` updates `userProfile.exp` atomically and invokes `saveSandboxState()` on every transition.
- Ensure `syncFromSupabase()` uses database view values (`dashboardView.exp`, `dashboardView.level`, `dashboardView.exp_in_level`, `dashboardView.exp_to_next_level`) cleanly.

### 2. Pomodoro Cycle & Statistics Recap Engine
- Update `completeCurrentSession()` so that:
  - Each completed work block increments `completedCycles` and saves `cycles_completed` on the session record.
  - When target cycles are reached (e.g. 4/4 cycles), a set completion badge is recorded.
- Update `FocusOverview.tsx`:
  - Add a **Total Completed Cycles** metric card.
  - Add a cycle recap progress indicator for active planner notes.

### 3. Business Card Database Sync
- Re-bind [`BusinessCardPopover.tsx`](file:///c:/Users/Reynard%20Runako/Downloads/Space%20Learner/src/components/header/BusinessCardPopover.tsx) to normalized state metrics:
  - `level`: `stats.userLevel`
  - `currentExp` / `expToNextLevel`: `stats.userExp` / `stats.expToNextLevel`
  - `streakDays`: `stats.streakDays`
  - `completedSessions`: `stats.completedSessionsCount`
  - `focusTime`: Expose both Total Focus Time (`stats.totalFocusTimeMinutes`) and Today's Time (`stats.todayFocusMinutes`).

---

## 🎯 Verification Criteria & Test Plan

1. **EXP Bug Test**: Earn EXP -> Restart/Reset timer -> Verify level and EXP progress are retained in state and localStorage/Supabase.
2. **Cycle Recap Test**: Run Pomodoro cycles -> Verify cycle log in Recent Sessions and new Cycle Recap module in Statistics view.
3. **Business Card Sync Test**: Compare Business Card Popover metrics against Main Dashboard & Supabase `user_study_dashboard` view to ensure 100% parity.
