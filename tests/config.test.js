import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFrontendConfig } from '../scripts/frontend-config.mjs';

const token = (role) => ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ role })).toString('base64url'), 'test-signature'].join('.');
const config = (patch = {}) => ({ VITE_SUPABASE_URL: 'https://agitta.supabase.co', VITE_SUPABASE_ANON_KEY: token('anon'), ...patch });

test('frontend accepts demo and public keys but rejects privileged keys before bundling', () => {
  assert.equal(validateFrontendConfig({}).demo, true);
  assert.equal(validateFrontendConfig(config()).demo, false);
  assert.equal(validateFrontendConfig(config({ VITE_SUPABASE_ANON_KEY: 'sb_publishable_example' })).demo, false);
  for (const key of [token('service_role'), token('authenticated'), 'sb_secret_example', 'sb_publishable_', 'invalid']) {
    assert.throws(() => validateFrontendConfig(config({ VITE_SUPABASE_ANON_KEY: key })), /chave pública/);
  }
  assert.throws(() => validateFrontendConfig(config({ VITE_SUPABASE_ANON_KEY: '' })), /ambas vazias/);
});

test('frontend URLs match allowed origins; public web builds reject computer loopback', () => {
  const local = config({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321' });
  assert.equal(validateFrontendConfig(local).demo, false);
  assert.throws(() => validateFrontendConfig(local, { publicDeployment: true }), /webapp público/);
  assert.equal(validateFrontendConfig(config(), { publicDeployment: true }).demo, false);
  for (const url of ['bad-url', 'https://evil.example', 'http://agitta.supabase.co', 'https://user:password@agitta.supabase.co', 'https://agitta.supabase.co/path', 'https://agitta.supabase.co?key=x', 'https://agitta.supabase.co:8443']) {
    assert.throws(() => validateFrontendConfig(config({ VITE_SUPABASE_URL: url })));
  }
});
