import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Sparkles, CheckCircle, AlertCircle, Rocket, LogOut, Lock, Mail } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useStudyStore } from '../../store/useStudyStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, toggleSandboxMode, syncFromSupabase } = useStudyStore();

  const [authUser, setAuthUser] = useState<any>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setAuthUser(data.user);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthUser(session?.user || null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email || !password) return;

    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const uName = username.trim() || email.split('@')[0];
        const fName = fullName.trim() || uName;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: uName,
              full_name: fName
            }
          }
        });

        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else if (data.user) {
          setMessage({ type: 'success', text: 'Account created! Logging you in...' });
          toggleSandboxMode(false);
          await syncFromSupabase();
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else if (data.user) {
          setMessage({ type: 'success', text: 'Welcome back! Synced with Supabase.' });
          toggleSandboxMode(false);
          await syncFromSupabase();
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Authentication error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthUser(null);
    setMessage({ type: 'success', text: 'Logged out. Switched back to Trial Sandbox mode.' });
    toggleSandboxMode(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-cosmic-card border border-purple-500/30 rounded-3xl p-6 shadow-glow-purple overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/60 border border-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-glow-purple">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-outfit text-white tracking-wide uppercase">
              SPACE LEARNER AUTH
            </h3>
            <p className="text-xs text-cosmic-textMuted">
              Sign in to sync your study goals &amp; progress live to the cloud.
            </p>
          </div>
        </div>

        {/* Logged-In User State */}
        {authUser ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/20 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-purple-900/60 border border-purple-400/40 flex items-center justify-center text-xl shadow-glow-purple">
                🧑‍🚀
              </div>
              <div className="text-sm font-bold text-white">
                {userProfile.full_name || userProfile.username || authUser.email}
              </div>
              <div className="text-xs text-cosmic-textMuted">
                {authUser.email}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
                <CheckCircle className="w-3 h-3" /> LIVE CLOUD SYNC ACTIVE
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" /> SIGN OUT OF ACCOUNT
            </button>
          </div>
        ) : (
          <div>
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-slate-900/80 p-1 border border-white/5 mb-5">
              <button
                type="button"
                onClick={() => { setMode('signin'); setMessage(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signin'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> LOG IN
              </button>

              <button
                type="button"
                onClick={() => { setMode('signup'); setMessage(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> CREATE ACCOUNT
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                      Full Name / Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Reynard Runako"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Reynard"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-900 border border-cosmic-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-cosmic-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-cosmic-textMuted uppercase block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-cosmic-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success' 
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-glow-purple disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>AUTHENTICATING...</span>
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" /> LOG IN TO SPACE LEARNER
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> CREATE MY ACCOUNT
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-cosmic-textMuted">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" /> Powered by Supabase PostgreSQL
          </span>
          <button
            onClick={() => {
              toggleSandboxMode(true);
              onClose();
            }}
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Continue as Guest Trial
          </button>
        </div>
      </div>
    </div>
  );
};
