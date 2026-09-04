import type { IncomingMessage, ServerResponse } from 'http';
import { loadProvidersFromEnv, handleKaizenProxy } from '../server/kaizen-handler';

/**
 * Serverless proxy for the Kaizen AI advisor.
 * Client calls POST /api/kaizen (same-origin) with header `x-kaizen-provider`.
 * See server/kaizen-handler.ts for the shared routing/streaming logic.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleKaizenProxy(req, res, loadProvidersFromEnv(process.env));
}