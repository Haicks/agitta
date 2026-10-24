import { loadEnv } from 'vite';

const env = loadEnv('production', process.cwd(), 'VITE_');
const url = env.VITE_SUPABASE_URL?.trim();
const key = env.VITE_SUPABASE_ANON_KEY?.trim();
if (!url && !key) {
  console.log('Build Android de demonstração: sem contas conectadas.');
} else {
  let valid = false;
  try {
    const endpoint = new URL(url);
    valid = endpoint.protocol === 'https:' && endpoint.hostname.endsWith('.supabase.co') && Boolean(key);
  } catch { /* A malformed URL must fail before bundling. */ }
  if (!valid) {
    console.error('O APK precisa da URL HTTPS do projeto Supabase hospedado e da chave pública. O backend local deste computador não é acessível pelo celular. Para um APK de demonstração, execute com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY vazias.');
    process.exit(1);
  }
  let publicKey = key.startsWith('sb_publishable_');
  try { publicKey ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; }
  catch { /* Accept only documented browser key formats. */ }
  if (!publicKey) {
    console.error('Use somente a chave pública anon/publishable no aplicativo.');
    process.exit(1);
  }
}
