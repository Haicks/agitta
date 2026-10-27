import { test, expect } from '@playwright/test';

// Controlled asynchronous provider; real Auth and RLS remain covered by test:live.
async function provider(page, body) {
  await page.route('**/src/data.js*', async (request) => {
    if (new URL(request.request().url()).searchParams.has('original')) return request.continue();
    await request.fulfill({ contentType: 'application/javascript', body: `
      import { demoBackend as actualDemo } from '/src/data.js?original';
      export const demoBackend = actualDemo;
      export const backendConfigured = true;
      const sample = actualDemo();
      const rows = await sample.listEvents();
      const session = {user:{id:'fixture-user',email:'fixture@example.test',name:'Pessoa de teste'}};
      const backend = {...sample, onAuthChange: () => () => {}};
      ${body}
      export const liveBackend = () => backend;
    ` });
  });
}

test('restauração lenta da sessão não substitui a demonstração escolhida', async ({ page }) => {
  await provider(page, `backend.getSession = () => new Promise(resolve => { window.finishRestore = () => resolve(null); });`);
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar demonstração/ }).click();
  await expect(page.locator('.demo-banner')).toBeVisible();
  await page.evaluate(() => window.finishRestore());
  // Wait for the init continuation, not a fixed sleep.
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  await expect(page.locator('.demo-banner')).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(5);
});

test('resposta do feed não apaga um formulário em edição', async ({ page }) => {
  await provider(page, `
    backend.getSession = async () => session;
    backend.listEvents = () => new Promise(resolve => { window.finishFeed = () => resolve(rows); });
    backend.toggleSaved = () => new Promise(resolve => { window.finishSave = () => resolve([rows[0].id]); });
  `);
  await page.goto('/');
  await page.locator('.mobile-nav').getByRole('link', { name: 'Publicar', exact: true }).click();
  await page.getByLabel('Qual é o rolê?').fill('Meu rolê em edição');
  await page.evaluate(() => window.finishFeed());
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  await expect(page.getByLabel('Qual é o rolê?')).toHaveValue('Meu rolê em edição');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Salvar evento: O Eixão/ }).click();
  await page.locator('.mobile-nav').getByRole('link', { name: 'Publicar', exact: true }).click();
  await page.getByLabel('Qual é o rolê?').fill('Outro formulário em edição');
  await page.evaluate(() => window.finishSave());
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  await expect(page.getByLabel('Qual é o rolê?')).toHaveValue('Outro formulário em edição');
});

test('logout conclui mesmo se o navegador bloquear remoção do armazenamento', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar demonstração/ }).click();
  await expect(page.locator('.demo-banner')).toBeVisible();
  await page.evaluate(() => { Storage.prototype.removeItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
  await page.getByRole('button', { name: /Sair da demo/ }).click();
  await expect(page.getByRole('button', { name: 'Entrar no Agitta' })).toBeVisible();
  await expect(page.locator('.app-shell')).toHaveCount(0);
});

test('salvos e links diretos encontram eventos fora da primeira página do feed', async ({ page }) => {
  await provider(page, `
    backend.getSession = async () => session;
    backend.listEvents = async () => [rows[0]];
    backend.getSavedIds = async () => [rows[1].id];
    backend.getEventsByIds = async ids => rows.filter(row => ids.includes(row.id));
  `);
  await page.goto('/#saved');
  await expect(page.locator('.event-card')).toHaveCount(1);
  await expect(page.locator('.event-card')).toContainText('Cinema debaixo das estrelas');
  await page.goto('/#event/demo-skate');
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Bora ocupar a pista? 🛹' })).toBeVisible();
});

test('voltar e avançar do navegador acompanham as telas do webapp', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar demonstração/ }).click();
  await page.locator('.mobile-nav').getByRole('link', { name: /Salvos/ }).click();
  await expect(page).toHaveURL(/#saved$/);
  await page.goBack();
  await expect(page).toHaveURL(/#feed$/);
  await page.goForward();
  await expect(page).toHaveURL(/#saved$/);
  await expect(page.getByRole('heading', { name: 'Seus próximos rolês.' })).toBeVisible();
});
