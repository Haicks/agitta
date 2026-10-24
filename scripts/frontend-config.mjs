/** Browser configuration is public. Reject privileged keys before Vite bundles them. */
export function validateFrontendConfig(env, { android = false } = {}) {
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url && !key) return { demo: true };
  if (!url || !key) throw new Error('Preencha a URL e a chave pública do Supabase, ou deixe ambas vazias para a demonstração.');
  let endpoint;
  try { endpoint = new URL(url); } catch { throw new Error('A URL do Supabase é inválida.'); }
  const hosted = endpoint.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(endpoint.hostname) && !endpoint.port;
  const local = endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname) && endpoint.port === '54321';
  if ((!hosted && (!local || android)) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !['', '/'].includes(endpoint.pathname)) {
    throw new Error(android
      ? 'O APK precisa da URL HTTPS de um projeto Supabase hospedado. Para demonstração, deixe as duas variáveis VITE_SUPABASE vazias.'
      : 'Use a URL HTTPS do projeto *.supabase.co ou o backend local na porta 54321, sem credenciais ou caminhos adicionais.');
  }
  let publicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!publicKey && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
    try { publicKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; }
    catch { /* Invalid JWTs are rejected before reaching the browser bundle. */ }
  }
  if (!publicKey) throw new Error('Use somente uma chave pública anon/publishable. Chaves administrativas não podem entrar no aplicativo.');
  return { demo: false };
}
