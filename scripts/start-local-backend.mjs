/** Reproducible, local-only backend. Docker volumes retain development accounts/posts. */
import './prepare-local-backend.mjs';
import { getLocalStatus } from './local-status.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const compose = ['compose', '--env-file', '.tools/supabase-local/.env', '-f', 'supabase/local/compose.yml'];
execFileSync('docker', [...compose, 'up', '-d'], { stdio: 'inherit' });
const status = getLocalStatus();
let ready = false;
for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    const response = await fetch(`${status.API_URL}/auth/v1/health`, { headers: { apikey: status.ANON_KEY }, signal: AbortSignal.timeout(2000) });
    if (response.ok) { ready = true; break; }
  } catch { /* Wait only for the services this script starts. */ }
  await new Promise(resolve => setTimeout(resolve, 500));
}
if (!ready) throw new Error('A autenticação local não ficou pronta. Verifique os logs dos serviços locais.');
function sql(query) {
  return execFileSync('docker', [...compose, 'exec', '-T', 'db', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tAq'], {
    input: query, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}
// Current PostgREST exposes JWT claims in the JSON request.jwt.claims setting.
// GoTrue's initial migrations supply the historical form; preserve both forms.
sql(`create or replace function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
   nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
create schema if not exists agitta_dev;
create table if not exists agitta_dev.migrations(name text primary key, checksum text not null);
`);
const files = readdirSync('supabase/migrations').filter(name => /^[0-9]+_[A-Za-z0-9_]+\.sql$/.test(name)).sort();
for (const name of files) {
  const contents = readFileSync(`supabase/migrations/${name}`, 'utf8');
  const checksum = createHash('sha256').update(contents).digest('hex');
  const existing = sql(`select checksum from agitta_dev.migrations where name='${name}';`);
  if (existing && existing !== checksum) throw new Error(`A migração aplicada ${name} mudou; crie uma nova migração em vez de substituir dados locais.`);
  if (!existing) {
    sql(contents);
    sql(`insert into agitta_dev.migrations(name,checksum) values('${name}','${checksum}');`);
    console.log(`Migração local aplicada: ${name}`);
  }
}
sql("notify pgrst, 'reload schema';");
let restReady = false;
for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    const response = await fetch(`${status.API_URL}/rest/v1/events?select=id&limit=1`, {
      headers: { apikey: status.ANON_KEY, Authorization: `Bearer ${status.ANON_KEY}` }, signal: AbortSignal.timeout(2000),
    });
    if (response.ok && Array.isArray(await response.json())) { restReady = true; break; }
  } catch { /* Retry while PostgREST refreshes its schema cache. */ }
  await new Promise(resolve => setTimeout(resolve, 500));
}
if (!restReady) throw new Error('A API de eventos local não ficou pronta. Verifique os logs do PostgREST.');
console.log('Backend local pronto: autenticação e API de eventos responderam corretamente.');
