import { readFileSync } from 'node:fs';
/** Internal helper: never log the returned credentials. */
export function getLocalStatus() {
  const result = JSON.parse(readFileSync(new URL('../.tools/supabase-local/status.json', import.meta.url), 'utf8'));
  const url = new URL(result.API_URL);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '54321' || !result.ANON_KEY || !result.SERVICE_ROLE_KEY) {
    throw new Error('A configuração de desenvolvimento local é inválida.');
  }
  return result;
}
