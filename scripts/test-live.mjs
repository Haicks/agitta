/** Integration checks against an isolated, local Supabase stack only. */
import assert from 'node:assert/strict';
import { getLocalStatus } from './local-status.mjs';
import { randomBytes, randomUUID } from 'node:crypto';

let status;
try { status = getLocalStatus(); } catch {
  console.error('Prepare e inicie o backend local antes do teste de integração.');
  process.exit(1);
}
const base = status.API_URL;
const endpoint = new URL(base);
assert(['localhost', '127.0.0.1'].includes(endpoint.hostname), 'Este teste só aceita o Supabase local.');
assert.equal(endpoint.port, '54321', 'Porta local inesperada: o teste não criará dados.');
const anonKey = status.ANON_KEY;
const adminKey = status.SERVICE_ROLE_KEY;
assert(anonKey && adminKey, 'As chaves de teste locais não foram encontradas.');
let checks = 0;
const createdUsers = [];
function pass(label) { checks += 1; console.log(`✓ ${label}`); }
async function request(path, { token = anonKey, key = anonKey, method = 'GET', body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
async function signup(name) {
  const email = `agitta-test-${randomUUID()}@example.com`;
  const password = `${randomBytes(24).toString('base64url')}aA1!`;
  const result = await request('/auth/v1/signup', { method: 'POST', body: { email, password, data: { name } } });
  assert.equal(result.status, 200, 'Cadastro local deve funcionar.');
  assert(result.data.access_token && result.data.user?.id, 'Cadastro local deve retornar uma sessão.');
  createdUsers.push(result.data.user.id);
  return { email, password, id: result.data.user.id, token: result.data.access_token };
}
try {
  const owner = await signup('Pessoa de teste');
  const other = await signup('Outra pessoa');
  pass('Cadastro de duas contas e criação de sessões reais');
  const login = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: owner.email, password: owner.password } });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.id, owner.id);
  pass('Login por e-mail e senha');
  const invalidLogin = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: owner.email, password: `${owner.password}wrong` } });
  assert.equal(invalidLogin.status, 400);
  pass('Senha incorreta rejeitada');
  const profile = await request(`/rest/v1/profiles?id=eq.${owner.id}&select=id,name`);
  assert.equal(profile.status, 200);
  assert.equal(profile.data[0]?.name, 'Pessoa de teste');
  assert(!Object.hasOwn(profile.data[0], 'email'));
  pass('Perfil público criado sem expor e-mail');
  const event = {
    author_id: owner.id, title: 'Evento de integração', description: 'Evento temporário criado apenas para validar o MVP.',
    starts_at: new Date(Date.now() + 86400000).toISOString(), venue: 'Espaço de teste', address: 'Asa Norte, Brasília - DF',
    region: 'Asa Norte', category: 'culture', price: 0, age_rating: 'Livre',
  };
  const anonymousInsert = await request('/rest/v1/events', { method: 'POST', body: event });
  assert.equal(anonymousInsert.status, 401);
  pass('Publicação sem login rejeitada');
  const forgedInsert = await request('/rest/v1/events', { method: 'POST', token: other.token, body: event });
  assert.equal(forgedInsert.status, 403);
  pass('Publicação em nome de outra pessoa rejeitada por RLS');
  const pastInsert = await request('/rest/v1/events', { method: 'POST', token: owner.token, body: { ...event, starts_at: new Date(Date.now() - 86400000).toISOString() } });
  assert.equal(pastInsert.status, 403);
  pass('Evento no passado rejeitado pelo banco');
  for (const starts_at of ['infinity', '10000-01-01T00:00:00Z']) {
    const invalidDate = await request('/rest/v1/events', { method: 'POST', token: owner.token, body: { ...event, starts_at } });
    assert.equal(invalidDate.status, 400);
    pass('Data não renderizável rejeitada pelo banco');
  }
  const published = await request('/rest/v1/events', { method: 'POST', token: owner.token, body: event });
  assert.equal(published.status, 201);
  const eventId = published.data[0].id;
  pass('Publicação de evento com sessão autenticada');
  const publicRead = await request(`/rest/v1/events?id=eq.${eventId}&select=*,profiles!events_author_id_fkey(name)`);
  assert.equal(publicRead.status, 200);
  assert.equal(publicRead.data[0].profiles.name, 'Pessoa de teste');
  pass('Feed público e nome do autor disponíveis');
  const edit = await request(`/rest/v1/events?id=eq.${eventId}`, { method: 'PATCH', token: other.token, body: { title: 'Alteração indevida' } });
  assert.equal(edit.status, 403);
  const deletion = await request(`/rest/v1/events?id=eq.${eventId}`, { method: 'DELETE', token: other.token });
  assert.equal(deletion.status, 403);
  pass('Alteração e remoção de posts bloqueadas no MVP');
  const save = await request('/rest/v1/saved_events', { method: 'POST', token: owner.token, body: { user_id: owner.id, event_id: eventId } });
  assert.equal(save.status, 201);
  const ownedSaves = await request(`/rest/v1/saved_events?user_id=eq.${owner.id}`, { token: owner.token });
  assert.equal(ownedSaves.data.length, 1);
  const privateSaves = await request(`/rest/v1/saved_events?user_id=eq.${owner.id}`, { token: other.token });
  assert.deepEqual(privateSaves.data, []);
  pass('Eventos salvos persistidos e privados por usuário');
  const forgedSave = await request('/rest/v1/saved_events', { method: 'POST', token: other.token, body: { user_id: owner.id, event_id: eventId } });
  assert.equal(forgedSave.status, 403);
  pass('Salvar em nome de outro usuário rejeitado');
  const unsave = await request(`/rest/v1/saved_events?user_id=eq.${owner.id}&event_id=eq.${eventId}`, { method: 'DELETE', token: owner.token });
  assert.equal(unsave.status, 200);
  assert.equal(unsave.data.length, 1);
  pass('Remoção dos próprios salvos');
  const logout = await request('/auth/v1/logout', { method: 'POST', token: owner.token });
  assert.equal(logout.status, 204);
  pass('Logout real');
  console.log(`${checks} verificações de integração passaram no Supabase local.`);
} finally {
  for (const id of createdUsers) {
    const cleanup = await request(`/auth/v1/admin/users/${id}`, { method: 'DELETE', token: adminKey, key: adminKey });
    assert.equal(cleanup.status, 200, 'Limpeza da conta temporária deve funcionar.');
  }
}
