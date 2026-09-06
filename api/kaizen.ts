import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Serverless proxy for the Kaizen AI advisor (OpenRouter).
 * Self-contained (no external local imports) so Vercel bundles it reliably.
 * Client posts to /api/kaizen with header `x-kaizen-provider` and body
 * `{ model, messages, stream }`; the API key is injected server-side.
 */

export interface ProviderCfg {
  baseUrl: string;
  key: string;
}

export function loadProvidersFromEnv(
  env: Record<string, string | undefined>
): Record<string, ProviderCfg> {
  const map: Record<string, ProviderCfg> = {};
  const base = env.VITE_AI_PROVIDER_OPENROUTER_BASE_URL;
  if (!base) return map;
  const key = env.VITE_AI_PROVIDER_OPENROUTER_KEY || env.VITE_OPENROUTER_API_KEY || '';
  if (key) map.openrouter = { baseUrl: base.replace(/\/+$/, ''), key };
  return map;
}

export async function handleKaizenProxy(
  req: IncomingMessage,
  res: ServerResponse,
  providers: Record<string, ProviderCfg>
): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const requested = (req.headers['x-kaizen-provider'] as string | undefined) || '';
    const providerId = providers[requested] ? requested : Object.keys(providers)[0];
    const provider = providerId ? providers[providerId] : undefined;

    if (!provider || !provider.key) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            'AI provider is not configured on the server. Set VITE_AI_PROVIDER_OPENROUTER_BASE_URL and VITE_OPENROUTER_API_KEY in the Vercel environment.'
        })
      );
      return;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as Record<string, unknown>;
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON body.' }));
      return;
    }

    const payload = { ...body, stream: true };

    const upstream = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.key}`
      },
      body: JSON.stringify(payload)
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: text.slice(0, 500) }));
      return;
    }

    if (!upstream.body) {
      res.statusCode = 502;
      res.end('No stream body');
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err: any) {
    // Never crash the invocation — surface a readable error instead.
    try {
      if (!res.writableEnded) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err?.message || 'Upstream request failed.' }));
      }
    } catch {
      /* response already ended */
    }
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleKaizenProxy(req, res, loadProvidersFromEnv(process.env));
}