import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

async function openApp(page) {
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Entrar no Agitta' })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
}

async function demo(page) {
  await openApp(page);
  await page.getByRole('button', { name: /Explorar demonstração/ }).click();
  await expect(page.locator('.event-card')).toHaveCount(5);
}

test('build publicado em subdiretório tem CSS, navegação e manifesto instalável', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await demo(page);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(248, 247, 243)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const cdp = await page.context().newCDPSession(page);
  const manifest = await cdp.send('Page.getAppManifest');
  expect(manifest.errors).toEqual([]);
  const data = JSON.parse(manifest.data);
  expect(data.display).toBe('standalone');
  expect(new URL(data.start_url, manifest.url).pathname).toBe('/agitta/');
  // Playwright isolates tests in private profiles, where installation is disabled.
  const installability = (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors;
  expect(installability.filter(error => error.errorId !== 'in-incognito')).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.locator('.sidebar').getByRole('link', { name: 'Rolês salvos', exact: true }).click();
  await expect(page).toHaveURL(/\/agitta\/#saved$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('offline recarrega o app com aparência, favoritos e publicações da demonstração', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await demo(page);
  await page.locator('.event-card').first().getByRole('button', { name: /^Salvar evento/ }).click();
  await expect(page.locator('.event-card').first().getByRole('button', { name: /^Remover dos salvos/ })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.event-card')).toHaveCount(5);
  await expect(page.locator('#offline-status')).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(11, 13, 11)');
  await page.locator('.mobile-nav').getByRole('link', { name: 'Salvos', exact: true }).click();
  await expect(page.locator('.event-card')).toHaveCount(1);
  await page.locator('.mobile-nav').getByRole('link', { name: 'Publicar', exact: true }).click();
  await page.getByLabel('Qual é o rolê?').fill('Encontro offline da demo');
  await page.getByLabel('Conta mais').fill('Evento fictício publicado somente neste navegador sem internet.');
  await page.getByLabel('Data e hora · Brasília').fill('2099-12-02T18:00');
  await page.getByLabel('Nome do local').fill('Eixão');
  await page.getByLabel('Região do DF').fill('Asa Norte');
  await page.getByLabel('Endereço ou ponto de encontro').fill('SQN 208, Brasília DF');
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar rolê', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Encontro offline da demo' })).toBeVisible();
  await context.setOffline(false);
  await expect(page.locator('#offline-status')).toBeHidden();
});

test('cache contém só arquivos públicos e deixa requisições de API na rede', async ({ page, context }) => {
  await openApp(page);
  let requests = 0;
  await context.route('https://pwa-test.supabase.co/rest/v1/events', route => {
    requests += 1;
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ test: requests }]) });
  });
  const result = await page.evaluate(async () => {
    const url = 'https://pwa-test.supabase.co/rest/v1/events';
    const first = await (await fetch(url)).json();
    const second = await (await fetch(url)).json();
    const names = await caches.keys();
    const keys = (await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).map(request => request.url)))).flat();
    return { first, second, keys };
  });
  expect(requests).toBe(2);
  expect(result.first).not.toEqual(result.second);
  expect(result.keys.some(url => url.endsWith('/agitta/index.html'))).toBe(true);
  expect(result.keys.some(url => url.endsWith('.css'))).toBe(true);
  expect(result.keys.every(url => url.startsWith('http://127.0.0.1:4175/agitta/') && !url.includes('supabase') && !url.includes('/auth/'))).toBe(true);
});

test('instalação oferece instruções e usa o convite do navegador quando disponível', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Instalar Agitta ↗', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Abra o menu do navegador');
  await page.getByRole('button', { name: 'Fechar instruções' }).click();
  await page.evaluate(() => {
    window.installInvocations = 0;
    const prompt = new Event('beforeinstallprompt', { cancelable: true });
    prompt.prompt = async () => { window.installInvocations += 1; };
    prompt.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(prompt);
  });
  await page.getByRole('button', { name: 'Instalar Agitta ↗', exact: true }).click();
  expect(await page.evaluate(() => window.installInvocations)).toBe(1);
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('atualização aguarda escolha e preserva formulário até o usuário atualizar', async ({ page }) => {
  await demo(page);
  await page.locator('.mobile-nav').getByRole('link', { name: 'Publicar', exact: true }).click();
  await page.getByLabel('Qual é o rolê?').fill('Rascunho que deve continuar aqui');
  // A real deployment changes bytes at the same script URL. Changing the URL
  // instead triggers another install when the app registers its canonical URL.
  const workerFile = new URL('../.tools/web-test-dist/sw.js', import.meta.url);
  const original = await readFile(workerFile, 'utf8');
  const updated = original.replace(/const CACHE = PREFIX \+ '([^']+)';/, "const CACHE = PREFIX + '$1-updated';");
  expect(updated).not.toBe(original);
  try {
    await writeFile(workerFile, updated);
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await expect(page.getByRole('button', { name: 'Nova versão disponível · Atualizar' })).toBeVisible();
    await expect(page.getByLabel('Qual é o rolê?')).toHaveValue('Rascunho que deve continuar aqui');
    await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).click();
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Nova versão disponível · Atualizar' }).click(),
    ]);
    await expect(page.getByRole('heading', { name: 'O que agitta Brasília?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nova versão disponível · Atualizar' })).toBeHidden();
  } finally {
    await writeFile(workerFile, original);
  }
});
