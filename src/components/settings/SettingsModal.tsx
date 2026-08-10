import React, { useState, useEffect } from 'react';
import { User, Database, Sparkles, Key, CheckCircle, AlertCircle, Save, LogIn, LogOut, UserPlus, RefreshCw } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export const SettingsModal: React.FC = () => {
  const { userProfile, updateProfile, isSandboxMode, toggleSandboxMode, resetSandboxData, syncFromSupabase } = useStudyStore();
  
  const [username, setUsername] = useState(userProfile.username || 'Reynard');
  const [fullName, setFullName] = useState(userProfile.full_name || 'Reynard Runako');
  const [dailyGoal, setDailyGoal] = useState(userProfile.daily_goal_minutes.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Sync state if userProfile changes
  useEffect(() => {
    setUsername(userProfile.username || 'Reynard');
    setFullName(userProfile.full_name || 'Reynard Runako');
    setDailyGoal((userProfile.daily_goal_minutes || 120).toString());
  }, [userProfile]);

  // Auth State
  const [authUser, setAuthUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setAuthUser(data.user);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthUser(session?.user || null);
        if (session?.user) {
          syncFromSupabase();
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [syncFromSupabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      username,
      full_name: fullName,
      daily_goal_minutes: parseInt(dailyGoal, 10) || 120
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetSandbox = () => {
    resetSandboxData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email || !password) return;

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: email.split('@')[0],
              full_name: email.split('@')[0]
            }
          }
        });

        if (error) {
          setAuthMessage({ type: 'error', text: error.message });
        } else if (data.user) {
          setAuthMessage({ type: 'success', text: 'Account created! Authenticated & synced with Supabase.' });
          toggleSandboxMode(false);
          await syncFromSupabase();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          setAuthMessage({ type: 'error', text: error.message });
        } else if (data.user) {
          setAuthMessage({ type: 'success', text: 'Logged in successfully! Fresh profile synced.' });
          toggleSandboxMode(false);
          await syncFromSupabase();
        }
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err?.message || 'Authentication error' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthUser(null);
    setAuthMessage({ type: 'success', text: 'Logged out. Switched back to Sandbox mode.' });
    toggleSandboxMode(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold font-outfit text-white tracking-wide uppercase">
          SETTINGS &amp; INTEGRATIONS
        </h2>
        <p className="text-xs text-cosmic-textMuted">
          Manage profile preferences, database connection, and auth synchronization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings Card */}
        <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-6 shadow-glow-card flex flex-col justify-between">
          <div>
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

          <div className="pt-4 mt-6 border-t border-white/5">
            <button
              onClick={handleResetSandbox}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-semibold transition-all"
            >
              {resetSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">DATA RESTARTED!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>RESET SANDBOX TO FRESH STATE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Database & Supabase Auth Card */}
        <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-6 shadow-glow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-outfit text-white">DATABASE &amp; AUTH</h3>
                <p className="text-[11px] text-cosmic-textMuted">Supabase real-time cloud sync</p>
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
                {isSandboxMode 
                  ? 'Running in trial mode. Logging in or toggling off syncs your data live with PostgreSQL.' 
                  : 'Connected to Supabase PostgreSQL schema v2.0 live cloud storage.'}
              </p>
            </div>

            {/* Supabase Account Authentication Box */}
            {isSupabaseConfigured && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/20 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-outfit text-purple-300 uppercase flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" /> SUPABASE AUTHENTICATION
                  </span>
                  {authUser && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-semibold">
                      LOGGED IN
                    </span>
                  )}
                </div>

                {authUser ? (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-300">
                      Signed in as <span className="text-white font-medium">{authUser.email}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" /> SIGN OUT
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="space-y-2.5">
                    <div>
                      <input
                        type="email"
                        placeholder="Supabase user email..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all disabled:opacity-50"
                      >
                        {authMode === 'signin' ? (
                          <>
                            <LogIn className="w-3.5 h-3.5" /> Log In
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" /> Sign Up
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                        className="text-[11px] text-purple-400 hover:text-purple-300 underline px-2"
                      >
                        {authMode === 'signin' ? 'Need an account?' : 'Already have account?'}
                      </button>
                    </div>
                  </form>
                )}

                {authMessage && (
                  <div className={`p-2 rounded-lg text-[11px] ${
                    authMessage.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                  }`}>
                    {authMessage.text}
                  </div>
                )}
              </div>
            )}

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
            SQL Schema v2.0 synchronized with <code className="text-purple-300">supabase/schema.sql</code>
          </p>
        </div>
      </div>
    </div>
  );
};
