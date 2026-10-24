/** Create isolated local credentials. Never reads or writes hosted project secrets. */
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { randomBytes, createHmac } from 'node:crypto';
const root = '.tools/supabase-local';
mkdirSync(root, { recursive: true, mode: 0o700 });
// Make init readable inside Postgres even when checkout files use a restrictive umask.
writeFileSync(`${root}/00-roles.sh`, readFileSync('supabase/local/00-roles.sh'));
chmodSync(`${root}/00-roles.sh`, 0o644);
const envPath = `${root}/.env`;
if (!existsSync(envPath)) {
  const password = randomBytes(24).toString('hex');
  const jwtSecret = randomBytes(32).toString('hex');
  writeFileSync(envPath, `POSTGRES_PASSWORD=${password}\nJWT_SECRET=${jwtSecret}\n`, { flag: 'wx', mode: 0o600 });
}
const values = Object.fromEntries(readFileSync(envPath, 'utf8').trim().split('\n').map(line => line.split('=')));
if (!/^[a-f0-9]{48}$/.test(values.POSTGRES_PASSWORD) || !/^[a-f0-9]{64}$/.test(values.JWT_SECRET)) {
  throw new Error('Configuração local inválida; os arquivos existentes foram preservados.');
}
function jwt(role) {
  const encode = item => Buffer.from(JSON.stringify(item)).toString('base64url');
  const payload = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, iss: 'supabase', iat: 1700000000, exp: 2208988800 })}`;
  return `${payload}.${createHmac('sha256', values.JWT_SECRET).update(payload).digest('base64url')}`;
}
const status = { API_URL: 'http://127.0.0.1:54321', ANON_KEY: jwt('anon'), SERVICE_ROLE_KEY: jwt('service_role') };
writeFileSync(`${root}/status.json`, `${JSON.stringify(status)}\n`, { mode: 0o600 });
const kong = `_format_version: "2.1"\n_transform: true\nconsumers:\n  - username: anon\n    keyauth_credentials:\n      - key: ${status.ANON_KEY}\n  - username: service_role\n    keyauth_credentials:\n      - key: ${status.SERVICE_ROLE_KEY}\nservices:\n  - name: auth\n    url: http://auth:9999/\n    routes:\n      - name: auth\n        strip_path: true\n        paths: ["/auth/v1/"]\n    plugins:\n      - name: cors\n      - name: key-auth\n        config:\n          key_names: [apikey]\n          hide_credentials: true\n          run_on_preflight: false\n  - name: rest\n    url: http://rest:3000/\n    routes:\n      - name: rest\n        strip_path: true\n        paths: ["/rest/v1/"]\n    plugins:\n      - name: cors\n      - name: key-auth\n        config:\n          key_names: [apikey]\n          hide_credentials: true\n          run_on_preflight: false\n`;
writeFileSync(`${root}/kong.yml`, kong, { mode: 0o644 });
// Bind-mounted config must be readable by Kong's non-root container user.
chmodSync(`${root}/kong.yml`, 0o644);
console.log('Credenciais de desenvolvimento local preparadas em .tools/ (ignorado pelo Git).');
