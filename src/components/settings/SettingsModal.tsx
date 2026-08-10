import React, { useState } from 'react';
import { User, Database, Sparkles, Key, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';
import { isSupabaseConfigured } from '../../lib/supabase';

export const SettingsModal: React.FC = () => {
  const { userProfile, updateProfile, isSandboxMode, toggleSandboxMode } = useStudyStore();
  
  const [username, setUsername] = useState(userProfile.username || 'Reynard');
  const [fullName, setFullName] = useState(userProfile.full_name || 'Reynard Runako');
  const [dailyGoal, setDailyGoal] = useState(userProfile.daily_goal_minutes.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      username,
      full_name: fullName,
      daily_goal_minutes: parseInt(dailyGoal, 10) || 120
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold font-outfit text-white tracking-wide uppercase">
          SETTINGS &amp; INTEGRATIONS
        </h2>
        <p className="text-xs text-cosmic-textMuted">
          Manage profile preferences, database connection, and trial sandbox mode.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings Card */}
        <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-6 shadow-glow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-outfit text-white">PROFILE ACCESS</h3>
              <p className="text-[11px] text-cosmic-textMuted">Student info &amp; daily goal</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                Username / Display Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                Daily Study Goal (Minutes)
              </label>
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>SETTINGS SAVED!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE PROFILE</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Database & Trial Sandbox Card */}
        <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-6 shadow-glow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-outfit text-white">DATABASE &amp; SANDBOX</h3>
                <p className="text-[11px] text-cosmic-textMuted">Supabase &amp; offline mode</p>
              </div>
            </div>

            {/* Trial Sandbox Toggle */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-white">TRIAL SANDBOX MODE</span>
                </div>
                <button
                  onClick={() => toggleSandboxMode(!isSandboxMode)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                    isSandboxMode ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isSandboxMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-cosmic-textMuted leading-relaxed">
                When enabled, trial sandbox operates in local memory. Once you set up Supabase SQL and verify testing, toggle off or delete trial mode.
              </p>
            </div>

            {/* Integration Status Indicators */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-200 font-medium">Supabase Database SQL</span>
                </div>
                {isSupabaseConfigured ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" /> CONNECTED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" /> TRIAL SANDBOX ACTIVE
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-200 font-medium">OpenRouter AI API Key</span>
                </div>
                <span className="text-[10px] font-semibold text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  PHASE II READY
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-cosmic-textMuted italic mt-4 pt-3 border-t border-white/5">
            SQL File available at <code className="text-purple-300">supabase/schema.sql</code>
          </p>
        </div>
      </div>
    </div>
  );
};
