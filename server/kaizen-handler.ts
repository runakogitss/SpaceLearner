import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Shared Kaizen AI proxy handler used by BOTH the Vercel serverless function
 * (api/kaizen.ts) and the Vite dev middleware (vite.config.ts).
 *
 * The client posts to the same-origin `/api/kaizen` with header
 * `x-kaizen-provider` and body `{ model, messages, stream }`. This handler
 * routes to the selected provider's base URL and injects its API key
 * server-side — avoiding browser CORS and keeping keys out of the bundle.
 */

export interface ProviderCfg {
  baseUrl: string;
  key: string;
}

export function loadProvidersFromEnv(
  env: Record<string, string | undefined>
): Record<string, ProviderCfg> {
  const map: Record<string, ProviderCfg> = {};
  const defs = [
    { id: 'openrouter', keyFallback: env.VITE_OPENROUTER_API_KEY || '' }
  ];
  for (const d of defs) {
    const base = env[`VITE_AI_PROVIDER_${d.id.toUpperCase()}_BASE_URL`];
    if (!base) continue;
    const key = env[`VITE_AI_PROVIDER_${d.id.toUpperCase()}_KEY`] || d.keyFallback;
    map[d.id] = { baseUrl: (base || '').replace(/\/+$/, ''), key };
  }
  return map;
}

export async function handleKaizenProxy(
  req: IncomingMessage,
  res: ServerResponse,
  providers: Record<string, ProviderCfg>
): Promise<void> {
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
    res.end(JSON.stringify({ error: 'AI provider is not configured on the server.' }));
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

  try {
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
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Upstream request failed.' }));
  }
}