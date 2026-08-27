import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, KeyRound, Sparkles, Brain, Loader2, RefreshCw, Rocket } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';
import {
  buildKaizenContext,
  streamKaizenReply,
  isOpenRouterConfigured,
  KAIZEN_WELCOME,
  AI_MODEL,
  KaizenChatMessage
} from '../../lib/ai';
import { insertSupabaseAIEvaluation } from '../../lib/supabase';

const SUGGESTIONS = [
  'Evaluate my study progress',
  'Review my latest reflection',
  'What should I improve?',
  'Build a weekly study plan',
  'Am I on track for my daily goal?'
];

const contextIndicator = (label: string, value: string, color: string) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/60 border border-white/5">
    <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
    <span className="text-[10px] font-semibold text-cosmic-textMuted uppercase tracking-wider">{label}</span>
    <span className="text-[11px] font-bold text-white">{value}</span>
  </div>
);

// Escape first, then convert Markdown tokens. Because every special character is
// escaped before we inject our own tags, dangerouslySetInnerHTML stays safe.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderKaizenMarkdown(text: string): string {
  let html = escapeHtml(text);

  // Bold **text** / __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // Italic *text* / _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/(^|[\s(\[])_([^_]+)_/g, '$1<em>$2</em>');
  // Inline code `code`
  html = html.replace(/`([^`\n]+)`/g, '<code class="rounded bg-slate-950/80 border border-white/10 px-1 py-0.5 text-[10px] text-purple-200">$1</code>');
  // Headings # .. / ## ...
  html = html.replace(/^(#{1,4})\s+(.*)$/gm, '<span class="block font-bold text-purple-300 uppercase tracking-wider text-[11px] mb-1">$2</span>');
  // Bullet lists: - item / * item  →  • item
  const lines = html.split('\n').map((line) => line.replace(/^\s*[-*]\s+/, '• '));
  html = lines.join('\n');
  // Preserve line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
}

export const KaizenAdvisor: React.FC = () => {
  const { userProfile, stats, allPlannerNotes, analyticsSessions, isSandboxMode } = useStudyStore();

  const [messages, setMessages] = useState<KaizenChatMessage[]>([
    { role: 'assistant', content: KAIZEN_WELCOME }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || isStreaming) return;

    setInput('');
    setError(null);

    const context = buildKaizenContext(userProfile, stats, allPlannerNotes, analyticsSessions);
    const conversation: KaizenChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages([...conversation, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    try {
      if (!isOpenRouterConfigured()) throw new Error('OPENROUTER_KEY_MISSING');

      let full = '';
      await streamKaizenReply(conversation.slice(-12), (delta) => {
        full += delta;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: full };
          return next;
        });
      });

      if (!isSandboxMode && userProfile.id && !userProfile.id.startsWith('user-trial-')) {
        await insertSupabaseAIEvaluation(userProfile.id, context, full, 'general_advice');
      }
    } catch (err: any) {
      const friendly =
        err?.message === 'OPENROUTER_KEY_MISSING'
          ? 'Kaizen needs an API key. Add VITE_OPENROUTER_API_KEY to your .env file and refresh.'
          : err?.message || 'Kaizen could not reach the AI service. Please try again.';
      setError(friendly);
      setMessages((prev) => {
        const next = [...prev];
        if (next[next.length - 1]?.role === 'assistant' && next[next.length - 1].content === '') {
          next[next.length - 1] = { role: 'assistant', content: `⚠️ ${friendly}` };
        }
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const totalSessions = analyticsSessions.filter((s) => s.is_completed).length;
  const focusHours = Math.floor((stats.totalFocusTimeMinutes || 0) / 60);
  const focusMins = (stats.totalFocusTimeMinutes || 0) % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold font-outfit text-white tracking-wide uppercase flex items-center gap-2">
        <Rocket className="w-5 h-5 text-purple-400" />
        AI ADVISOR — KAIZEN
      </h2>

      {/* Missing API Key Banner */}
      {!isOpenRouterConfigured() && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">OpenRouter API key not set</p>
            <p className="text-xs text-amber-200/80 mt-1">
              Add <code className="bg-slate-950/60 px-1.5 py-0.5 rounded">VITE_OPENROUTER_API_KEY</code> to your{' '}
              <code className="bg-slate-950/60 px-1.5 py-0.5 rounded">.env</code> file to bring Kaizen online.
            </p>
          </div>
        </div>
      )}

      {/* Kaizen Chat Card */}
      <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl shadow-glow-card overflow-hidden relative">
        {/* Ambient glow */}
        <div className="absolute inset-x-0 top-0 h-40 bg-glow-gradient opacity-40 pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between gap-4 p-5 border-b border-cosmic-border bg-slate-950/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Astronaut Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-glow-purple animate-float">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl overflow-hidden">
                  🧑‍🚀
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-outfit text-white tracking-wide uppercase">KAIZEN</h3>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                </span>
              </div>
              <p className="text-[11px] text-cosmic-textMuted">
                Space astronaut AI · {AI_MODEL}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1.5 rounded-full">
              <Brain className="w-3.5 h-3.5" />
              Reading your live study data
            </span>
          </div>
        </div>

        {/* Context Strip — proves Kaizen can see your data */}
        <div className="relative flex flex-wrap items-center gap-2 px-5 py-3 border-b border-cosmic-border bg-cosmic-bg/40">
          {contextIndicator('Notes', `${allPlannerNotes.length}`, 'bg-purple-400')}
          {contextIndicator('Sessions', `${totalSessions}`, 'bg-indigo-400')}
          {contextIndicator('Focus', `${focusHours}h ${focusMins}m`, 'bg-emerald-400')}
          {contextIndicator('Streak', `${stats.streakDays || 0}d`, 'bg-rose-400')}
          {contextIndicator('Level', `${stats.userLevel || 1}`, 'bg-yellow-400')}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="relative h-[52vh] overflow-y-auto p-5 space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="mr-2.5 w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 self-end">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-base">🧑‍🚀</div>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed break-words ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-glow-purple rounded-br-md'
                      : 'bg-slate-900/80 border border-purple-500/20 text-slate-200 rounded-bl-md'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderKaizenMarkdown(msg.content) }} />
                  )}
                  {isStreaming && idx === messages.length - 1 && msg.role === 'assistant' && (
                    <span className="inline-flex items-center gap-1 ml-1">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-300" />
                      {!msg.content && <span className="text-purple-300 animate-pulse">…</span>}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestion Chips */}
        <div className="relative px-5 pb-2 flex flex-wrap gap-2 border-t border-cosmic-border pt-3 bg-slate-950/30">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={isStreaming}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-purple-500/25 text-[11px] text-purple-200 hover:bg-purple-950/50 hover:border-purple-400/60 transition-all disabled:opacity-40"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2 p-4 border-t border-cosmic-border bg-slate-950/40"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Kaizen anything about your studies…"
            className="flex-1 bg-slate-900 border border-cosmic-border rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold tracking-wider shadow-glow-purple transition-all disabled:opacity-40"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isStreaming ? 'KAZEN IS THINKING…' : 'SEND'}</span>
          </button>
        </form>

        {error && !isStreaming && (
          <div className="relative px-5 pb-4 text-[11px] text-rose-300 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" /> {error}
          </div>
        )}
      </div>

      {/* Kaizen Assistant Footer Note */}
      <p className="text-center text-[11px] text-cosmic-textMuted flex items-center justify-center gap-1.5">
        <Bot className="w-3.5 h-3.5 text-purple-400" />
        Kaizen evaluates your planner notes, reflections &amp; statistics. Sessions are logged to ai_evaluations.
      </p>
    </div>
  );
};

export default KaizenAdvisor;