import { Profile, PlannerNote, PomodoroSession, FocusStats } from '../types';

// ====================================================================
// KAIZEN — SPACE LEARNER AI STUDY ADVISOR
// Provider-agnostic OpenAI-compatible client. Providers are registered in
// `.env` as a named registry (only base URL + model reach the browser —
// API keys stay server-side in the proxy / serverless function):
//   VITE_AI_PROVIDER_<ID>_BASE_URL
//   VITE_AI_PROVIDER_<ID>_MODEL
//   VITE_AI_PROVIDER_<ID>_KEY   (server-side only; falls back per provider)
// ====================================================================

export interface AIProviderInfo {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
}

export const KAIZEN_PROVIDER_STORAGE_KEY = 'kaizen_active_provider';

/**
 * Builds the list of available AI providers from `.env`.
 * Add a provider by adding its `VITE_AI_PROVIDER_<ID>_BASE_URL` +
 * `VITE_AI_PROVIDER_<ID>_MODEL` lines — it appears in the switcher automatically.
 */
export function getAIProviders(): AIProviderInfo[] {
  const providers: AIProviderInfo[] = [];

  const orBase = import.meta.env.VITE_AI_PROVIDER_OPENROUTER_BASE_URL;
  const orModel = import.meta.env.VITE_AI_PROVIDER_OPENROUTER_MODEL;
  if (orBase && orModel) providers.push({ id: 'openrouter', label: 'OpenRouter', baseUrl: orBase, model: orModel });

  return providers;
}

/** True when at least one AI provider is configured. */
export function isAIConfigured(): boolean {
  return getAIProviders().length > 0;
}

export interface KaizenChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const KAIZEN_WELCOME =
  "Hi, I'm Kaizen 🧑‍🚀 — your cosmic study co-pilot. I'm reading your planner notes, reflections, and focus statistics so my advice actually fits your study life. Ask me to evaluate your progress, review a reflection, or build a weekly study plan.";

export const KAIZEN_SYSTEM_PROMPT = `You are Kaizen, a warm, encouraging space-astronaut AI study advisor inside the Space Learner app.
You coach students by grounding every answer in the live study data provided in the conversation context (planner notes, reflections, focus statistics, recent sessions).

Rules:
- Always reference the student's actual data: subjects, target goals, reflections, streak, focus score, total focus time, today's goal progress, and recent sessions.
- Give concrete, actionable advice (e.g. split long blocks, balance weak subjects, adjust durations, improve reflection habits).
- Keep responses concise (about 150-250 words) unless the student asks for more detail.
- Be encouraging but honest: gently point out patterns such as missed daily goals or a low focus score and how to fix them.
- Never invent data that is not present in the context. If relevant data is missing, say so and give general guidance.
- If the student writes in another language, reply in that language.

Formatting rules (very important):
- Use simple, chat-friendly formatting only: short paragraphs, bullet lists (lines starting with "-"), bold labels (e.g. **Vocabulary**), and numbered steps.
- NEVER use markdown tables (no "|" pipe characters, no "---" separator rows). Present structured plans as bullet lists or numbered steps instead.
- NEVER use fenced code blocks (no lines with triple backticks \`\`\`). Share templates or notes as plain indented text only when truly needed, otherwise as a bullet list.
- Keep lines short and avoid long horizontal blocks. Prefer one idea per bullet.`;

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Builds a compact, structured snapshot of the student's live study data.
 * This is the context payload Kaizen uses to personalize every answer.
 */
export function buildKaizenContext(
  profile: Profile | null,
  stats: FocusStats | null,
  notes: PlannerNote[],
  sessions: PomodoroSession[]
): string {
  const lines: string[] = [];

  lines.push(
    `STUDENT PROFILE: level ${stats?.userLevel ?? 1}, lifetime EXP ${profile?.exp ?? 0}, daily focus goal ${stats?.dailyGoalMinutes ?? 120} min, today ${stats?.todayFocusMinutes ?? 0} min, total focus time ${formatMinutes(stats?.totalFocusTimeMinutes ?? 0)}, current streak ${stats?.streakDays ?? 0} day(s), focus score ${stats?.focusScore ?? 0}%, completed sessions ${stats?.completedSessionsCount ?? 0}, completed cycles ${stats?.totalCompletedCycles ?? 0}.`
  );

  const activeNotes = notes.filter((n) => !n.is_completed);
  const completedNotes = notes.filter((n) => n.is_completed);
  lines.push(`PLANNER NOTES: ${notes.length} total (${activeNotes.length} in progress, ${completedNotes.length} completed).`);
  notes.slice(0, 8).forEach((n) => {
    lines.push(
      `- "${n.topic}" | targets: ${n.priority_targets?.join(', ') || 'none'} | planned ${n.planned_duration_minutes}m | ${n.is_completed ? 'completed' : 'in progress'}${n.content ? ` | goal: "${n.content}"` : ''}${n.reflection_notes ? ` | reflection: "${n.reflection_notes}"` : ''}`
    );
  });

  const recent = sessions.slice(0, 10);
  lines.push(`RECENT SESSIONS (last ${recent.length}):`);
  recent.forEach((s) => {
    const date = s.completed_at ? new Date(s.completed_at).toLocaleDateString() : 'unknown date';
    lines.push(`- ${s.subject_name || 'Untitled'} | ${s.duration_minutes}m | ${s.is_completed ? 'completed' : 'abandoned'} | ${date}`);
  });

  return lines.join('\n');
}

/**
 * Streams a Kaizen reply through the same-origin proxy (`/api/kaizen`), which
 * routes to the selected provider and injects its API key server-side.
 * Calls `onToken` for every content delta so the UI renders the response as
 * it arrives. Returns the full assistant response text.
 */
export async function streamKaizenReply(
  messages: KaizenChatMessage[],
  onToken: (text: string) => void,
  provider: AIProviderInfo
): Promise<string> {
  if (!isAIConfigured()) throw new Error('AI_NOT_CONFIGURED');

  try {
    const res = await fetch('/api/kaizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kaizen-Provider': provider.id
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: 'system', content: KAIZEN_SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content }))
        ],
        stream: true
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let detail = body;
      try {
        const parsed = JSON.parse(body);
        detail = parsed?.error || body;
      } catch {
        /* keep raw body */
      }
      throw new Error(`AI API error (${res.status}): ${String(detail).slice(0, 300)}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('This endpoint did not return a streaming response.');

    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) {
            full += delta;
            onToken(delta);
          }
        } catch {
          /* skip keep-alive / partial lines */
        }
      }
    }

    return full;
  } catch (err: any) {
    const message = err?.message || String(err || 'Unknown AI error');
    console.error('Kaizen stream error:', message);
    throw new Error(message);
  }
}