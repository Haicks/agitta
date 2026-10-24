/** Real UI checks. Refuses cloud targets and removes its temporary local account. */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { chromium, expect } from '@playwright/test';
import { getLocalStatus } from './local-status.mjs';

let status;
try {
  status = await getLocalStatus();
} catch {
  console.error('Inicie o backend local e gere .env.local antes deste teste de interface.');
  process.exit(1);
}

const api = new URL(status.API_URL);
const app = new URL(process.env.BASE_URL || 'http://127.0.0.1:5173');
const loopback = (url) => ['127.0.0.1', 'localhost'].includes(url.hostname);
assert(loopback(api) && api.protocol === 'http:' && api.port === '54321', 'Este teste só aceita o Supabase local na porta 54321.');
assert(loopback(app) && app.protocol === 'http:', 'Este teste só aceita o app servido na máquina local.');
assert(status.ANON_KEY && status.SERVICE_ROLE_KEY, 'Configuração do backend local incompleta.');

const email = `agitta-browser-${randomUUID()}@example.com`;
const password = `${randomBytes(24).toString('base64url')}aA1!`;
const displayName = 'Pessoa do teste de interface';
const title = `Rolê de teste ${randomUUID().slice(0, 8)}`;
let userId;
let signupAttempted = false;
let browser;
let checks = 0;
let failed = false;
const pass = (label) => { checks += 1; console.log(`✓ ${label}`); };
const isLocalAPI = (url) => loopback(url) && url.protocol === 'http:' && url.port === '54321';

