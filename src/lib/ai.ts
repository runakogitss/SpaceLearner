import { OpenRouter } from '@openrouter/sdk';
import { Profile, PlannerNote, PomodoroSession, FocusStats } from '../types';

// ====================================================================
// KAIZEN — SPACE LEARNER AI STUDY ADVISOR
// Powered by OpenRouter (`VITE_OPENROUTER_API_KEY` in `.env`)
// ====================================================================

export const AI_MODEL = 'nvidia/nemotron-3.5-lightning:free';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export function isOpenRouterConfigured(): boolean {
  return Boolean(OPENROUTER_API_KEY);
}

function getOpenRouterClient(): OpenRouter | null {
  if (!OPENROUTER_API_KEY) return null;
  return new OpenRouter({ apiKey: OPENROUTER_API_KEY });
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
- If the student writes in another language, reply in that language.`;

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
 * Streams a Kaizen reply from OpenRouter, calling `onToken` for every
 * content delta so the UI can render the response as it arrives.
 * Returns the full assistant response text.
 */
export async function streamKaizenReply(
  messages: KaizenChatMessage[],
  onToken: (text: string) => void
): Promise<string> {
  const client = getOpenRouterClient();
  if (!client) throw new Error('OPENROUTER_KEY_MISSING');

  try {
    const result = await client.chat.send({
      chatRequest: {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: KAIZEN_SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content }))
        ],
        stream: true
      }
    });

    // `stream: true` resolves to an EventStream<ChatStreamChunk>.
    const stream = result as unknown as AsyncIterable<{
      choices?: Array<{ delta?: { content?: string | null } }>;
    }>;

    let full = '';
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        full += content;
        onToken(content);
      }
    }
    return full;
  } catch (err: any) {
    const message = err?.message || String(err || 'Unknown AI error');
    console.error('Kaizen stream error:', message);
    throw new Error(message);
  }
}