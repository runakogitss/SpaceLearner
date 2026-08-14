import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Database, Image, LogIn, LogOut, Save, ShieldCheck, Trash2, Upload, User, UserPlus } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';
import { isSupabaseConfigured, supabase, uploadSupabaseAvatar } from '../../lib/supabase';

export const SettingsModal: React.FC = () => {
  const { userProfile, updateProfile, resetSandboxData, syncFromSupabase } = useStudyStore();
  const [username, setUsername] = useState('reynard');
  const [fullName, setFullName] = useState('Reynard Runako');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [dailyGoal, setDailyGoal] = useState('120');
  const [authUser, setAuthUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUsername(userProfile.username || 'reynard');
    setFullName(userProfile.full_name || 'Reynard Runako');
    setAvatarPreview(userProfile.avatar_url || '');
    setDailyGoal(String(userProfile.daily_goal_minutes || 120));
  }, [userProfile]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) syncFromSupabase();
    });
    return () => listener.subscription.unsubscribe();
  }, [syncFromSupabase]);

  const selectAvatar = (file: File | null) => {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) || file.size > 5 * 1024 * 1024) { setMessage({ type: 'error', text: 'Choose a JPG, PNG, WEBP, or GIF image under 5 MB.' }); return; }
    setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const encodeAvatar = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected photo.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    let avatarUrl = avatarPreview ? userProfile.avatar_url || '' : '';
    if (avatarFile) {
      if (!authUser) { setMessage({ type: 'error', text: 'Sign in before uploading a profile photo so it can be saved securely.' }); return; }
      const uploadedUrl = await uploadSupabaseAvatar(authUser.id, avatarFile);
      avatarUrl = uploadedUrl || await encodeAvatar(avatarFile);
    }
    await updateProfile({ username: username.trim() || 'reynard', full_name: fullName.trim() || 'Reynard Runako', avatar_url: avatarUrl, daily_goal_minutes: Math.max(1, Number(dailyGoal) || 120) });
    setAvatarFile(null);
    setMessage({ type: 'success', text: authUser ? 'Profile saved to your Space Learner account.' : 'Profile saved for this session.' });
  };

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true); setMessage(null);
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { username: username.trim() || email.split('@')[0], full_name: fullName.trim() || username.trim() || email.split('@')[0] } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage({ type: 'error', text: result.error.message });
    else { await syncFromSupabase(); setMessage({ type: 'success', text: authMode === 'signup' ? 'Account created. Your profile is syncing now.' : 'Welcome back. Your live data is synced.' }); }
    setLoading(false);
  };

  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setAuthUser(null); resetSandboxData(); setMessage({ type: 'success', text: 'Signed out. Welcome, Reynard.' }); };

  return <div className="max-w-5xl mx-auto space-y-6">
    <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-indigo-950/70 via-cosmic-card to-purple-950/50 p-7 shadow-glow-card">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-purple-300">Personal command centre</p>
      <h2 className="mt-2 text-2xl font-bold font-outfit tracking-wide text-white">SETTINGS &amp; PROFILE</h2>
      <p className="mt-1 text-sm text-cosmic-textMuted">Shape your study space and keep your account securely connected.</p>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <form onSubmit={saveProfile} className="lg:col-span-3 rounded-3xl border border-cosmic-border bg-cosmic-card/90 p-6 shadow-glow-card space-y-5">
        <div className="flex items-center gap-3"><div className="rounded-2xl border border-purple-400/30 bg-purple-950/70 p-3 text-purple-300"><User className="h-5 w-5" /></div><div><h3 className="text-sm font-bold tracking-wide text-white">PROFILE DETAILS</h3><p className="text-xs text-cosmic-textMuted">Visible in your personal study dashboard.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" value={username} onChange={setUsername} placeholder="reynard" />
          <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Reynard Runako" />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-cosmic-textMuted">Profile photo</label>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-purple-400/30 bg-purple-950 text-purple-200">
              {avatarPreview ? <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" /> : <Image className="h-5 w-5" />}
            </div>
            
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/50 transition-all">
              <Upload className="h-4 w-4" /> CHOOSE JPG PHOTO
              <input type="file" accept=".jpg,.jpeg,image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => selectAvatar(e.target.files?.[0] || null)} />
            </label>

            {avatarPreview && (
              <button
                type="button"
                onClick={removeAvatar}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 hover:border-rose-400/50 transition-all cursor-pointer"
                title="Remove profile photo"
              >
                <Trash2 className="h-4 w-4 text-rose-400" /> REMOVE PHOTO
              </button>
            )}

            <span className="text-[10px] text-cosmic-textMuted w-full sm:w-auto">JPG, PNG, WEBP, or GIF · 5 MB max</span>
          </div>
        </div>
        <div><div className="mb-2 flex justify-between"><label className="text-[10px] font-bold uppercase tracking-wider text-cosmic-textMuted">Daily focus goal</label><span className="text-xs font-bold text-purple-300">{dailyGoal} min</span></div><input type="range" min="15" max="360" step="15" value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)} className="w-full accent-purple-500" /><div className="mt-2 flex justify-between text-[10px] text-cosmic-textMuted"><span>15 min</span><span>6 hrs</span></div></div>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-bold tracking-wide text-white transition hover:brightness-110"><Save className="h-4 w-4" /> SAVE PROFILE</button>
      </form>

      <section className="lg:col-span-2 rounded-3xl border border-cosmic-border bg-cosmic-card/90 p-6 shadow-glow-card space-y-5">
        <div className="flex items-center gap-3"><div className="rounded-2xl border border-indigo-400/30 bg-indigo-950/70 p-3 text-indigo-300"><Database className="h-5 w-5" /></div><div><h3 className="text-sm font-bold tracking-wide text-white">ACCOUNT &amp; SYNC</h3><p className="text-xs text-cosmic-textMuted">Your data is stored privately in Supabase.</p></div></div>
        <div className={`rounded-2xl border p-4 ${authUser ? 'border-emerald-500/25 bg-emerald-950/30' : 'border-slate-700 bg-slate-950/50'}`}><div className="flex items-center gap-2 text-xs font-bold text-white"><ShieldCheck className={`h-4 w-4 ${authUser ? 'text-emerald-400' : 'text-slate-400'}`} />{authUser ? 'LIVE DATABASE CONNECTED' : 'GUEST MODE'}</div><p className="mt-1 text-[11px] text-cosmic-textMuted">{authUser ? authUser.email : 'Sign in to save your plans, sessions, statistics, and profile across devices.'}</p></div>
        {!isSupabaseConfigured ? <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200"><AlertCircle className="mr-1 inline h-4 w-4" />Add Supabase environment variables to enable accounts and cloud sync.</div> : authUser ? <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 py-2.5 text-xs font-bold text-rose-200"><LogOut className="h-4 w-4" /> SIGN OUT</button> : <form onSubmit={submitAuth} className="space-y-3"><div className="flex rounded-xl bg-slate-950 p-1"><button type="button" onClick={() => setAuthMode('signin')} className={`flex-1 rounded-lg py-2 text-xs font-bold ${authMode === 'signin' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>LOG IN</button><button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 rounded-lg py-2 text-xs font-bold ${authMode === 'signup' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>CREATE ACCOUNT</button></div><input required type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-cosmic-border bg-slate-950/70 px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"/><input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-cosmic-border bg-slate-950/70 px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"/><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">{authMode === 'signin' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{loading ? 'CONNECTING…' : authMode === 'signin' ? 'LOG IN' : 'CREATE ACCOUNT'}</button></form>}
        {message && <div className={`rounded-xl border p-3 text-xs ${message.type === 'success' ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200' : 'border-rose-500/30 bg-rose-950/40 text-rose-200'}`}>{message.type === 'success' ? <CheckCircle className="mr-1 inline h-4 w-4" /> : <AlertCircle className="mr-1 inline h-4 w-4" />}{message.text}</div>}
      </section>
    </div>
  </div>;
};

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder: string }> = ({ label, value, onChange, placeholder }) => <div><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-cosmic-textMuted">{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-cosmic-border bg-slate-950/70 px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500" /></div>;