async function adminRequest(path, method = 'GET') {
  return fetch(new URL(path, api), {
    method,
    headers: {
      apikey: status.SERVICE_ROLE_KEY,
      Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}

async function cleanup() {
  if (!signupAttempted) return;
  if (!userId) {
    const response = await adminRequest('/auth/v1/admin/users?page=1&per_page=1000');
    assert(response.ok, 'Não foi possível localizar a conta temporária para limpeza.');
    const data = await response.json();
    userId = data.users?.find((user) => user.email === email)?.id;
  }
  if (!userId) return;
  assert.match(userId, /^[0-9a-f-]{36}$/i, 'Identificador de conta temporária inválido.');
  const response = await adminRequest(`/auth/v1/admin/users/${userId}`, 'DELETE');
  assert(response.ok, 'A limpeza da conta temporária local falhou.');
  pass('Conta temporária e dados relacionados removidos do backend local');
}

try {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // A cloud .env file must never cause this test to create data outside the machine.
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === app.origin || isLocalAPI(url)) await route.continue();
    else await route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(app.href);
  await expect(page.getByRole('button', { name: 'Entrar no Agitta' })).toBeVisible();
  await expect(page.locator('.connection-note')).toHaveCount(0);
  pass('Interface conectada ao backend de desenvolvimento');

  await page.getByRole('link', { name: 'Criar conta', exact: true }).click();
  await page.getByLabel('Como podemos te chamar?').fill(displayName);
  await page.getByLabel('Seu e-mail').fill(email);
  await page.getByLabel('Sua senha', { exact: true }).fill(password);
  signupAttempted = true;
  const signupResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return isLocalAPI(url) && url.pathname === '/auth/v1/signup';
  });
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  const response = await signupResponse;
  assert.equal(response.status(), 200, 'Cadastro pelo formulário deve funcionar.');
  const signup = await response.json();
  userId = signup.user?.id || signup.id;
  assert(userId, 'Cadastro não retornou o identificador da conta.');
  await expect(page.getByRole('heading', { name: 'O que agitta Brasília?' })).toBeVisible();
  await expect(page.locator('.demo-banner')).toHaveCount(0);
  pass('Cadastro pelo formulário cria uma conta e abre uma sessão real');

  await page.locator('.mobile-nav').getByRole('link', { name: 'Publicar', exact: true }).click();
  await page.getByLabel('Qual é o rolê?').fill(title);
  await page.getByLabel('Conta mais').fill('Evento temporário de Brasília criado para validar a interface conectada.');
  await page.getByLabel('Categoria', { exact: true }).selectOption('culture');
  await page.getByLabel('Data e hora · Brasília').fill(new Date(Date.now() + 7 * 86400000 - 3 * 3600000).toISOString().slice(0, 16));
  await page.getByLabel('Nome do local').fill('Espaço de teste');
  await page.getByLabel('Região do DF').fill('Asa Norte');
  await page.getByLabel('Endereço ou ponto de encontro').fill('SQN 208, Asa Norte, Brasília DF');
  await page.getByLabel('Entrada · R$').fill('0');
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar rolê', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(displayName);
  pass('Publicação pelo formulário grava evento com autoria autenticada');

  await page.getByRole('dialog').getByRole('button', { name: 'Salvar esse rolê', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Remover dos salvos', exact: true })).toBeVisible();
  const detailURL = page.url();
  await page.reload();
  await expect(page.getByRole('dialog').getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page).toHaveURL(detailURL);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Remover dos salvos', exact: true })).toBeVisible();
  pass('Sessão, evento salvo e rota de detalhes sobrevivem ao recarregamento');

  await page.keyboard.press('Escape');
  await page.locator('.mobile-nav').getByRole('link', { name: 'Perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: displayName, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Entrar no Agitta' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Entrar no Agitta' })).toBeVisible();
  pass('Sair da conta encerra a sessão e impede restauração após recarregar');

  await page.getByLabel('Seu e-mail').fill(email);
  await page.getByLabel('Sua senha', { exact: true }).fill(`${password}-incorreta`);
  await page.getByRole('button', { name: 'Entrar no Agitta' }).click();
  await expect(page.locator('#auth-error')).toContainText('E-mail ou senha incorretos');
  await expect(page.locator('.app-shell')).toHaveCount(0);
  pass('Senha incorreta é rejeitada pelo serviço de autenticação');

  await page.getByLabel('Sua senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar no Agitta' }).click();
  await expect(page.getByRole('heading', { name: 'O que agitta Brasília?' })).toBeVisible();
  await page.locator('.mobile-nav').getByRole('link', { name: /Salvos/ }).click();
  await expect(page.locator('.event-card').filter({ hasText: title })).toHaveCount(1);
  await expect(page.locator('.event-card').filter({ hasText: title }).getByRole('button', { name: `Remover dos salvos: ${title}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  pass('Login posterior recupera eventos salvos no banco');

  // Put the saved event outside the feed's first 100 rows and create another
  // event only reachable by its URL. All rows belong to this temporary account.
  const baseEvent = {
    author_id: userId, description: 'Evento temporário para validar paginação e concorrência.',
    venue: 'Local de teste', address: 'SQN 208, Asa Norte, Brasília DF',
    region: 'Asa Norte', category: 'culture', price: 0, age_rating: 'Livre',
  };
  const rows = Array.from({ length: 101 }, (_, index) => ({
    ...baseEvent, title: `Teste de página ${index}`,
    starts_at: new Date(Date.now() + (index === 100 ? 14 : 1) * 86400000).toISOString(),
  }));
  const inserted = await fetch(new URL('/rest/v1/events', api), {
    method: 'POST',
    headers: { apikey: status.ANON_KEY, Authorization: `Bearer ${signup.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  });
  assert.equal(inserted.status, 201, 'Preparação dos eventos temporários deve funcionar.');
  const extra = await inserted.json();
  await page.reload();
  await expect(page.locator('.event-card').filter({ hasText: title })).toHaveCount(1);
  pass('Salvo fora dos primeiros 100 eventos continua visível após recarregar');

  const deepEvent = extra.find((event) => event.title === 'Teste de página 100');
  await page.goto(new URL(`/#event/${deepEvent.id.toUpperCase()}`, app).href);
  await expect(page.getByRole('dialog').getByRole('heading', { name: deepEvent.title, exact: true })).toBeVisible();
  pass('Link direto encontra evento fora da primeira página do feed');
  await page.keyboard.press('Escape');
  const pair = extra.slice(0, 2).map((event) => event.id);
  await page.evaluate((ids) => {
    for (const id of ids) document.querySelector(`button[data-save="${id}"]`).click();
  }, pair);
  for (const id of pair) await expect(page.locator(`button[data-save="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.mobile-nav').getByRole('link', { name: /Salvos/ }).click();
  await expect(page.locator('.event-card')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('.event-card')).toHaveCount(3);
  pass('Salvar eventos rapidamente mantém os três favoritos no banco e na tela');
  assert.deepEqual(errors, [], 'O fluxo conectado não deve lançar erros de JavaScript.');
  pass('Fluxo completo sem erros de JavaScript');
} catch (error) {
  failed = true;
  // Never print credentials, API keys or their reflected values from browser output.
  let message = error.message || 'Falha não identificada no teste de interface.';
  for (const sensitive of [email, password, status.ANON_KEY, status.SERVICE_ROLE_KEY]) {
    message = message.split(sensitive).join('[redigido]');
  }
  console.error(message);
} finally {
  await browser?.close();
  try { await cleanup(); }
  catch (error) { failed = true; console.error(error.message); }
}

console.log(`${checks} verificações de interface conectada concluídas.`);
if (failed) process.exitCode = 1;
