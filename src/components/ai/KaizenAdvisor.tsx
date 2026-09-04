import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, KeyRound, Sparkles, Brain, Loader2, RefreshCw, Rocket, ChevronDown } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';
import {
  buildKaizenContext,
  streamKaizenReply,
  isAIConfigured,
  getAIProviders,
  KAIZEN_WELCOME,
  KAIZEN_PROVIDER_STORAGE_KEY,
  AIProviderInfo,
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

// Inline formatting: bold, italic, links, and inline code (code spans are
// protected with placeholders so ** or * inside them stay literal).
function applyInline(html: string): string {
  const codeSpans: string[] = [];
  let s = html.replace(/`([^`\n]+)`/g, (_m, code: string) => {
    codeSpans.push(code);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/(^|[\s(\[])_([^_]+)_/g, '$1<em>$2</em>');
  s = s.replace(
    /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-300 underline decoration-purple-500/50 hover:text-white">$1</a>'
  );

  s = s.replace(/\u0000(\d+)\u0000/g, (_m, idx: string) => {
    const code = codeSpans[Number(idx)] || '';
    return `<code class="rounded bg-slate-950/80 border border-white/10 px-1 py-0.5 text-[10px] text-purple-200">${code}</code>`;
  });

  return s;
}

function renderTableRow(cells: string[], tag: 'th' | 'td'): string {
  const cls =
    tag === 'th'
      ? 'px-2 py-1.5 border-b-2 border-purple-500/30 text-left font-bold text-purple-200 uppercase tracking-wider text-[10px]'
      : 'px-2 py-1.5 border-b border-white/10 text-left align-top text-slate-200';
  return `<tr>${cells.map((c) => `<${tag} class="${cls}">${applyInline(c)}</${tag}>`).join('')}</tr>`;
}

function renderTable(tableLines: string[]): string {
  const rows = tableLines
    .map((line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim()))
    .filter((cells) => cells.length > 0 && !cells.every((c) => /^:?-{2,}:?$/.test(c)));

  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  return (
    '<div class="overflow-x-auto my-2"><table class="w-full text-left border-collapse text-[11px]">' +
    `<thead>${renderTableRow(header, 'th')}</thead>` +
    `<tbody>${body.map((r) => renderTableRow(r, 'td')).join('')}</tbody>` +
    '</table></div>'
  );
}

function processLine(line: string): string {
  let s = line;
  s = s.replace(/^(#{1,4})\s+(.*)$/, '<span class="block font-bold text-purple-300 uppercase tracking-wider text-[11px] mb-1">$2</span>');
  s = s.replace(/^\s*[-*]\s+/, '• ');
  return applyInline(s);
}

function renderKaizenMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  const lines = escaped.split('\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(paragraph.join('<br/>'));
      paragraph = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block ```lang ... ```
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      flushParagraph();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        `<pre class="my-2 rounded-xl bg-slate-950/80 border border-purple-500/20 p-3 overflow-x-auto text-[11px] leading-relaxed text-purple-100">${codeLines.join('\n')}</pre>`
      );
      continue;
    }

    // Table block: consecutive rows starting with '|'
    if (line.trim().startsWith('|')) {
      flushParagraph();
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const table = renderTable(tableLines);
      if (table) blocks.push(table);
      continue;
    }

    // Blockquote block: consecutive lines starting with '>'
    if (line.trim().startsWith('&gt;')) {
      flushParagraph();
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('&gt;')) {
        quoteLines.push(lines[i].replace(/^\s*&gt;\s*/, ''));
        i++;
      }
      blocks.push(
        `<blockquote class="my-2 border-l-2 border-purple-500/50 pl-3 text-slate-300">${quoteLines.map(processLine).join('<br/>')}</blockquote>`
      );
      continue;
    }

    paragraph.push(processLine(line));
    i++;
  }
  flushParagraph();

  return blocks.join('<br/>');
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

  // Provider switcher: registry comes from .env, selection is remembered locally.
  const [providers] = useState<AIProviderInfo[]>(() => getAIProviders());
  const [activeProviderId, setActiveProviderId] = useState<string>(() => {
    const saved = localStorage.getItem(KAIZEN_PROVIDER_STORAGE_KEY);
    const envDefault = import.meta.env.VITE_AI_ACTIVE_PROVIDER || '';
    return saved || envDefault || getAIProviders()[0]?.id || '';
  });
  const activeProvider = providers.find((p) => p.id === activeProviderId) || providers[0];

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
      if (!activeProvider) throw new Error('AI_NOT_CONFIGURED');

      let full = '';
      await streamKaizenReply(conversation.slice(-12), (delta) => {
        full += delta;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: full };
          return next;
        });
      }, activeProvider);

      if (!isSandboxMode && userProfile.id && !userProfile.id.startsWith('user-trial-')) {
        await insertSupabaseAIEvaluation(userProfile.id, context, full, 'general_advice');
      }
    } catch (err: any) {
      const friendly =
        err?.message === 'AI_NOT_CONFIGURED'
          ? 'No AI provider is configured. Add VITE_AI_PROVIDER_<ID>_BASE_URL and VITE_AI_PROVIDER_<ID>_MODEL to your .env file and refresh.'
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

      {/* Missing AI Config Banner */}
      {!isAIConfigured() && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">AI advisor not configured</p>
            <p className="text-xs text-amber-200/80 mt-1">
              Add a provider to your <code className="bg-slate-950/60 px-1.5 py-0.5 rounded">.env</code> file, e.g.{' '}
              <code className="bg-slate-950/60 px-1.5 py-0.5 rounded">VITE_AI_PROVIDER_OPENROUTER_BASE_URL</code> +{' '}
              <code className="bg-slate-950/60 px-1.5 py-0.5 rounded">_MODEL</code> (API keys are injected server-side).
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
                Space astronaut AI · {activeProvider?.model || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Provider Switcher */}
            {providers.length > 1 && (
              <div className="relative">
                <select
                  value={activeProvider?.id || ''}
                  onChange={(e) => {
                    setActiveProviderId(e.target.value);
                    localStorage.setItem(KAIZEN_PROVIDER_STORAGE_KEY, e.target.value);
                  }}
                  disabled={isStreaming}
                  className="appearance-none bg-indigo-950/70 border border-purple-500/30 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-purple-300 focus:outline-none focus:border-purple-400 cursor-pointer"
                  title="Switch AI provider"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-purple-300 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1.5 rounded-full">
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