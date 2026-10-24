/** Generate public local-only browser configuration without exposing admin keys. */
import { getLocalStatus } from './local-status.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
let status;
try { status = getLocalStatus(); } catch {
  console.error('Prepare o backend local antes de gerar a configuração.');
  process.exit(1);
}
const url = new URL(status.API_URL);
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '54321' || !status.ANON_KEY) {
  throw new Error('A configuração recebida não pertence ao Supabase local esperado.');
}
const content = `# Local development only. Public browser configuration; never a service_role key.\nVITE_SUPABASE_URL=${status.API_URL}\nVITE_SUPABASE_ANON_KEY=${status.ANON_KEY}\n`;
if (existsSync('.env.local')) {
  const current = readFileSync('.env.local', 'utf8');
  const readValue = name => current.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const same = readValue('VITE_SUPABASE_URL') === status.API_URL && readValue('VITE_SUPABASE_ANON_KEY') === status.ANON_KEY;
  if (!same) {
    console.error('.env.local já existe e foi preservado. Use a configuração existente ou faça backup antes de gerar outra.');
    process.exit(1);
  }
  console.log('Configuração pública local já presente; arquivo preservado.');
} else {
  writeFileSync('.env.local', content, { flag: 'wx', mode: 0o600 });
  console.log('Configuração pública local gravada em .env.local (ignorado pelo Git).');
}
